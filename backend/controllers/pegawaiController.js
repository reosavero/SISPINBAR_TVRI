// ============================================
// PEGAWAI CONTROLLER - Sistem Peminjaman Barang TVRI
// ============================================

const pegawaiService = require('../services/pegawaiService');
const emailVerificationService = require('../services/emailVerificationService');

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

  // ========== SEND OTP - Admin mengirim OTP ke email pegawai baru ==========
  sendOtp: async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ success: false, message: 'Email wajib diisi' });
      }

      // Validasi format email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ success: false, message: 'Format email tidak valid' });
      }

      // Cek duplikat email
      const pool = require('../config/db');
      const [existingEmail] = await pool.execute('SELECT id FROM users WHERE email = ? AND deleted_at IS NULL', [email.trim()]);
      if (existingEmail.length > 0) {
        return res.status(409).json({ success: false, message: 'Email sudah terdaftar. Silakan gunakan email lain.' });
      }

      // Kirim OTP
      const result = await emailVerificationService.sendOtp(email.trim());
      res.json({ success: true, message: 'Kode verifikasi telah dikirim ke email pegawai' });
    } catch (error) {
      console.error('Send OTP pegawai error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // ========== VERIFY OTP - Admin memverifikasi OTP pegawai baru ==========
  verifyOtp: async (req, res) => {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return res.status(400).json({ success: false, message: 'Email dan kode OTP wajib diisi' });
      }

      const result = await emailVerificationService.verifyOtp(email.trim(), otp);
      if (!result.success) {
        return res.status(400).json({ success: false, message: result.message });
      }

      res.json({ success: true, message: 'Email berhasil diverifikasi' });
    } catch (error) {
      console.error('Verify OTP pegawai error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // ========== CREATE - Admin menambah pegawai + buat akun login ==========
  create: async (req, res) => {
    try {
      const { email } = req.body;

      // Jika email diisi, wajib verifikasi OTP terlebih dahulu
      if (email && email.trim()) {
        const isVerified = await emailVerificationService.isEmailVerified(email.trim());
        if (!isVerified) {
          return res.status(400).json({ success: false, message: 'Email belum diverifikasi. Silakan verifikasi email terlebih dahulu.' });
        }
      }

      const result = await pegawaiService.create(req.body);
      res.status(201).json({ success: true, data: result, message: 'Pegawai berhasil ditambahkan dan akun login telah dibuat' });
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
      const result = await pegawaiService.delete(req.params.id, req.user);
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