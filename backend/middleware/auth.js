// ============================================
// AUTH MIDDLEWARE - Sistem Peminjaman Barang TVRI
// Updated: Super Admin Role System with Hierarchical Authorization
// ============================================

const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'tvri_jatim_secret_key_2024_production';

// Role hierarchy: super_admin > admin > pegawai
const ROLE_HIERARCHY = {
  super_admin: 3,
  admin: 2,
  pegawai: 1,
};

// Helper: check if role has sufficient access level
const hasAccess = (userRole, requiredRoles) => {
  // super_admin can access everything
  if (userRole === 'super_admin') return true;
  return requiredRoles.includes(userRole);
};

const auth = async (req, res, next) => {
  const authHeader = req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Token tidak ditemukan. Silakan login kembali.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Fetch full user from DB including avatar and is_active
    const [users] = await pool.execute('SELECT id, username, email, nama, role, avatar, is_active, deleted_at FROM users WHERE id = ?', [decoded.id]);

    if (users.length > 0) {
      const user = users[0];

      // Check if user is active
      if (user.is_active === 0) {
        return res.status(403).json({
          success: false,
          message: 'Akun Anda telah dinonaktifkan. Hubungi administrator.',
        });
      }

      // Check if user is soft-deleted
      if (user.deleted_at !== null) {
        return res.status(403).json({
          success: false,
          message: 'Akun Anda telah dihapus. Hubungi administrator.',
        });
      }

      req.user = {
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
      };
    } else {
      return res.status(401).json({
        success: false,
        message: 'User tidak ditemukan. Silakan login kembali.',
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token tidak valid. Silakan login kembali.',
    });
  }
};

// Middleware untuk role-based access
// Mendukung hierarki: super_admin selalu punya akses jika role yang lebih rendah diperlukan
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Anda harus login terlebih dahulu.',
      });
    }

    // super_admin selalu punya akses ke semua endpoint
    if (req.user.role === 'super_admin') {
      return next();
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses untuk melakukan aksi ini.',
      });
    }

    next();
  };
};

// Middleware khusus: hanya super_admin yang boleh akses
const superAdminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Anda harus login terlebih dahulu.',
    });
  }

  if (req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Hanya Super Admin yang dapat mengakses fitur ini.',
    });
  }

  next();
};

// Middleware: super_admin dan admin boleh akses
const adminAndAbove = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Anda harus login terlebih dahulu.',
    });
  }

  if (!['super_admin', 'admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Anda tidak memiliki akses untuk melakukan aksi ini.',
    });
  }

  next();
};

module.exports = { auth, authorize, superAdminOnly, adminAndAbove };