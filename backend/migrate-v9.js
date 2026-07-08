// ============================================
// MIGRATION v9: Add login_attempts & locked_until to users
// ============================================

const pool = require('./config/db');

async function migrate() {
  console.log('Running migration v9: Add login_attempts & locked_until to users...');

  try {
    // Check if column already exists
    const [columns] = await pool.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'login_attempts'"
    );

    if (columns.length > 0) {
      console.log('  ✓ login_attempts column already exists, skipping');
    } else {
      await pool.execute(`
        ALTER TABLE users
          ADD COLUMN login_attempts INT DEFAULT 0 COMMENT 'Jumlah percobaan login gagal',
          ADD COLUMN locked_until DATETIME NULL COMMENT 'Waktu sampai akun terkunci'
      `);
      console.log('  ✓ Added login_attempts and locked_until columns');
    }

    // Check if index exists
    const [indexes] = await pool.execute(
      "SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND INDEX_NAME = 'idx_users_locked_until'"
    );

    if (indexes.length === 0) {
      await pool.execute('CREATE INDEX idx_users_locked_until ON users (locked_until)');
      console.log('  ✓ Created index idx_users_locked_until');
    } else {
      console.log('  ✓ Index idx_users_locked_until already exists, skipping');
    }

    console.log('Migration v9 completed successfully!');
  } catch (error) {
    console.error('Migration v9 error:', error.message);
    throw error;
  }
}

migrate()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));