// ============================================
// SETTINGS CONTROLLER - Sistem Peminjaman Barang TVRI
// System Settings (Super Admin only)
// ============================================

const settingsService = require('../services/settingsService');

const settingsController = {
  // ========== GET ALL SETTINGS ==========
  getAll: async (req, res) => {
    try {
      const result = await settingsService.getAll();
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // ========== GET APP INFO ==========
  getAppInfo: async (req, res) => {
    try {
      const result = await settingsService.getAppInfo();
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // ========== UPDATE SETTING ==========
  update: async (req, res) => {
    try {
      const { key, value } = req.body;

      if (!key || value === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Key dan value harus diisi',
        });
      }

      const result = await settingsService.update(key, value, {
        id: req.user.id,
        username: req.user.username,
        ip: req.ip || req.connection?.remoteAddress,
      });

      res.json({ success: true, data: result, message: 'Setting berhasil diperbarui' });
    } catch (error) {
      console.error('Update setting error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // ========== UPDATE MULTIPLE SETTINGS ==========
  updateMultiple: async (req, res) => {
    try {
      const { settings } = req.body;

      if (!Array.isArray(settings)) {
        return res.status(400).json({
          success: false,
          message: 'Settings harus berupa array',
        });
      }

      const result = await settingsService.updateMultiple(settings, {
        id: req.user.id,
        username: req.user.username,
        ip: req.ip || req.connection?.remoteAddress,
      });

      res.json({ success: true, data: result, message: 'Settings berhasil diperbarui' });
    } catch (error) {
      console.error('Update settings error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

module.exports = settingsController;