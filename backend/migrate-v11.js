// ============================================
// MIGRATION v11: Add registration_status to users
// ============================================

const pool = require('./config/db');

async function migrate() {
  console.log('Running migration v11: Add registration_status to users...');

  try {
    // Check if column already exists
    const [columns] = await pool.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'registration_status'"
    );

    if (columns.length > 0) {
      console.log('  ✓ registration_status column already exists, skipping');
    } else {
      await pool.execute(`
        ALTER TABLE users
          ADD COLUMN registration_status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved' COMMENT 'pending = menunggu persetujuan, approved = disetujui, rejected = ditolak' AFTER is_active,
          ADD COLUMN rejection_reason TEXT NULL COMMENT 'Alasan penolakan registrasi' AFTER registration_status
      `);
      console.log('  ✓ Added registration_status and rejection_reason columns');
    }

    // Create index
    const [indexes] = await pool.execute(
      "SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND INDEX_NAME = 'idx_users_registration_status'"
    );

    if (indexes.length === 0) {
      await pool.execute('CREATE INDEX idx_users_registration_status ON users (registration_status)');
      console.log('  ✓ Created index idx_users_registration_status');
    } else {
      console.log('  ✓ Index idx_users_registration_status already exists');
    }

    // Set all existing users to approved
    await pool.execute("UPDATE users SET registration_status = 'approved' WHERE registration_status = 'approved' OR registration_status IS NULL");
    console.log('  ✓ All existing users set to approved');

    console.log('Migration v11 completed successfully!');
  } catch (error) {
    console.error('Migration v11 error:', error.message);
    throw error;
  }
}

migrate()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));