-- ============================================
-- MIGRATION: Add status to pengembalian + Menunggu Konfirmasi
-- ============================================
-- Run: mysql -u root < backend/database/migrate_pengembalian_status.sql

USE db_peminjaman_tvri;

-- 1. Add status column to pengembalian
ALTER TABLE pengembalian
ADD COLUMN status ENUM('Menunggu Konfirmasi', 'Diterima') DEFAULT 'Menunggu Konfirmasi'
AFTER foto;

-- 2. Add 'Menunggu Konfirmasi' to peminjaman status ENUM
ALTER TABLE peminjaman
MODIFY COLUMN status ENUM('Menunggu Persetujuan', 'Disetujui', 'Dipinjam', 'Menunggu Konfirmasi', 'Dikembalikan', 'Ditolak') DEFAULT 'Menunggu Persetujuan';