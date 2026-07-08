// ============================================
// RIWAYAT ROUTES - Sistem Peminjaman Barang TVRI
// Updated: Added delete endpoints for super_admin
// ============================================

const express = require('express');
const router = express.Router();
const { auth, superAdminOnly } = require('../middleware/auth');
const pool = require('../config/db');
const { paginate } = require('../utils/helpers');
const riwayatController = require('../controllers/riwayatController');

// Semua route memerlukan autentikasi
router.use(auth);

// Get all riwayat with filters
router.get('/', async (req, res) => {
  try {
    const { search, bulan, tahun, status, page = 1, limit } = req.query;
    // Default limit per halaman
    const defaultLimit = (req.user.role === 'admin' || req.user.role === 'super_admin') ? 10 : 5;
    const itemsPerPage = Math.min(Math.max(parseInt(limit) || defaultLimit, 1), 50);
    const offset = (parseInt(page) - 1) * itemsPerPage;

    let whereConditions = [];
    let params = [];

    // Pegawai hanya bisa melihat riwayat miliknya sendiri
    if (req.user.role === 'pegawai' && req.user.id) {
      whereConditions.push('p.pegawai_id = ?');
      params.push(req.user.id);
    }

    // Default: tampilkan hanya data bulan berjalan (yang belum diarsipkan)
    if (!req.query.showAll) {
      whereConditions.push('p.archived_at IS NULL');
    }

    if (search) {
      whereConditions.push('(pg.nama LIKE ? OR p.nomor_peminjaman LIKE ? OR b.nama_barang LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (bulan) {
      whereConditions.push('MONTH(p.tanggal_pinjam) = ?');
      params.push(bulan);
    }
    if (tahun) {
      whereConditions.push('YEAR(p.tanggal_pinjam) = ?');
      params.push(tahun);
    }
    if (status) {
      whereConditions.push('p.status = ?');
      params.push(status);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    const [rows] = await pool.execute(
      `SELECT p.*, u.nama AS pegawai_nama, b.nama_barang AS barang_nama, b.kode_barang, b.foto AS barang_foto,
              k.nama AS kategori_nama, pk_latest.tanggal_kembali_aktual, pk_latest.kondisi_barang AS kondisi_pengembalian,
              pk_latest.foto AS foto_pengembalian, pk_latest.catatan AS catatan_pengembalian, pk_latest.status AS pengembalian_status
       FROM peminjaman p
       LEFT JOIN users u ON p.pegawai_id = u.id
       LEFT JOIN barang b ON p.barang_id = b.id
       LEFT JOIN kategori k ON b.kategori_id = k.id
       LEFT JOIN (
         SELECT pk.*, ROW_NUMBER() OVER (PARTITION BY pk.peminjaman_id ORDER BY pk.created_at DESC) AS rn
         FROM pengembalian pk
       ) pk_latest ON pk_latest.peminjaman_id = p.id AND pk_latest.rn = 1
       ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, itemsPerPage, offset]
    );

    const [countResult] = await pool.execute(
      `SELECT COUNT(*) AS total FROM peminjaman p
       LEFT JOIN users u ON p.pegawai_id = u.id
       LEFT JOIN barang b ON p.barang_id = b.id
       ${whereClause}`,
      params
    );

    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    res.json({
      success: true,
      data: rows,
      pagination: { page: parseInt(page), totalPages, totalItems, itemsPerPage },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete a single riwayat record (super_admin only)
router.delete('/:id', superAdminOnly, riwayatController.deleteRecord);

module.exports = router;