-- ============================================
-- MIGRATION v10: Add unique constraint on kategori.nama
-- Prevents duplicate category names
-- ============================================

-- Add unique index on kategori.nama (case-insensitive via collation)
ALTER TABLE kategori ADD UNIQUE INDEX uk_kategori_nama (nama);