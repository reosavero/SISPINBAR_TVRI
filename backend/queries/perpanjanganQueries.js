

const perpanjanganQueries = {
  create: `
    INSERT INTO perpanjangan (peminjaman_id, tanggal_kembali_lama, tanggal_kembali_baru, alasan, status)
    VALUES (?, ?, ?, ?, 'Menunggu Persetujuan')
  `,

  getAll: `
    SELECT pp.*, p.nomor_peminjaman, p.jumlah, p.keperluan,
           u.nama AS pegawai_nama, b.nama_barang AS barang_nama,
           b.kode_barang, k.nama AS kategori_nama
    FROM perpanjangan pp
    LEFT JOIN peminjaman p ON pp.peminjaman_id = p.id
    LEFT JOIN users u ON p.pegawai_id = u.id
    LEFT JOIN barang b ON p.barang_id = b.id
    LEFT JOIN kategori k ON b.kategori_id = k.id
    ORDER BY pp.created_at DESC
    LIMIT ? OFFSET ?
  `,

  countAll: `
    SELECT COUNT(*) AS total FROM perpanjangan pp
    LEFT JOIN peminjaman p ON pp.peminjaman_id = p.id
    LEFT JOIN users u ON p.pegawai_id = u.id
    LEFT JOIN barang b ON p.barang_id = b.id
    WHERE (? IS NULL OR u.nama LIKE CONCAT('%', ?, '%'))
    AND (? IS NULL OR pp.status = ?)
  `,

  getByPegawai: `
    SELECT pp.*, p.nomor_peminjaman, p.jumlah, p.keperluan,
           u.nama AS pegawai_nama, b.nama_barang AS barang_nama,
           b.kode_barang, k.nama AS kategori_nama
    FROM perpanjangan pp
    LEFT JOIN peminjaman p ON pp.peminjaman_id = p.id
    LEFT JOIN users u ON p.pegawai_id = u.id
    LEFT JOIN barang b ON p.barang_id = b.id
    LEFT JOIN kategori k ON b.kategori_id = k.id
    WHERE p.pegawai_id = ?
    ORDER BY pp.created_at DESC
    LIMIT ? OFFSET ?
  `,

  countByPegawai: `
    SELECT COUNT(*) AS total FROM perpanjangan pp
    LEFT JOIN peminjaman p ON pp.peminjaman_id = p.id
    WHERE p.pegawai_id = ?
  `,

  getById: `
    SELECT pp.*, p.nomor_peminjaman, p.jumlah, p.keperluan,
           p.pegawai_id, p.barang_id, p.tanggal_pinjam, p.tanggal_kembali_rencana,
           u.nama AS pegawai_nama, b.nama_barang AS barang_nama,
           b.kode_barang, k.nama AS kategori_nama
    FROM perpanjangan pp
    LEFT JOIN peminjaman p ON pp.peminjaman_id = p.id
    LEFT JOIN users u ON p.pegawai_id = u.id
    LEFT JOIN barang b ON p.barang_id = b.id
    LEFT JOIN kategori k ON b.kategori_id = k.id
    WHERE pp.id = ?
  `,

  approve: `
    UPDATE perpanjangan SET status = 'Disetujui', updated_at = NOW() WHERE id = ? AND status = 'Menunggu Persetujuan'
  `,

  reject: `
    UPDATE perpanjangan SET status = 'Ditolak', updated_at = NOW() WHERE id = ? AND status = 'Menunggu Persetujuan'
  `,

  updatePeminjamanDate: `
    UPDATE peminjaman SET tanggal_kembali_rencana = ?, updated_at = NOW() WHERE id = ?
  `,
};

module.exports = perpanjanganQueries;