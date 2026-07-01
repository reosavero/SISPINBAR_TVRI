const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

router.use(auth);

router.get('/stats', dashboardController.getStats);
router.get('/monthly-loans', dashboardController.getMonthlyLoans);
router.get('/barang-status', dashboardController.getBarangStatus);
router.get('/recent-activity', dashboardController.getRecentActivity);
router.get('/available-years', dashboardController.getAvailableYears);
router.get('/pending-notifications', dashboardController.getPendingNotifications);

module.exports = router;