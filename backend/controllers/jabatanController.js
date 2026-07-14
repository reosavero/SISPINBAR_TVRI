// ============================================
// JABATAN CONTROLLER - Sistem Peminjaman Barang TVRI
// ============================================

const jabatanService = require('../services/jabatanService');

const jabatanController = {
  getAll: async (req, res) => {
    try {
      const result = await jabatanService.getAll(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getAllActive: async (req, res) => {
    try {
      const data = await jabatanService.getAllActive();
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const result = await jabatanService.getById(req.params.id);
      if (!result) return res.status(404).json({ success: false, message: 'Jabatan tidak ditemukan' });
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const result = await jabatanService.create(req.body, req.user);
      res.status(201).json({ success: true, data: result, message: 'Jabatan berhasil ditambahkan' });
    } catch (error) {
      if (error.message.includes('sudah digunakan')) {
        return res.status(409).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const result = await jabatanService.update(req.params.id, req.body, req.user);
      res.json({ success: true, data: result, message: 'Jabatan berhasil diperbarui' });
    } catch (error) {
      if (error.message.includes('sudah digunakan')) {
        return res.status(409).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  },

  toggleActive: async (req, res) => {
    try {
      const result = await jabatanService.toggleActive(req.params.id, req.user);
      res.json({ success: true, data: result, message: 'Status jabatan berhasil diubah' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const result = await jabatanService.delete(req.params.id, req.user);
      res.json({ success: true, data: result, message: 'Jabatan berhasil dihapus' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

module.exports = jabatanController;