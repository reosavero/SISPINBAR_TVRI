// ============================================
// KATEGORI CONTROLLER - Sistem Peminjaman Barang TVRI
// ============================================

const kategoriService = require('../services/kategoriService');

const kategoriController = {
  getAll: async (req, res) => {
    try {
      const result = await kategoriService.getAll(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const result = await kategoriService.getById(req.params.id);
      if (!result) return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const result = await kategoriService.create(req.body);
      res.status(201).json({ success: true, data: result, message: 'Kategori berhasil ditambahkan' });
    } catch (error) {
      if (error.message.includes('sudah digunakan')) {
        return res.status(409).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const result = await kategoriService.update(req.params.id, req.body);
      res.json({ success: true, data: result, message: 'Kategori berhasil diperbarui' });
    } catch (error) {
      if (error.message.includes('sudah digunakan')) {
        return res.status(409).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const result = await kategoriService.delete(req.params.id);
      res.json({ success: true, data: result, message: 'Kategori berhasil dihapus' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

module.exports = kategoriController;