// ============================================
// USER ROUTES - Sistem Peminjaman Barang TVRI
// Super Admin only: Manajemen User (Admin)
// Admin+ can approve registrations
// ============================================

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth, superAdminOnly, adminAndAbove } = require('../middleware/auth');

// Semua route memerlukan autentikasi
router.use(auth);

// ===== Admin+ (approve/reject registrations) =====
// Must be before /:id to avoid route conflict
router.get('/pending', adminAndAbove, userController.getPending);
router.get('/by-jabatan-divisi', adminAndAbove, userController.getByJabatanOrDivisi);
router.put('/:id/approve', adminAndAbove, userController.approve);
router.put('/:id/reject', adminAndAbove, userController.reject);

// ===== Super Admin only =====
router.get('/', superAdminOnly, userController.getAll);
router.get('/admins', superAdminOnly, userController.getAdmins);
router.get('/stats', superAdminOnly, userController.getStats);
router.get('/:id', superAdminOnly, userController.getById);
router.post('/admin', superAdminOnly, userController.createAdmin);
router.put('/:id', superAdminOnly, userController.update);
router.delete('/:id', superAdminOnly, userController.delete);
router.put('/:id/toggle-active', superAdminOnly, userController.toggleActive);
router.put('/:id/reset-password', superAdminOnly, userController.resetPassword);

module.exports = router;