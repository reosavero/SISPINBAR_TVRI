// ============================================
// RIWAYAT SERVICE - Sistem Peminjaman Barang TVRI
// Delete riwayat records (super_admin only)
// ============================================

const pool = require('../config/db');
const { updateBarangStatus } = require('./barangService');

const riwayatService = {

  // ==========================================
  // DELETE A SINGLE RIWAYAT RECORD
  // Hard delete peminjaman + cascade pengembalian
  // Only allowed for completed/finished records
  // ==========================================
  deleteRecord: async (id) => {
    // Fetch the record first
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

    // Safety: prevent deleting active/ongoing peminjaman
    const activeStatuses = ['Menunggu Persetujuan', 'Disetujui', 'Dipinjam', 'Menunggu Konfirmasi'];
    if (activeStatuses.includes(peminjaman.status)) {
      throw new Error(`Peminjaman dengan status "${peminjaman.status}" tidak dapat dihapus dari riwayat. Hanya peminjaman yang sudah selesai (Dikembalikan/Ditolak) yang dapat dihapus.`);
    }

    const barangId = peminjaman.barang_id;

    // Delete pengembalian records first (explicit, even though CASCADE should handle it)
    await pool.execute('DELETE FROM pengembalian WHERE peminjaman_id = ?', [id]);

    // Delete peminjaman record
    await pool.execute('DELETE FROM peminjaman WHERE id = ?', [id]);

    // Update barang status (recalculate available stock)
    if (barangId) {
      await updateBarangStatus(barangId);
    }

    return {
      id,
      nomor_peminjaman: peminjaman.nomor_peminjaman,
      deleted: true,
    };
  },

  // ==========================================
  // BULK DELETE ALL RIWAYAT FOR A GIVEN MONTH/YEAR
  // Only deletes completed records (Dikembalikan, Ditolak)
  // ==========================================
  deleteBulkByMonth: async (year, month) => {
    // Only delete completed records
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

  // ==========================================
  // COUNT RECORDS THAT WILL BE DELETED IN BULK
  // Preview before deletion
  // ==========================================
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