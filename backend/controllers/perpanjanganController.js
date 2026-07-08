// ============================================
// PERPANJANGAN CONTROLLER - Sistem Peminjaman Barang TVRI
// ============================================

const perpanjanganService = require('../services/perpanjanganService');

const perpanjanganController = {
  // Ajukan perpanjangan (pegawai atau admin)
  create: async (req, res) => {
    try {
      const data = {
        peminjaman_id: req.body.peminjaman_id,
        tanggal_kembali_baru: req.body.tanggal_kembali_baru,
        alasan: req.body.alasan,
      };

      const result = await perpanjanganService.create(data, {
        id: req.user.id,
        username: req.user.username,
        ip: req.ip,
      });
      res.status(201).json({ success: true, data: result, message: 'Permintaan perpanjangan berhasil diajukan' });
    } catch (error) {
      const statusCode = error.message.includes('tidak ditemukan') ||
                         error.message.includes('Hanya') ||
                         error.message.includes('Sudah ada') ||
                         error.message.includes('harus setelah') ? 400 : 500;
      res.status(statusCode).json({ success: false, message: error.message });
    }
  },

  // Ambil daftar perpanjangan
  getAll: async (req, res) => {
    try {
      const params = { ...req.query };
      // Pegawai hanya melihat perpanjangan miliknya
      if (req.user.role === 'pegawai') {
        params.pegawai_id = req.user.id;
      }
      const result = await perpanjanganService.getAll(params);
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Detail perpanjangan
  getById: async (req, res) => {
    try {
      const result = await perpanjanganService.getById(req.params.id);
      if (!result) return res.status(404).json({ success: false, message: 'Perpanjangan tidak ditemukan' });
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Admin approve perpanjangan
  approve: async (req, res) => {
    try {
      const result = await perpanjanganService.approve(req.params.id, {
        id: req.user.id,
        username: req.user.username,
        ip: req.ip,
      });
      res.json({ success: true, data: result, message: 'Perpanjangan berhasil disetujui' });
    } catch (error) {
      const statusCode = error.message.includes('tidak ditemukan') || error.message.includes('tidak dapat') ? 400 : 500;
      res.status(statusCode).json({ success: false, message: error.message });
    }
  },

  // Admin reject perpanjangan
  reject: async (req, res) => {
    try {
      const result = await perpanjanganService.reject(req.params.id, {
        id: req.user.id,
        username: req.user.username,
        ip: req.ip,
      });
      res.json({ success: true, data: result, message: 'Perpanjangan berhasil ditolak' });
    } catch (error) {
      const statusCode = error.message.includes('tidak ditemukan') || error.message.includes('tidak dapat') ? 400 : 500;
      res.status(statusCode).json({ success: false, message: error.message });
    }
  },
};

module.exports = perpanjanganController;