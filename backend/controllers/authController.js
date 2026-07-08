// ============================================
// AUTH CONTROLLER - Sistem Peminjaman Barang TVRI
// Updated: Super Admin Role System
// ============================================

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const auditService = require('../services/auditService');
const settingsService = require('../services/settingsService');

const JWT_SECRET = process.env.JWT_SECRET || 'tvri_jatim_secret_key_2024_production';
const JWT_DEFAULT_EXPIRES = process.env.JWT_EXPIRES_IN || '24h';

const generateToken = async (user) => {
  // Baca session_timeout dari DB secara dinamis
  const timeoutHours = await getSettingInt('session_timeout', 24);
  const expiresIn = `${Math.min(Math.max(timeoutHours, 1), 168)}h`; // clamp 1-168h

  return jwt.sign(
    { id: user.id, username: user.username, nama: user.nama, role: user.role },
    JWT_SECRET,
    { expiresIn }
  );
};

// Simpan token reset sementara di memory (production: gunakan tabel DB)
const resetTokens = new Map();

// Helper: baca setting dari DB dengan fallback
const getSettingInt = async (key, defaultValue) => {
  try {
    const setting = await settingsService.getByKey(key);
    if (setting && setting.setting_value) {
      const val = parseInt(setting.setting_value, 10);
      if (!isNaN(val) && val > 0) return val;
    }
  } catch (err) {
    // DB error, fallback
  }
  return defaultValue;
};

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

      // Cari user berdasarkan username (termasuk cek deleted_at)
      const [users] = await pool.execute(
        'SELECT * FROM users WHERE username = ? AND deleted_at IS NULL',
        [username]
      );

      if (users.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Username atau password salah',
        });
      }

      const user = users[0];

      // Cek apakah akun belum disetujui (registrasi mandiri)
      if (user.registration_status === 'pending') {
        return res.status(403).json({
          success: false,
          message: 'Akun Anda belum disetujui oleh admin. Silakan menunggu persetujuan.',
        });
      }

      if (user.registration_status === 'rejected') {
        return res.status(403).json({
          success: false,
          message: 'Registrasi akun Anda ditolak. Hubungi administrator untuk informasi lebih lanjut.',
        });
      }

      // Cek apakah akun nonaktif
      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          message: 'Akun Anda dinonaktifkan. Hubungi administrator.',
        });
      }

      // Cek apakah akun terkunci karena terlalu banyak percobaan login
      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        const remainingMinutes = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
        return res.status(423).json({
          success: false,
          message: `Akun terkunci. Coba lagi dalam ${remainingMinutes} menit.`,
        });
      }

      // Jika lock period sudah lewat, reset counter
      if (user.locked_until && new Date(user.locked_until) <= new Date()) {
        await pool.execute(
          'UPDATE users SET login_attempts = 0, locked_until = NULL WHERE id = ?',
          [user.id]
        );
        user.login_attempts = 0;
      }

      const isMatch = await bcrypt.compare(password, user.password);
      
      if (!isMatch) {
        // Ambil max_login_attempts dari settings
        const maxAttempts = await getSettingInt('max_login_attempts', 5);
        const newAttempts = (user.login_attempts || 0) + 1;

        if (newAttempts >= maxAttempts) {
          // Kunci akun selama 30 menit
          const lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
          await pool.execute(
            'UPDATE users SET login_attempts = ?, locked_until = ? WHERE id = ?',
            [newAttempts, lockedUntil, user.id]
          );
          return res.status(423).json({
            success: false,
            message: `Akun terkunci karena ${maxAttempts}x percobaan login gagal. Coba lagi dalam 30 menit.`,
          });
        }

        // Tambah counter percobaan gagal
        await pool.execute(
          'UPDATE users SET login_attempts = ? WHERE id = ?',
          [newAttempts, user.id]
        );

        const remaining = maxAttempts - newAttempts;
        return res.status(401).json({
          success: false,
          message: `Username atau password salah. Sisa percobaan: ${remaining}.`,
        });
      }

      // Login berhasil — reset login attempts
      await pool.execute(
        'UPDATE users SET login_attempts = 0, locked_until = NULL WHERE id = ?',
        [user.id]
      );

      const token = await generateToken(user);

      // Audit log for login
      await auditService.log({
        userId: user.id,
        username: user.username,
        action: 'LOGIN',
        module: 'auth',
        details: { role: user.role },
        ipAddress: req.ip || req.connection?.remoteAddress,
      });

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
            nip: user.nip || null,
            jabatan: user.jabatan || null,
            divisi: user.divisi || null,
            nomor_hp: user.nomor_hp || null,
            avatar: user.avatar || null,
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
      const [users] = await pool.execute(
        'SELECT id, username, email, nama, role, nip, jabatan, divisi, nomor_hp, avatar, is_active FROM users WHERE id = ?',
        [req.user.id]
      );

      if (users.length > 0) {
        const user = users[0];
        return res.json({
          success: true,
          data: {
            id: user.id,
            username: user.username,
            email: user.email || null,
            nama: user.nama,
            role: user.role,
            nip: user.nip || null,
            jabatan: user.jabatan || null,
            divisi: user.divisi || null,
            nomor_hp: user.nomor_hp || null,
            avatar: user.avatar || null,
            is_active: user.is_active,
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
      const [users] = await pool.execute(
        'SELECT id, username, email, nama, role, nip, jabatan, divisi, nomor_hp, avatar, is_active FROM users WHERE id = ?',
        [userId]
      );
      const updatedUser = users.length > 0 ? users[0] : req.user;

      res.json({
        success: true,
        message: 'Profil berhasil diperbarui',
        data: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email || null,
          nama: updatedUser.nama,
          role: updatedUser.role,
          nip: updatedUser.nip || null,
          jabatan: updatedUser.jabatan || null,
          divisi: updatedUser.divisi || null,
          nomor_hp: updatedUser.nomor_hp || null,
          avatar: updatedUser.avatar || null,
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
      const [updatedUsers] = await pool.execute('SELECT id, username, email, nama, role, nip, jabatan, divisi, nomor_hp, avatar, is_active FROM users WHERE id = ?', [userId]);
      const updatedUser = updatedUsers[0];

      res.json({
        success: true,
        message: 'Foto profil berhasil diperbarui',
        data: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email || null,
          nama: updatedUser.nama,
          role: updatedUser.role,
          nip: updatedUser.nip || null,
          jabatan: updatedUser.jabatan || null,
          divisi: updatedUser.divisi || null,
          nomor_hp: updatedUser.nomor_hp || null,
          avatar: updatedUser.avatar,
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
      const [users] = await pool.execute('SELECT * FROM users WHERE email = ? AND is_active = 1 AND deleted_at IS NULL', [email]);

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

      // Audit log
      await auditService.log({
        userId: user.id,
        username: user.username,
        action: 'CHANGE_PASSWORD',
        module: 'auth',
        ipAddress: req.ip || req.connection?.remoteAddress,
      });

      res.json({
        success: true,
        message: 'Password berhasil diubah',
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // ========== REGISTER (Self-registration for Pegawai) ==========
  register: async (req, res) => {
    try {
      const { nama, nip, email, nomor_hp, jabatan, divisi, username, password } = req.body;

      // Validasi wajib
      if (!nama || !nip || !username || !password) {
        return res.status(400).json({ success: false, message: 'Nama, NIP, username, dan password wajib diisi' });
      }
      if (!email) {
        return res.status(400).json({ success: false, message: 'Email wajib diisi untuk notifikasi persetujuan akun' });
      }
      // Validasi format email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: 'Format email tidak valid' });
      }
      // Verifikasi domain email (MX record)
      const { verifyEmail } = require('../services/emailVerifyService');
      const emailCheck = await verifyEmail(email.trim());
      if (!emailCheck.valid) {
        return res.status(400).json({ success: false, message: emailCheck.reason });
      }

      // Verifikasi email OTP sudah dikonfirmasi
      const emailVerificationService = require('../services/emailVerificationService');
      const isVerified = await emailVerificationService.isEmailVerified(email.trim());
      if (!isVerified) {
        return res.status(400).json({ success: false, message: 'Email belum diverifikasi. Silakan verifikasi email Anda terlebih dahulu.' });
      }
      if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password minimal 6 karakter' });
      }
      if (username.length < 3) {
        return res.status(400).json({ success: false, message: 'Username minimal 3 karakter' });
      }

      // Cek duplikat username
      const [existingUsername] = await pool.execute('SELECT id FROM users WHERE username = ?', [username]);
      if (existingUsername.length > 0) {
        return res.status(409).json({ success: false, message: 'Username sudah digunakan. Silakan pilih username lain.' });
      }

      // Cek duplikat NIP
      const [existingNip] = await pool.execute('SELECT id FROM users WHERE nip = ?', [nip]);
      if (existingNip.length > 0) {
        return res.status(409).json({ success: false, message: 'NIP sudah terdaftar. Silakan hubungi admin jika ini adalah kesalahan.' });
      }

      // Cek duplikat email
      const [existingEmail] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
      if (existingEmail.length > 0) {
        return res.status(409).json({ success: false, message: 'Email sudah terdaftar. Silakan gunakan email lain.' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Buat akun pegawai (single table)
      const [userResult] = await pool.execute(
        'INSERT INTO users (username, email, password, nama, role, nip, jabatan, divisi, nomor_hp, is_active, registration_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [username, email || null, hashedPassword, nama, 'pegawai', nip, jabatan || null, divisi || null, nomor_hp || null, 0, 'pending']
      );
      const userId = userResult.insertId;

      // Audit log
      await auditService.log({
        userId,
        username,
        action: 'REGISTER',
        module: 'auth',
        details: { nama, nip, role: 'pegawai' },
        ipAddress: req.ip || req.connection?.remoteAddress,
      });

      res.status(201).json({
        success: true,
        message: 'Registrasi berhasil! Akun Anda sedang menunggu persetujuan admin. Notifikasi akan dikirim ke email Anda ketika akun disetujui.',
        data: { id: userId, nama, username, registration_status: 'pending' },
      });
    } catch (error) {
      console.error('Register error:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ success: false, message: 'Data sudah terdaftar. Silakan gunakan data lain.' });
      }
      res.status(500).json({ success: false, message: 'Terjadi kesalahan saat mendaftar. Silakan coba lagi.' });
    }
  },
};

module.exports = authController;