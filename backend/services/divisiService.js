

const pool = require('../config/db');
const divisiQueries = require('../queries/divisiQueries');
const { paginate } = require('../utils/helpers');
const auditService = require('./auditService');

const divisiService = {
  getAll: async (params = {}) => {
    const { search = null, page = 1 } = params;
    const limit = parseInt(params.limit) || 50;
    const { offset } = paginate(page, limit);

    const [rows] = await pool.execute(divisiQueries.getAll, [search, search, limit, offset]);
    const [countResult] = await pool.execute(divisiQueries.countAll, [search, search]);
    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: rows.map(row => ({ ...row, total_pegawai: Number(row.total_pegawai) })),
      pagination: { page, totalPages, totalItems, itemsPerPage: limit },
    };
  },

  getAllActive: async () => {
    const [rows] = await pool.execute(divisiQueries.getAllActive);
    return rows;
  },

  getById: async (id) => {
    const [rows] = await pool.execute(divisiQueries.getById, [id]);
    return rows[0] || null;
  },

  create: async (data, user) => {
    const { nama, deskripsi } = data;
    const trimmedNama = nama.trim();

    const [existing] = await pool.execute(
      'SELECT id FROM divisi WHERE nama = ?',
      [trimmedNama]
    );
    if (existing.length > 0) {
      throw new Error('Nama divisi sudah digunakan. Silakan gunakan nama lain.');
    }

    const [result] = await pool.execute(divisiQueries.create, [trimmedNama, deskripsi?.trim() || null]);

    await auditService.log({
      userId: user?.id, username: user?.username,
      action: 'CREATE', module: 'divisi', recordId: result.insertId,
      details: { nama: trimmedNama },
      ipAddress: user?.ip,
    });

    return { id: result.insertId, nama: trimmedNama, deskripsi: deskripsi?.trim() || null };
  },

  update: async (id, data, user) => {
    const { nama, deskripsi } = data;
    const trimmedNama = nama.trim();

    const [existing] = await pool.execute(divisiQueries.checkNama, [trimmedNama, id]);
    if (existing.length > 0) {
      throw new Error('Nama divisi sudah digunakan. Silakan gunakan nama lain.');
    }

    await pool.execute(divisiQueries.update, [trimmedNama, deskripsi?.trim() || null, id]);

    await auditService.log({
      userId: user?.id, username: user?.username,
      action: 'UPDATE', module: 'divisi', recordId: id,
      details: { nama: trimmedNama },
      ipAddress: user?.ip,
    });

    return { id, nama: trimmedNama, deskripsi: deskripsi?.trim() || null };
  },

  toggleActive: async (id, user) => {
    const divisi = await divisiService.getById(id);
    if (!divisi) throw new Error('Divisi tidak ditemukan');

    await pool.execute(divisiQueries.toggleActive, [id]);

    await auditService.log({
      userId: user?.id, username: user?.username,
      action: divisi.is_active ? 'DEACTIVATE' : 'ACTIVATE', module: 'divisi', recordId: id,
      details: { nama: divisi.nama, new_status: divisi.is_active ? 'Tidak Aktif' : 'Aktif' },
      ipAddress: user?.ip,
    });

    return { id, is_active: !divisi.is_active };
  },

  delete: async (id, user) => {
    const divisi = await divisiService.getById(id);
    if (!divisi) throw new Error('Divisi tidak ditemukan');

    
    const [usedBy] = await pool.execute(
      'SELECT COUNT(*) AS total FROM users WHERE divisi = ? AND role = \'pegawai\' AND deleted_at IS NULL',
      [divisi.nama]
    );
    if (usedBy[0].total > 0) {
      throw new Error(`Divisi "${divisi.nama}" tidak dapat dihapus karena masih digunakan oleh ${usedBy[0].total} pegawai.`);
    }

    await pool.execute(divisiQueries.delete, [id]);

    await auditService.log({
      userId: user?.id, username: user?.username,
      action: 'DELETE', module: 'divisi', recordId: id,
      details: { nama: divisi.nama },
      ipAddress: user?.ip,
    });

    return { id };
  },
};

module.exports = divisiService;