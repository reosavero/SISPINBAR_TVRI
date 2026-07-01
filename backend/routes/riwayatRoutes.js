const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const pool = require('../config/db');
const { paginate } = require('../utils/helpers');

// Semua route memerlukan autentikasi
router.use(auth);

// Get all riwayat with filters
router.get('/', async (req, res) => {
  try {
    const { search, bulan, tahun, status, page = 1 } = req.query;
    const { itemsPerPage = 10, offset } = paginate(parseInt(page));

    let whereConditions = [];
    let params = [];

    // Jika pegawai (bukan admin), hanya tampilkan riwayat miliknya
    if (req.user.role !== 'admin' && req.user.pegawai_id) {
      whereConditions.push('p.pegawai_id = ?');
      params.push(req.user.pegawai_id);
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
      `SELECT p.*, pg.nama AS pegawai_nama, b.nama_barang AS barang_nama, b.kode_barang, b.foto AS barang_foto,
              k.nama AS kategori_nama, pk.tanggal_kembali_aktual, pk.kondisi_barang AS kondisi_pengembalian,
              pk.foto AS foto_pengembalian, pk.catatan AS catatan_pengembalian
       FROM peminjaman p
       LEFT JOIN pegawai pg ON p.pegawai_id = pg.id
       LEFT JOIN barang b ON p.barang_id = b.id
       LEFT JOIN kategori k ON b.kategori_id = k.id
       LEFT JOIN pengembalian pk ON pk.peminjaman_id = p.id
       ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, itemsPerPage, offset]
    );

    const [countResult] = await pool.execute(
      `SELECT COUNT(*) AS total FROM peminjaman p
       LEFT JOIN pegawai pg ON p.pegawai_id = pg.id
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

module.exports = router;