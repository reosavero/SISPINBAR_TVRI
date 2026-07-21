

const pool = require('../config/db');

const auditService = {
  
  log: async ({ userId, username, action, module, recordId, details, ipAddress }) => {
    try {
      await pool.execute(
        `INSERT INTO audit_log (user_id, username, action, module, record_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          userId || null,
          username || null,
          action,
          module,
          recordId || null,
          details ? JSON.stringify(details) : null,
          ipAddress || null,
        ]
      );
    } catch (error) {
      
      console.error('Audit log error:', error.message);
    }
  },

  
  getAll: async (params = {}) => {
    const page = parseInt(params.page) || 1;
    const limit = parseInt(params.limit) || 20;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let queryParams = [];

    if (params.userId) {
      whereConditions.push('user_id = ?');
      queryParams.push(params.userId);
    }
    if (params.action) {
      whereConditions.push('action = ?');
      queryParams.push(params.action);
    }
    if (params.module) {
      whereConditions.push('module = ?');
      queryParams.push(params.module);
    }
    if (params.startDate) {
      whereConditions.push('created_at >= ?');
      queryParams.push(params.startDate);
    }
    if (params.endDate) {
      whereConditions.push('created_at <= ?');
      queryParams.push(params.endDate);
    }
    if (params.search) {
      whereConditions.push('(username LIKE ? OR details LIKE ?)');
      queryParams.push(`%${params.search}%`, `%${params.search}%`);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    const [rows] = await pool.execute(
      `SELECT * FROM audit_log ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    const [countResult] = await pool.execute(
      `SELECT COUNT(*) AS total FROM audit_log ${whereClause}`,
      queryParams
    );

    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: rows,
      pagination: { page, totalPages, totalItems, itemsPerPage: limit },
    };
  },

  
  getByUser: async (userId, params = {}) => {
    return auditService.getAll({ ...params, userId });
  },

  
  getRecent: async (limit = 10) => {
    const [rows] = await pool.execute(
      `SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ?`,
      [limit]
    );
    return rows;
  },

  
  getStats: async () => {
    const [todayActions] = await pool.execute(
      `SELECT COUNT(*) AS total FROM audit_log WHERE DATE(created_at) = CURDATE()`
    );
    const [weekActions] = await pool.execute(
      `SELECT COUNT(*) AS total FROM audit_log WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
    );
    const [totalActions] = await pool.execute(
      `SELECT COUNT(*) AS total FROM audit_log`
    );
    const [actionBreakdown] = await pool.execute(
      `SELECT action, COUNT(*) AS total FROM audit_log GROUP BY action ORDER BY total DESC`
    );
    const [moduleBreakdown] = await pool.execute(
      `SELECT module, COUNT(*) AS total FROM audit_log GROUP BY module ORDER BY total DESC`
    );

    return {
      today: todayActions[0].total,
      thisWeek: weekActions[0].total,
      total: totalActions[0].total,
      actionBreakdown,
      moduleBreakdown,
    };
  },
};

module.exports = auditService;