// ============================================
// BARANG ROUTES - Sistem Peminjaman Barang TVRI
// Updated: Role hierarchy (super_admin + admin can manage)
// ============================================

const express = require('express');
const router = express.Router();
const { auth, authorize, adminAndAbove } = require('../middleware/auth');
const barangController = require('../controllers/barangController');
const { uploadBarang } = require('../config/multer');

// Semua route memerlukan autentikasi
router.use(auth);

// GET routes - semua role bisa lihat barang
router.get('/', barangController.getAll);
router.get('/available', barangController.getAvailable);
router.get('/:id', barangController.getById);

// CRUD - admin dan super_admin
router.post('/', adminAndAbove, barangController.create);
router.put('/:id', adminAndAbove, barangController.update);
router.post('/:id/foto', adminAndAbove, ...uploadBarang, barangController.uploadFoto);
router.delete('/:id', adminAndAbove, barangController.delete);

module.exports = router;