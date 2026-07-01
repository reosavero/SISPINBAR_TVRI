// ============================================
// BARANG ROUTES - Sistem Peminjaman Barang TVRI
// ============================================

const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const barangController = require('../controllers/barangController');
const { uploadBarang } = require('../config/multer');

// Semua route memerlukan autentikasi
router.use(auth);

// GET routes
router.get('/', barangController.getAll);
router.get('/available', barangController.getAvailable);
router.get('/:id', barangController.getById);

// POST - admin only
router.post('/', authorize('admin'), barangController.create);

// PUT - admin only
router.put('/:id', authorize('admin'), barangController.update);

// POST upload foto - admin only
router.post('/:id/foto', authorize('admin'), ...uploadBarang, barangController.uploadFoto);

// DELETE - admin only
router.delete('/:id', authorize('admin'), barangController.delete);

module.exports = router;