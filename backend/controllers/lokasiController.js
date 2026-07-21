

const lokasiService = require('../services/lokasiService');

const lokasiController = {
  
  getAll: async (req, res) => {
    try {
      const result = await lokasiService.getAll(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  
  getActive: async (req, res) => {
    try {
      const data = await lokasiService.getActive();
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  
  getStats: async (req, res) => {
    try {
      const stats = await lokasiService.getStats();
      const topLokasi = await lokasiService.getTopLokasi(5);
      res.json({ success: true, data: { ...stats, topLokasi } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  
  getById: async (req, res) => {
    try {
      const result = await lokasiService.getById(req.params.id);
      if (!result) return res.status(404).json({ success: false, message: 'Lokasi tidak ditemukan' });
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  
  getBarangByLokasi: async (req, res) => {
    try {
      const result = await lokasiService.getBarangByLokasi(req.params.id, req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  
  create: async (req, res) => {
    try {
      const { nama_lokasi } = req.body;
      if (!nama_lokasi || !nama_lokasi.trim()) {
        return res.status(400).json({ success: false, message: 'Nama lokasi wajib diisi' });
      }
      req.user = { ...req.user, ip: req.ip };
      const result = await lokasiService.create(req.body, req.user);
      res.status(201).json({ success: true, data: result, message: 'Lokasi berhasil ditambahkan' });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ success: false, message: error.message });
    }
  },

  
  update: async (req, res) => {
    try {
      const { nama_lokasi } = req.body;
      if (!nama_lokasi || !nama_lokasi.trim()) {
        return res.status(400).json({ success: false, message: 'Nama lokasi wajib diisi' });
      }
      req.user = { ...req.user, ip: req.ip };
      const result = await lokasiService.update(req.params.id, req.body, req.user);
      res.json({ success: true, data: result, message: 'Lokasi berhasil diperbarui' });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ success: false, message: error.message });
    }
  },

  
  delete: async (req, res) => {
    try {
      req.user = { ...req.user, ip: req.ip };
      const result = await lokasiService.delete(req.params.id, req.user);
      res.json({ success: true, data: result, message: 'Lokasi berhasil dihapus' });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ success: false, message: error.message });
    }
  },

  
  restore: async (req, res) => {
    try {
      req.user = { ...req.user, ip: req.ip };
      const result = await lokasiService.restore(req.params.id, req.user);
      res.json({ success: true, data: result, message: 'Lokasi berhasil dipulihkan' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

module.exports = lokasiController;