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
    const [result] = await pool.execute(kategoriQueries.create, [nama, deskripsi || null]);
    return { id: result.insertId, ...data };
  },

  update: async (id, data) => {
    const { nama, deskripsi } = data;
    await pool.execute(kategoriQueries.update, [nama, deskripsi || null, id]);
    return { id, ...data };
  },

  delete: async (id) => {
    await pool.execute(kategoriQueries.delete, [id]);
    return { id };
  },
};

module.exports = kategoriService;