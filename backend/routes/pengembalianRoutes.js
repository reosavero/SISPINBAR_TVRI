// ============================================
// PENGEMBALIAN ROUTES - Sistem Peminjaman Barang TVRI
// ============================================

const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const pengembalianController = require('../controllers/pengembalianController');
const { uploadPengembalian } = require('../config/multer');

// Semua route memerlukan autentikasi
router.use(auth);

router.get('/', pengembalianController.getAll);
router.post('/', ...uploadPengembalian, pengembalianController.create);

module.exports = router;