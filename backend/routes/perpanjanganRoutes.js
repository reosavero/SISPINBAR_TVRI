// ============================================
// PERPANJANGAN ROUTES - Sistem Peminjaman Barang TVRI
// ============================================

const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const perpanjanganController = require('../controllers/perpanjanganController');

// Semua route memerlukan autentikasi
router.use(auth);

// Ambil daftar perpanjangan (filtered by role)
router.get('/', perpanjanganController.getAll);

// Detail perpanjangan
router.get('/:id', perpanjanganController.getById);

// Ajukan perpanjangan (pegawai atau admin)
router.post('/', perpanjanganController.create);

// Admin: approve perpanjangan
router.put('/:id/approve', authorize('admin'), perpanjanganController.approve);

// Admin: reject perpanjangan
router.put('/:id/reject', authorize('admin'), perpanjanganController.reject);

module.exports = router;