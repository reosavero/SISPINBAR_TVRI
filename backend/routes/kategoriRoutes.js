// ============================================
// KATEGORI ROUTES - Sistem Peminjaman Barang TVRI
// ============================================

const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const kategoriController = require('../controllers/kategoriController');

// Semua route memerlukan autentikasi
router.use(auth);

// Semua user bisa melihat kategori
router.get('/', kategoriController.getAll);
router.get('/:id', kategoriController.getById);

// Hanya admin yang bisa CRUD kategori
router.post('/', authorize('admin'), kategoriController.create);
router.put('/:id', authorize('admin'), kategoriController.update);
router.delete('/:id', authorize('admin'), kategoriController.delete);

module.exports = router;