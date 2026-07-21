

const barangQueries = {
  getAll: `
    SELECT b.*, k.nama AS kategori_nama, l.nama_lokasi AS lokasi_nama,
      l.gedung AS lokasi_gedung, l.lantai AS lokasi_lantai, l.ruangan AS lokasi_ruangan,
      l.kode_lokasi AS lokasi_kode,
      (b.jumlah - COALESCE((
        SELECT SUM(p.jumlah) FROM peminjaman p
        WHERE p.barang_id = b.id AND p.status IN ('Menunggu Persetujuan', 'Disetujui', 'Dipinjam')
      ), 0)) AS tersedia
    FROM barang b
    LEFT JOIN kategori k ON b.kategori_id = k.id
    LEFT JOIN lokasi l ON b.lokasi_id = l.id
    WHERE b.deleted_at IS NULL
    AND (? IS NULL OR b.nama_barang LIKE CONCAT('%', ?, '%'))
    AND (? IS NULL OR b.kategori_id = ?)
    AND (? IS NULL OR b.status = ?)
    ORDER BY b.created_at DESC
    LIMIT ? OFFSET ?
  `,

  countAll: `
    SELECT COUNT(*) AS total
    FROM barang b
    WHERE b.deleted_at IS NULL
    AND (? IS NULL OR b.nama_barang LIKE CONCAT('%', ?, '%'))
    AND (? IS NULL OR b.kategori_id = ?)
    AND (? IS NULL OR b.status = ?)
  `,

  getById: `
    SELECT b.*, k.nama AS kategori_nama, l.nama_lokasi AS lokasi_nama,
      l.gedung AS lokasi_gedung, l.lantai AS lokasi_lantai, l.ruangan AS lokasi_ruangan,
      l.kode_lokasi AS lokasi_kode, l.status AS lokasi_status,
      (b.jumlah - COALESCE((
        SELECT SUM(p.jumlah) FROM peminjaman p
        WHERE p.barang_id = b.id AND p.status IN ('Menunggu Persetujuan', 'Disetujui', 'Dipinjam')
      ), 0)) AS tersedia
    FROM barang b
    LEFT JOIN kategori k ON b.kategori_id = k.id
    LEFT JOIN lokasi l ON b.lokasi_id = l.id
    WHERE b.id = ? AND b.deleted_at IS NULL
  `,

  getAvailable: `
    SELECT b.*, k.nama AS kategori_nama, l.nama_lokasi AS lokasi_nama,
      l.gedung AS lokasi_gedung, l.lantai AS lokasi_lantai, l.ruangan AS lokasi_ruangan,
      l.kode_lokasi AS lokasi_kode,
      (b.jumlah - COALESCE((
        SELECT SUM(p.jumlah) FROM peminjaman p
        WHERE p.barang_id = b.id AND p.status IN ('Menunggu Persetujuan', 'Disetujui', 'Dipinjam')
      ), 0)) AS tersedia
    FROM barang b
    LEFT JOIN kategori k ON b.kategori_id = k.id
    LEFT JOIN lokasi l ON b.lokasi_id = l.id
    WHERE b.deleted_at IS NULL
    AND b.status IN ('Tersedia', 'Dipinjam')
    AND (b.jumlah - COALESCE((
      SELECT SUM(p.jumlah) FROM peminjaman p
      WHERE p.barang_id = b.id AND p.status IN ('Menunggu Persetujuan', 'Disetujui', 'Dipinjam')
    ), 0)) > 0
    ORDER BY b.nama_barang ASC
  `,

  checkNamaBarang: `
    SELECT id, nama_barang FROM barang WHERE nama_barang = ? AND deleted_at IS NULL
  `,

  checkNamaBarangForUpdate: `
    SELECT id, nama_barang FROM barang WHERE nama_barang = ? AND deleted_at IS NULL AND id != ?
  `,

  create: `
    INSERT INTO barang (kode_barang, nama_barang, kategori_id, lokasi, lokasi_id, kondisi, status, deskripsi, jumlah, foto)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,

  update: `
    UPDATE barang
    SET nama_barang = ?, kategori_id = ?, lokasi = ?, lokasi_id = ?, kondisi = ?, status = ?, deskripsi = ?, jumlah = ?, foto = ?
    WHERE id = ?
  `,

  updateFoto: `
    UPDATE barang SET foto = ? WHERE id = ?
  `,

  softDelete: `
    UPDATE barang SET deleted_at = NOW() WHERE id = ?
  `,
};

module.exports = barangQueries;