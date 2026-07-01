const express = require('express');
const router = express.Router();
const pegawaiController = require('../controllers/pegawaiController');
const { auth, authorize } = require('../middleware/auth');

// Public routes (dengan auth biasa - bisa lihat daftar pegawai)
router.get('/', auth, pegawaiController.getAll);
router.get('/:id', auth, pegawaiController.getById);

// Admin-only routes (hanya admin yang bisa tambah/edit/hapus pegawai)
router.post('/', auth, authorize('admin'), pegawaiController.create);
router.put('/:id', auth, authorize('admin'), pegawaiController.update);
router.delete('/:id', auth, authorize('admin'), pegawaiController.delete);
router.put('/:id/reset-password', auth, authorize('admin'), pegawaiController.resetPassword);

module.exports = router;