// ============================================
// AUDIT CONTROLLER - Sistem Peminjaman Barang TVRI
// ============================================

const auditService = require('../services/auditService');
const auditCleanupService = require('../services/auditCleanupService');

const auditController = {
  // Ambil audit log (super_admin only)
  getAll: async (req, res) => {
    try {
      const result = await auditService.getAll(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Ambil statistik audit (super_admin only)
  getStats: async (req, res) => {
    try {
      const result = await auditService.getStats();
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get retention info (super_admin only)
  getRetentionInfo: async (req, res) => {
    try {
      const result = await auditCleanupService.getRetentionInfo();
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Manual cleanup (super_admin only)
  cleanup: async (req, res) => {
    try {
      const result = await auditCleanupService.cleanupOldLogs({
        id: req.user.id,
        username: req.user.username,
        ip: req.ip || req.connection?.remoteAddress,
      });
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

module.exports = auditController;