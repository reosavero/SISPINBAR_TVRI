

const express = require('express');
const router = express.Router();
const { auth, authorize, adminAndAbove } = require('../middleware/auth');
const peminjamanController = require('../controllers/peminjamanController');
const { uploadPeminjaman } = require('../config/multer');

router.use(auth);

router.get('/', peminjamanController.getAll);
router.get('/:id', peminjamanController.getById);

router.post('/', ...uploadPeminjaman, peminjamanController.create);

router.put('/:id', ...uploadPeminjaman, peminjamanController.updateByPegawai);
router.delete('/:id/cancel', peminjamanController.deleteByPegawai);

router.post('/bulk-action', adminAndAbove, peminjamanController.bulkAction);

router.put('/:id/approve', adminAndAbove, peminjamanController.approve);
router.put('/:id/reject', adminAndAbove, peminjamanController.reject);
router.delete('/:id', adminAndAbove, peminjamanController.delete);

module.exports = router;