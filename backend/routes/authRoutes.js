

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { uploadAvatar } = require('../config/multer');
const { verifyEmail } = require('../services/emailVerifyService');
const emailVerificationService = require('../services/emailVerificationService');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

router.post('/verify-email', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email wajib diisi' });
    }
    const result = await verifyEmail(email.trim());
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan saat memverifikasi email' });
  }
});

router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email wajib diisi' });
    }
    const result = await emailVerificationService.sendOtp(email);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email dan kode OTP wajib diisi' });
    }
    const result = await emailVerificationService.verifyOtp(email, otp);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/profile', auth, authController.profile);
router.put('/profile', auth, authController.updateProfile);
router.put('/avatar', auth, ...uploadAvatar, authController.uploadAvatar);
router.put('/change-password', auth, authController.changePassword);

module.exports = router;