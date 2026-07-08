// ============================================
// PEGAWAI ROUTES - Sistem Peminjaman Barang TVRI
// Updated: Role hierarchy (super_admin + admin can manage)
// ============================================

const express = require('express');
const router = express.Router();
const pegawaiController = require('../controllers/pegawaiController');
const { auth, authorize, adminAndAbove } = require('../middleware/auth');

// Semua route memerlukan autentikasi
router.use(auth);

// GET routes - admin dan super_admin bisa lihat daftar pegawai
router.get('/', adminAndAbove, pegawaiController.getAll);
router.get('/:id', adminAndAbove, pegawaiController.getById);

// CRUD - admin dan super_admin bisa CRUD pegawai
router.post('/send-otp', adminAndAbove, pegawaiController.sendOtp);
router.post('/verify-otp', adminAndAbove, pegawaiController.verifyOtp);
router.post('/', adminAndAbove, pegawaiController.create);
router.put('/:id', adminAndAbove, pegawaiController.update);
router.delete('/:id', adminAndAbove, pegawaiController.delete);
router.put('/:id/reset-password', adminAndAbove, pegawaiController.resetPassword);

module.exports = router;