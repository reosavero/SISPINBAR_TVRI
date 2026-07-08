// ============================================
// NOTIFICATION ROUTES - Sistem Peminjaman Barang TVRI
// ============================================

const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

// Semua route memerlukan autentikasi
router.use(auth);

// SSE endpoint untuk real-time notifications
router.get('/subscribe', notificationController.subscribe);

// Ambil notifikasi persetujuan peminjaman untuk pegawai
router.get('/approvals', notificationController.getApprovalNotifications);

// Ambil SEMUA notifikasi untuk pegawai (read + unread)
router.get('/pegawai', notificationController.getPegawaiNotifications);

// Ambil notifikasi (grouped for admin)
router.get('/', notificationController.getNotifications);

// Hitung notifikasi yang belum dibaca
router.get('/unread-count', notificationController.getUnreadCount);

// Tandai beberapa notifikasi sebagai dibaca sekaligus (BATCH)
router.put('/mark-multiple-read', notificationController.markMultipleAsRead);

// Tandai semua notifikasi sebagai dibaca
router.put('/mark-all-read', notificationController.markAllAsRead);

// Tandai satu notifikasi sebagai dibaca
router.put('/:id/read', notificationController.markAsRead);

module.exports = router;