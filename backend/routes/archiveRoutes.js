

const express = require('express');
const router = express.Router();
const { auth, adminAndAbove, superAdminOnly } = require('../middleware/auth');
const riwayatController = require('../controllers/riwayatController');
const archiveController = require('../controllers/archiveController');

router.use(auth);

router.get('/years', adminAndAbove, archiveController.getArchiveYears);
router.get('/months', adminAndAbove, archiveController.getArchiveMonths);
router.get('/data', adminAndAbove, archiveController.getArchiveData);

router.post('/process', superAdminOnly, archiveController.triggerArchive);

router.get('/export/excel', adminAndAbove, archiveController.exportArchiveExcel);

router.get('/delete/count', superAdminOnly, riwayatController.countBulkByMonth);

router.delete('/bulk', superAdminOnly, riwayatController.deleteBulkByMonth);

module.exports = router;