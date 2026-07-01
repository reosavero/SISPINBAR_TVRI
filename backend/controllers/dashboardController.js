// ============================================
// DASHBOARD CONTROLLER - Sistem Peminjaman Barang TVRI
// ============================================

const dashboardService = require('../services/dashboardService');

const dashboardController = {
  getStats: async (req, res) => {
    try {
      const result = await dashboardService.getStats();
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getMonthlyLoans: async (req, res) => {
    try {
      const result = await dashboardService.getMonthlyLoans(req.query.year);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getBarangStatus: async (req, res) => {
    try {
      const result = await dashboardService.getBarangStatus();
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getPendingNotifications: async (req, res) => {
    try {
      const result = await dashboardService.getPendingNotifications();
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getRecentActivity: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 5;
      const result = await dashboardService.getRecentActivity(page, limit);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getAvailableYears: async (req, res) => {
    try {
      const result = await dashboardService.getAvailableYears();
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

module.exports = dashboardController;