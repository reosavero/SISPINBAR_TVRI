// ============================================
// PEGAWAI CONTROLLER - Sistem Peminjaman Barang TVRI
// ============================================

const pegawaiService = require('../services/pegawaiService');

const pegawaiController = {
  getAll: async (req, res) => {
    try {
      const result = await pegawaiService.getAll(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      console.error('GetAll pegawai error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const result = await pegawaiService.getById(req.params.id);
      if (!result) return res.status(404).json({ success: false, message: 'Pegawai tidak ditemukan' });
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // ========== CREATE - Admin menambah pegawai + buat akun login ==========
  create: async (req, res) => {
    try {
      const result = await pegawaiService.create(req.body);
      res.status(201).json({ success: true, data: result, message: 'Pegawai berhasil ditambahkan' });
    } catch (error) {
      console.error('Create pegawai error:', error);
      if (error.message.includes('sudah digunakan') || error.message.includes('sudah terdaftar')) {
        return res.status(400).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const result = await pegawaiService.update(req.params.id, req.body);
      res.json({ success: true, data: result, message: 'Pegawai berhasil diperbarui' });
    } catch (error) {
      console.error('Update pegawai error:', error);
      if (error.message.includes('sudah digunakan') || error.message.includes('sudah terdaftar')) {
        return res.status(400).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const result = await pegawaiService.delete(req.params.id);
      res.json({ success: true, data: result, message: 'Pegawai berhasil dihapus' });
    } catch (error) {
      console.error('Delete pegawai error:', error);
      if (error.message.includes('tidak ditemukan')) {
        return res.status(404).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // ========== RESET PASSWORD - Admin reset password pegawai ==========
  resetPassword: async (req, res) => {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password baru minimal 6 karakter',
        });
      }

      const result = await pegawaiService.resetPassword(id, newPassword);
      res.json({ success: true, message: 'Password pegawai berhasil direset' });
    } catch (error) {
      console.error('Reset password pegawai error:', error);
      if (error.message.includes('tidak ditemukan')) {
        return res.status(404).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

module.exports = pegawaiController;