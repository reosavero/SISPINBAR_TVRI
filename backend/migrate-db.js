// ============================================
// DATABASE MIGRATION - Comprehensive Migration Script
// Sistem Peminjaman Barang TVRI
//
// Run: npm run migrate
// This script ensures all database schema changes are applied.
// It is SAFE to run multiple times (idempotent).
// ============================================

const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
  console.log('\n🔄 Starting comprehensive database migration...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'db_peminjaman_tvri',
  });

  // Helper: check if a column exists
  async function columnExists(table, column) {
    const [rows] = await connection.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [table, column]
    );
    return rows.length > 0;
  }

  // Helper: check if a table exists
  async function tableExists(table) {
    const [rows] = await connection.execute(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
      [table]
    );
    return rows.length > 0;
  }

  // Helper: check if an index exists
  async function indexExists(table, indexName) {
    const [rows] = await connection.execute(
      `SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
      [table, indexName]
    );
    return rows.length > 0;
  }

  // Helper: run a migration step safely
  async function runStep(step) {
    try {
      // Check if column/table should exist first (for ALTER TABLE ADD COLUMN)
      if (step.checkColumn) {
        const exists = await columnExists(step.checkColumn.table, step.checkColumn.column);
        if (exists) {
          console.log(`⏭️  Skipped: ${step.name} (column already exists)`);
          return;
        }
      }

      if (step.checkTable) {
        const exists = await tableExists(step.checkTable);
        if (exists) {
          console.log(`⏭️  Skipped: ${step.name} (table already exists)`);
          return;
        }
      }

      if (step.checkIndex) {
        const exists = await indexExists(step.checkIndex.table, step.checkIndex.index);
        if (exists) {
          console.log(`⏭️  Skipped: ${step.name} (index already exists)`);
          return;
        }
      }

      await connection.execute(step.sql);
      console.log(`✅ Done: ${step.name}`);
    } catch (err) {
      if (
        err.message.includes('Duplicate') ||
        err.message.includes('already exists') ||
        err.message.includes('Duplicate column') ||
        err.message.includes('Duplicate key')
      ) {
        console.log(`⏭️  Skipped: ${step.name} (already exists)`);
      } else {
        console.log(`⚠️  Warning: ${step.name} - ${err.message}`);
      }
    }
  }

  // ============================================
  // MIGRATION STEPS
  // ============================================
  const steps = [
    // ===== USERS TABLE =====
    {
      name: 'Add username column to users',
      sql: 'ALTER TABLE users ADD COLUMN username VARCHAR(50) NOT NULL AFTER id',
      checkColumn: { table: 'users', column: 'username' },
    },
    {
      name: 'Add avatar column to users',
      sql: 'ALTER TABLE users ADD COLUMN avatar VARCHAR(255) DEFAULT NULL AFTER role',
      checkColumn: { table: 'users', column: 'avatar' },
    },
    {
      name: 'Set default username from email for existing users',
      sql: 'UPDATE users SET username = email WHERE username IS NULL OR username = ""',
    },
    {
      name: 'Set admin username explicitly',
      sql: "UPDATE users SET username = 'admin' WHERE role = 'admin'",
    },
    {
      name: 'Make username NOT NULL UNIQUE',
      sql: 'ALTER TABLE users MODIFY COLUMN username VARCHAR(50) NOT NULL UNIQUE',
    },
    {
      name: 'Make email nullable',
      sql: 'ALTER TABLE users MODIFY COLUMN email VARCHAR(100) DEFAULT NULL',
    },
    {
      name: 'Add username index to users',
      sql: 'ALTER TABLE users ADD INDEX idx_username (username)',
      checkIndex: { table: 'users', index: 'idx_username' },
    },

    // ===== PEGAWAI TABLE =====
    {
      name: 'Add user_id column to pegawai',
      sql: 'ALTER TABLE pegawai ADD COLUMN user_id INT DEFAULT NULL AFTER id',
      checkColumn: { table: 'pegawai', column: 'user_id' },
    },
    {
      name: 'Add user_id index to pegawai',
      sql: 'ALTER TABLE pegawai ADD INDEX idx_user_id (user_id)',
      checkIndex: { table: 'pegawai', index: 'idx_user_id' },
    },
    {
      name: 'Add foreign key pegawai.user_id -> users.id',
      sql: 'ALTER TABLE pegawai ADD CONSTRAINT fk_pegawai_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL',
      checkIndex: { table: 'pegawai', index: 'fk_pegawai_user' },
    },
    {
      name: 'Add deleted_at column to pegawai (soft delete)',
      sql: 'ALTER TABLE pegawai ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER updated_at',
      checkColumn: { table: 'pegawai', column: 'deleted_at' },
    },

    // ===== BARANG TABLE =====
    {
      name: 'Add jumlah column to barang',
      sql: 'ALTER TABLE barang ADD COLUMN jumlah INT NOT NULL DEFAULT 1 AFTER deskripsi',
      checkColumn: { table: 'barang', column: 'jumlah' },
    },
    {
      name: 'Add deleted_at column to barang (soft delete)',
      sql: 'ALTER TABLE barang ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER updated_at',
      checkColumn: { table: 'barang', column: 'deleted_at' },
    },

    // ===== PEMINJAMAN TABLE =====
    {
      name: 'Add foto column to peminjaman',
      sql: 'ALTER TABLE peminjaman ADD COLUMN foto VARCHAR(255) DEFAULT NULL AFTER keperluan',
      checkColumn: { table: 'peminjaman', column: 'foto' },
    },
    {
      name: 'Add jumlah column to peminjaman',
      sql: 'ALTER TABLE peminjaman ADD COLUMN jumlah INT DEFAULT 1 AFTER barang_id',
      checkColumn: { table: 'peminjaman', column: 'jumlah' },
    },
    {
      name: 'Update peminjaman status ENUM to include Menunggu Konfirmasi',
      sql: "ALTER TABLE peminjaman MODIFY COLUMN status ENUM('Menunggu Persetujuan', 'Disetujui', 'Dipinjam', 'Menunggu Konfirmasi', 'Dikembalikan', 'Ditolak') DEFAULT 'Menunggu Persetujuan'",
    },
    {
      name: 'Change peminjaman tanggal_pinjam from DATE to DATETIME',
      sql: 'ALTER TABLE peminjaman MODIFY COLUMN tanggal_pinjam DATETIME NOT NULL',
    },
    {
      name: 'Change peminjaman tanggal_kembali_rencana from DATE to DATETIME',
      sql: 'ALTER TABLE peminjaman MODIFY COLUMN tanggal_kembali_rencana DATETIME NOT NULL',
    },
    {
      name: 'Add archived_at column to peminjaman',
      sql: 'ALTER TABLE peminjaman ADD COLUMN archived_at TIMESTAMP NULL DEFAULT NULL AFTER updated_at',
      checkColumn: { table: 'peminjaman', column: 'archived_at' },
    },
    {
      name: 'Add index on peminjaman.archived_at',
      sql: 'ALTER TABLE peminjaman ADD INDEX idx_archived_at (archived_at)',
      checkIndex: { table: 'peminjaman', index: 'idx_archived_at' },
    },

    // ===== PENGEMBALIAN TABLE =====
    {
      name: 'Add status column to pengembalian',
      sql: "ALTER TABLE pengembalian ADD COLUMN status ENUM('Menunggu Konfirmasi', 'Diterima') DEFAULT 'Menunggu Konfirmasi' AFTER foto",
      checkColumn: { table: 'pengembalian', column: 'status' },
    },
    {
      name: 'Change pengembalian tanggal_kembali_aktual from DATE to DATETIME',
      sql: 'ALTER TABLE pengembalian MODIFY COLUMN tanggal_kembali_aktual DATETIME NOT NULL',
    },

    // ===== AUDIT_LOG TABLE =====
    {
      name: 'Create audit_log table',
      sql: `CREATE TABLE IF NOT EXISTS audit_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT DEFAULT NULL,
        username VARCHAR(100) DEFAULT NULL,
        action VARCHAR(50) NOT NULL COMMENT 'CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT, APPROVE, REJECT, EXPORT',
        module VARCHAR(50) NOT NULL COMMENT 'auth, barang, kategori, pegawai, peminjaman, pengembalian',
        record_id INT DEFAULT NULL,
        details TEXT DEFAULT NULL COMMENT 'JSON detail perubahan',
        ip_address VARCHAR(45) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user (user_id),
        INDEX idx_action (action),
        INDEX idx_module (module),
        INDEX idx_created (created_at),
        INDEX idx_user_action (user_id, action)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
      checkTable: 'audit_log',
    },

    // ===== NOTIFICATIONS TABLE =====
    {
      name: 'Create notifications table',
      sql: `CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT DEFAULT NULL COMMENT 'NULL = broadcast ke semua admin',
        pegawai_id INT DEFAULT NULL COMMENT 'Untuk notifikasi ke pegawai tertentu',
        title VARCHAR(255) NOT NULL,
        message TEXT DEFAULT NULL,
        type ENUM('info', 'success', 'warning', 'danger', 'peminjaman', 'pengembalian', 'persetujuan', 'penolakan') DEFAULT 'info',
        module VARCHAR(50) DEFAULT NULL,
        record_id INT DEFAULT NULL,
        is_read TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user (user_id),
        INDEX idx_pegawai (pegawai_id),
        INDEX idx_is_read (is_read),
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
      checkTable: 'notifications',
    },

    // ===== PERPANJANGAN TABLE =====
    {
      name: 'Create perpanjangan table',
      sql: `CREATE TABLE IF NOT EXISTS perpanjangan (
        id INT AUTO_INCREMENT PRIMARY KEY,
        peminjaman_id INT NOT NULL,
        tanggal_kembali_lama DATE NOT NULL COMMENT 'Tanggal kembali rencana sebelumnya',
        tanggal_kembali_baru DATE NOT NULL COMMENT 'Tanggal kembali rencana baru',
        alasan TEXT DEFAULT NULL,
        status ENUM('Menunggu Persetujuan', 'Disetujui', 'Ditolak') DEFAULT 'Menunggu Persetujuan',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (peminjaman_id) REFERENCES peminjaman(id) ON DELETE CASCADE,
        INDEX idx_peminjaman (peminjaman_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
      checkTable: 'perpanjangan',
    },

    // ===== UPDATE ADMIN PASSWORD =====
    {
      name: 'Update admin password (admin123)',
      sql: "UPDATE users SET password = '$2b$10$0oKa8p6ORE2kf1D1F.6VBeRDMYTI27Zt/wMTBqnjoJD1j/i4ki8e2' WHERE role = 'admin'",
    },
  ];

  // Execute all migration steps
  for (const step of steps) {
    await runStep(step);
  }

  // ============================================
  // VERIFICATION: Check all critical columns exist
  // ============================================
  console.log('\n📋 Verifying database schema...\n');

  const criticalChecks = [
    { table: 'users', column: 'username', desc: 'users.username' },
    { table: 'users', column: 'avatar', desc: 'users.avatar' },
    { table: 'pegawai', column: 'user_id', desc: 'pegawai.user_id' },
    { table: 'pegawai', column: 'deleted_at', desc: 'pegawai.deleted_at' },
    { table: 'barang', column: 'jumlah', desc: 'barang.jumlah' },
    { table: 'barang', column: 'deleted_at', desc: 'barang.deleted_at' },
    { table: 'peminjaman', column: 'jumlah', desc: 'peminjaman.jumlah' },
    { table: 'peminjaman', column: 'foto', desc: 'peminjaman.foto' },
    { table: 'peminjaman', column: 'archived_at', desc: 'peminjaman.archived_at' },
    { table: 'pengembalian', column: 'status', desc: 'pengembalian.status' },
  ];

  let allGood = true;
  for (const check of criticalChecks) {
    const exists = await columnExists(check.table, check.column);
    if (exists) {
      console.log(`  ✅ ${check.desc} exists`);
    } else {
      console.log(`  ❌ ${check.desc} MISSING!`);
      allGood = false;
    }
  }

  const criticalTables = ['audit_log', 'notifications', 'perpanjangan'];
  for (const table of criticalTables) {
    const exists = await tableExists(table);
    if (exists) {
      console.log(`  ✅ Table ${table} exists`);
    } else {
      console.log(`  ❌ Table ${table} MISSING!`);
      allGood = false;
    }
  }

  if (allGood) {
    console.log('\n🎉 Migration completed successfully! All critical columns and tables verified.');
  } else {
    console.log('\n⚠️  Migration completed with warnings. Some columns/tables are still missing.');
    console.log('   Try running this script again or check the database manually.');
  }

  console.log('\n🔑 Login: username=admin, password=admin123\n');

  await connection.end();
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});