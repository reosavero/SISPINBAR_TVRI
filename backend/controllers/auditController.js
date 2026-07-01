// ============================================
// AUDIT CONTROLLER - Sistem Peminjaman Barang TVRI
// ============================================

const auditService = require('../services/auditService');
const { authorize } = require('../middleware/auth');

const auditController = {
  // Ambil audit log (admin only)
  getAll: async (req, res) => {
    try {
      const result = await auditService.getAll(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Ambil statistik audit (admin only)
  getStats: async (req, res) => {
    try {
      const result = await auditService.getStats();
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

module.exports = auditController;