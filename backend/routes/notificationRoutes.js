

const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

router.use(auth);

router.get('/subscribe', notificationController.subscribe);

router.get('/approvals', notificationController.getApprovalNotifications);

router.get('/pegawai', notificationController.getPegawaiNotifications);

router.get('/', notificationController.getNotifications);

router.get('/unread-count', notificationController.getUnreadCount);

router.put('/mark-multiple-read', notificationController.markMultipleAsRead);

router.put('/mark-all-read', notificationController.markAllAsRead);

router.put('/:id/read', notificationController.markAsRead);

module.exports = router;