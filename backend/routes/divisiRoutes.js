// ============================================
// DIVISI ROUTES - Sistem Peminjaman Barang TVRI
// ============================================

const express = require('express');
const router = express.Router();
const { auth, adminAndAbove } = require('../middleware/auth');
const divisiController = require('../controllers/divisiController');

// Public — untuk halaman registrasi (tanpa auth)
router.get('/active', divisiController.getAllActive);

// Semua route di bawah memerlukan autentikasi
router.use(auth);

router.get('/', divisiController.getAll);
router.get('/:id', divisiController.getById);

router.post('/', adminAndAbove, divisiController.create);
router.put('/:id', adminAndAbove, divisiController.update);
router.patch('/:id/toggle-active', adminAndAbove, divisiController.toggleActive);
router.delete('/:id', adminAndAbove, divisiController.delete);

module.exports = router;