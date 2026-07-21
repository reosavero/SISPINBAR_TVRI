

const pool = require('../config/db');
const auditService = require('./auditService');

const settingsService = {
  
  getAll: async () => {
    const [rows] = await pool.execute('SELECT * FROM system_settings ORDER BY id ASC');
    return rows;
  },

  
  getByKey: async (key) => {
    const [rows] = await pool.execute('SELECT * FROM system_settings WHERE setting_key = ?', [key]);
    return rows[0] || null;
  },

  
  update: async (key, value, updatedBy) => {
    const [existing] = await pool.execute('SELECT * FROM system_settings WHERE setting_key = ?', [key]);
    if (existing.length === 0) {
      throw new Error('Setting tidak ditemukan');
    }

    await pool.execute(
      'UPDATE system_settings SET setting_value = ?, updated_by = ?, updated_at = NOW() WHERE setting_key = ?',
      [value, updatedBy?.id || null, key]
    );

    
    await auditService.log({
      userId: updatedBy?.id,
      username: updatedBy?.username,
      action: 'UPDATE_SETTINGS',
      module: 'settings',
      details: { setting_key: key, new_value: value },
      ipAddress: updatedBy?.ip,
    });

    const [updated] = await pool.execute('SELECT * FROM system_settings WHERE setting_key = ?', [key]);
    return updated[0];
  },

  
  updateMultiple: async (settings, updatedBy) => {
    const results = [];
    for (const { key, value } of settings) {
      try {
        const result = await settingsService.update(key, value, updatedBy);
        results.push(result);
      } catch (err) {
        results.push({ key, error: err.message });
      }
    }
    return results;
  },

  
  getAppInfo: async () => {
    const settings = await settingsService.getAll();
    const settingsMap = {};
    settings.forEach(s => {
      settingsMap[s.setting_key] = s.setting_value;
    });

    
    const [dbStats] = await pool.execute(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL) AS total_users,
        (SELECT COUNT(*) FROM users WHERE role = 'super_admin' AND deleted_at IS NULL) AS total_super_admin,
        (SELECT COUNT(*) FROM users WHERE role = 'admin' AND deleted_at IS NULL) AS total_admin,
        (SELECT COUNT(*) FROM users WHERE role = 'pegawai' AND registration_status = 'approved' AND deleted_at IS NULL) AS total_pegawai,
        (SELECT COUNT(*) FROM barang WHERE deleted_at IS NULL) AS total_barang,
        (SELECT COUNT(*) FROM peminjaman) AS total_peminjaman,
        (SELECT COUNT(*) FROM kategori) AS total_kategori,
        (SELECT COUNT(*) FROM users WHERE role = 'pegawai' AND registration_status = 'approved' AND deleted_at IS NULL) AS total_pegawai_data
    `);

    return {
      settings: settingsMap,
      stats: dbStats[0],
      version: '1.0.0',
    };
  },
};

module.exports = settingsService;