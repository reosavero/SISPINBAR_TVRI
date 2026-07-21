

const express = require('express');
const router = express.Router();
const { auth, adminAndAbove } = require('../middleware/auth');
const divisiController = require('../controllers/divisiController');

router.get('/active', divisiController.getAllActive);

router.use(auth);

router.get('/', divisiController.getAll);
router.get('/:id', divisiController.getById);

router.post('/', adminAndAbove, divisiController.create);
router.put('/:id', adminAndAbove, divisiController.update);
router.patch('/:id/toggle-active', adminAndAbove, divisiController.toggleActive);
router.delete('/:id', adminAndAbove, divisiController.delete);

module.exports = router;