// ============================================
// MIGRATION v13: Email Verification (OTP) Table
// ============================================

const pool = require('./config/db');

async function migrate() {
  console.log('🔄 Running Migration v13: Email Verification (OTP) Table...');

  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS email_verifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        otp_code VARCHAR(6) NOT NULL,
        attempts INT DEFAULT 0,
        verified TINYINT(1) DEFAULT 0,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_expires (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('  ✅ Created email_verifications table');

    console.log('✅ Migration v13 completed successfully!');
  } catch (error) {
    console.error('❌ Migration v13 failed:', error.message);
    throw error;
  }
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });