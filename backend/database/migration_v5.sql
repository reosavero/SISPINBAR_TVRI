-- ======================================================================
-- MIGRATION v5: Fitur Baru SISPINBAR
-- - Soft delete (barang, pegawai)
-- - Audit log
-- - Notifications
-- - Perpanjangan peminjaman
-- ======================================================================

USE db_peminjaman_tvri;

-- 1. Tambah kolom deleted_at pada tabel barang (soft delete)
SET @col_deleted_at_barang = 0;
SELECT 1 INTO @col_deleted_at_barang
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'db_peminjaman_tvri'
  AND TABLE_NAME = 'barang'
  AND COLUMN_NAME = 'deleted_at';

SET @sql_barang = IF(@col_deleted_at_barang = 0,
  'ALTER TABLE barang ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER updated_at',
  'SELECT "Kolom deleted_at pada barang sudah ada" AS info');
PREPARE stmt_barang FROM @sql_barang;
EXECUTE stmt_barang;
DEALLOCATE PREPARE stmt_barang;

-- 2. Tambah kolom deleted_at pada tabel pegawai (soft delete)
SET @col_deleted_at_pegawai = 0;
SELECT 1 INTO @col_deleted_at_pegawai
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'db_peminjaman_tvri'
  AND TABLE_NAME = 'pegawai'
  AND COLUMN_NAME = 'deleted_at';

SET @sql_pegawai = IF(@col_deleted_at_pegawai = 0,
  'ALTER TABLE pegawai ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER updated_at',
  'SELECT "Kolom deleted_at pada pegawai sudah ada" AS info');
PREPARE stmt_pegawai FROM @sql_pegawai;
EXECUTE stmt_pegawai;
DEALLOCATE PREPARE stmt_pegawai;

-- 3. Buat tabel audit_log
CREATE TABLE IF NOT EXISTS audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT NULL,
  username VARCHAR(100) DEFAULT NULL,
  action VARCHAR(50) NOT NULL COMMENT 'CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT, APPROVE, REJECT, EXPORT',
  module VARCHAR(50) NOT NULL COMMENT 'auth, barang, kategori, pegawai, peminjaman, pengembalian',
  record_id INT DEFAULT NULL,
  details TEXT DEFAULT NULL COMMENT 'JSON detail perubahan',
  ip_address VARCHAR(45) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  INDEX idx_action (action),
  INDEX idx_module (module),
  INDEX idx_created (created_at),
  INDEX idx_user_action (user_id, action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Buat tabel notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT NULL COMMENT 'NULL = broadcast ke semua admin',
  pegawai_id INT DEFAULT NULL COMMENT 'Untuk notifikasi ke pegawai tertentu',
  title VARCHAR(255) NOT NULL,
  message TEXT DEFAULT NULL,
  type ENUM('info', 'success', 'warning', 'danger', 'peminjaman', 'pengembalian', 'persetujuan', 'penolakan') DEFAULT 'info',
  module VARCHAR(50) DEFAULT NULL,
  record_id INT DEFAULT NULL,
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  INDEX idx_pegawai (pegawai_id),
  INDEX idx_is_read (is_read),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Buat tabel perpanjangan_peminjaman
CREATE TABLE IF NOT EXISTS perpanjangan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  peminjaman_id INT NOT NULL,
  tanggal_kembali_lama DATE NOT NULL COMMENT 'Tanggal kembali rencana sebelumnya',
  tanggal_kembali_baru DATE NOT NULL COMMENT 'Tanggal kembali rencana baru',
  alasan TEXT DEFAULT NULL,
  status ENUM('Menunggu Persetujuan', 'Disetujui', 'Ditolak') DEFAULT 'Menunggu Persetujuan',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (peminjaman_id) REFERENCES peminjaman(id) ON DELETE CASCADE,
  INDEX idx_peminjaman (peminjaman_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SELECT '✅ Migrasi v5 selesai! Soft delete, audit log, notifikasi, dan perpanjangan ditambahkan.' AS message;