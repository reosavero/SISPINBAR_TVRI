// ============================================
// BARANG QUERIES - Sistem Peminjaman Barang TVRI
// ============================================

const barangQueries = {
  getAll: `
    SELECT b.*, k.nama AS kategori_nama,
      (b.jumlah - COALESCE((
        SELECT SUM(p.jumlah) FROM peminjaman p
        WHERE p.barang_id = b.id AND p.status IN ('Menunggu Persetujuan', 'Disetujui', 'Dipinjam')
      ), 0)) AS tersedia
    FROM barang b
    LEFT JOIN kategori k ON b.kategori_id = k.id
    WHERE (? IS NULL OR b.nama_barang LIKE CONCAT('%', ?, '%'))
    AND (? IS NULL OR b.kategori_id = ?)
    AND (? IS NULL OR b.status = ?)
    ORDER BY b.created_at DESC
    LIMIT ? OFFSET ?
  `,

  countAll: `
    SELECT COUNT(*) AS total
    FROM barang b
    WHERE (? IS NULL OR b.nama_barang LIKE CONCAT('%', ?, '%'))
    AND (? IS NULL OR b.kategori_id = ?)
    AND (? IS NULL OR b.status = ?)
  `,

  getById: `
    SELECT b.*, k.nama AS kategori_nama,
      (b.jumlah - COALESCE((
        SELECT SUM(p.jumlah) FROM peminjaman p
        WHERE p.barang_id = b.id AND p.status IN ('Menunggu Persetujuan', 'Disetujui', 'Dipinjam')
      ), 0)) AS tersedia
    FROM barang b
    LEFT JOIN kategori k ON b.kategori_id = k.id
    WHERE b.id = ?
  `,

  getAvailable: `
    SELECT b.*, k.nama AS kategori_nama
    FROM barang b
    LEFT JOIN kategori k ON b.kategori_id = k.id
    WHERE b.status = 'Tersedia'
    ORDER BY b.nama_barang ASC
  `,

  create: `
    INSERT INTO barang (kode_barang, nama_barang, kategori_id, lokasi, kondisi, status, deskripsi, jumlah, foto)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,

  update: `
    UPDATE barang
    SET nama_barang = ?, kategori_id = ?, lokasi = ?, kondisi = ?, status = ?, deskripsi = ?, jumlah = ?, foto = ?
    WHERE id = ?
  `,

  updateFoto: `
    UPDATE barang SET foto = ? WHERE id = ?
  `,
};

module.exports = barangQueries;