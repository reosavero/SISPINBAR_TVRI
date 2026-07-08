-- ============================================
-- MIGRATION v15: Lokasi nama_lokasi unique index
-- ============================================

-- Add unique index on nama_lokasi (case-insensitive via collation)
-- First, check and resolve any existing duplicates
CREATE UNIQUE INDEX uk_lokasi_nama_lokasi ON lokasi (nama_lokasi);