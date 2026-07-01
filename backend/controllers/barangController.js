// ============================================
// BARANG CONTROLLER - Sistem Peminjaman Barang TVRI
// ============================================

const barangService = require('../services/barangService');

const barangController = {
  getAll: async (req, res) => {
    try {
      const result = await barangService.getAll(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const result = await barangService.getById(req.params.id);
      if (!result) return res.status(404).json({ success: false, message: 'Barang tidak ditemukan' });
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getAvailable: async (req, res) => {
    try {
      const result = await barangService.getAvailable();
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const data = req.body;
      const result = await barangService.create(data, req.user);
      res.status(201).json({ success: true, data: result, message: 'Barang berhasil ditambahkan' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const data = req.body;
      const result = await barangService.update(req.params.id, data, req.user);
      res.json({ success: true, data: result, message: 'Barang berhasil diperbarui' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  uploadFoto: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'File foto diperlukan' });
      }
      const fotoPath = `/uploads/barang/${req.file.filename}`;
      const result = await barangService.updateFoto(req.params.id, fotoPath);
      res.json({ success: true, data: result, message: 'Foto barang berhasil diunggah' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const result = await barangService.delete(req.params.id, req.user);
      res.json({ success: true, data: result, message: 'Barang berhasil dihapus' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

module.exports = barangController;