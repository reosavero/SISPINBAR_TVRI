// ============================================
// AUTH ROUTES - Sistem Peminjaman Barang TVRI
// ============================================

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { uploadAvatar } = require('../config/multer');

// Public routes
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.get('/profile', auth, authController.profile);
router.put('/profile', auth, authController.updateProfile);
router.put('/avatar', auth, ...uploadAvatar, authController.uploadAvatar);
router.put('/change-password', auth, authController.changePassword);

module.exports = router;