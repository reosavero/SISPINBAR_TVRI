

const pool = require('../config/db');
const dashboardQueries = require('../queries/dashboardQueries');

const dashboardService = {
  getStats: async () => {
    const [rows] = await pool.execute(dashboardQueries.getStats);
    const row = rows[0];
    
    return {
      totalBarang: row.total_barang,
      barangTersedia: row.barang_tersedia,
      barangDipinjam: row.barang_dipinjam,
      barangRusak: row.barang_rusak,
      barangPerbaikan: row.barang_perbaikan,
      totalPegawai: row.total_pegawai,
      peminjamanHariIni: row.peminjaman_hari_ini,
      pengembalianHariIni: row.pengembalian_hari_ini,
      totalLokasi: row.total_lokasi,
      lokasiAktif: row.lokasi_aktif,
      lokasiTidakAktif: row.lokasi_tidak_aktif,
    };
  },

  getMonthlyLoans: async (year) => {
    const targetYear = year || new Date().getFullYear();
    const [rows] = await pool.execute(dashboardQueries.getMonthlyLoans, [targetYear]);

    
    const monthData = {};
    rows.forEach(row => {
      monthData[row.bulan_num] = row.total;
    });

    
    const bulanNama = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    
    const result = bulanNama.map((nama, idx) => ({
      bulan: nama,
      bulan_num: idx + 1,
      total: monthData[idx + 1] || 0,
    }));

    return result;
  },

  getAvailableYears: async () => {
    const [rows] = await pool.execute(dashboardQueries.getAvailableYears);
    return rows.map(r => r.year);
  },

  getBarangStatus: async () => {
    const [rows] = await pool.execute(dashboardQueries.getBarangStatus);
    return rows;
  },

  

  getPegawaiStats: async (pegawaiId) => {
    const [rows] = await pool.execute(dashboardQueries.getPegawaiStats, [
      pegawaiId, pegawaiId, pegawaiId, pegawaiId, pegawaiId,
    ]);
    const row = rows[0];
    return {
      aktif: row.aktif,
      menunggu: row.menunggu,
      sedangDipinjam: row.sedang_dipinjam,
      selesai: row.selesai,
      ditolak: row.ditolak,
    };
  },

  getPegawaiRecentPeminjaman: async (pegawaiId, page = 1, limit = 5) => {
    const offset = (page - 1) * limit;
    const [rows] = await pool.execute(dashboardQueries.getPegawaiRecentPeminjaman, [
      pegawaiId, limit, offset,
    ]);
    return rows;
  },

  getPegawaiPerpanjanganPending: async (pegawaiId) => {
    const [rows] = await pool.execute(dashboardQueries.getPegawaiPerpanjanganPending, [pegawaiId]);
    return rows;
  },

  getPendingNotifications: async () => {
    const [rows] = await pool.execute(dashboardQueries.getPendingNotifications);
    return rows;
  },

  getRecentActivity: async (page = 1, limit = 5) => {
    const offset = (page - 1) * limit;

    const [rows] = await pool.execute(dashboardQueries.getRecentActivity, [limit, offset]);
    const [countResult] = await pool.execute(dashboardQueries.getRecentActivityCount);
    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: rows,
      pagination: { page, totalPages, totalItems, limit },
    };
  },
};

module.exports = dashboardService;