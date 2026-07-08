-- ============================================
-- MIGRATION v9: Add login_attempts & locked_until to users table
-- Integrates max_login_attempts from system_settings
-- ============================================

ALTER TABLE users
  ADD COLUMN login_attempts INT DEFAULT 0 COMMENT 'Jumlah percobaan login gagal',
  ADD COLUMN locked_until DATETIME NULL COMMENT 'Waktu sampai akun terkunci (null = tidak terkunci)';

-- Add index for lock check
CREATE INDEX idx_users_locked_until ON users (locked_until);