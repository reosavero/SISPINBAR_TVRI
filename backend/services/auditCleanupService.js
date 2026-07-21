

const pool = require('../config/db');
const auditService = require('./auditService');

const cleanupOldLogs = async (performedBy = null) => {
  
  const [settings] = await pool.execute(
    "SELECT setting_value FROM system_settings WHERE setting_key = 'audit_log_retention_days'"
  );

  const retentionDays = settings.length > 0 ? parseInt(settings[0].setting_value) : 30;

  if (retentionDays <= 0) {
    return { deleted: 0, message: 'Retention disabled (0 days)', retentionDays: 0 };
  }

  
  const [countResult] = await pool.execute(
    'SELECT COUNT(*) AS total FROM audit_log WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
    [retentionDays]
  );
  const totalToDelete = countResult[0].total;

  if (totalToDelete === 0) {
    return { deleted: 0, message: 'Tidak ada log yang perlu dibersihkan', retentionDays };
  }

  
  const [result] = await pool.execute(
    'DELETE FROM audit_log WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
    [retentionDays]
  );

  
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

const getRetentionInfo = async () => {
  const [settings] = await pool.execute(
    "SELECT setting_value FROM system_settings WHERE setting_key = 'audit_log_retention_days'"
  );
  const retentionDays = settings.length > 0 ? parseInt(settings[0].setting_value) : 30;

  
  const [countResult] = await pool.execute(
    'SELECT COUNT(*) AS total FROM audit_log WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
    [retentionDays]
  );

  
  const [totalResult] = await pool.execute('SELECT COUNT(*) AS total FROM audit_log');

  
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