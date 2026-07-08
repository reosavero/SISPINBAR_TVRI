-- ============================================
-- Migration v16: Unique index on barang.nama_barang
-- Prevents duplicate barang names at DB level
-- ============================================

CREATE UNIQUE INDEX uk_barang_nama_barang ON barang(nama_barang);