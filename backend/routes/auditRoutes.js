// ============================================
// AUDIT ROUTES - Sistem Peminjaman Barang TVRI
// Updated: super_admin only can access
// ============================================

const express = require('express');
const router = express.Router();
const { auth, superAdminOnly } = require('../middleware/auth');
const auditController = require('../controllers/auditController');

// Super Admin only bisa melihat audit log
router.use(auth, superAdminOnly);

router.get('/', auditController.getAll);
router.get('/stats', auditController.getStats);
router.get('/retention-info', auditController.getRetentionInfo);
router.post('/cleanup', auditController.cleanup);

module.exports = router;