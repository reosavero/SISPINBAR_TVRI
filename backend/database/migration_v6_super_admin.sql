-- ======================================================================
-- MIGRATION v6: Super Admin Role System
-- - Ubah ENUM role: ('admin', 'operator', 'viewer') → ('super_admin', 'admin', 'pegawai')
-- - Tambah kolom is_active pada users
-- - Tambah kolom deleted_at pada users (soft delete)
-- - Buat tabel system_settings
-- - Seed Super Admin account
-- - Migrasi data lama
-- ======================================================================

USE db_peminjaman_tvri;

-- ============================================
-- 1. Migrasi data role lama ke role baru
-- ============================================
-- operator → pegawai, viewer → pegawai
-- admin tetap admin (akan ada super_admin terpisah)

UPDATE users SET role = 'pegawai' WHERE role IN ('operator', 'viewer', '');

-- Juga perbaiki role NULL menjadi pegawai
UPDATE users SET role = 'pegawai' WHERE role IS NULL;

-- ============================================
-- 2. Tambah kolom is_active jika belum ada
-- ============================================
SET @col_is_active = 0;
SELECT 1 INTO @col_is_active
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'db_peminjaman_tvri'
  AND TABLE_NAME = 'users'
  AND COLUMN_NAME = 'is_active';

SET @sql_is_active = IF(@col_is_active = 0,
  'ALTER TABLE users ADD COLUMN is_active TINYINT(1) DEFAULT 1 AFTER role',
  'SELECT "Kolom is_active sudah ada" AS info');
PREPARE stmt_is_active FROM @sql_is_active;
EXECUTE stmt_is_active;
DEALLOCATE PREPARE stmt_is_active;

-- ============================================
-- 3. Tambah kolom deleted_at pada users (soft delete)
-- ============================================
SET @col_users_deleted = 0;
SELECT 1 INTO @col_users_deleted
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'db_peminjaman_tvri'
  AND TABLE_NAME = 'users'
  AND COLUMN_NAME = 'deleted_at';

SET @sql_users_deleted = IF(@col_users_deleted = 0,
  'ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER is_active',
  'SELECT "Kolom deleted_at pada users sudah ada" AS info');
PREPARE stmt_users_deleted FROM @sql_users_deleted;
EXECUTE stmt_users_deleted;
DEALLOCATE PREPARE stmt_users_deleted;

-- ============================================
-- 4. Ubah ENUM role pada tabel users
-- ============================================
ALTER TABLE users MODIFY COLUMN role ENUM('super_admin', 'admin', 'pegawai') DEFAULT 'pegawai';

-- ============================================
-- 5. Set semua user yang sudah ada menjadi active
-- ============================================
UPDATE users SET is_active = 1 WHERE is_active IS NULL;

-- ============================================
-- 6. Buat tabel system_settings
-- ============================================
CREATE TABLE IF NOT EXISTS system_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT,
  description VARCHAR(255),
  updated_by INT DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 7. Seed default system settings
-- ============================================
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
  ('app_name', 'SISPINBAR', 'Nama Aplikasi'),
  ('app_full_name', 'Sistem Peminjaman Barang', 'Nama Lengkap Aplikasi'),
  ('app_organization', 'TVRI Jawa Timur', 'Nama Organisasi'),
  ('max_login_attempts', '5', 'Maksimal percobaan login'),
  ('session_timeout', '24', 'Session timeout (jam)'),
  ('default_password', 'tvri1234', 'Default password untuk akun baru')
ON DUPLICATE KEY UPDATE description=VALUES(description);

-- ============================================
-- 8. Seed Super Admin account
-- Password: superadmin123 (bcrypt hash)
-- ============================================
-- Cek apakah super_admin sudah ada
SET @super_admin_exists = 0;
SELECT COUNT(*) INTO @super_admin_exists FROM users WHERE role = 'super_admin';

-- Hanya insert jika belum ada
SET @sql_seed = IF(@super_admin_exists = 0,
  'INSERT INTO users (username, email, password, nama, role, is_active) VALUES (''superadmin'', ''superadmin@tvri.go.id'', ''$2b$10$Lqp7xM2Eh8VqxH6G5Z1KXOZvN3qY8rF2wT4bD6mKeR9jLpNsXvW3G'', ''Super Administrator'', ''super_admin'', 1)',
  'SELECT "Super Admin sudah ada" AS info');
PREPARE stmt_seed FROM @sql_seed;
EXECUTE stmt_seed;
DEALLOCATE PREPARE stmt_seed;

-- ============================================
-- 9. Tambah index pada users untuk performance
-- ============================================
SET @idx_role = 0;
SELECT 1 INTO @idx_role
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = 'db_peminjaman_tvri'
  AND TABLE_NAME = 'users'
  AND INDEX_NAME = 'idx_role';

SET @sql_idx_role = IF(@idx_role = 0,
  'ALTER TABLE users ADD INDEX idx_role (role)',
  'SELECT "Index idx_role sudah ada" AS info');
PREPARE stmt_idx_role FROM @sql_idx_role;
EXECUTE stmt_idx_role;
DEALLOCATE PREPARE stmt_idx_role;

SET @idx_is_active = 0;
SELECT 1 INTO @idx_is_active
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = 'db_peminjaman_tvri'
  AND TABLE_NAME = 'users'
  AND INDEX_NAME = 'idx_is_active';

SET @sql_idx_is_active = IF(@idx_is_active = 0,
  'ALTER TABLE users ADD INDEX idx_is_active (is_active)',
  'SELECT "Index idx_is_active sudah ada" AS info');
PREPARE stmt_idx_is_active FROM @sql_idx_is_active;
EXECUTE stmt_idx_is_active;
DEALLOCATE PREPARE stmt_idx_is_active;

SELECT '✅ Migrasi v6 selesai! Super Admin role system ditambahkan.' AS message;