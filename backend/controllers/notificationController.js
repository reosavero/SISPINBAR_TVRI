

const notificationService = require('../services/notificationService');

const notificationController = {
  
  subscribe: async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    res.flushHeaders();
    res.write(`data: ${JSON.stringify({ type: 'connected', message: 'SSE connected' })}\n\n`);

    let connectionId;
    if (req.user.role === 'admin' || req.user.role === 'super_admin') {
      connectionId = notificationService.registerAdmin(res, req.user.id);
    } else {
      connectionId = notificationService.registerPegawai(res, req.user.id);
    }

    req.on('close', () => {
      notificationService.unregister(connectionId);
    });
  },

  
  getNotifications: async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';

      if (isAdmin) {
        
        const result = await notificationService.getByAdminGrouped(
          req.user.id,
          { page, limit }
        );
        res.json({ success: true, ...result });
      } else {
        
        const result = await notificationService.getByUser(
          null,
          req.user.id,
          { page, limit }
        );
        res.json({ success: true, ...result });
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  
  markAsRead: async (req, res) => {
    try {
      const result = await notificationService.markAsRead(req.params.id, req.user.id);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  
  markMultipleAsRead: async (req, res) => {
    try {
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'ids harus berupa array dengan minimal 1 id',
        });
      }

      const validIds = ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id));

      if (validIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'ids tidak valid',
        });
      }

      const result = await notificationService.markMultipleAsRead(validIds, req.user.id);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  
  markAllAsRead: async (req, res) => {
    try {
      const result = await notificationService.markAllAsRead(req.user.id, req.user.id);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  
  getUnreadCount: async (req, res) => {
    try {
      const result = await notificationService.getByUser(
        (req.user.role === 'admin' || req.user.role === 'super_admin') ? req.user.id : null,
        req.user.id,
        { limit: 0 }
      );
      res.json({ success: true, data: { unreadCount: result.unreadCount } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  
  getApprovalNotifications: async (req, res) => {
    try {
      if (req.user.role !== 'pegawai') {
        return res.json({ success: true, data: [], unreadCount: 0 });
      }
      const { page = 1, limit = 20 } = req.query;
      const result = await notificationService.getByPegawaiApproval(
        req.user.id,
        { page, limit }
      );
      res.json({ success: true, ...result });
    } catch (error) {
      console.error('Error fetching approval notifications:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  
  getPegawaiNotifications: async (req, res) => {
    try {
      if (req.user.role !== 'pegawai') {
        return res.json({ success: true, data: [], unreadCount: 0 });
      }
      const { page = 1, limit = 30 } = req.query;
      const result = await notificationService.getByPegawaiAll(
        req.user.id,
        { page, limit }
      );
      res.json({ success: true, ...result });
    } catch (error) {
      console.error('Error fetching pegawai notifications:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

module.exports = notificationController;