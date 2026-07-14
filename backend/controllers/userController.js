// ============================================
// USER CONTROLLER - Sistem Peminjaman Barang TVRI
// Manajemen User oleh Super Admin
// ============================================

const userService = require('../services/userService');

const userController = {
  // ========== GET ALL USERS ==========
  getAll: async (req, res) => {
    try {
      const result = await userService.getAll(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      console.error('GetAll users error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // ========== GET ALL ADMINS ==========
  getAdmins: async (req, res) => {
    try {
      const result = await userService.getAdmins(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      console.error('GetAdmins error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // ========== GET PEGAWAI BY JABATAN/DIVISI (Admin & Super Admin) ==========
  getByJabatanOrDivisi: async (req, res) => {
    try {
      const { type, value, page, limit } = req.query;
      const result = await userService.getByJabatanOrDivisi({ type, value, page, limit });
      res.json({ success: true, ...result });
    } catch (error) {
      console.error('GetByJabatanOrDivisi error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // ========== GET USER BY ID ==========
  getById: async (req, res) => {
    try {
      const result = await userService.getById(req.params.id);
      if (!result) {
        return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
      }
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // ========== CREATE ADMIN (Super Admin only) ==========
  createAdmin: async (req, res) => {
    try {
      const result = await userService.createAdmin(req.body, {
        id: req.user.id,
        username: req.user.username,
        ip: req.ip || req.connection?.remoteAddress,
      });
      res.status(201).json({ success: true, data: result, message: 'Admin berhasil ditambahkan' });
    } catch (error) {
      console.error('Create admin error:', error);
      if (error.message.includes('sudah digunakan') || error.message.includes('wajib diisi')) {
        return res.status(400).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // ========== UPDATE USER (Super Admin only) ==========
  update: async (req, res) => {
    try {
      const result = await userService.update(req.params.id, req.body, {
        id: req.user.id,
        username: req.user.username,
        ip: req.ip || req.connection?.remoteAddress,
      });
      res.json({ success: true, data: result, message: 'User berhasil diperbarui' });
    } catch (error) {
      console.error('Update user error:', error);
      if (error.message.includes('tidak ditemukan') || error.message.includes('tidak dapat')) {
        return res.status(400).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // ========== DELETE USER (Soft Delete, Super Admin only) ==========
  delete: async (req, res) => {
    try {
      const result = await userService.delete(req.params.id, {
        id: req.user.id,
        username: req.user.username,
        ip: req.ip || req.connection?.remoteAddress,
      });
      res.json({ success: true, data: result, message: 'User berhasil dihapus' });
    } catch (error) {
      console.error('Delete user error:', error);
      if (error.message.includes('tidak ditemukan') || error.message.includes('tidak dapat')) {
        return res.status(400).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // ========== TOGGLE ACTIVE/INACTIVE (Super Admin only) ==========
  toggleActive: async (req, res) => {
    try {
      const result = await userService.toggleActive(req.params.id, {
        id: req.user.id,
        username: req.user.username,
        ip: req.ip || req.connection?.remoteAddress,
      });
      res.json({ success: true, data: result });
    } catch (error) {
      console.error('Toggle active error:', error);
      if (error.message.includes('tidak ditemukan') || error.message.includes('tidak dapat')) {
        return res.status(400).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // ========== RESET PASSWORD (Super Admin only) ==========
  resetPassword: async (req, res) => {
    try {
      const { newPassword } = req.body;
      const result = await userService.resetPassword(req.params.id, newPassword, {
        id: req.user.id,
        username: req.user.username,
        ip: req.ip || req.connection?.remoteAddress,
      });
      res.json({ success: true, data: result });
    } catch (error) {
      console.error('Reset password user error:', error);
      if (error.message.includes('tidak ditemukan') || error.message.includes('tidak dapat') || error.message.includes('minimal')) {
        return res.status(400).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // ========== GET USER STATS (Super Admin only) ==========
  getStats: async (req, res) => {
    try {
      const result = await userService.getStats();
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // ========== GET PENDING REGISTRATIONS (Admin & Super Admin) ==========
  getPending: async (req, res) => {
    try {
      const result = await userService.getPending();
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // ========== APPROVE REGISTRATION ==========
  approve: async (req, res) => {
    try {
      const result = await userService.approve(req.params.id, {
        id: req.user.id,
        username: req.user.username,
        ip: req.ip || req.connection?.remoteAddress,
      });
      const { emailNotif, ...data } = result;
      let message = 'Registrasi berhasil disetujui';
      if (emailNotif?.sent) {
        message += '. Notifikasi email telah dikirim';
      } else if (!emailNotif?.sent && result.email) {
        message += '. Email notifikasi gagal dikirim';
      }
      res.json({ success: true, data, emailNotif, message });
    } catch (error) {
      if (error.message.includes('tidak ditemukan') || error.message.includes('bukan')) {
        return res.status(404).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // ========== REJECT REGISTRATION ==========
  reject: async (req, res) => {
    try {
      const { reason } = req.body;
      const result = await userService.reject(req.params.id, reason, {
        id: req.user.id,
        username: req.user.username,
        ip: req.ip || req.connection?.remoteAddress,
      });
      const { emailNotif, ...data } = result;
      let message = 'Registrasi berhasil ditolak';
      if (emailNotif?.sent) {
        message += '. Notifikasi email telah dikirim';
      } else if (!emailNotif?.sent && result.email) {
        message += '. Email notifikasi gagal dikirim';
      }
      res.json({ success: true, data, emailNotif, message });
    } catch (error) {
      if (error.message.includes('tidak ditemukan') || error.message.includes('bukan')) {
        return res.status(404).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

module.exports = userController;