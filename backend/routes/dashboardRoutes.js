// ============================================
// DASHBOARD ROUTES - Sistem Peminjaman Barang TVRI
// Updated: Role hierarchy support
// ============================================

const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

router.use(auth);

// Dashboard stats - available for all authenticated users
// (Backend returns different data based on role)
router.get('/stats', dashboardController.getStats);
router.get('/monthly-loans', dashboardController.getMonthlyLoans);
router.get('/barang-status', dashboardController.getBarangStatus);
router.get('/recent-activity', dashboardController.getRecentActivity);
router.get('/available-years', dashboardController.getAvailableYears);
router.get('/pending-notifications', dashboardController.getPendingNotifications);
router.get('/lokasi-stats', dashboardController.getLokasiStats);

// Pegawai dashboard
router.get('/pegawai-stats', dashboardController.getPegawaiStats);
router.get('/pegawai-recent-peminjaman', dashboardController.getPegawaiRecentPeminjaman);

module.exports = router;