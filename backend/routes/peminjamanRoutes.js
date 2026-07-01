// ============================================
// PEMINJAMAN ROUTES - Sistem Peminjaman Barang TVRI
// ============================================

const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const peminjamanController = require('../controllers/peminjamanController');
const { uploadPeminjaman } = require('../config/multer');

// Semua route memerlukan autentikasi
router.use(auth);

// Pegawai & admin bisa melihat daftar peminjaman (filtered by role)
router.get('/', peminjamanController.getAll);
router.get('/:id', peminjamanController.getById);

// Pegawai & admin bisa membuat peminjaman (dengan upload foto)
router.post('/', ...uploadPeminjaman, peminjamanController.create);

// Pegawai bisa mengedit/menghapus peminjaman sendiri jika masih Menunggu Persetujuan
router.put('/:id', ...uploadPeminjaman, peminjamanController.updateByPegawai);
router.delete('/:id/cancel', peminjamanController.deleteByPegawai);

// Bulk approve/reject (admin only)
router.post('/bulk-action', authorize('admin'), peminjamanController.bulkAction);

// Hanya admin yang bisa approve/reject/delete
router.put('/:id/approve', authorize('admin'), peminjamanController.approve);
router.put('/:id/reject', authorize('admin'), peminjamanController.reject);
router.delete('/:id', authorize('admin'), peminjamanController.delete);

module.exports = router;