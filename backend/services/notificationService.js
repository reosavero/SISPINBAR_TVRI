// ============================================
// NOTIFICATION SERVICE - Sistem Peminjaman Barang TVRI
// Notifikasi real-time via SSE + database
// ============================================

const pool = require('../config/db');

// Active SSE connections
const sseConnections = new Map();

const notificationService = {
  // Buat notifikasi baru
  create: async ({ userId, pegawaiId, title, message, type, module, recordId }) => {
    const [result] = await pool.execute(
      `INSERT INTO notifications (user_id, pegawai_id, title, message, type, module, record_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId || null, pegawaiId || null, title, message, type || 'info', module || null, recordId || null]
    );

    const notification = {
      id: result.insertId,
      user_id: userId,
      pegawai_id: pegawaiId,
      title,
      message,
      type: type || 'info',
      module: module || null,
      record_id: recordId || null,
      is_read: 0,
      created_at: new Date().toISOString(),
    };

    // Push via SSE to connected clients
    notificationService.broadcastToAdmins(notification);
    if (pegawaiId) {
      notificationService.broadcastToPegawai(pegawaiId, notification);
    }

    return notification;
  },

  // Ambil notifikasi untuk user
  getByUser: async (userId, pegawaiId, params = {}) => {
    const limit = parseInt(params.limit) || 20;
    const offset = (parseInt(params.page) || 1 - 1) * limit;

    let whereConditions = [];
    let queryParams = [];

    // Notifikasi spesifik untuk user ini ATAU broadcast (user_id IS NULL)
    if (pegawaiId) {
      whereConditions.push('(pegawai_id = ? OR pegawai_id IS NULL)');
      queryParams.push(pegawaiId);
    } else if (userId) {
      whereConditions.push('(user_id = ? OR user_id IS NULL)');
      queryParams.push(userId);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    const [rows] = await pool.execute(
      `SELECT * FROM notifications ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    const [unread] = await pool.execute(
      `SELECT COUNT(*) AS total FROM notifications ${whereClause} AND is_read = 0`,
      queryParams
    );

    return {
      data: rows,
      unreadCount: unread[0].total,
    };
  },

  // Tandai notifikasi sebagai dibaca
  markAsRead: async (notificationId, userId) => {
    await pool.execute(
      'UPDATE notifications SET is_read = 1 WHERE id = ?',
      [notificationId]
    );
    return { id: notificationId, is_read: 1 };
  },

  // Tandai semua notifikasi sebagai dibaca
  markAllAsRead: async (userId, pegawaiId) => {
    if (pegawaiId) {
      await pool.execute(
        'UPDATE notifications SET is_read = 1 WHERE pegawai_id = ? AND is_read = 0',
        [pegawaiId]
      );
    } else if (userId) {
      await pool.execute(
        'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
        [userId]
      );
    }
    return { success: true };
  },

  // Hapus notifikasi lama (lebih dari 30 hari)
  cleanup: async () => {
    const [result] = await pool.execute(
      'DELETE FROM notifications WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)'
    );
    return { deleted: result.affectedRows };
  },

  // ========== SSE (Server-Sent Events) ==========

  // Daftarkan koneksi SSE untuk admin
  registerAdmin: (res, userId) => {
    const connectionId = `admin_${userId}_${Date.now()}`;
    sseConnections.set(connectionId, { type: 'admin', res, userId });
    return connectionId;
  },

  // Daftarkan koneksi SSE untuk pegawai
  registerPegawai: (res, pegawaiId) => {
    const connectionId = `pegawai_${pegawaiId}_${Date.now()}`;
    sseConnections.set(connectionId, { type: 'pegawai', res, pegawaiId });
    return connectionId;
  },

  // Hapus koneksi SSE
  unregister: (connectionId) => {
    sseConnections.delete(connectionId);
  },

  // Broadcast notifikasi ke semua admin
  broadcastToAdmins: (notification) => {
    sseConnections.forEach((conn) => {
      if (conn.type === 'admin') {
        try {
          conn.res.write(`data: ${JSON.stringify(notification)}\n\n`);
        } catch (e) {
          // Connection might be closed
        }
      }
    });
  },

  // Broadcast notifikasi ke pegawai tertentu
  broadcastToPegawai: (pegawaiId, notification) => {
    sseConnections.forEach((conn) => {
      if (conn.type === 'pegawai' && conn.pegawaiId === pegawaiId) {
        try {
          conn.res.write(`data: ${JSON.stringify(notification)}\n\n`);
        } catch (e) {
          // Connection might be closed
        }
      }
    });
  },

  // Kirim heartbeat ke semua koneksi aktif
  heartbeat: () => {
    sseConnections.forEach((conn) => {
      try {
        conn.res.write(`:heartbeat\n\n`);
      } catch (e) {
        sseConnections.delete(conn);
      }
    });
  },
};

// Kirim heartbeat setiap 30 detik untuk menjaga koneksi SSE
setInterval(() => {
  notificationService.heartbeat();
}, 30000);

module.exports = notificationService;