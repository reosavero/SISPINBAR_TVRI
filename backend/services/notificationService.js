// ============================================
// NOTIFICATION SERVICE - Sistem Peminjaman Barang TVRI
// Notifikasi real-time via SSE + database
// Grouping per Pegawai per Tipe Aksi
// ============================================

const pool = require('../config/db');
const { getWIBDateTime } = require('../utils/helpers');

// Active SSE connections
const sseConnections = new Map();

// ============================================
// HELPER: Extract pegawai name from message
// Pattern: "NAMA mengajukan peminjaman..." or "NAMA mengembalikan..."
// ============================================
function extractPegawaiName(message) {
  if (!message) return '';
  const match = message.match(/^(.+?)\s+(mengajukan|mengembalikan)\s/);
  return match ? match[1].trim() : '';
}

// ============================================
// HELPER: Extract barang name from message
// Pattern: "...mengajukan peminjaman BARANG (KODE)" or "...mengembalikan BARANG (KODE)..."
// ============================================
function extractBarangName(message) {
  if (!message) return '';
  const match = message.match(/(?:mengajukan peminjaman|mengembalikan)\s+(.+?)(?:\s*\(|$)/);
  return match ? match[1].trim() : '';
}

// ============================================
// HELPER: Group notifications by pegawai + type
// Peminjaman & pengembalian dari pegawai yang sama digabung jadi 1 baris.
// Tipe lain tetap individual.
// ============================================
function groupNotificationsByActor(notifications) {
  if (!notifications || notifications.length === 0) return [];

  const GROUPABLE_TYPES = ['peminjaman', 'pengembalian'];
  const result = [];
  const groupedMap = new Map(); // key: `${type}|${pegawaiName}`
  const processed = new Set();

  // First pass: group peminjaman & pengembalian by pegawai
  for (const notif of notifications) {
    if (!GROUPABLE_TYPES.includes(notif.type)) continue;

    const pegawaiName = extractPegawaiName(notif.message);
    if (!pegawaiName) {
      // Cannot extract name → show individually
      continue;
    }

    const key = `${notif.type}|${pegawaiName}`;

    if (!groupedMap.has(key)) {
      groupedMap.set(key, []);
    }
    groupedMap.get(key).push(notif);
    processed.add(notif.id);
  }

  // Build grouped results
  for (const [key, items] of groupedMap) {
    const [type, pegawaiName] = key.split('|');
    const sortedItems = [...items].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const latestTime = sortedItems[0].created_at; // newest first

    if (sortedItems.length === 1) {
      // Single item → show individually but with pegawai name prominent
      const item = sortedItems[0];
      const barangName = extractBarangName(item.message);
      const actionText = type === 'peminjaman'
        ? `Mengajukan peminjaman ${barangName}`
        : `Mengembalikan ${barangName}`;

      result.push({
        is_group: false,
        id: item.id,
        type: item.type,
        title: item.title,
        message: item.message,
        module: item.module,
        record_id: item.record_id,
        created_at: item.created_at,
        // Extra fields for pegawai-first display
        pegawai_name: pegawaiName,
        action_text: actionText,
        barang_name: barangName,
      });
    } else {
      // Multiple items → show as expandable group
      const barangNames = sortedItems.map(item => extractBarangName(item.message)).filter(Boolean);
      const actionLabel = type === 'peminjaman'
        ? `Mengajukan ${sortedItems.length} peminjaman`
        : `Mengembalikan ${sortedItems.length} barang`;

      result.push({
        is_group: true,
        id: `group_${type}_${sortedItems[0].id}`,
        group_type: type,
        group_count: sortedItems.length,
        group_title: actionLabel,
        group_summary: barangNames,
        pegawai_name: pegawaiName,
        latest_time: latestTime,
        created_at: latestTime,
        type: type,
        module: type,
        items: sortedItems.map(item => ({
          id: item.id,
          type: item.type,
          title: item.title,
          message: item.message,
          module: item.module,
          record_id: item.record_id,
          created_at: item.created_at,
          barang_name: extractBarangName(item.message),
        })),
      });
    }
  }

  // Add non-groupable notifications (individual)
  for (const notif of notifications) {
    if (processed.has(notif.id)) continue;

    result.push({
      is_group: false,
      id: notif.id,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      module: notif.module,
      record_id: notif.record_id,
      created_at: notif.created_at,
      pegawai_name: extractPegawaiName(notif.message) || '',
      action_text: notif.message,
      barang_name: '',
    });
  }

  // Sort by time (newest first)
  result.sort((a, b) => {
    const aTime = a.is_group ? new Date(a.latest_time) : new Date(a.created_at);
    const bTime = b.is_group ? new Date(b.latest_time) : new Date(b.created_at);
    return bTime - aTime;
  });

  return result;
}

// ============================================
// NOTIFICATION SERVICE METHODS
// ============================================

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
      created_at: getWIBDateTime(),
    };

    // Hanya broadcast ke admin jika notifikasi ditujukan untuk admin
    // (userId = null dan pegawaiId = null berarti broadcast ke semua admin)
    // Notifikasi untuk pegawai tertentu (pegawaiId set) TIDAK dikirim ke admin
    if (!pegawaiId) {
      notificationService.broadcastToAdmins(notification);
    }
    if (pegawaiId) {
      notificationService.broadcastToPegawai(pegawaiId, notification);
    }

    return notification;
  },

  // Ambil notifikasi untuk user (flat list, ungrouped)
  // Admin: hanya notifikasi untuk admin (pegawai_id IS NULL)
  // Pegawai: notifikasi untuk pegawai tersebut + broadcast
  getByUser: async (userId, pegawaiId, params = {}) => {
    const limit = parseInt(params.limit) || 20;
    const page = parseInt(params.page) || 1;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let queryParams = [];

    if (pegawaiId) {
      // Pegawai: notifikasi khusus pegawai ini + broadcast (pegawai_id IS NULL)
      whereConditions.push('(pegawai_id = ? OR pegawai_id IS NULL)');
      queryParams.push(pegawaiId);
    } else if (userId) {
      // Admin: hanya notifikasi untuk admin (pegawai_id IS NULL)
      whereConditions.push('pegawai_id IS NULL');
    }
    whereConditions.push('is_read = 0');

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    const [rows] = await pool.execute(
      `SELECT * FROM notifications ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    const [unread] = await pool.execute(
      `SELECT COUNT(*) AS total FROM notifications ${whereClause}`,
      queryParams
    );

    return {
      data: rows,
      unreadCount: unread[0].total,
    };
  },

  // Ambil notifikasi untuk admin — dikelompokkan per pegawai per tipe
  getByAdminGrouped: async (userId, params = {}) => {
    // Fetch all unread notifications (more for grouping)
    const fetchParams = { ...params, limit: 50, page: 1 };
    const result = await notificationService.getByUser(userId, null, fetchParams);

    // Apply grouping by pegawai + type
    const groupedData = groupNotificationsByActor(result.data);

    return {
      data: groupedData,
      unreadCount: result.unreadCount,
    };
  },

  // Ambil notifikasi persetujuan peminjaman untuk pegawai tertentu
  // Hanya type='persetujuan' dan module='peminjaman'
  getByPegawaiApproval: async (pegawaiId, params = {}) => {
    const limit = parseInt(params.limit) || 20;
    const page = parseInt(params.page) || 1;
    const offset = (page - 1) * limit;

    const [rows] = await pool.execute(
      `SELECT * FROM notifications WHERE pegawai_id = ? AND type = 'persetujuan' AND module = 'peminjaman' ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [pegawaiId, limit, offset]
    );

    const [unread] = await pool.execute(
      `SELECT COUNT(*) AS total FROM notifications WHERE pegawai_id = ? AND type = 'persetujuan' AND module = 'peminjaman' AND is_read = 0`,
      [pegawaiId]
    );

    return {
      data: rows,
      unreadCount: unread[0].total,
    };
  },

  // Ambil notifikasi yang BELUM dibaca untuk pegawai
  // Setelah dibaca, notifikasi hilang dari daftar
  getByPegawaiAll: async (pegawaiId, params = {}) => {
    const limit = parseInt(params.limit) || 30;
    const page = parseInt(params.page) || 1;
    const offset = (page - 1) * limit;

    // Hanya notifikasi yang belum dibaca
    const [rows] = await pool.execute(
      `SELECT * FROM notifications WHERE pegawai_id = ? AND is_read = 0 ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [pegawaiId, limit, offset]
    );

    // Hitung unread
    const [unread] = await pool.execute(
      `SELECT COUNT(*) AS total FROM notifications WHERE pegawai_id = ? AND is_read = 0`,
      [pegawaiId]
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

  // Tandai beberapa notifikasi sebagai dibaca sekaligus
  markMultipleAsRead: async (ids, userId) => {
    if (!ids || ids.length === 0) return { success: true, count: 0 };

    const placeholders = ids.map(() => '?').join(', ');
    const [result] = await pool.execute(
      `UPDATE notifications SET is_read = 1 WHERE id IN (${placeholders})`,
      ids
    );
    return { success: true, count: result.affectedRows };
  },

  // Tandai semua notifikasi sebagai dibaca
  markAllAsRead: async (userId, pegawaiId) => {
    if (pegawaiId) {
      await pool.execute(
        'UPDATE notifications SET is_read = 1 WHERE (pegawai_id = ? OR pegawai_id IS NULL) AND is_read = 0',
        [pegawaiId]
      );
    } else if (userId) {
      // Admin: hanya notifikasi admin (pegawai_id IS NULL)
      await pool.execute(
        'UPDATE notifications SET is_read = 1 WHERE pegawai_id IS NULL AND is_read = 0'
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

  registerAdmin: (res, userId) => {
    const connectionId = `admin_${userId}_${Date.now()}`;
    sseConnections.set(connectionId, { type: 'admin', res, userId });
    return connectionId;
  },

  registerPegawai: (res, pegawaiId) => {
    const connectionId = `pegawai_${pegawaiId}_${Date.now()}`;
    sseConnections.set(connectionId, { type: 'pegawai', res, pegawaiId });
    return connectionId;
  },

  unregister: (connectionId) => {
    sseConnections.delete(connectionId);
  },

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