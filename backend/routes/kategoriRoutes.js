

const express = require('express');
const router = express.Router();
const { auth, adminAndAbove } = require('../middleware/auth');
const kategoriController = require('../controllers/kategoriController');

router.use(auth);

router.get('/', kategoriController.getAll);
router.get('/:id', kategoriController.getById);

router.post('/', adminAndAbove, kategoriController.create);
router.put('/:id', adminAndAbove, kategoriController.update);
router.delete('/:id', adminAndAbove, kategoriController.delete);

module.exports = router;