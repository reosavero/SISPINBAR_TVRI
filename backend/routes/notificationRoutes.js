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

// Ambil notifikasi
router.get('/', notificationController.getNotifications);

// Hitung notifikasi yang belum dibaca
router.get('/unread-count', notificationController.getUnreadCount);

// Tandai notifikasi sebagai dibaca
router.put('/:id/read', notificationController.markAsRead);

// Tandai semua notifikasi sebagai dibaca
router.put('/mark-all-read', notificationController.markAllAsRead);

module.exports = router;