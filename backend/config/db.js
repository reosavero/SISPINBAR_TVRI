

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

const closePool = async () => {
  try { await pool.end(); } catch (e) { 
 }
};

module.exports = pool;
module.exports.closePool = closePool;