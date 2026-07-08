// ============================================
// LOKASI QUERIES - Sistem Peminjaman Barang TVRI
// ============================================

const lokasiQueries = {
  // Get all with search, filter, pagination
  getAll: `
    SELECT l.*,
      (SELECT COUNT(*) FROM barang WHERE lokasi_id = l.id AND deleted_at IS NULL) AS total_barang,
      (SELECT COUNT(*) FROM barang WHERE lokasi_id = l.id AND status = 'Tersedia' AND deleted_at IS NULL) AS barang_tersedia,
      (SELECT COUNT(*) FROM barang WHERE lokasi_id = l.id AND status = 'Dipinjam' AND deleted_at IS NULL) AS barang_dipinjam,
      (SELECT COUNT(*) FROM barang WHERE lokasi_id = l.id AND status IN ('Rusak', 'Dalam Perbaikan') AND deleted_at IS NULL) AS barang_maintenance
    FROM lokasi l
    WHERE l.deleted_at IS NULL
    AND (? IS NULL OR l.nama_lokasi LIKE CONCAT('%', ?, '%'))
    AND (? IS NULL OR l.gedung LIKE CONCAT('%', ?, '%'))
    AND (? IS NULL OR l.ruangan LIKE CONCAT('%', ?, '%'))
    AND (? IS NULL OR l.lantai = ?)
    AND (? IS NULL OR l.status = ?)
    ORDER BY l.nama_lokasi ASC
    LIMIT ? OFFSET ?
  `,

  countAll: `
    SELECT COUNT(*) AS total
    FROM lokasi l
    WHERE l.deleted_at IS NULL
    AND (? IS NULL OR l.nama_lokasi LIKE CONCAT('%', ?, '%'))
    AND (? IS NULL OR l.gedung LIKE CONCAT('%', ?, '%'))
    AND (? IS NULL OR l.ruangan LIKE CONCAT('%', ?, '%'))
    AND (? IS NULL OR l.lantai = ?)
    AND (? IS NULL OR l.status = ?)
  `,

  // Get by ID with full detail
  getById: `
    SELECT l.*,
      (SELECT COUNT(*) FROM barang WHERE lokasi_id = l.id AND deleted_at IS NULL) AS total_barang,
      (SELECT COUNT(*) FROM barang WHERE lokasi_id = l.id AND status = 'Tersedia' AND deleted_at IS NULL) AS barang_tersedia,
      (SELECT COUNT(*) FROM barang WHERE lokasi_id = l.id AND status = 'Dipinjam' AND deleted_at IS NULL) AS barang_dipinjam,
      (SELECT COUNT(*) FROM barang WHERE lokasi_id = l.id AND status IN ('Rusak', 'Dalam Perbaikan') AND deleted_at IS NULL) AS barang_maintenance
    FROM lokasi l
    WHERE l.id = ? AND l.deleted_at IS NULL
  `,

  // Get active locations for dropdowns
  getActive: `
    SELECT l.id, l.kode_lokasi, l.nama_lokasi, l.gedung, l.lantai, l.ruangan,
      (SELECT COUNT(*) FROM barang WHERE lokasi_id = l.id AND deleted_at IS NULL) AS total_barang
    FROM lokasi l
    WHERE l.status = 'Aktif' AND l.deleted_at IS NULL
    ORDER BY l.nama_lokasi ASC
  `,

  // Get barang by lokasi
  getBarangByLokasi: `
    SELECT b.*, k.nama AS kategori_nama,
      (b.jumlah - COALESCE((
        SELECT SUM(p.jumlah) FROM peminjaman p
        WHERE p.barang_id = b.id AND p.status IN ('Menunggu Persetujuan', 'Disetujui', 'Dipinjam')
      ), 0)) AS tersedia
    FROM barang b
    LEFT JOIN kategori k ON b.kategori_id = k.id
    WHERE b.lokasi_id = ? AND b.deleted_at IS NULL
    ORDER BY b.nama_barang ASC
    LIMIT ? OFFSET ?
  `,

  countBarangByLokasi: `
    SELECT COUNT(*) AS total
    FROM barang
    WHERE lokasi_id = ? AND deleted_at IS NULL
  `,

  // Check unique constraint: gedung + lantai + ruangan
  checkDuplicate: `
    SELECT id FROM lokasi
    WHERE gedung = ? AND lantai = ? AND ruangan = ? AND deleted_at IS NULL AND id != ?
    LIMIT 1
  `,

  // Check unique constraint: nama_lokasi
  checkNamaLokasi: `
    SELECT id FROM lokasi
    WHERE nama_lokasi = ? AND deleted_at IS NULL AND id != ?
    LIMIT 1
  `,

  // Create
  create: `
    INSERT INTO lokasi (kode_lokasi, nama_lokasi, gedung, lantai, ruangan, deskripsi, status, created_by, updated_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,

  // Update
  update: `
    UPDATE lokasi
    SET nama_lokasi = ?, gedung = ?, lantai = ?, ruangan = ?, deskripsi = ?, status = ?, updated_by = ?
    WHERE id = ? AND deleted_at IS NULL
  `,

  // Soft delete
  softDelete: `
    UPDATE lokasi SET deleted_at = NOW(), updated_by = ? WHERE id = ?
  `,

  // Restore
  restore: `
    UPDATE lokasi SET deleted_at = NULL, updated_by = ? WHERE id = ?
  `,

  // Check if lokasi has active barang
  countActiveBarang: `
    SELECT COUNT(*) AS total FROM barang WHERE lokasi_id = ? AND deleted_at IS NULL
  `,

  // Get next kode_lokasi
  getNextKode: `
    SELECT MAX(CAST(SUBSTRING(kode_lokasi, 5) AS UNSIGNED)) AS max_kode FROM lokasi WHERE kode_lokasi LIKE 'LOC-%'
  `,

  // Dashboard stats
  getStats: `
    SELECT
      (SELECT COUNT(*) FROM lokasi WHERE deleted_at IS NULL) AS total_lokasi,
      (SELECT COUNT(*) FROM lokasi WHERE status = 'Aktif' AND deleted_at IS NULL) AS lokasi_aktif,
      (SELECT COUNT(*) FROM lokasi WHERE status = 'Tidak Aktif' AND deleted_at IS NULL) AS lokasi_tidak_aktif
  `,

  // Lokasi with most barang (for dashboard)
  getTopLokasi: `
    SELECT l.id, l.kode_lokasi, l.nama_lokasi, l.gedung, l.lantai, l.ruangan,
      (SELECT COUNT(*) FROM barang WHERE lokasi_id = l.id AND deleted_at IS NULL) AS total_barang
    FROM lokasi l
    WHERE l.deleted_at IS NULL AND l.status = 'Aktif'
    ORDER BY total_barang DESC
    LIMIT ?
  `,
};

module.exports = lokasiQueries;