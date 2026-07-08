// ============================================
// PERPANJANGAN ROUTES - Sistem Peminjaman Barang TVRI
// Updated: Role hierarchy (super_admin + admin for approve/reject)
// ============================================

const express = require('express');
const router = express.Router();
const { auth, adminAndAbove } = require('../middleware/auth');
const perpanjanganController = require('../controllers/perpanjanganController');

// Semua route memerlukan autentikasi
router.use(auth);

// Ambil daftar perpanjangan (filtered by role)
router.get('/', perpanjanganController.getAll);

// Detail perpanjangan
router.get('/:id', perpanjanganController.getById);

// Ajukan perpanjangan (pegawai atau admin)
router.post('/', perpanjanganController.create);

// Admin & super_admin: approve perpanjangan
router.put('/:id/approve', adminAndAbove, perpanjanganController.approve);

// Admin & super_admin: reject perpanjangan
router.put('/:id/reject', adminAndAbove, perpanjanganController.reject);

module.exports = router;