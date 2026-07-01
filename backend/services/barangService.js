// ============================================
// BARANG SERVICE - Sistem Peminjaman Barang TVRI
// ============================================

const pool = require('../config/db');
const barangQueries = require('../queries/barangQueries');
const { paginate } = require('../utils/helpers');
const auditService = require('./auditService');

// Update barang status based on available units
const updateBarangStatus = async (barangId) => {
  const [[barang]] = await pool.execute('SELECT jumlah FROM barang WHERE id = ?', [barangId]);
  if (!barang) return;

  const [[borrowed]] = await pool.execute(
    `SELECT COALESCE(SUM(jumlah), 0) AS total_dipinjam FROM peminjaman WHERE barang_id = ? AND status IN ('Menunggu Persetujuan', 'Disetujui', 'Dipinjam')`,
    [barangId]
  );

  const tersedia = barang.jumlah - Number(borrowed.total_dipinjam);
  const newStatus = tersedia <= 0 ? 'Dipinjam' : 'Tersedia';
  await pool.execute('UPDATE barang SET status = ? WHERE id = ?', [newStatus, barangId]);
};

const barangService = {
  getAll: async (params = {}) => {
    const page = parseInt(params.page) || 1;
    const limit = parseInt(params.limit) || 10;
    const search = params.search || null;
    const kategori = params.kategori || null;
    const status = params.status || null;
    const { offset } = paginate(page, limit);
    const itemsPerPage = limit;

    const [rows] = await pool.execute(barangQueries.getAll, [
      search, search, kategori, kategori, status, status,
      itemsPerPage, offset,
    ]);

    const [countResult] = await pool.execute(barangQueries.countAll, [
      search, search, kategori, kategori, status, status,
    ]);

    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Parse DECIMAL fields to numbers (mysql2 returns DECIMAL as string)
    return {
      data: rows.map(row => ({ ...row, tersedia: Number(row.tersedia) })),
      pagination: { page, totalPages, totalItems, itemsPerPage },
    };
  },

  getById: async (id) => {
    const [rows] = await pool.execute(barangQueries.getById, [id]);
    const row = rows[0] || null;
    if (row) row.tersedia = Number(row.tersedia);
    return row;
  },

  getAvailable: async () => {
    const [rows] = await pool.execute(`
      SELECT b.*, k.nama AS kategori_nama,
        (b.jumlah - COALESCE((
          SELECT SUM(p.jumlah) FROM peminjaman p
          WHERE p.barang_id = b.id AND p.status IN ('Menunggu Persetujuan', 'Disetujui', 'Dipinjam')
        ), 0)) AS tersedia
      FROM barang b
      LEFT JOIN kategori k ON b.kategori_id = k.id
      WHERE b.status IN ('Tersedia', 'Dipinjam')
        AND (b.jumlah - COALESCE((
          SELECT SUM(p.jumlah) FROM peminjaman p
          WHERE p.barang_id = b.id AND p.status IN ('Menunggu Persetujuan', 'Disetujui', 'Dipinjam')
        ), 0)) > 0
      ORDER BY b.nama_barang ASC
    `);
    // Parse DECIMAL fields to numbers (mysql2 returns DECIMAL as string)
    return rows.map(row => ({ ...row, tersedia: Number(row.tersedia) }));
  },

  create: async (data, user) => {
    const {
      kode_barang, nama_barang, kategori_id, lokasi,
      kondisi, status, deskripsi, jumlah, foto,
    } = data;
    const [result] = await pool.execute(barangQueries.create, [
      kode_barang, nama_barang, kategori_id, lokasi,
      kondisi || 'Baik', status || 'Tersedia',
      deskripsi || null, jumlah || 1, foto || null,
    ]);

    // Audit log
    await auditService.log({
      userId: user?.id,
      username: user?.username,
      action: 'CREATE',
      module: 'barang',
      recordId: result.insertId,
      details: { nama_barang, kode_barang },
      ipAddress: user?.ip,
    });

    return { id: result.insertId, ...data };
  },

  update: async (id, data, user) => {
    const {
      nama_barang, kategori_id, lokasi, kondisi,
      status, deskripsi, jumlah, foto,
    } = data;
    // If foto is not provided, preserve the existing foto in DB
    const updateFields = [
      nama_barang, kategori_id, lokasi, kondisi,
      status, deskripsi || null, jumlah || 1,
    ];
    if (foto !== undefined && foto !== '') {
      updateFields.push(foto);
    } else {
      // Preserve existing foto — fetch current value
      const [existing] = await pool.execute(barangQueries.getById, [id]);
      if (existing.length > 0) {
        updateFields.push(existing[0].foto);
      } else {
        updateFields.push(null);
      }
    }
    updateFields.push(id);
    await pool.execute(barangQueries.update, updateFields);

    // Audit log
    await auditService.log({
      userId: user?.id,
      username: user?.username,
      action: 'UPDATE',
      module: 'barang',
      recordId: id,
      details: { nama_barang, status },
      ipAddress: user?.ip,
    });

    return { id, ...data };
  },

  updateFoto: async (id, foto) => {
    await pool.execute(barangQueries.updateFoto, [foto, id]);
    return { id, foto };
  },

  delete: async (id, user) => {
    // Soft delete — set deleted_at instead of actually deleting
    await pool.execute(barangQueries.softDelete, [id]);

    // Audit log
    await auditService.log({
      userId: user?.id,
      username: user?.username,
      action: 'DELETE',
      module: 'barang',
      recordId: id,
      details: { method: 'soft_delete' },
      ipAddress: user?.ip,
    });

    return { id };
  },
};

module.exports = barangService;
module.exports.updateBarangStatus = updateBarangStatus;