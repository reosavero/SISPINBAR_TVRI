// ============================================
// DATABASE MIGRATION - Add username to users, user_id to pegawai
// ============================================
// Run this script if you have an OLD database that doesn't have
// the username column yet.
//
// Usage: npm run migrate
// ============================================

const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
  console.log('🔄 Starting database migration...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'db_peminjaman_tvri',
  });

  const steps = [
    {
      name: 'Add username column to users',
      sql: 'ALTER TABLE users ADD COLUMN username VARCHAR(50) AFTER id',
      check: "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'username'",
    },
    {
      name: 'Add avatar column to users',
      sql: 'ALTER TABLE users ADD COLUMN avatar VARCHAR(255) DEFAULT NULL AFTER role',
      check: "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'avatar'",
    },
    {
      name: 'Copy email to username for existing users',
      sql: 'UPDATE users SET username = email WHERE username IS NULL',
    },
    {
      name: 'Set default username for NULL usernames',
      sql: "UPDATE users SET username = CONCAT('user_', id) WHERE username IS NULL OR username = ''",
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
      name: 'Add username index',
      sql: 'ALTER TABLE users ADD INDEX idx_username (username)',
    },
    {
      name: 'Add user_id column to pegawai',
      sql: 'ALTER TABLE pegawai ADD COLUMN user_id INT DEFAULT NULL AFTER id',
      check: "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pegawai' AND COLUMN_NAME = 'user_id'",
    },
    {
      name: 'Add user_id index to pegawai',
      sql: 'ALTER TABLE pegawai ADD INDEX idx_user_id (user_id)',
    },
    {
      name: 'Add foreign key pegawai.user_id -> users.id',
      sql: 'ALTER TABLE pegawai ADD CONSTRAINT fk_pegawai_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL',
    },
    {
      name: 'Update admin password (admin123)',
      sql: "UPDATE users SET password = '$2b$10$0oKa8p6ORE2kf1D1F.6VBeRDMYTI27Zt/wMTBqnjoJD1j/i4ki8e2' WHERE role = 'admin'",
    },
  ];

  for (const step of steps) {
    try {
      // Check if column already exists (for ALTER TABLE ADD COLUMN)
      if (step.check) {
        const [rows] = await connection.execute(step.check);
        if (rows.length > 0) {
          console.log(`⏭️  Skipped: ${step.name} (already exists)`);
          continue;
        }
      }

      await connection.execute(step.sql);
      console.log(`✅ Done: ${step.name}`);
    } catch (err) {
      if (err.message.includes('Duplicate') || err.message.includes('already exists') || err.message.includes('Duplicate key') || err.message.includes('Duplicate column')) {
        console.log(`⏭️  Skipped: ${step.name} (already exists)`);
      } else {
        console.log(`⚠️  Warning: ${step.name} - ${err.message}`);
      }
    }
  }

  console.log('\n🎉 Migration completed!');
  console.log('🔑 Login: username=admin, password=admin123');

  await connection.end();
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});