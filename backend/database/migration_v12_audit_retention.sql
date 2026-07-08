-- ============================================
-- MIGRATION v12: Audit Log Retention Setting
-- Menambahkan setting audit_log_retention_days
-- Default: 30 hari (auto-purge log > 30 hari)
-- ============================================

-- Tambah setting retention days
INSERT INTO system_settings (setting_key, setting_value, description)
VALUES ('audit_log_retention_days', '30', 'Jumlah hari retensi log aktivitas. Log yang lebih lama akan dihapus otomatis.')
ON DUPLICATE KEY UPDATE setting_value = setting_value;

-- Tambah index pada created_at jika belum ada (untuk performa DELETE berdasarkan tanggal)
-- Index ini sudah ada dari schema awal, tapi pastikan
ALTER TABLE audit_log ADD INDEX IF NOT EXISTS idx_audit_log_created_at (created_at);