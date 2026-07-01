// ============================================
// DASHBOARD QUERIES - Sistem Peminjaman Barang TVRI
// ============================================

const dashboardQueries = {
  getStats: `
    SELECT
      (SELECT COUNT(*) FROM barang) AS total_barang,
      (SELECT COUNT(*) FROM barang WHERE status = 'Tersedia') AS barang_tersedia,
      (SELECT COUNT(*) FROM barang WHERE status = 'Dipinjam') AS barang_dipinjam,
      (SELECT COUNT(*) FROM barang WHERE status = 'Rusak') AS barang_rusak,
      (SELECT COUNT(*) FROM barang WHERE status = 'Dalam Perbaikan') AS barang_perbaikan,
      (SELECT COUNT(*) FROM pegawai) AS total_pegawai,
      (SELECT COUNT(*) FROM peminjaman WHERE DATE(tanggal_pinjam) = CURDATE()) AS peminjaman_hari_ini,
      (SELECT COUNT(*) FROM pengembalian WHERE DATE(tanggal_kembali_aktual) = CURDATE()) AS pengembalian_hari_ini
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
    GROUP BY status
  `,

  getPendingNotifications: `
    SELECT
      pg.id AS pegawai_id,
      pg.nama AS pegawai_nama,
      COUNT(*) AS jumlah,
      GROUP_CONCAT(CONCAT(b.nama_barang, ' (', p.nomor_peminjaman, ')') ORDER BY p.created_at DESC SEPARATOR ', ') AS items,
      MIN(p.created_at) AS waktu_awal,
      MAX(p.created_at) AS waktu_terakhir
    FROM peminjaman p
    LEFT JOIN pegawai pg ON p.pegawai_id = pg.id
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
        CONCAT(pg.nama, ' meminjam ', b.nama_barang, ' (', p.nomor_peminjaman, ')') AS deskripsi,
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
      LEFT JOIN pegawai pg ON p.pegawai_id = pg.id
      LEFT JOIN barang b ON p.barang_id = b.id

      UNION ALL

      SELECT
        CONCAT('pengembalian_', pk.id) AS id,
        'Pengembalian Barang' AS aksi,
        CONCAT(pg.nama, ' mengembalikan ', b.nama_barang, ' (', p.nomor_peminjaman, ')') AS deskripsi,
        'Dikembalikan' AS status,
        pk.created_at AS waktu,
        'pengembalian' AS tipe
      FROM pengembalian pk
      LEFT JOIN peminjaman p ON pk.peminjaman_id = p.id
      LEFT JOIN pegawai pg ON p.pegawai_id = pg.id
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