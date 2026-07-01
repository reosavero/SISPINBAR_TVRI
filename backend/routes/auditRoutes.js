// ============================================
// AUDIT ROUTES - Sistem Peminjaman Barang TVRI
// ============================================

const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const auditController = require('../controllers/auditController');

// Semua route memerlukan autentikasi dan role admin
router.use(auth, authorize('admin'));

router.get('/', auditController.getAll);
router.get('/stats', auditController.getStats);

module.exports = router;