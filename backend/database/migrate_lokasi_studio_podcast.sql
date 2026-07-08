-- ============================================================
-- MIGRATION: Update semua lokasi barang ke "Studio Podcast"
-- Tanggal: 2025-01-09
-- Deskripsi: Mengubah semua lokasi barang yang bukan "Studio Podcast"
--            menjadi "Studio Podcast" sebagai lokasi default.
-- ============================================================

-- Update semua barang yang lokasinya belum "Studio Podcast"
UPDATE barang 
SET lokasi = 'Studio Podcast' 
WHERE lokasi != 'Studio Podcast' 
   OR lokasi IS NULL;

-- Verifikasi: Hitung barang per lokasi
SELECT lokasi, COUNT(*) AS jumlah 
FROM barang 
WHERE deleted_at IS NULL 
GROUP BY lokasi 
ORDER BY jumlah DESC;