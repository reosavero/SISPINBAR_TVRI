

const express = require('express');
const router = express.Router();
const pegawaiController = require('../controllers/pegawaiController');
const { auth, authorize, adminAndAbove } = require('../middleware/auth');

router.use(auth);

router.get('/', adminAndAbove, pegawaiController.getAll);
router.get('/:id', adminAndAbove, pegawaiController.getById);

router.post('/send-otp', adminAndAbove, pegawaiController.sendOtp);
router.post('/verify-otp', adminAndAbove, pegawaiController.verifyOtp);
router.post('/', adminAndAbove, pegawaiController.create);
router.put('/:id', adminAndAbove, pegawaiController.update);
router.delete('/:id', adminAndAbove, pegawaiController.delete);
router.put('/:id/reset-password', adminAndAbove, pegawaiController.resetPassword);
router.put('/:id/reset-lock', adminAndAbove, pegawaiController.resetLock);

module.exports = router;