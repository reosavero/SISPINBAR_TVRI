// ============================================
// LOKASI CONTROLLER - Sistem Peminjaman Barang TVRI
// ============================================

const lokasiService = require('../services/lokasiService');

const lokasiController = {
  // GET /api/lokasi — Get all with search/filter/pagination
  getAll: async (req, res) => {
    try {
      const result = await lokasiService.getAll(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // GET /api/lokasi/active — Get active locations for dropdowns
  getActive: async (req, res) => {
    try {
      const data = await lokasiService.getActive();
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // GET /api/lokasi/stats — Get location statistics (dashboard)
  getStats: async (req, res) => {
    try {
      const stats = await lokasiService.getStats();
      const topLokasi = await lokasiService.getTopLokasi(5);
      res.json({ success: true, data: { ...stats, topLokasi } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // GET /api/lokasi/:id — Get by ID with detail
  getById: async (req, res) => {
    try {
      const result = await lokasiService.getById(req.params.id);
      if (!result) return res.status(404).json({ success: false, message: 'Lokasi tidak ditemukan' });
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // GET /api/lokasi/:id/barang — Get barang by lokasi
  getBarangByLokasi: async (req, res) => {
    try {
      const result = await lokasiService.getBarangByLokasi(req.params.id, req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // POST /api/lokasi — Create lokasi
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

  // PUT /api/lokasi/:id — Update lokasi
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

  // DELETE /api/lokasi/:id — Soft delete
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

  // PUT /api/lokasi/:id/restore — Restore soft-deleted
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