// ============================================
// JABATAN ROUTES - Sistem Peminjaman Barang TVRI
// ============================================

const express = require('express');
const router = express.Router();
const { auth, adminAndAbove } = require('../middleware/auth');
const jabatanController = require('../controllers/jabatanController');

// Public — untuk halaman registrasi (tanpa auth)
router.get('/active', jabatanController.getAllActive);

// Semua route di bawah memerlukan autentikasi
router.use(auth);

router.get('/', jabatanController.getAll);
router.get('/:id', jabatanController.getById);

router.post('/', adminAndAbove, jabatanController.create);
router.put('/:id', adminAndAbove, jabatanController.update);
router.patch('/:id/toggle-active', adminAndAbove, jabatanController.toggleActive);
router.delete('/:id', adminAndAbove, jabatanController.delete);

module.exports = router;