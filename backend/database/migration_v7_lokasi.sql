-- ======================================================================
-- MIGRATION v7: Lokasi Barang
-- - Buat tabel lokasi
-- - Tambah kolom lokasi_id pada tabel barang (FK)
-- - Seed default lokasi dari konstanta LOKASI
-- - Migrasi data barang yang sudah ada ke lokasi_id
-- ======================================================================

USE db_peminjaman_tvri;

-- ============================================
-- 1. Buat tabel lokasi
-- ============================================
CREATE TABLE IF NOT EXISTS lokasi (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kode_lokasi VARCHAR(20) NOT NULL UNIQUE,
  nama_lokasi VARCHAR(100) NOT NULL,
  gedung VARCHAR(100) DEFAULT NULL,
  lantai VARCHAR(20) DEFAULT NULL,
  ruangan VARCHAR(100) DEFAULT NULL,
  deskripsi TEXT DEFAULT NULL,
  status ENUM('Aktif', 'Tidak Aktif') DEFAULT 'Aktif',
  created_by INT DEFAULT NULL,
  updated_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_kode_lokasi (kode_lokasi),
  INDEX idx_status (status),
  INDEX idx_deleted_at (deleted_at),
  INDEX idx_gedung (gedung),
  INDEX idx_nama_lokasi (nama_lokasi)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 2. Tambah kolom lokasi_id pada tabel barang jika belum ada
-- ============================================
SET @col_lokasi_id = 0;
SELECT 1 INTO @col_lokasi_id
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'db_peminjaman_tvri'
  AND TABLE_NAME = 'barang'
  AND COLUMN_NAME = 'lokasi_id';

SET @sql_lokasi_id = IF(@col_lokasi_id = 0,
  'ALTER TABLE barang ADD COLUMN lokasi_id INT DEFAULT NULL AFTER lokasi',
  'SELECT "Kolom lokasi_id sudah ada" AS info');
PREPARE stmt_lokasi_id FROM @sql_lokasi_id;
EXECUTE stmt_lokasi_id;
DEALLOCATE PREPARE stmt_lokasi_id;

-- ============================================
-- 3. Tambah foreign key constraint pada barang.lokasi_id
-- ============================================
-- Cek apakah FK sudah ada
SET @fk_exists = 0;
SELECT 1 INTO @fk_exists
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
WHERE TABLE_SCHEMA = 'db_peminjaman_tvri'
  AND TABLE_NAME = 'barang'
  AND CONSTRAINT_NAME = 'fk_barang_lokasi';

SET @sql_fk = IF(@fk_exists = 0,
  'ALTER TABLE barang ADD CONSTRAINT fk_barang_lokasi FOREIGN KEY (lokasi_id) REFERENCES lokasi(id) ON DELETE SET NULL',
  'SELECT "FK fk_barang_lokasi sudah ada" AS info');
PREPARE stmt_fk FROM @sql_fk;
EXECUTE stmt_fk;
DEALLOCATE PREPARE stmt_fk;

-- ============================================
-- 4. Tambah index pada barang.lokasi_id
-- ============================================
SET @idx_barang_lokasi = 0;
SELECT 1 INTO @idx_barang_lokasi
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = 'db_peminjaman_tvri'
  AND TABLE_NAME = 'barang'
  AND INDEX_NAME = 'idx_barang_lokasi_id';

SET @sql_idx_barang = IF(@idx_barang_lokasi = 0,
  'ALTER TABLE barang ADD INDEX idx_barang_lokasi_id (lokasi_id)',
  'SELECT "Index idx_barang_lokasi_id sudah ada" AS info');
PREPARE stmt_idx_barang FROM @sql_idx_barang;
EXECUTE stmt_idx_barang;
DEALLOCATE PREPARE stmt_idx_barang;

-- ============================================
-- 5. Seed default lokasi dari konstanta LOKASI
-- ============================================
INSERT IGNORE INTO lokasi (kode_lokasi, nama_lokasi, gedung, lantai, ruangan, status) VALUES
  ('LOC-001', 'Studio Podcast', 'Gedung Produksi', '1', 'Studio Podcast', 'Aktif'),
  ('LOC-002', 'Gudang Utama', 'Gedung Produksi', '1', 'Gudang Utama', 'Aktif'),
  ('LOC-003', 'Studio A', 'Gedung Produksi', '2', 'Studio A', 'Aktif'),
  ('LOC-004', 'Studio B', 'Gedung Produksi', '2', 'Studio B', 'Aktif'),
  ('LOC-005', 'Rangkaian Produksi', 'Gedung Produksi', '1', 'Rangkaian Produksi', 'Aktif'),
  ('LOC-006', 'Ruang IT', 'Gedung Administrasi', '2', 'Ruang IT', 'Aktif'),
  ('LOC-007', 'Ruang Berita', 'Gedung Berita', '1', 'Ruang Berita', 'Aktif'),
  ('LOC-008', 'Ruang Editing', 'Gedung Produksi', '2', 'Ruang Editing', 'Aktif'),
  ('LOC-009', 'Lantai 2', 'Gedung Utama', '2', 'Lantai 2', 'Aktif'),
  ('LOC-010', 'Lantai 3', 'Gedung Utama', '3', 'Lantai 3', 'Aktif'),
  ('LOC-011', 'Outdoor Kit', 'Outdoor', '-', 'Outdoor Kit', 'Aktif');

-- ============================================
-- 6. Migrasi data barang yang sudah ada ke lokasi_id
-- ============================================
-- Hubungkan barang.lokasi (VARCHAR) dengan lokasi.nama_lokasi
UPDATE barang b
INNER JOIN lokasi l ON b.lokasi = l.nama_lokasi
SET b.lokasi_id = l.id
WHERE b.lokasi_id IS NULL AND b.lokasi IS NOT NULL AND l.deleted_at IS NULL;

SELECT '✅ Migrasi v7 selesai! Tabel lokasi dibuat, kolom lokasi_id ditambahkan pada barang, data default di-seed.' AS message;