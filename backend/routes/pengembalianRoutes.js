// ============================================
// PENGEMBALIAN ROUTES - Sistem Peminjaman Barang TVRI
// Updated: Role hierarchy (super_admin + admin for management)
// Added: getById, reject endpoints
// ============================================

const express = require('express');
const router = express.Router();
const { auth, adminAndAbove } = require('../middleware/auth');
const pengembalianController = require('../controllers/pengembalianController');
const { uploadPengembalian } = require('../config/multer');

// Semua route memerlukan autentikasi
router.use(auth);

router.get('/', pengembalianController.getAll);
router.get('/:id', pengembalianController.getById);
router.post('/', ...uploadPengembalian, pengembalianController.create);

// Bulk confirm (admin & super_admin only)
router.post('/bulk-confirm', adminAndAbove, pengembalianController.bulkConfirm);

// Admin: confirm & reject pengembalian
router.put('/:id/confirm', adminAndAbove, pengembalianController.confirm);
router.put('/:id/reject', adminAndAbove, pengembalianController.reject);

module.exports = router;