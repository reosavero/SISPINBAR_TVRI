

const pool = require('../config/db');
const jabatanQueries = require('../queries/jabatanQueries');
const { paginate } = require('../utils/helpers');
const auditService = require('./auditService');

const jabatanService = {
  getAll: async (params = {}) => {
    const { search = null, page = 1 } = params;
    const limit = parseInt(params.limit) || 50;
    const { offset } = paginate(page, limit);

    const [rows] = await pool.execute(jabatanQueries.getAll, [search, search, limit, offset]);
    const [countResult] = await pool.execute(jabatanQueries.countAll, [search, search]);
    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: rows.map(row => ({ ...row, total_pegawai: Number(row.total_pegawai) })),
      pagination: { page, totalPages, totalItems, itemsPerPage: limit },
    };
  },

  getAllActive: async () => {
    const [rows] = await pool.execute(jabatanQueries.getAllActive);
    return rows;
  },

  getById: async (id) => {
    const [rows] = await pool.execute(jabatanQueries.getById, [id]);
    return rows[0] || null;
  },

  create: async (data, user) => {
    const { nama, deskripsi } = data;
    const trimmedNama = nama.trim();

    const [existing] = await pool.execute(
      'SELECT id FROM jabatan WHERE nama = ?',
      [trimmedNama]
    );
    if (existing.length > 0) {
      throw new Error('Nama jabatan sudah digunakan. Silakan gunakan nama lain.');
    }

    const [result] = await pool.execute(jabatanQueries.create, [trimmedNama, deskripsi?.trim() || null]);

    await auditService.log({
      userId: user?.id, username: user?.username,
      action: 'CREATE', module: 'jabatan', recordId: result.insertId,
      details: { nama: trimmedNama },
      ipAddress: user?.ip,
    });

    return { id: result.insertId, nama: trimmedNama, deskripsi: deskripsi?.trim() || null };
  },

  update: async (id, data, user) => {
    const { nama, deskripsi } = data;
    const trimmedNama = nama.trim();

    const [existing] = await pool.execute(jabatanQueries.checkNama, [trimmedNama, id]);
    if (existing.length > 0) {
      throw new Error('Nama jabatan sudah digunakan. Silakan gunakan nama lain.');
    }

    await pool.execute(jabatanQueries.update, [trimmedNama, deskripsi?.trim() || null, id]);

    await auditService.log({
      userId: user?.id, username: user?.username,
      action: 'UPDATE', module: 'jabatan', recordId: id,
      details: { nama: trimmedNama },
      ipAddress: user?.ip,
    });

    return { id, nama: trimmedNama, deskripsi: deskripsi?.trim() || null };
  },

  toggleActive: async (id, user) => {
    const jabatan = await jabatanService.getById(id);
    if (!jabatan) throw new Error('Jabatan tidak ditemukan');

    await pool.execute(jabatanQueries.toggleActive, [id]);

    await auditService.log({
      userId: user?.id, username: user?.username,
      action: jabatan.is_active ? 'DEACTIVATE' : 'ACTIVATE', module: 'jabatan', recordId: id,
      details: { nama: jabatan.nama, new_status: jabatan.is_active ? 'Tidak Aktif' : 'Aktif' },
      ipAddress: user?.ip,
    });

    return { id, is_active: !jabatan.is_active };
  },

  delete: async (id, user) => {
    const jabatan = await jabatanService.getById(id);
    if (!jabatan) throw new Error('Jabatan tidak ditemukan');

    
    const [usedBy] = await pool.execute(
      'SELECT COUNT(*) AS total FROM users WHERE jabatan = ? AND role = \'pegawai\' AND deleted_at IS NULL',
      [jabatan.nama]
    );
    if (usedBy[0].total > 0) {
      throw new Error(`Jabatan "${jabatan.nama}" tidak dapat dihapus karena masih digunakan oleh ${usedBy[0].total} pegawai.`);
    }

    await pool.execute(jabatanQueries.delete, [id]);

    await auditService.log({
      userId: user?.id, username: user?.username,
      action: 'DELETE', module: 'jabatan', recordId: id,
      details: { nama: jabatan.nama },
      ipAddress: user?.ip,
    });

    return { id };
  },
};

module.exports = jabatanService;