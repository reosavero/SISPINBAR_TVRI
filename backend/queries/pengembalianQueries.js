

const pengembalianQueries = {
  
  
  getAll: `
    SELECT pk.*, p.nomor_peminjaman, p.jumlah, p.tanggal_pinjam, p.tanggal_kembali_rencana, p.status AS peminjaman_status,
           p.pegawai_id, p.barang_id,
           u.nama AS pegawai_nama, b.nama_barang AS barang_nama, b.foto AS barang_foto,
           k.nama AS kategori_nama
    FROM pengembalian pk
    LEFT JOIN peminjaman p ON pk.peminjaman_id = p.id
    LEFT JOIN users u ON p.pegawai_id = u.id
    LEFT JOIN barang b ON p.barang_id = b.id
    LEFT JOIN kategori k ON b.kategori_id = k.id
    ORDER BY pk.created_at DESC
    LIMIT ? OFFSET ?
  `,

  countAll: `SELECT COUNT(*) AS total FROM pengembalian`,

  create: `
    INSERT INTO pengembalian (peminjaman_id, tanggal_kembali_aktual, kondisi_barang, catatan, foto, status)
    VALUES (?, ?, ?, ?, ?, 'Menunggu Konfirmasi')
  `,

  updatePeminjamanStatus: `
    UPDATE peminjaman SET status = 'Menunggu Konfirmasi' WHERE id = ?
  `,

  confirmPengembalian: `
    UPDATE pengembalian SET status = 'Diterima' WHERE id = ?
  `,

  confirmPeminjamanStatus: `
    UPDATE peminjaman SET status = 'Dikembalikan' WHERE id = ?
  `,

  getById: `
    SELECT pk.*, p.nomor_peminjaman, p.jumlah, p.tanggal_pinjam, p.tanggal_kembali_rencana, p.status AS peminjaman_status,
           p.keperluan, p.foto AS peminjaman_foto,
           p.pegawai_id, p.barang_id,
           u.nama AS pegawai_nama, u.nip AS pegawai_nip, u.jabatan AS pegawai_jabatan, u.divisi AS pegawai_divisi,
           u.email AS pegawai_email, u.nomor_hp AS pegawai_nomor_hp,
           b.nama_barang AS barang_nama, b.kode_barang, b.foto AS barang_foto, b.lokasi AS barang_lokasi,
           k.nama AS kategori_nama
    FROM pengembalian pk
    LEFT JOIN peminjaman p ON pk.peminjaman_id = p.id
    LEFT JOIN users u ON p.pegawai_id = u.id
    LEFT JOIN barang b ON p.barang_id = b.id
    LEFT JOIN kategori k ON b.kategori_id = k.id
    WHERE pk.id = ?
  `,

  rejectPengembalian: `
    UPDATE pengembalian SET status = 'Ditolak', catatan_admin = ? WHERE id = ?
  `,

  revertPeminjamanStatus: `
    UPDATE peminjaman SET status = 'Dipinjam' WHERE id = ?
  `,
};

module.exports = pengembalianQueries;