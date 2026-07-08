// ============================================
// KATEGORI ROUTES - Sistem Peminjaman Barang TVRI
// Updated: Role hierarchy (super_admin + admin can manage)
// ============================================

const express = require('express');
const router = express.Router();
const { auth, adminAndAbove } = require('../middleware/auth');
const kategoriController = require('../controllers/kategoriController');

// Semua route memerlukan autentikasi
router.use(auth);

// Semua user bisa melihat kategori
router.get('/', kategoriController.getAll);
router.get('/:id', kategoriController.getById);

// Hanya admin dan super_admin yang bisa CRUD kategori
router.post('/', adminAndAbove, kategoriController.create);
router.put('/:id', adminAndAbove, kategoriController.update);
router.delete('/:id', adminAndAbove, kategoriController.delete);

module.exports = router;