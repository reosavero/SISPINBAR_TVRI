-- ============================================
-- MIGRATION v8: Add 'Ditolak' status & catatan_admin to pengembalian
-- Date: 2025-01
-- Description:
--   - Add 'Ditolak' to pengembalian status ENUM
--   - Add catatan_admin column for admin notes on confirm/reject
-- ============================================
-- Run: mysql -u root -p < backend/database/migration_v8_pengembalian_reject.sql

USE db_peminjaman_tvri;

-- 1. Modify pengembalian status ENUM to include 'Ditolak'
ALTER TABLE pengembalian
MODIFY COLUMN status ENUM('Menunggu Konfirmasi', 'Diterima', 'Ditolak') DEFAULT 'Menunggu Konfirmasi';

-- 2. Add catatan_admin column for admin notes when confirming/rejecting
ALTER TABLE pengembalian
ADD COLUMN catatan_admin TEXT DEFAULT NULL
AFTER catatan;