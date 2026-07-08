// ============================================
// KATEGORI SERVICE - Sistem Peminjaman Barang TVRI
// ============================================

const pool = require('../config/db');
const kategoriQueries = require('../queries/kategoriQueries');
const { paginate } = require('../utils/helpers');

const kategoriService = {
  getAll: async (params = {}) => {
    const { search = null, page = 1 } = params;
    const { offset } = paginate(page, 50);
    const itemsPerPage = 50;

    const [rows] = await pool.execute(kategoriQueries.getAll, [
      search, search, itemsPerPage, offset,
    ]);

    const [countResult] = await pool.execute(kategoriQueries.countAll, [
      search, search,
    ]);

    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return {
      data: rows,
      pagination: { page, totalPages, totalItems, itemsPerPage },
    };
  },

  getById: async (id) => {
    const [rows] = await pool.execute(kategoriQueries.getById, [id]);
    return rows[0] || null;
  },

  create: async (data) => {
    const { nama, deskripsi } = data;

    // Cek duplikat nama kategori
    const [existing] = await pool.execute(
      'SELECT id FROM kategori WHERE nama = ?',
      [nama.trim()]
    );
    if (existing.length > 0) {
      throw new Error('Nama kategori sudah digunakan. Silakan gunakan nama lain.');
    }

    const [result] = await pool.execute(kategoriQueries.create, [nama.trim(), deskripsi && deskripsi.trim() || null]);
    return { id: result.insertId, nama: nama.trim(), deskripsi: deskripsi && deskripsi.trim() || null };
  },

  update: async (id, data) => {
    const { nama, deskripsi } = data;

    // Cek duplikat nama kategori (kecuali dirinya sendiri)
    const [existing] = await pool.execute(
      'SELECT id FROM kategori WHERE nama = ? AND id != ?',
      [nama.trim(), id]
    );
    if (existing.length > 0) {
      throw new Error('Nama kategori sudah digunakan. Silakan gunakan nama lain.');
    }

    await pool.execute(kategoriQueries.update, [nama.trim(), deskripsi && deskripsi.trim() || null, id]);
    return { id, nama: nama.trim(), deskripsi: deskripsi && deskripsi.trim() || null };
  },

  delete: async (id) => {
    await pool.execute(kategoriQueries.delete, [id]);
    return { id };
  },
};

module.exports = kategoriService;