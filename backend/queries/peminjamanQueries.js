

const peminjamanQueries = {
  
  
  getAll: `
    SELECT p.*, u.nama AS pegawai_nama, b.nama_barang AS barang_nama, b.kode_barang, b.foto AS barang_foto,
           k.nama AS kategori_nama
    FROM peminjaman p
    LEFT JOIN users u ON p.pegawai_id = u.id
    LEFT JOIN barang b ON p.barang_id = b.id
    LEFT JOIN kategori k ON b.kategori_id = k.id
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `,

  countAll: `
    SELECT COUNT(*) AS total FROM peminjaman
  `,

  getById: `
    SELECT p.*, u.nama AS pegawai_nama, b.nama_barang AS barang_nama, b.kode_barang, b.foto AS barang_foto,
           k.nama AS kategori_nama
    FROM peminjaman p
    LEFT JOIN users u ON p.pegawai_id = u.id
    LEFT JOIN barang b ON p.barang_id = b.id
    LEFT JOIN kategori k ON b.kategori_id = k.id
    WHERE p.id = ?
  `,

  getActiveLoans: `
    SELECT p.*, u.nama AS pegawai_nama, b.nama_barang AS barang_nama, b.kode_barang, b.foto AS barang_foto,
           k.nama AS kategori_nama
    FROM peminjaman p
    LEFT JOIN users u ON p.pegawai_id = u.id
    LEFT JOIN barang b ON p.barang_id = b.id
    LEFT JOIN kategori k ON b.kategori_id = k.id
    WHERE p.status IN ('Dipinjam', 'Disetujui')
    ORDER BY p.tanggal_pinjam DESC
  `,

  create: `
    INSERT INTO peminjaman (nomor_peminjaman, pegawai_id, barang_id, jumlah, tanggal_pinjam, tanggal_kembali_rencana, keperluan, foto, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Menunggu Persetujuan')
  `,

  approve: `UPDATE peminjaman SET status = 'Dipinjam' WHERE id = ? AND status = 'Menunggu Persetujuan'`,

  reject: `UPDATE peminjaman SET status = 'Ditolak' WHERE id = ? AND status = 'Menunggu Persetujuan'`,

  updateStatus: `UPDATE peminjaman SET status = ? WHERE id = ?`,

  update: `UPDATE peminjaman SET barang_id = ?, jumlah = ?, tanggal_pinjam = ?, tanggal_kembali_rencana = ?, keperluan = ?, foto = ? WHERE id = ? AND status = 'Menunggu Persetujuan'`,

  delete: `DELETE FROM peminjaman WHERE id = ? AND status = 'Menunggu Persetujuan'`,
};

module.exports = peminjamanQueries;