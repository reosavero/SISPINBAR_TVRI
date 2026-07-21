

const express = require('express');
const router = express.Router();
const { auth, authorize, adminAndAbove } = require('../middleware/auth');
const barangController = require('../controllers/barangController');
const { uploadBarang } = require('../config/multer');

router.use(auth);

router.get('/', barangController.getAll);
router.get('/available', barangController.getAvailable);
router.get('/:id', barangController.getById);

router.post('/', adminAndAbove, barangController.create);
router.put('/:id', adminAndAbove, barangController.update);
router.post('/:id/foto', adminAndAbove, ...uploadBarang, barangController.uploadFoto);
router.delete('/:id', adminAndAbove, barangController.delete);

module.exports = router;