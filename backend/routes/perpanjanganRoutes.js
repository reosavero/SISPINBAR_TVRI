

const express = require('express');
const router = express.Router();
const { auth, adminAndAbove } = require('../middleware/auth');
const perpanjanganController = require('../controllers/perpanjanganController');

router.use(auth);

router.get('/', perpanjanganController.getAll);

router.get('/:id', perpanjanganController.getById);

router.post('/', perpanjanganController.create);

router.put('/:id/approve', adminAndAbove, perpanjanganController.approve);

router.put('/:id/reject', adminAndAbove, perpanjanganController.reject);

module.exports = router;