

const divisiService = require('../services/divisiService');

const divisiController = {
  getAll: async (req, res) => {
    try {
      const result = await divisiService.getAll(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getAllActive: async (req, res) => {
    try {
      const data = await divisiService.getAllActive();
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const result = await divisiService.getById(req.params.id);
      if (!result) return res.status(404).json({ success: false, message: 'Divisi tidak ditemukan' });
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const result = await divisiService.create(req.body, req.user);
      res.status(201).json({ success: true, data: result, message: 'Divisi berhasil ditambahkan' });
    } catch (error) {
      if (error.message.includes('sudah digunakan')) {
        return res.status(409).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const result = await divisiService.update(req.params.id, req.body, req.user);
      res.json({ success: true, data: result, message: 'Divisi berhasil diperbarui' });
    } catch (error) {
      if (error.message.includes('sudah digunakan')) {
        return res.status(409).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  },

  toggleActive: async (req, res) => {
    try {
      const result = await divisiService.toggleActive(req.params.id, req.user);
      res.json({ success: true, data: result, message: 'Status divisi berhasil diubah' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const result = await divisiService.delete(req.params.id, req.user);
      res.json({ success: true, data: result, message: 'Divisi berhasil dihapus' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

module.exports = divisiController;