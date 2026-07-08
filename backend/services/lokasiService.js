// ============================================
// LOKASI SERVICE - Sistem Peminjaman Barang TVRI
// ============================================

const pool = require('../config/db');
const lokasiQueries = require('../queries/lokasiQueries');
const { paginate } = require('../utils/helpers');
const auditService = require('./auditService');

const lokasiService = {
  // Get all locations with search, filter, pagination
  getAll: async (params = {}) => {
    const page = parseInt(params.page) || 1;
    const limit = parseInt(params.limit) || 10;
    const { offset } = paginate(page, limit);
    const search = params.search || null;
    const gedung = params.gedung || null;
    const ruangan = params.ruangan || null;
    const lantai = params.lantai || null;
    const status = params.status || null;

    const [rows] = await pool.execute(lokasiQueries.getAll, [
      search, search, gedung, gedung, ruangan, ruangan,
      lantai, lantai, status, status,
      limit, offset,
    ]);

    const [countResult] = await pool.execute(lokasiQueries.countAll, [
      search, search, gedung, gedung, ruangan, ruangan,
      lantai, lantai, status, status,
    ]);

    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    // Parse DECIMAL fields
    return {
      data: rows.map(row => ({
        ...row,
        total_barang: Number(row.total_barang),
        barang_tersedia: Number(row.barang_tersedia),
        barang_dipinjam: Number(row.barang_dipinjam),
        barang_maintenance: Number(row.barang_maintenance),
      })),
      pagination: { page, totalPages, totalItems, itemsPerPage: limit },
    };
  },

  // Get by ID
  getById: async (id) => {
    const [rows] = await pool.execute(lokasiQueries.getById, [id]);
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      ...row,
      total_barang: Number(row.total_barang),
      barang_tersedia: Number(row.barang_tersedia),
      barang_dipinjam: Number(row.barang_dipinjam),
      barang_maintenance: Number(row.barang_maintenance),
    };
  },

  // Get active locations for dropdowns
  getActive: async () => {
    const [rows] = await pool.execute(lokasiQueries.getActive);
    return rows.map(row => ({
      ...row,
      total_barang: Number(row.total_barang),
    }));
  },

  // Get barang by lokasi
  getBarangByLokasi: async (lokasiId, params = {}) => {
    const page = parseInt(params.page) || 1;
    const limit = parseInt(params.limit) || 20;
    const { offset } = paginate(page, limit);

    const [rows] = await pool.execute(lokasiQueries.getBarangByLokasi, [lokasiId, limit, offset]);
    const [countResult] = await pool.execute(lokasiQueries.countBarangByLokasi, [lokasiId]);

    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: rows.map(row => ({ ...row, tersedia: Number(row.tersedia) })),
      pagination: { page, totalPages, totalItems, itemsPerPage: limit },
    };
  },

  // Generate next kode_lokasi
  generateKode: async () => {
    const [rows] = await pool.execute(lokasiQueries.getNextKode);
    const maxKode = rows[0].max_kode || 0;
    const nextNum = maxKode + 1;
    return `LOC-${String(nextNum).padStart(3, '0')}`;
  },

  // Create lokasi
  create: async (data, user) => {
    const { nama_lokasi, gedung, lantai, ruangan, deskripsi, status } = data;

    // Validate: no duplicate nama_lokasi
    const [namaDuplicate] = await pool.execute(lokasiQueries.checkNamaLokasi, [nama_lokasi.trim(), 0]);
    if (namaDuplicate.length > 0) {
      const err = new Error('Nama lokasi sudah digunakan. Silakan gunakan nama lokasi lain.');
      err.statusCode = 409;
      throw err;
    }

    // Validate: no duplicate gedung + lantai + ruangan
    const [duplicate] = await pool.execute(lokasiQueries.checkDuplicate, [
      gedung || '', lantai || '', ruangan || '', 0,
    ]);
    if (duplicate.length > 0) {
      const err = new Error('Kombinasi Gedung, Lantai, dan Ruangan sudah digunakan pada lokasi lain');
      err.statusCode = 409;
      throw err;
    }

    const kode_lokasi = await lokasiService.generateKode();

    const [result] = await pool.execute(lokasiQueries.create, [
      kode_lokasi, nama_lokasi, gedung || null, lantai || null,
      ruangan || null, deskripsi || null, status || 'Aktif',
      user?.id || null, user?.id || null,
    ]);

    // Audit log
    await auditService.log({
      userId: user?.id,
      username: user?.username,
      action: 'CREATE',
      module: 'lokasi',
      recordId: result.insertId,
      details: { kode_lokasi, nama_lokasi, gedung, lantai, ruangan, status },
      ipAddress: user?.ip,
    });

    return { id: result.insertId, kode_lokasi, ...data };
  },

  // Update lokasi
  update: async (id, data, user) => {
    const { nama_lokasi, gedung, lantai, ruangan, deskripsi, status } = data;

    // Validate: no duplicate nama_lokasi (exclude self)
    const [namaDuplicate] = await pool.execute(lokasiQueries.checkNamaLokasi, [nama_lokasi.trim(), id]);
    if (namaDuplicate.length > 0) {
      const err = new Error('Nama lokasi sudah digunakan. Silakan gunakan nama lokasi lain.');
      err.statusCode = 409;
      throw err;
    }

    // Validate: no duplicate gedung + lantai + ruangan (exclude self)
    const [duplicate] = await pool.execute(lokasiQueries.checkDuplicate, [
      gedung || '', lantai || '', ruangan || '', id,
    ]);
    if (duplicate.length > 0) {
      const err = new Error('Kombinasi Gedung, Lantai, dan Ruangan sudah digunakan pada lokasi lain');
      err.statusCode = 409;
      throw err;
    }

    await pool.execute(lokasiQueries.update, [
      nama_lokasi, gedung || null, lantai || null,
      ruangan || null, deskripsi || null, status || 'Aktif',
      user?.id || null, id,
    ]);

    // Audit log
    await auditService.log({
      userId: user?.id,
      username: user?.username,
      action: 'UPDATE',
      module: 'lokasi',
      recordId: id,
      details: { nama_lokasi, gedung, lantai, ruangan, status },
      ipAddress: user?.ip,
    });

    return { id, ...data };
  },

  // Soft delete lokasi
  delete: async (id, user) => {
    // Check if lokasi has active barang
    const [countResult] = await pool.execute(lokasiQueries.countActiveBarang, [id]);
    const totalBarang = countResult[0].total;

    if (totalBarang > 0) {
      const err = new Error(`Lokasi tidak dapat dihapus karena masih memiliki ${totalBarang} barang aktif. Pindahkan seluruh barang ke lokasi lain terlebih dahulu.`);
      err.statusCode = 400;
      throw err;
    }

    await pool.execute(lokasiQueries.softDelete, [user?.id || null, id]);

    // Audit log
    await auditService.log({
      userId: user?.id,
      username: user?.username,
      action: 'DELETE',
      module: 'lokasi',
      recordId: id,
      details: { method: 'soft_delete' },
      ipAddress: user?.ip,
    });

    return { id };
  },

  // Restore soft-deleted lokasi
  restore: async (id, user) => {
    await pool.execute(lokasiQueries.restore, [user?.id || null, id]);

    // Audit log
    await auditService.log({
      userId: user?.id,
      username: user?.username,
      action: 'RESTORE',
      module: 'lokasi',
      recordId: id,
      details: { method: 'restore' },
      ipAddress: user?.ip,
    });

    return { id };
  },

  // Dashboard stats
  getStats: async () => {
    const [rows] = await pool.execute(lokasiQueries.getStats);
    return rows[0];
  },

  // Top lokasi (most barang)
  getTopLokasi: async (limit = 5) => {
    const [rows] = await pool.execute(lokasiQueries.getTopLokasi, [limit]);
    return rows.map(row => ({
      ...row,
      total_barang: Number(row.total_barang),
    }));
  },
};

module.exports = lokasiService;