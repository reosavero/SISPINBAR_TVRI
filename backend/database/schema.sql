-- ============================================
-- DATABASE SCHEMA - Sistem Peminjaman Barang TVRI
-- Versi: 2.0 (Final - includes all migrations v5-v16)
-- Database: db_peminjaman_tvri
-- Engine: InnoDB | Charset: utf8mb4
--
-- Cara menjalankan:
--   npm run migrate          (otomatis via Node.js)
--   ATAU
--   mysql -u root -p < backend/database/schema.sql  (manual)
-- ============================================

CREATE DATABASE IF NOT EXISTS db_peminjaman_tvri;
USE db_peminjaman_tvri;

-- ============================================
-- TABEL USERS
-- Kolom dari semua versi (v1 base + v6 super_admin + v9 login_attempts + v11 registration + v14 merge pegawai)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) DEFAULT NULL,
  password VARCHAR(255) NOT NULL,
  nama VARCHAR(100) NOT NULL,
  nip VARCHAR(20) DEFAULT NULL UNIQUE,
  jabatan VARCHAR(100) DEFAULT NULL,
  divisi VARCHAR(100) DEFAULT NULL,
  nomor_hp VARCHAR(20) DEFAULT NULL,
  role ENUM('super_admin', 'admin', 'pegawai') DEFAULT 'pegawai',
  avatar VARCHAR(255) DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  registration_status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved' COMMENT 'pending = menunggu persetujuan, approved = disetujui, rejected = ditolak',
  rejection_reason TEXT NULL COMMENT 'Alasan penolakan registrasi',
  login_attempts INT DEFAULT 0 COMMENT 'Jumlah percobaan login gagal',
  locked_until DATETIME NULL COMMENT 'Waktu sampai akun terkunci',
  deleted_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_is_active (is_active),
  INDEX idx_users_locked_until (locked_until),
  INDEX idx_users_registration_status (registration_status),
  UNIQUE INDEX uk_users_nip (nip)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABEL SYSTEM_SETTINGS (v6)
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
-- TABEL KATEGORI (v10: unique index on nama)
-- ============================================
CREATE TABLE IF NOT EXISTS kategori (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  deskripsi TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE INDEX uk_kategori_nama (nama)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABEL LOKASI (v7 + v15: unique index on nama_lokasi)
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
  UNIQUE INDEX uk_lokasi_nama_lokasi (nama_lokasi),
  INDEX idx_kode_lokasi (kode_lokasi),
  INDEX idx_status (status),
  INDEX idx_deleted_at (deleted_at),
  INDEX idx_gedung (gedung),
  INDEX idx_nama_lokasi (nama_lokasi)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABEL JABATAN
-- ============================================
CREATE TABLE IF NOT EXISTS jabatan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  deskripsi TEXT DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE INDEX uk_jabatan_nama (nama),
  INDEX idx_jabatan_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABEL DIVISI
-- ============================================
CREATE TABLE IF NOT EXISTS divisi (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  deskripsi TEXT DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE INDEX uk_divisi_nama (nama),
  INDEX idx_divisi_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABEL BARANG (v16: unique index on nama_barang)
-- ============================================
CREATE TABLE IF NOT EXISTS barang (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kode_barang VARCHAR(20) NOT NULL UNIQUE,
  nama_barang VARCHAR(200) NOT NULL,
  kategori_id INT DEFAULT NULL,
  lokasi_id INT DEFAULT NULL,
  lokasi VARCHAR(100) DEFAULT NULL COMMENT 'Legacy column, use lokasi_id',
  kondisi ENUM('Baik', 'Rusak Ringan', 'Rusak Berat') DEFAULT 'Baik',
  status ENUM('Tersedia', 'Dipinjam', 'Rusak', 'Dalam Perbaikan') DEFAULT 'Tersedia',
  deskripsi TEXT,
  jumlah INT NOT NULL DEFAULT 1,
  foto VARCHAR(255) DEFAULT NULL,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (kategori_id) REFERENCES kategori(id) ON DELETE SET NULL,
  FOREIGN KEY (lokasi_id) REFERENCES lokasi(id) ON DELETE SET NULL,
  UNIQUE INDEX uk_barang_nama_barang (nama_barang),
  INDEX idx_kode (kode_barang),
  INDEX idx_status (status),
  INDEX idx_kategori (kategori_id),
  INDEX idx_barang_lokasi_id (lokasi_id),
  INDEX idx_barang_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABEL PEMINJAMAN (v14: pegawai_id → users.id, SET NULL)
-- ============================================
CREATE TABLE IF NOT EXISTS peminjaman (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nomor_peminjaman VARCHAR(20) NOT NULL UNIQUE,
  pegawai_id INT DEFAULT NULL COMMENT 'FK ke users.id (pegawai), SET NULL on delete',
  barang_id INT DEFAULT NULL COMMENT 'FK ke barang.id, SET NULL on delete',
  jumlah INT DEFAULT 1,
  tanggal_pinjam DATETIME NOT NULL,
  tanggal_kembali_rencana DATETIME NOT NULL,
  keperluan TEXT,
  foto VARCHAR(255) DEFAULT NULL,
  archived_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft archive timestamp',
  status ENUM('Menunggu Persetujuan', 'Disetujui', 'Dipinjam', 'Menunggu Konfirmasi', 'Dikembalikan', 'Ditolak') DEFAULT 'Menunggu Persetujuan',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (pegawai_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (barang_id) REFERENCES barang(id) ON DELETE SET NULL,
  INDEX idx_nomor (nomor_peminjaman),
  INDEX idx_pegawai (pegawai_id),
  INDEX idx_status (status),
  INDEX idx_tanggal (tanggal_pinjam),
  INDEX idx_peminjaman_archived_at (archived_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABEL PENGEMBALIAN (v8: Ditolak status + catatan_admin)
-- ============================================
CREATE TABLE IF NOT EXISTS pengembalian (
  id INT AUTO_INCREMENT PRIMARY KEY,
  peminjaman_id INT NOT NULL,
  tanggal_kembali_aktual DATETIME NOT NULL,
  kondisi_barang ENUM('Baik', 'Rusak Ringan', 'Rusak Berat') DEFAULT 'Baik',
  catatan TEXT,
  catatan_admin TEXT DEFAULT NULL COMMENT 'Catatan admin saat konfirmasi/tolak',
  foto VARCHAR(255) DEFAULT NULL,
  status ENUM('Menunggu Konfirmasi', 'Diterima', 'Ditolak') DEFAULT 'Menunggu Konfirmasi',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (peminjaman_id) REFERENCES peminjaman(id) ON DELETE CASCADE,
  INDEX idx_peminjaman (peminjaman_id),
  INDEX idx_tanggal (tanggal_kembali_aktual)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABEL AUDIT LOG (v5 + v12: retention index)
-- ============================================
CREATE TABLE IF NOT EXISTS audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT NULL,
  username VARCHAR(100) DEFAULT NULL,
  action VARCHAR(50) NOT NULL,
  module VARCHAR(50) NOT NULL,
  record_id INT DEFAULT NULL,
  details TEXT DEFAULT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  INDEX idx_action (action),
  INDEX idx_module (module),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABEL NOTIFICATIONS (v5)
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT NULL,
  pegawai_id INT DEFAULT NULL,
  title VARCHAR(255) DEFAULT NULL,
  message TEXT,
  type VARCHAR(50) DEFAULT 'info',
  module VARCHAR(50) DEFAULT NULL,
  record_id INT DEFAULT NULL,
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (pegawai_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_read (user_id, is_read),
  INDEX idx_pegawai_read (pegawai_id, is_read),
  INDEX idx_user_created (user_id, created_at),
  INDEX idx_pegawai_id (pegawai_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABEL EMAIL VERIFICATIONS (v13)
-- ============================================
CREATE TABLE IF NOT EXISTS email_verifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  attempts INT DEFAULT 0,
  verified TINYINT(1) DEFAULT 0,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- SEED DATA
-- ============================================

-- Default system settings (v6 + v12)
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
  ('app_name', 'SISPINBAR', 'Nama Aplikasi'),
  ('app_full_name', 'Sistem Peminjaman Barang', 'Nama Lengkap Aplikasi'),
  ('app_organization', 'TVRI Jawa Timur', 'Nama Organisasi'),
  ('max_login_attempts', '5', 'Maksimal percobaan login'),
  ('session_timeout', '24', 'Session timeout (jam)'),
  ('audit_log_retention_days', '30', 'Jumlah hari retensi log aktivitas. Log yang lebih lama akan dihapus otomatis.')
ON DUPLICATE KEY UPDATE description=VALUES(description);

-- Default kategori
INSERT IGNORE INTO kategori (nama, deskripsi) VALUES
  ('Kamera', 'Peralatan kamera dan videography'),
  ('Audio', 'Peralatan audio dan sound system'),
  ('Lighting', 'Peralatan pencahayaan dan lighting'),
  ('Tripod', 'Tripod dan stabilizer'),
  ('Kabel', 'Berbagai jenis kabel dan konektor'),
  ('Komputer', 'Laptop dan komputer'),
  ('Aksesoris', 'Aksesoris dan peralatan pendukung');

-- Default lokasi (v7)
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

SELECT '✅ Database schema v2.0 (final) berhasil dibuat!' AS message;