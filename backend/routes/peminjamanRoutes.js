// ============================================
// PEMINJAMAN ROUTES - Sistem Peminjaman Barang TVRI
// Updated: Role hierarchy (super_admin + admin for management)
// ============================================

const express = require('express');
const router = express.Router();
const { auth, authorize, adminAndAbove } = require('../middleware/auth');
const peminjamanController = require('../controllers/peminjamanController');
const { uploadPeminjaman } = require('../config/multer');

// Semua route memerlukan autentikasi
router.use(auth);

// Pegawai & admin/super_admin bisa melihat daftar peminjaman (filtered by role)
router.get('/', peminjamanController.getAll);
router.get('/:id', peminjamanController.getById);

// Pegawai & admin/super_admin bisa membuat peminjaman (dengan upload foto)
router.post('/', ...uploadPeminjaman, peminjamanController.create);

// Pegawai bisa mengedit/menghapus peminjaman sendiri jika masih Menunggu Persetujuan
router.put('/:id', ...uploadPeminjaman, peminjamanController.updateByPegawai);
router.delete('/:id/cancel', peminjamanController.deleteByPegawai);

// Bulk approve/reject (admin & super_admin only)
router.post('/bulk-action', adminAndAbove, peminjamanController.bulkAction);

// Hanya admin & super_admin yang bisa approve/reject/delete
router.put('/:id/approve', adminAndAbove, peminjamanController.approve);
router.put('/:id/reject', adminAndAbove, peminjamanController.reject);
router.delete('/:id', adminAndAbove, peminjamanController.delete);

module.exports = router;