// ============================================
// NOTIFICATION CONTROLLER - Sistem Peminjaman Barang TVRI
// ============================================

const notificationService = require('../services/notificationService');

const notificationController = {
  // SSE endpoint untuk real-time notifications
  subscribe: async (req, res) => {
    // Set headers untuk SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // Flush headers
    res.flushHeaders();

    // Kirim initial connection event
    res.write(`data: ${JSON.stringify({ type: 'connected', message: 'SSE connected' })}\n\n`);

    // Register connection
    let connectionId;
    if (req.user.role === 'admin') {
      connectionId = notificationService.registerAdmin(res, req.user.id);
    } else {
      connectionId = notificationService.registerPegawai(res, req.user.pegawai_id);
    }

    // Cleanup saat client disconnect
    req.on('close', () => {
      notificationService.unregister(connectionId);
    });
  },

  // Ambil notifikasi untuk user yang login
  getNotifications: async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const result = await notificationService.getByUser(
        req.user.role === 'admin' ? req.user.id : null,
        req.user.pegawai_id,
        { page, limit }
      );
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Tandai notifikasi sebagai dibaca
  markAsRead: async (req, res) => {
    try {
      const result = await notificationService.markAsRead(req.params.id, req.user.id);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Tandai semua notifikasi sebagai dibaca
  markAllAsRead: async (req, res) => {
    try {
      const result = await notificationService.markAllAsRead(req.user.id, req.user.pegawai_id);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Hitung notifikasi yang belum dibaca
  getUnreadCount: async (req, res) => {
    try {
      const result = await notificationService.getByUser(
        req.user.role === 'admin' ? req.user.id : null,
        req.user.pegawai_id,
        { limit: 0 }
      );
      res.json({ success: true, data: { unreadCount: result.unreadCount } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

module.exports = notificationController;