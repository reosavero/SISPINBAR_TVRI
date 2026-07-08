// ============================================
// DATABASE CONFIG - Sistem Peminjaman Barang TVRI
// ============================================

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'db_peminjaman_tvri',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  timezone: '+07:00',
});

// Pool connects lazily on first query — no eager getConnection needed.
// Connection errors surface naturally on first query if DB is unreachable.

// Graceful shutdown helper for scripts/tests
const closePool = async () => {
  try { await pool.end(); } catch (e) { /* ignore */ }
};

module.exports = pool;
module.exports.closePool = closePool;