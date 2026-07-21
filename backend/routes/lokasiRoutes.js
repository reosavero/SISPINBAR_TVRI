

const express = require('express');
const router = express.Router();
const { auth, adminAndAbove } = require('../middleware/auth');
const lokasiController = require('../controllers/lokasiController');

router.get('/active', lokasiController.getActive);

router.use(auth);

router.get('/stats', lokasiController.getStats);
router.get('/:id/barang', lokasiController.getBarangByLokasi);
router.get('/:id', lokasiController.getById);
router.get('/', lokasiController.getAll);

router.post('/', adminAndAbove, lokasiController.create);
router.put('/:id', adminAndAbove, lokasiController.update);
router.delete('/:id', adminAndAbove, lokasiController.delete);
router.put('/:id/restore', adminAndAbove, lokasiController.restore);

module.exports = router;