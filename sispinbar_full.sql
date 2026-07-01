-- ======================================================================
-- SISPINBAR - Sistem Peminjaman Barang TVRI Jawa Timur
-- ======================================================================
-- SQL Script lengkap untuk di-import di XAMPP phpMyAdmin
-- 
-- Cara Pakai:
-- 1. Buka XAMPP Control Panel
-- 2. Start Apache dan MySQL
-- 3. Buka phpMyAdmin di http://localhost/phpmyadmin
-- 4. Klik tab "SQL" di bagian atas
-- 5. Copy-paste SELURUH script ini
-- 6. Klik "Go" / "Kirim"
--
-- ATAU via command line:
-- mysql -u root < sispinbar_full.sql
-- ======================================================================

-- Hapus database lama jika ada
DROP DATABASE IF EXISTS db_peminjaman_tvri;

-- Buat database baru
CREATE DATABASE db_peminjaman_tvri 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE db_peminjaman_tvri;

-- ======================================================================
-- TABEL USERS
-- ======================================================================
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) DEFAULT NULL,
  password VARCHAR(255) NOT NULL,
  nama VARCHAR(100) NOT NULL,
  role ENUM('admin', 'operator', 'viewer') DEFAULT 'operator',
  avatar VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ======================================================================
-- TABEL KATEGORI
-- ======================================================================
CREATE TABLE kategori (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  deskripsi TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ======================================================================
-- TABEL BARANG
-- ======================================================================
CREATE TABLE barang (
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
  INDEX idx_status (status),
  INDEX idx_kategori (kategori_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ======================================================================
-- TABEL PEGAWAI
-- ======================================================================
CREATE TABLE pegawai (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ======================================================================
-- TABEL PEMINJAMAN
-- ======================================================================
CREATE TABLE peminjaman (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nomor_peminjaman VARCHAR(20) NOT NULL UNIQUE,
  pegawai_id INT NOT NULL,
  barang_id INT NOT NULL,
  jumlah INT DEFAULT 1,
  tanggal_pinjam DATE NOT NULL,
  tanggal_kembali_rencana DATE NOT NULL,
  keperluan TEXT,
  foto VARCHAR(255) DEFAULT NULL,
  status ENUM('Menunggu Persetujuan', 'Disetujui', 'Dipinjam', 'Dikembalikan', 'Ditolak') DEFAULT 'Menunggu Persetujuan',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (pegawai_id) REFERENCES pegawai(id) ON DELETE CASCADE,
  FOREIGN KEY (barang_id) REFERENCES barang(id) ON DELETE CASCADE,
  INDEX idx_nomor (nomor_peminjaman),
  INDEX idx_pegawai (pegawai_id),
  INDEX idx_status (status),
  INDEX idx_tanggal (tanggal_pinjam)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ======================================================================
-- TABEL PENGEMBALIAN
-- ======================================================================
CREATE TABLE pengembalian (
  id INT AUTO_INCREMENT PRIMARY KEY,
  peminjaman_id INT NOT NULL,
  tanggal_kembali_aktual DATE NOT NULL,
  kondisi_barang ENUM('Baik', 'Rusak Ringan', 'Rusak Berat') DEFAULT 'Baik',
  catatan TEXT,
  foto VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (peminjaman_id) REFERENCES peminjaman(id) ON DELETE CASCADE,
  INDEX idx_peminjaman (peminjaman_id),
  INDEX idx_tanggal (tanggal_kembali_aktual)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ======================================================================
-- SEED DATA
-- ======================================================================

-- Admin user (Password: admin123)
INSERT INTO users (username, email, password, nama, role) VALUES
('admin', 'admin@tvri.go.id', '$2b$10$0oKa8p6ORE2kf1D1F.6VBeRDMYTI27Zt/wMTBqnjoJD1j/i4ki8e2', 'Administrator', 'admin');

-- Kategori (10)
INSERT INTO kategori (nama, deskripsi) VALUES
('Kamera', 'Semua jenis kamera dan aksesoris kamera'),
('Laptop', 'Laptop untuk produksi dan editing video'),
('Mikrofon', 'Mikrofon dan perangkat audio recording'),
('Lighting', 'Peralatan pencahayaan studio dan outdoor'),
('Tripod', 'Tripod, monopod, dan stabilizer'),
('Komputer', 'Komputer desktop dan workstation editing'),
('Monitor', 'Monitor referensi warna dan display'),
('Printer', 'Printer, scanner, dan mesin fotokopi'),
('Kabel', 'Berbagai jenis kabel audio, video, dan power'),
('Peralatan Studio', 'Peralatan studio lainnya seperti mixer, switcher');

-- Barang (50 items)
INSERT INTO barang (kode_barang, nama_barang, kategori_id, lokasi, kondisi, status, deskripsi) VALUES
('TVRI-KAM-0001', 'Kamera Sony FX3', 1, 'Gudang Utama', 'Baik', 'Tersedia', 'Kamera sinematik full-frame untuk produksi'),
('TVRI-KAM-0002', 'Kamera Canon EOS R5', 1, 'Studio A', 'Baik', 'Tersedia', 'Mirrorless 45MP untuk fotografi dan video'),
('TVRI-KAM-0003', 'Kamera Panasonic Lumix S5II', 1, 'Gudang Utama', 'Baik', 'Tersedia', 'Full-frame hybrid camera'),
('TVRI-KAM-0004', 'Kamera Blackmagic Pocket 6K', 1, 'Ruang Editing', 'Baik', 'Tersedia', 'Cinema camera 6K'),
('TVRI-KAM-0005', 'Kamera Sony A7IV', 1, 'Studio B', 'Baik', 'Tersedia', 'Mirrorless full-frame hybrid'),
('TVRI-KAM-0006', 'Kamera Canon XA55', 1, 'Rangkaian Produksi', 'Baik', 'Tersedia', 'Camcorder profesional 4K'),
('TVRI-KAM-0007', 'Kamera JVC GY-HM250', 1, 'Gudang Utama', 'Rusak Ringan', 'Dalam Perbaikan', 'Camcorder shoulder mount 4K'),
('TVRI-KAM-0008', 'GoPro Hero 12 Black', 1, 'Outdoor Kit', 'Baik', 'Tersedia', 'Action camera untuk outdoor'),
('TVRI-KAM-0009', 'Insta360 X3', 1, 'Outdoor Kit', 'Baik', 'Tersedia', 'Kamera 360 degree'),
('TVRI-KAM-0010', 'Kamera Sony PXW-Z750', 1, 'Studio A', 'Baik', 'Tersedia', 'Shoulder camcorder XDCAM'),
('TVRI-KAM-0011', 'Lens Sony FE 24-70mm f/2.8 GM', 1, 'Gudang Utama', 'Baik', 'Tersedia', 'Lens zoom profesional Sony'),
('TVRI-KAM-0012', 'Lens Canon RF 70-200mm f/2.8L', 1, 'Gudang Utama', 'Baik', 'Tersedia', 'Telephoto lens Canon RF mount'),
('TVRI-LAP-0001', 'Laptop Asus ROG Strix G16', 2, 'Ruang IT', 'Baik', 'Tersedia', 'Laptop gaming untuk editing berat'),
('TVRI-LAP-0002', 'Laptop Lenovo ThinkPad X1 Carbon', 2, 'Ruang Editing', 'Baik', 'Tersedia', 'Laptop productivity ultrabook'),
('TVRI-LAP-0003', 'MacBook Pro 16" M2 Max', 2, 'Ruang Editing', 'Baik', 'Tersedia', 'Laptop editing video profesional'),
('TVRI-LAP-0004', 'Dell XPS 15', 2, 'Ruang IT', 'Baik', 'Tersedia', 'Laptop workstation'),
('TVRI-LAP-0005', 'HP ZBook Studio 16', 2, 'Ruang Editing', 'Baik', 'Tersedia', 'Mobile workstation'),
('TVRI-LAP-0006', 'Lenovo Legion 5 Pro', 2, 'Ruang Berita', 'Rusak Ringan', 'Dalam Perbaikan', 'Laptop editing news'),
('TVRI-LAP-0007', 'MacBook Air M2', 2, 'Ruang IT', 'Baik', 'Tersedia', 'Laptop ringan untuk presentasi'),
('TVRI-LAP-0008', 'Asus ProArt StudioBook 16', 2, 'Ruang Editing', 'Baik', 'Tersedia', 'Laptop khusus content creator'),
('TVRI-MIK-0001', 'Mikrofon Shure SM7B', 3, 'Studio A', 'Baik', 'Tersedia', 'Dynamic broadcast microphone'),
('TVRI-MIK-0002', 'Mikrofon Rode NT1-A', 3, 'Studio B', 'Baik', 'Tersedia', 'Condenser studio microphone'),
('TVRI-MIK-0003', 'Mikrofon Sennheiser MKH 416', 3, 'Gudang Utama', 'Baik', 'Tersedia', 'Shotgun microphone profesional'),
('TVRI-MIK-0004', 'Mixer Yamaha MG10XU', 3, 'Studio A', 'Rusak Ringan', 'Dalam Perbaikan', 'Audio mixer 10 channel'),
('TVRI-MIK-0005', 'Wireless Mic Sennheiser EW 112P', 3, 'Rangkaian Produksi', 'Baik', 'Tersedia', 'Wireless lavalier microphone'),
('TVRI-MIK-0006', 'Podcast Mic Rode PodMic', 3, 'Studio B', 'Baik', 'Tersedia', 'Dynamic podcast microphone'),
('TVRI-LIG-0001', 'Lighting Godox SL60W', 4, 'Studio A', 'Baik', 'Tersedia', 'Lampu studio LED 60W'),
('TVRI-LIG-0002', 'Ring Light Elgato Key Light', 4, 'Studio B', 'Baik', 'Tersedia', 'Ring light streaming'),
('TVRI-LIG-0003', 'Panel Light Aputure 120d II', 4, 'Studio A', 'Baik', 'Tersedia', 'LED panel 120W daylight'),
('TVRI-LIG-0004', 'Softbox Godox 80x80cm', 4, 'Gudang Utama', 'Baik', 'Tersedia', 'Softbox untuk diffuser cahaya'),
('TVRI-LIG-0005', 'C-stand Combo 40" Steel', 4, 'Studio A', 'Baik', 'Tersedia', 'C-stand untuk mounting lighting'),
('TVRI-TRI-0001', 'Tripod Manfrotto MVH502AH', 5, 'Gudang Utama', 'Baik', 'Tersedia', 'Video head tripod profesional'),
('TVRI-TRI-0002', 'Tripod Sachtler Video 18 S2', 5, 'Studio A', 'Baik', 'Tersedia', 'Tripod broadcast grade'),
('TVRI-TRI-0003', 'Gimbal DJI RS 3 Pro', 5, 'Rangkaian Produksi', 'Baik', 'Tersedia', 'Gimbal stabilizer 4.5kg payload'),
('TVRI-TRI-0004', 'Slider Kessler CineSlider 3ft', 5, 'Gudang Utama', 'Baik', 'Tersedia', 'Camera slider untuk cinematic movement'),
('TVRI-KOM-0001', 'PC Workstation AMD Threadripper', 6, 'Ruang Editing', 'Baik', 'Tersedia', 'Workstation editing berat'),
('TVRI-KOM-0002', 'iMac 24" M3', 6, 'Ruang Editing', 'Baik', 'Tersedia', 'Desktop Apple untuk editing'),
('TVRI-KOM-0003', 'Mac Studio M2 Ultra', 6, 'Ruang Editing', 'Baik', 'Tersedia', 'Desktop profesional untuk rendering'),
('TVRI-KOM-0004', 'PC Editing Custom Build', 6, 'Ruang Editing', 'Baik', 'Tersedia', 'PC editing video spesial'),
('TVRI-KOM-0005', 'Mac Mini M2', 6, 'Ruang IT', 'Rusak Berat', 'Rusak', 'Mac mini server dan presentasi'),
('TVRI-MON-0001', 'Monitor LG 27" 4K', 7, 'Ruang Editing', 'Baik', 'Tersedia', 'Monitor referensi warna 4K'),
('TVRI-MON-0002', 'Monitor Sony BVM-HX310', 7, 'Studio A', 'Baik', 'Tersedia', 'Monitor referensi broadcast'),
('TVRI-MON-0003', 'Monitor Dell UltraSharp 32"', 7, 'Ruang Editing', 'Baik', 'Tersedia', 'Monitor color accurate'),
('TVRI-MON-0004', 'TV Monitor LG 55" OLED', 7, 'Ruang Berita', 'Baik', 'Tersedia', 'Monitor preview studio'),
('TVRI-PRT-0001', 'Printer HP LaserJet Pro', 8, 'Ruang IT', 'Baik', 'Tersedia', 'Printer laser mono'),
('TVRI-PRT-0002', 'Printer Epson EcoTank L3250', 8, 'Keuangan', 'Baik', 'Tersedia', 'Printer warna multifungsi'),
('TVRI-KBL-0001', 'Kabel HDMI 10m', 9, 'Gudang Utama', 'Baik', 'Tersedia', 'Kabel HDMI panjang'),
('TVRI-KBL-0002', 'Kabel XLR 5m', 9, 'Studio A', 'Baik', 'Tersedia', 'Kabel audio XLR'),
('TVRI-KBL-0003', 'Kabel SDI 15m BNC', 9, 'Rangkaian Produksi', 'Baik', 'Tersedia', 'Kabel video SDI profesional'),
('TVRI-PST-0001', 'Video Switcher Roland V-8HD', 10, 'Studio A', 'Baik', 'Tersedia', 'Video switcher 8 input');

-- ======================================================================
-- SELESAI!
--
-- Data Awal:
-- ┌──────────────┬──────────┐
-- │ Tabel        │ Jumlah   │
-- ├──────────────┼──────────┤
-- │ users        │ 1 (admin)│
-- │ kategori     │ 10       │
-- │ barang       │ 50       │
-- │ pegawai      │ 0        │
-- │ peminjaman   │ 0        │
-- │ pengembalian │ 0        │
-- └──────────────┴──────────┘
--
-- 🔑 Login Admin:
--    Username : admin
--    Password : admin123
--
-- Alur Tambah Pegawai:
-- 1. Admin login → menu Data Pegawai → Tambah Pegawai
-- 2. Isi data pegawai + username & password
-- 3. Sistem otomatis buat akun login untuk pegawai
-- 4. Pegawai login pakai username & password tsb
-- ======================================================================