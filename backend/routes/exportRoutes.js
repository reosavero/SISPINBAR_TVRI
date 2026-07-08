// ============================================
// EXPORT ROUTES - Sistem Peminjaman Barang TVRI
// Updated: Role hierarchy (super_admin + admin can export)
// ============================================

const express = require('express');
const router = express.Router();
const { auth, adminAndAbove } = require('../middleware/auth');
const exportController = require('../controllers/exportController');

// Semua route memerlukan autentikasi
router.use(auth);

// Export peminjaman (admin & super_admin)
router.get('/peminjaman/excel', adminAndAbove, exportController.exportPeminjamanExcel);

// Export barang (admin & super_admin)
router.get('/barang/excel', adminAndAbove, exportController.exportBarangExcel);

// Export riwayat (admin & super_admin)
router.get('/riwayat/excel', adminAndAbove, exportController.exportRiwayatExcel);

module.exports = router;