-- ============================================
-- SEED DATA - Sistem Peminjaman Barang TVRI
-- ============================================

USE db_peminjaman_tvri;

-- ============================================
-- SEED USERS (Admin default only)
-- Password: admin123 (bcrypt hash)
-- Pegawai akan ditambahkan admin melalui aplikasi
-- ============================================
INSERT INTO users (username, email, password, nama, role) VALUES
('admin', 'admin@tvri.go.id', '$2b$10$0oKa8p6ORE2kf1D1F.6VBeRDMYTI27Zt/wMTBqnjoJD1j/i4ki8e2', 'Administrator', 'admin')
ON DUPLICATE KEY UPDATE nama=VALUES(nama);

-- ============================================
-- SEED KATEGORI
-- ============================================
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
('Peralatan Studio', 'Peralatan studio lainnya seperti mixer, switcher'),
('Baterai', 'Baterai dan power supply untuk perangkat produksi'),
('Lensa', 'Lens dan aksesoris lensa untuk kamera')
ON DUPLICATE KEY UPDATE nama=VALUES(nama);

-- ============================================
-- SEED BARANG (11 items dengan foto)
-- Barang tanpa foto telah dihapus.
-- Tambahkan barang baru melalui menu Kelola Barang di aplikasi.
-- ============================================
INSERT INTO barang (kode_barang, nama_barang, kategori_id, lokasi, kondisi, status, deskripsi, jumlah, foto) VALUES
('TVRI-KAM-0001', 'Kamera A6400', 1, 'Gudang Utama', 'Baik', 'Tersedia', 'Kamera mirrorless Sony A6400 dengan sensor APS-C 24.2MP, autofocus cepat, cocok untuk produksi video dan dokumentasi', 2, '/uploads/barang/barang-1782380012460-682069088.jpg'),
('TVRI-KAM-0002', 'Kamera A74', 1, 'Studio A', 'Baik', 'Tersedia', 'Kamera mirrorless Sony A7IV dengan sensor full-frame 33MP, stabilisasi built-in, ideal untuk produksi video sinematik', 2, '/uploads/barang/barang-1782714785883-731680010.jpg'),
('TVRI-KAM-0003', 'Kamera Lumix', 1, 'Gudang Utama', 'Baik', 'Tersedia', 'Kamera mirrorless Panasonic Lumix S5II dengan sensor full-frame, phase hybrid AF, cocok untuk produksi video dan foto', 2, '/uploads/barang/barang-1782714867817-119031574.jpg'),
('TVRI-LIG-0001', 'Lighting Soonwell', 4, 'Studio A', 'Baik', 'Tersedia', 'Lampu studio LED Soonwell dengan output cahaya terang dan konsisten, cocok untuk pencahayaan studio dan outdoor', 6, '/uploads/barang/barang-1782716014591-190894693.jpg'),
('TVRI-BAT-0001', 'Baterai A6400', 11, 'Gudang Utama', 'Baik', 'Tersedia', 'Baterai NP-FW50 kompatibel dengan Sony A6400, kapasitas tinggi untuk sesi pemotretan sepanjang hari', 5, '/uploads/barang/barang-1782715323875-566135670.jpg'),
('TVRI-BAT-0002', 'Baterai A74', 11, 'Gudang Utama', 'Baik', 'Tersedia', 'Baterai NP-FZ100 kompatibel dengan Sony A7IV, kapasitas besar untuk penggunaan berat sepanjang hari', 5, '/uploads/barang/barang-1782715406595-367204525.jpg'),
('TVRI-BAT-0003', 'Baterai Lumix', 11, 'Gudang Utama', 'Baik', 'Tersedia', 'Baterai DMW-BLK22 kompatibel dengan Panasonic Lumix S5II, daya tahan lama untuk produksi video', 5, '/uploads/barang/barang-1782715468252-938875108.jpg'),
('TVRI-LEN-0001', 'Lensa Kit Sony', 12, 'Gudang Utama', 'Baik', 'Tersedia', 'Lensa kit Sony FE 28-70mm f/3.5-5.6 OSS, lensa standar serbaguna untuk pemotretan sehari-hari dan video', 3, '/uploads/barang/barang-1782715536357-622604393.jpg'),
('TVRI-LEN-0002', 'Lensa Tele Sony', 12, 'Gudang Utama', 'Baik', 'Tersedia', 'Lensa telefoto Sony FE 70-200mm f/4 G OSS, ideal untuk pemotretan jarak jauh dan produksi acara', 2, '/uploads/barang/barang-1782715587123-54108904.jpg'),
('TVRI-LEN-0003', 'Lensa 50 Sony', 12, 'Gudang Utama', 'Baik', 'Tersedia', 'Lensa prime Sony FE 50mm f/1.8, lensa portrait dengan bokeh halus dan performa low-light', 2, '/uploads/barang/barang-1782715633113-781425995.jpg'),
('TVRI-LEN-0004', 'Lensa Lumix', 12, 'Gudang Utama', 'Baik', 'Tersedia', 'Lensa LUMIX S 20-60mm f/3.5-5.6 kit kompatibel dengan Panasonic Lumix S5II, wide-to-standard zoom serbaguna', 2, '/uploads/barang/barang-1782715726947-274071516.jpg')
ON DUPLICATE KEY UPDATE nama_barang=VALUES(nama_barang), deskripsi=VALUES(deskripsi), jumlah=VALUES(jumlah), foto=VALUES(foto);

-- ============================================
-- TIDAK ADA DATA PEGAWAI AWAL
-- Admin menambahkan pegawai melalui menu Data Pegawai di aplikasi.
-- Setiap pegawai yang ditambahkan akan otomatis mendapat akun login.
-- ============================================