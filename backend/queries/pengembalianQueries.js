// ============================================
// PENGEMBALIAN QUERIES - Sistem Peminjaman Barang TVRI
// ============================================

const pengembalianQueries = {
  getAll: `
    SELECT pk.*, p.nomor_peminjaman, p.jumlah, p.tanggal_pinjam, p.tanggal_kembali_rencana,
           pg.nama AS pegawai_nama, b.nama_barang AS barang_nama, b.foto AS barang_foto,
           k.nama AS kategori_nama
    FROM pengembalian pk
    LEFT JOIN peminjaman p ON pk.peminjaman_id = p.id
    LEFT JOIN pegawai pg ON p.pegawai_id = pg.id
    LEFT JOIN barang b ON p.barang_id = b.id
    LEFT JOIN kategori k ON b.kategori_id = k.id
    ORDER BY pk.created_at DESC
    LIMIT ? OFFSET ?
  `,

  countAll: `SELECT COUNT(*) AS total FROM pengembalian`,

  create: `
    INSERT INTO pengembalian (peminjaman_id, tanggal_kembali_aktual, kondisi_barang, catatan, foto)
    VALUES (?, ?, ?, ?, ?)
  `,

  updatePeminjamanStatus: `
    UPDATE peminjaman SET status = 'Dikembalikan' WHERE id = ?
  `,

  updateBarangStatus: `
    UPDATE barang SET status = 'Tersedia' WHERE id = ?
  `,
};

module.exports = pengembalianQueries;