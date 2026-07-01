-- ======================================================================
-- MIGRATION: Perbaikan struktur database
-- ======================================================================
-- Jalankan ini HANYA jika Anda mengupgrade dari versi lama
-- yang belum memiliki kolom username pada tabel users
-- atau kolom user_id pada tabel pegawai.
--
-- ⚠️  Script ini TIDAK menghapus data apapun.
-- ⚠️  Data pegawai dan user yang sudah ada akan tetap tersimpan.
-- ======================================================================

USE db_peminjaman_tvri;

-- 1. Tambah kolom username jika belum ada
SET @col_exists = 0;
SELECT 1 INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'db_peminjaman_tvri' 
  AND TABLE_NAME = 'users' 
  AND COLUMN_NAME = 'username';

SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE users ADD COLUMN username VARCHAR(50) UNIQUE NOT NULL AFTER id',
  'SELECT "Kolom username sudah ada" AS info');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Tambah kolom user_id pada pegawai jika belum ada
SET @col_exists2 = 0;
SELECT 1 INTO @col_exists2 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'db_peminjaman_tvri' 
  AND TABLE_NAME = 'pegawai' 
  AND COLUMN_NAME = 'user_id';

SET @sql2 = IF(@col_exists2 = 0, 
  'ALTER TABLE pegawai ADD COLUMN user_id INT NULL AFTER id',
  'SELECT "Kolom user_id sudah ada" AS info');
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- Selesai!
SELECT '✅ Migrasi selesai! Tidak ada data yang dihapus.' AS message;

-- ======================================================================
-- MIGRATION v3: Add jumlah column to barang
-- ======================================================================
SET @col_jumlah_exists = 0;
SELECT 1 INTO @col_jumlah_exists
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'db_peminjaman_tvri'
  AND TABLE_NAME = 'barang'
  AND COLUMN_NAME = 'jumlah';

SET @sql_jumlah = IF(@col_jumlah_exists = 0,
  'ALTER TABLE barang ADD COLUMN jumlah INT NOT NULL DEFAULT 1 AFTER deskripsi',
  'SELECT "Kolom jumlah sudah ada" AS info');
PREPARE stmt_jumlah FROM @sql_jumlah;
EXECUTE stmt_jumlah;
DEALLOCATE PREPARE stmt_jumlah;

SELECT '✅ Migrasi v3 selesai! Kolom jumlah ditambahkan jika belum ada.' AS message;
-- ======================================================================
-- MIGRATION v4: Add foto column to peminjaman
-- ======================================================================
SET @col_foto_peminjaman_exists = 0;
SELECT 1 INTO @col_foto_peminjaman_exists
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'db_peminjaman_tvri'
  AND TABLE_NAME = 'peminjaman'
  AND COLUMN_NAME = 'foto';

SET @sql_foto_peminjaman = IF(@col_foto_peminjaman_exists = 0,
  'ALTER TABLE peminjaman ADD COLUMN foto VARCHAR(255) DEFAULT NULL AFTER keperluan',
  'SELECT "Kolom foto pada peminjaman sudah ada" AS info');
PREPARE stmt_foto_peminjaman FROM @sql_foto_peminjaman;
EXECUTE stmt_foto_peminjaman;
DEALLOCATE PREPARE stmt_foto_peminjaman;

SELECT '✅ Migrasi v4 selesai! Kolom foto ditambahkan ke peminjaman jika belum ada.' AS message;
