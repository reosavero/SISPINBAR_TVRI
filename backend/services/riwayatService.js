

const pool = require('../config/db');
const { updateBarangStatus } = require('./barangService');

const riwayatService = {

  
  
  
  
  
  deleteRecord: async (id) => {
    
    const [rows] = await pool.execute(
      `SELECT p.id, p.nomor_peminjaman, p.barang_id, p.status, p.jumlah
       FROM peminjaman p
       WHERE p.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      throw new Error('Data peminjaman tidak ditemukan');
    }

    const peminjaman = rows[0];

    
    const activeStatuses = ['Menunggu Persetujuan', 'Disetujui', 'Dipinjam', 'Menunggu Konfirmasi'];
    if (activeStatuses.includes(peminjaman.status)) {
      throw new Error(`Peminjaman dengan status "${peminjaman.status}" tidak dapat dihapus dari riwayat. Hanya peminjaman yang sudah selesai (Dikembalikan/Ditolak) yang dapat dihapus.`);
    }

    const barangId = peminjaman.barang_id;

    
    await pool.execute('DELETE FROM pengembalian WHERE peminjaman_id = ?', [id]);

    
    await pool.execute('DELETE FROM peminjaman WHERE id = ?', [id]);

    
    if (barangId) {
      await updateBarangStatus(barangId);
    }

    return {
      id,
      nomor_peminjaman: peminjaman.nomor_peminjaman,
      deleted: true,
    };
  },

  
  
  
  
  deleteBulkByMonth: async (year, month) => {
    
    const [result] = await pool.execute(
      `DELETE FROM peminjaman
       WHERE YEAR(tanggal_pinjam) = ?
         AND MONTH(tanggal_pinjam) = ?
         AND status IN ('Dikembalikan', 'Ditolak')`,
      [year, month]
    );

    return {
      deleted: result.affectedRows,
      year,
      month,
    };
  },

  
  
  
  
  countBulkByMonth: async (year, month) => {
    const [[result]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM peminjaman
       WHERE YEAR(tanggal_pinjam) = ?
         AND MONTH(tanggal_pinjam) = ?
         AND status IN ('Dikembalikan', 'Ditolak')`,
      [year, month]
    );

    const [[active]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM peminjaman
       WHERE YEAR(tanggal_pinjam) = ?
         AND MONTH(tanggal_pinjam) = ?
         AND status NOT IN ('Dikembalikan', 'Ditolak')`,
      [year, month]
    );

    return {
      deletable: result.total,
      active: active.total,
      year,
      month,
    };
  },
};

module.exports = riwayatService;