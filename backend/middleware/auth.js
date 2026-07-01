// ============================================
// AUTH MIDDLEWARE - Sistem Peminjaman Barang TVRI
// ============================================

const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'tvri_jatim_secret_key_2024_production';

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

    // Fetch full user from DB including avatar
    const [users] = await pool.execute('SELECT id, username, email, nama, role, avatar FROM users WHERE id = ?', [decoded.id]);

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

      req.user = {
        id: user.id,
        username: user.username,
        email: user.email || null,
        nama: user.nama,
        role: user.role,
        avatar: user.avatar || null,
        pegawai_id: pegawaiData ? pegawaiData.id : null,
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
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Anda harus login terlebih dahulu.',
      });
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

module.exports = { auth, authorize };