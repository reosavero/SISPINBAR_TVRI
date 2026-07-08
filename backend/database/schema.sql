-- ============================================
-- DATABASE SCHEMA - Sistem Peminjaman Barang TVRI
-- ============================================

CREATE DATABASE IF NOT EXISTS db_peminjaman_tvri;
USE db_peminjaman_tvri;

-- ============================================
-- TABEL USERS - Akun login sistem
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) DEFAULT NULL,
  password VARCHAR(255) NOT NULL,
  nama VARCHAR(100) NOT NULL,
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
  INDEX idx_users_locked_until (locked_until),
  INDEX idx_users_registration_status (registration_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABEL KATEGORI
-- ============================================
CREATE TABLE IF NOT EXISTS kategori (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100) NOT NULL UNIQUE,
  deskripsi TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE INDEX uk_kategori_nama (nama)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABEL BARANG
-- ============================================
CREATE TABLE IF NOT EXISTS barang (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kode_barang VARCHAR(20) NOT NULL UNIQUE,
  nama_barang VARCHAR(200) NOT NULL,
  kategori_id INT,
  lokasi VARCHAR(100),
  kondisi ENUM('Baik', 'Rusak Ringan', 'Rusak Berat') DEFAULT 'Baik',
  status ENUM('Tersedia', 'Dipinjam', 'Rusak', 'Dalam Perbaikan') DEFAULT 'Tersedia',
  deskripsi TEXT,
  jumlah INT NOT NULL DEFAULT 1,
  foto VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (kategori_id) REFERENCES kategori(id) ON DELETE SET NULL,
  INDEX idx_kode (kode_barang),
  UNIQUE INDEX uk_barang_nama_barang (nama_barang),
  INDEX idx_status (status),
  INDEX idx_kategori (kategori_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABEL PEGAWAI - Data pegawai TVRI
-- user_id: relasi ke tabel users untuk akun login
-- ============================================
CREATE TABLE IF NOT EXISTS pegawai (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT NULL,
  nip VARCHAR(20) NOT NULL UNIQUE,
  nama VARCHAR(100) NOT NULL,
  jabatan VARCHAR(100),
  divisi VARCHAR(100),
  email VARCHAR(100),
  nomor_hp VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_nama (nama),
  INDEX idx_divisi (divisi),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABEL PEMINJAMAN
-- ============================================
CREATE TABLE IF NOT EXISTS peminjaman (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nomor_peminjaman VARCHAR(20) NOT NULL UNIQUE,
  pegawai_id INT NOT NULL,
  barang_id INT NOT NULL,
  jumlah INT DEFAULT 1,
  tanggal_pinjam DATETIME NOT NULL,
  tanggal_kembali_rencana DATETIME NOT NULL,
  keperluan TEXT,
  foto VARCHAR(255) DEFAULT NULL,
  status ENUM('Menunggu Persetujuan', 'Disetujui', 'Dipinjam', 'Menunggu Konfirmasi', 'Dikembalikan', 'Ditolak') DEFAULT 'Menunggu Persetujuan',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (pegawai_id) REFERENCES pegawai(id) ON DELETE CASCADE,
  FOREIGN KEY (barang_id) REFERENCES barang(id) ON DELETE CASCADE,
  INDEX idx_nomor (nomor_peminjaman),
  INDEX idx_pegawai (pegawai_id),
  INDEX idx_status (status),
  INDEX idx_tanggal (tanggal_pinjam)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABEL PENGEMBALIAN
-- ============================================
CREATE TABLE IF NOT EXISTS pengembalian (
  id INT AUTO_INCREMENT PRIMARY KEY,
  peminjaman_id INT NOT NULL,
  tanggal_kembali_aktual DATETIME NOT NULL,
  kondisi_barang ENUM('Baik', 'Rusak Ringan', 'Rusak Berat') DEFAULT 'Baik',
  catatan TEXT,
  catatan_admin TEXT DEFAULT NULL,
  foto VARCHAR(255),
  status ENUM('Menunggu Konfirmasi', 'Diterima', 'Ditolak') DEFAULT 'Menunggu Konfirmasi',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (peminjaman_id) REFERENCES peminjaman(id) ON DELETE CASCADE,
  INDEX idx_peminjaman (peminjaman_id),
  INDEX idx_tanggal (tanggal_kembali_aktual)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;