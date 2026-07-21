

const express = require('express');
const router = express.Router();
const { auth, adminAndAbove } = require('../middleware/auth');
const pengembalianController = require('../controllers/pengembalianController');
const { uploadPengembalian } = require('../config/multer');

router.use(auth);

router.get('/', pengembalianController.getAll);
router.get('/:id', pengembalianController.getById);
router.post('/', ...uploadPengembalian, pengembalianController.create);

router.post('/bulk-confirm', adminAndAbove, pengembalianController.bulkConfirm);

router.put('/:id/confirm', adminAndAbove, pengembalianController.confirm);
router.put('/:id/reject', adminAndAbove, pengembalianController.reject);

module.exports = router;