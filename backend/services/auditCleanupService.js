// ============================================
// AUDIT CLEANUP SERVICE - Sistem Peminjaman Barang TVRI
// Automatic & manual cleanup of old audit logs
// Based on audit_log_retention_days system setting
// ============================================

const pool = require('../config/db');
const auditService = require('./auditService');

// ========== CLEANUP OLD LOGS ==========
const cleanupOldLogs = async (performedBy = null) => {
  // Get retention days from system settings
  const [settings] = await pool.execute(
    "SELECT setting_value FROM system_settings WHERE setting_key = 'audit_log_retention_days'"
  );

  const retentionDays = settings.length > 0 ? parseInt(settings[0].setting_value) : 30;

  if (retentionDays <= 0) {
    return { deleted: 0, message: 'Retention disabled (0 days)', retentionDays: 0 };
  }

  // Count logs that will be deleted
  const [countResult] = await pool.execute(
    'SELECT COUNT(*) AS total FROM audit_log WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
    [retentionDays]
  );
  const totalToDelete = countResult[0].total;

  if (totalToDelete === 0) {
    return { deleted: 0, message: 'Tidak ada log yang perlu dibersihkan', retentionDays };
  }

  // Delete old logs
  const [result] = await pool.execute(
    'DELETE FROM audit_log WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
    [retentionDays]
  );

  // Audit log about the cleanup itself
  await auditService.log({
    userId: performedBy?.id || null,
    username: performedBy?.username || 'system',
    action: 'CLEANUP_AUDIT_LOG',
    module: 'settings',
    details: {
      deleted_count: result.affectedRows,
      retention_days: retentionDays,
      performed_by: performedBy?.username || 'auto-scheduler',
    },
    ipAddress: performedBy?.ip || null,
  });

  return {
    deleted: result.affectedRows,
    retentionDays,
    message: `${result.affectedRows} log berhasil dibersihkan (retention: ${retentionDays} hari)`,
  };
};

// ========== GET RETENTION INFO ==========
const getRetentionInfo = async () => {
  const [settings] = await pool.execute(
    "SELECT setting_value FROM system_settings WHERE setting_key = 'audit_log_retention_days'"
  );
  const retentionDays = settings.length > 0 ? parseInt(settings[0].setting_value) : 30;

  // Count logs that would be deleted
  const [countResult] = await pool.execute(
    'SELECT COUNT(*) AS total FROM audit_log WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
    [retentionDays]
  );

  // Total logs
  const [totalResult] = await pool.execute('SELECT COUNT(*) AS total FROM audit_log');

  // Oldest log date
  const [oldestResult] = await pool.execute(
    'SELECT MIN(created_at) AS oldest FROM audit_log'
  );

  return {
    retentionDays,
    totalLogs: totalResult[0].total,
    logsToClean: countResult[0].total,
    oldestLog: oldestResult[0].oldest || null,
  };
};

module.exports = { cleanupOldLogs, getRetentionInfo };