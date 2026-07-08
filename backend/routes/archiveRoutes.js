// ============================================
// ARCHIVE ROUTES - Sistem Peminjaman Barang TVRI
// Updated: Role hierarchy (super_admin + admin for management)
// ============================================

const express = require('express');
const router = express.Router();
const { auth, adminAndAbove, superAdminOnly } = require('../middleware/auth');
const riwayatController = require('../controllers/riwayatController');
const archiveController = require('../controllers/archiveController');

// Semua route memerlukan autentikasi
router.use(auth);

// Admin & super_admin bisa akses arsip
router.get('/years', adminAndAbove, archiveController.getArchiveYears);
router.get('/months', adminAndAbove, archiveController.getArchiveMonths);
router.get('/data', adminAndAbove, archiveController.getArchiveData);

// Hanya super_admin yang bisa trigger archive process
router.post('/process', superAdminOnly, archiveController.triggerArchive);

// Export arsip (admin & super_admin)
router.get('/export/excel', adminAndAbove, archiveController.exportArchiveExcel);

// Delete riwayat: count preview for bulk delete (super_admin only)
router.get('/delete/count', superAdminOnly, riwayatController.countBulkByMonth);

// Delete all completed riwayat for a given month/year (super_admin only)
router.delete('/bulk', superAdminOnly, riwayatController.deleteBulkByMonth);

module.exports = router;