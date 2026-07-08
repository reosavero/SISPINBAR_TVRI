// ============================================
// MIGRATION v12: Audit Log Retention Setting
// ============================================

const pool = require('./config/db');

async function migrate() {
  console.log('🔄 Running Migration v12: Audit Log Retention Setting...');

  try {
    // Add audit_log_retention_days setting
    await pool.execute(`
      INSERT INTO system_settings (setting_key, setting_value, description)
      VALUES ('audit_log_retention_days', '30', 'Jumlah hari retensi log aktivitas. Log yang lebih lama akan dihapus otomatis.')
      ON DUPLICATE KEY UPDATE setting_value = setting_value
    `);
    console.log('  ✅ Added audit_log_retention_days setting (default: 30)');

    // Ensure index on created_at
    await pool.execute(`
      ALTER TABLE audit_log ADD INDEX idx_audit_log_created_at (created_at)
    `).catch(() => {
      // Index might already exist
      console.log('  ⚠️  Index idx_audit_log_created_at already exists, skipping');
    });
    console.log('  ✅ Index on audit_log.created_at ensured');

    console.log('✅ Migration v12 completed successfully!');
  } catch (error) {
    console.error('❌ Migration v12 failed:', error.message);
    throw error;
  }
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });