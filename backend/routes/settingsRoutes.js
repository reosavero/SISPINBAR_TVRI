

const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { auth, superAdminOnly } = require('../middleware/auth');

router.use(auth, superAdminOnly);

router.get('/', settingsController.getAll);
router.get('/app-info', settingsController.getAppInfo);
router.put('/', settingsController.update);
router.put('/batch', settingsController.updateMultiple);

module.exports = router;