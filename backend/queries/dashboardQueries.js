// ============================================
// DASHBOARD QUERIES - Sistem Peminjaman Barang TVRI
// (pegawai merged into users table)
// ============================================

const dashboardQueries = {
  getStats: `
    SELECT
      (SELECT COUNT(*) FROM barang WHERE deleted_at IS NULL) AS total_barang,
      (SELECT COUNT(*) FROM barang WHERE status = 'Tersedia' AND deleted_at IS NULL) AS barang_tersedia,
      (SELECT COUNT(*) FROM barang WHERE status = 'Dipinjam' AND deleted_at IS NULL) AS barang_dipinjam,
      (SELECT COUNT(*) FROM barang WHERE status = 'Rusak' AND deleted_at IS NULL) AS barang_rusak,
      (SELECT COUNT(*) FROM barang WHERE status = 'Dalam Perbaikan' AND deleted_at IS NULL) AS barang_perbaikan,
      (SELECT COUNT(*) FROM users WHERE role = 'pegawai' AND registration_status = 'approved' AND deleted_at IS NULL) AS total_pegawai,
      (SELECT COUNT(*) FROM peminjaman WHERE DATE(tanggal_pinjam) = CURDATE()) AS peminjaman_hari_ini,
      (SELECT COUNT(*) FROM pengembalian WHERE DATE(tanggal_kembali_aktual) = CURDATE()) AS pengembalian_hari_ini,
      (SELECT COUNT(*) FROM lokasi WHERE deleted_at IS NULL) AS total_lokasi,
      (SELECT COUNT(*) FROM lokasi WHERE status = 'Aktif' AND deleted_at IS NULL) AS lokasi_aktif,
      (SELECT COUNT(*) FROM lokasi WHERE status = 'Tidak Aktif' AND deleted_at IS NULL) AS lokasi_tidak_aktif
  `,

  // Pegawai dashboard stats
  getPegawaiStats: `
    SELECT
      (SELECT COUNT(*) FROM peminjaman WHERE pegawai_id = ? AND status IN ('Menunggu Persetujuan', 'Disetujui', 'Dipinjam')) AS aktif,
      (SELECT COUNT(*) FROM peminjaman WHERE pegawai_id = ? AND status = 'Menunggu Persetujuan') AS menunggu,
      (SELECT COUNT(*) FROM peminjaman WHERE pegawai_id = ? AND status = 'Dipinjam') AS sedang_dipinjam,
      (SELECT COUNT(*) FROM peminjaman WHERE pegawai_id = ? AND status = 'Dikembalikan') AS selesai,
      (SELECT COUNT(*) FROM peminjaman WHERE pegawai_id = ? AND status = 'Ditolak') AS ditolak
  `,

  // Pegawai recent peminjaman
  getPegawaiRecentPeminjaman: `
    SELECT p.*, b.nama_barang AS barang_nama, b.kode_barang, b.foto AS barang_foto,
           k.nama AS kategori_nama
    FROM peminjaman p
    LEFT JOIN barang b ON p.barang_id = b.id
    LEFT JOIN kategori k ON b.kategori_id = k.id
    WHERE p.pegawai_id = ?
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `,

  // Pegawai perpanjangan pending
  getPegawaiPerpanjanganPending: `
    SELECT pp.*, p.nomor_peminjaman, b.nama_barang AS barang_nama
    FROM perpanjangan pp
    LEFT JOIN peminjaman p ON pp.peminjaman_id = p.id
    LEFT JOIN barang b ON p.barang_id = b.id
    WHERE p.pegawai_id = ? AND pp.status = 'Menunggu Persetujuan'
    ORDER BY pp.created_at DESC
  `,

  getMonthlyLoans: `
    SELECT
      MONTH(tanggal_pinjam) AS bulan_num,
      COUNT(*) AS total
    FROM peminjaman
    WHERE YEAR(tanggal_pinjam) = ?
    GROUP BY MONTH(tanggal_pinjam)
    ORDER BY bulan_num
  `,

  getAvailableYears: `
    SELECT DISTINCT YEAR(tanggal_pinjam) AS year
    FROM peminjaman
    ORDER BY year DESC
  `,

  getBarangStatus: `
    SELECT status, COUNT(*) AS total
    FROM barang
    WHERE deleted_at IS NULL
    GROUP BY status
  `,

  getPendingNotifications: `
    SELECT
      u.id AS pegawai_id,
      u.nama AS pegawai_nama,
      COUNT(*) AS jumlah,
      GROUP_CONCAT(CONCAT(b.nama_barang, ' (', p.nomor_peminjaman, ')') ORDER BY p.created_at DESC SEPARATOR ', ') AS items,
      MIN(p.created_at) AS waktu_awal,
      MAX(p.created_at) AS waktu_terakhir
    FROM peminjaman p
    LEFT JOIN users u ON p.pegawai_id = u.id
    LEFT JOIN barang b ON p.barang_id = b.id
    WHERE p.status = 'Menunggu Persetujuan'
    GROUP BY p.pegawai_id
    ORDER BY waktu_terakhir DESC
  `,

  getRecentActivity: `
    SELECT * FROM (
      SELECT
        CONCAT('peminjaman_', p.id) AS id,
        CASE
          WHEN p.status = 'Menunggu Persetujuan' THEN 'Permintaan Peminjaman Baru'
          WHEN p.status = 'Disetujui' THEN 'Peminjaman Disetujui'
          WHEN p.status = 'Ditolak' THEN 'Peminjaman Ditolak'
          WHEN p.status = 'Dipinjam' THEN 'Barang Sedang Dipinjam'
          WHEN p.status = 'Dikembalikan' THEN 'Peminjaman Selesai'
          ELSE 'Peminjaman'
        END AS aksi,
        CONCAT(u.nama, ' meminjam ', b.nama_barang, ' (', p.nomor_peminjaman, ')') AS deskripsi,
        p.status,
        p.created_at AS waktu,
        CASE
          WHEN p.status = 'Menunggu Persetujuan' THEN 'peminjaman'
          WHEN p.status = 'Disetujui' THEN 'persetujuan'
          WHEN p.status = 'Ditolak' THEN 'penolakan'
          WHEN p.status = 'Dipinjam' THEN 'peminjaman'
          WHEN p.status = 'Dikembalikan' THEN 'pengembalian'
          ELSE 'peminjaman'
        END AS tipe
      FROM peminjaman p
      LEFT JOIN users u ON p.pegawai_id = u.id
      LEFT JOIN barang b ON p.barang_id = b.id

      UNION ALL

      SELECT
        CONCAT('pengembalian_', pk.id) AS id,
        'Pengembalian Barang' AS aksi,
        CONCAT(u.nama, ' mengembalikan ', b.nama_barang, ' (', p.nomor_peminjaman, ')') AS deskripsi,
        'Dikembalikan' AS status,
        pk.created_at AS waktu,
        'pengembalian' AS tipe
      FROM pengembalian pk
      LEFT JOIN peminjaman p ON pk.peminjaman_id = p.id
      LEFT JOIN users u ON p.pegawai_id = u.id
      LEFT JOIN barang b ON p.barang_id = b.id
    ) AS activity
    ORDER BY waktu DESC
    LIMIT ? OFFSET ?
  `,

  getRecentActivityCount: `
    SELECT COUNT(*) AS total FROM (
      SELECT p.id FROM peminjaman p
      UNION ALL
      SELECT pk.id FROM pengembalian pk
    ) AS total_activity
  `,
};

module.exports = dashboardQueries;