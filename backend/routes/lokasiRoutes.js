// ============================================
// LOKASI ROUTES - Sistem Peminjaman Barang TVRI
// Role: super_admin & admin = full CRUD, pegawai = read-only dropdown
// ============================================

const express = require('express');
const router = express.Router();
const { auth, adminAndAbove } = require('../middleware/auth');
const lokasiController = require('../controllers/lokasiController');

// Semua route memerlukan autentikasi
router.use(auth);

// GET — semua role bisa melihat (untuk dropdown)
router.get('/active', lokasiController.getActive);
router.get('/stats', lokasiController.getStats);
router.get('/:id/barang', lokasiController.getBarangByLokasi);
router.get('/:id', lokasiController.getById);
router.get('/', lokasiController.getAll);

// CRUD — hanya admin dan super_admin
router.post('/', adminAndAbove, lokasiController.create);
router.put('/:id', adminAndAbove, lokasiController.update);
router.delete('/:id', adminAndAbove, lokasiController.delete);
router.put('/:id/restore', adminAndAbove, lokasiController.restore);

module.exports = router;