// ============================================
// AUTH CONTROLLER - Sistem Peminjaman Barang TVRI
// ============================================

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'tvri_jatim_secret_key_2024_production';

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, nama: user.nama, role: user.role },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

// Simpan token reset sementara di memory (production: gunakan tabel DB)
const resetTokens = new Map();

const authController = {
  // ========== LOGIN (menggunakan username) ==========
  login: async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username dan password harus diisi',
        });
      }

      // Cari user berdasarkan username
      const [users] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);

      if (users.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Username atau password salah',
        });
      }

      const user = users[0];
      const isMatch = await bcrypt.compare(password, user.password);
      
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Username atau password salah',
        });
      }

      const token = generateToken(user);

      // Jika user adalah pegawai (operator/viewer), ambil data pegawai terkait
      let pegawaiData = null;
      if (user.role !== 'admin') {
        const [pegawaiRows] = await pool.execute(
          'SELECT id, nip, jabatan, divisi FROM pegawai WHERE user_id = ?',
          [user.id]
        );
        if (pegawaiRows.length > 0) {
          pegawaiData = pegawaiRows[0];
        }
      }

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email || null,
            nama: user.nama,
            role: user.role,
            avatar: user.avatar || null,
            pegawai_id: pegawaiData ? pegawaiData.id : null,
          },
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // ========== PROFILE ==========
  profile: async (req, res) => {
    try {
      const [users] = await pool.execute('SELECT id, username, email, nama, role, avatar FROM users WHERE id = ?', [req.user.id]);

      if (users.length > 0) {
        const user = users[0];

        // Jika bukan admin, cek apakah punya data pegawai
        let pegawaiData = null;
        if (user.role !== 'admin') {
          const [pegawaiRows] = await pool.execute(
            'SELECT id, nip, jabatan, divisi FROM pegawai WHERE user_id = ?',
            [user.id]
          );
          if (pegawaiRows.length > 0) {
            pegawaiData = pegawaiRows[0];
          }
        }

        return res.json({
          success: true,
          data: {
            id: user.id,
            username: user.username,
            email: user.email || null,
            nama: user.nama,
            role: user.role,
            avatar: user.avatar || null,
            pegawai_id: pegawaiData ? pegawaiData.id : null,
          },
        });
      }

      // Fallback
      res.json({
        success: true,
        data: req.user,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // ========== UPDATE PROFILE ==========
  updateProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      const { nama, email } = req.body;

      await pool.execute(
        'UPDATE users SET nama = ?, email = ?, updated_at = NOW() WHERE id = ?',
        [nama || req.user.nama, email || null, userId]
      );

      // Fetch updated user
      const [users] = await pool.execute('SELECT id, username, email, nama, role, avatar FROM users WHERE id = ?', [userId]);
      const updatedUser = users.length > 0 ? users[0] : req.user;

      // Jika bukan admin, sync nama ke tabel pegawai
      if (updatedUser.role !== 'admin') {
        await pool.execute(
          'UPDATE pegawai SET nama = ?, email = ?, updated_at = NOW() WHERE user_id = ?',
          [updatedUser.nama, updatedUser.email || null, userId]
        );
      }

      // Get pegawai data
      let pegawaiData = null;
      if (updatedUser.role !== 'admin') {
        const [pegawaiRows] = await pool.execute('SELECT id, nip, jabatan, divisi FROM pegawai WHERE user_id = ?', [userId]);
        if (pegawaiRows.length > 0) {
          pegawaiData = pegawaiRows[0];
        }
      }

      res.json({
        success: true,
        message: 'Profil berhasil diperbarui',
        data: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email || null,
          nama: updatedUser.nama,
          role: updatedUser.role,
          avatar: updatedUser.avatar || null,
          pegawai_id: pegawaiData ? pegawaiData.id : null,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // ========== UPLOAD AVATAR ==========
  uploadAvatar: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'File gambar harus dipilih',
        });
      }

      const userId = req.user.id;
      const avatarPath = `/uploads/avatars/${req.file.filename}`;

      // Get old avatar to delete
      const [users] = await pool.execute('SELECT avatar FROM users WHERE id = ?', [userId]);
      const oldAvatar = users.length > 0 ? users[0].avatar : null;

      // Delete old avatar file if exists
      if (oldAvatar && oldAvatar.startsWith('/uploads/avatars/')) {
        const oldPath = path.join(__dirname, '..', oldAvatar);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      // Update avatar in database
      await pool.execute('UPDATE users SET avatar = ?, updated_at = NOW() WHERE id = ?', [avatarPath, userId]);

      // Fetch updated user
      const [updatedUsers] = await pool.execute('SELECT id, username, email, nama, role, avatar FROM users WHERE id = ?', [userId]);
      const updatedUser = updatedUsers[0];

      // Get pegawai data
      let pegawaiData = null;
      if (updatedUser.role !== 'admin') {
        const [pegawaiRows] = await pool.execute('SELECT id, nip, jabatan, divisi FROM pegawai WHERE user_id = ?', [userId]);
        if (pegawaiRows.length > 0) {
          pegawaiData = pegawaiRows[0];
        }
      }

      res.json({
        success: true,
        message: 'Foto profil berhasil diperbarui',
        data: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email || null,
          nama: updatedUser.nama,
          role: updatedUser.role,
          avatar: updatedUser.avatar,
          pegawai_id: pegawaiData ? pegawaiData.id : null,
        },
      });
    } catch (error) {
      // Delete uploaded file if DB update fails
      if (req.file) {
        const filePath = req.file.path;
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // ========== LUPA PASSWORD ==========
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email harus diisi',
        });
      }

      // Cek apakah user ada di database
      const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);

      // Selalu return sukses untuk keamanan (tidak bocor info)
      if (users.length === 0) {
        return res.json({
          success: true,
          message: 'Jika email terdaftar, token reset password telah dikirim ke email Anda.',
        });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');

      // Simpan token di memory (valid 1 jam)
      resetTokens.set(resetToken, {
        userId: users[0].id,
        email: users[0].email,
        expiresAt: Date.now() + 3600000,
      });

      res.json({
        success: true,
        message: 'Token reset password berhasil dibuat. Silakan cek email Anda.',
        data: {
          resetToken: resetToken,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // ========== RESET PASSWORD ==========
  resetPassword: async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Token dan password baru harus diisi',
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password minimal 6 karakter',
        });
      }

      // Cek token di memory
      const storedData = resetTokens.get(token);

      if (!storedData) {
        return res.status(400).json({
          success: false,
          message: 'Token tidak valid atau sudah kadaluarsa',
        });
      }

      // Cek apakah token expired
      if (Date.now() > storedData.expiresAt) {
        resetTokens.delete(token);
        return res.status(400).json({
          success: false,
          message: 'Token sudah kadaluarsa. Silakan minta token baru.',
        });
      }

      // Hash password baru
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password di database
      await pool.execute(
        'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
        [hashedPassword, storedData.userId]
      );

      // Hapus token yang sudah digunakan
      resetTokens.delete(token);

      res.json({
        success: true,
        message: 'Password berhasil diubah! Silakan login dengan password baru.',
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // ========== CHANGE PASSWORD (user yang sudah login) ==========
  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Password lama dan password baru harus diisi',
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password baru minimal 6 karakter',
        });
      }

      const userId = req.user.id;

      // Ambil data user dari database
      const [users] = await pool.execute('SELECT * FROM users WHERE id = ?', [userId]);

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User tidak ditemukan',
        });
      }

      const user = users[0];
      const isMatch = await bcrypt.compare(currentPassword, user.password);

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Password lama salah',
        });
      }

      // Hash dan update password baru
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await pool.execute('UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?', [hashedPassword, userId]);

      res.json({
        success: true,
        message: 'Password berhasil diubah',
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

module.exports = authController;