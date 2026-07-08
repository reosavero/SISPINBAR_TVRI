-- ============================================
-- MIGRATION: Change DATE columns to DATETIME
-- Allows storing date + time for peminjaman/pengembalian
-- ============================================

USE db_peminjaman_tvri;

-- Change peminjaman.tanggal_pinjam from DATE to DATETIME
ALTER TABLE peminjaman MODIFY COLUMN tanggal_pinjam DATETIME NOT NULL;

-- Change peminjaman.tanggal_kembali_rencana from DATE to DATETIME
ALTER TABLE peminjaman MODIFY COLUMN tanggal_kembali_rencana DATETIME NOT NULL;

-- Change pengembalian.tanggal_kembali_aktual from DATE to DATETIME
ALTER TABLE pengembalian MODIFY COLUMN tanggal_kembali_aktual DATETIME NOT NULL;

-- Verify
DESCRIBE peminjaman;
DESCRIBE pengembalian;