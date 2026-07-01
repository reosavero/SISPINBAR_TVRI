// ============================================
// EXPORT ROUTES - Sistem Peminjaman Barang TVRI
// ============================================

const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const exportController = require('../controllers/exportController');

// Semua route memerlukan autentikasi
router.use(auth);

// Export peminjaman
router.get('/peminjaman/pdf', exportController.exportPeminjamanPDF);
router.get('/peminjaman/excel', exportController.exportPeminjamanExcel);

// Export barang (admin only)
router.get('/barang/excel', exportController.exportBarangExcel);

module.exports = router;