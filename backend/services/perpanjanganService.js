// ============================================
// PERPANJANGAN SERVICE - Sistem Peminjaman Barang TVRI
// Fitur perpanjangan peminjaman
// ============================================

const pool = require('../config/db');
const perpanjanganQueries = require('../queries/perpanjanganQueries');
const auditService = require('./auditService');
const notificationService = require('./notificationService');

const perpanjanganService = {
  // Pegawai mengajukan perpanjangan
  create: async (data, user) => {
    const { peminjaman_id, tanggal_kembali_baru, alasan } = data;

    // Validasi peminjaman
    const [peminjamanRows] = await pool.execute(
      'SELECT * FROM peminjaman WHERE id = ? AND deleted_at IS NULL',
      [peminjaman_id]
    );

    if (peminjamanRows.length === 0) {
      throw new Error('Peminjaman tidak ditemukan');
    }

    const peminjaman = peminjamanRows[0];

    // Hanya peminjaman dengan status Dipinjam yang bisa diperpanjang
    if (peminjaman.status !== 'Dipinjam') {
      throw new Error('Hanya peminjaman dengan status Dipinjam yang dapat diperpanjang');
    }

    // Validasi tanggal baru harus setelah tanggal kembali rencana
    if (tanggal_kembali_baru <= peminjaman.tanggal_kembali_rencana) {
      throw new Error('Tanggal kembali baru harus setelah tanggal kembali rencana');
    }

    // Cek apakah sudah ada perpanjangan yang Menunggu Persetujuan
    const [existingPerpanjangan] = await pool.execute(
      "SELECT id FROM perpanjangan WHERE peminjaman_id = ? AND status = 'Menunggu Persetujuan'",
      [peminjaman_id]
    );

    if (existingPerpanjangan.length > 0) {
      throw new Error('Sudah ada permintaan perpanjangan yang menunggu persetujuan untuk peminjaman ini');
    }

    // Buat perpanjangan
    const [result] = await pool.execute(perpanjanganQueries.create, [
      peminjaman_id,
      peminjaman.tanggal_kembali_rencana,
      tanggal_kembali_baru,
      alasan || null,
    ]);

    // Audit log
    await auditService.log({
      userId: user?.id,
      username: user?.username,
      action: 'CREATE',
      module: 'perpanjangan',
      recordId: result.insertId,
      details: { peminjaman_id, tanggal_kembali_baru, alasan },
      ipAddress: user?.ip,
    });

    // Notifikasi ke admin
    await notificationService.create({
      title: 'Permintaan Perpanjangan Baru',
      message: `${peminjaman.nomor_peminjaman} - Permintaan perpanjangan hingga ${tanggal_kembali_baru}`,
      type: 'warning',
      module: 'perpanjangan',
      recordId: result.insertId,
    });

    return { id: result.insertId, peminjaman_id, tanggal_kembali_baru, alasan };
  },

  // Ambil semua perpanjangan (admin) atau milik pegawai
  getAll: async (params = {}) => {
    const page = parseInt(params.page) || 1;
    const itemsPerPage = 10;
    const offset = (page - 1) * itemsPerPage;

    // Jika pegawai, hanya tampilkan miliknya
    if (params.pegawai_id) {
      const [rows] = await pool.execute(perpanjanganQueries.getByPegawai, [
        params.pegawai_id, itemsPerPage, offset
      ]);
      const [countResult] = await pool.execute(perpanjanganQueries.countByPegawai, [params.pegawai_id]);
      const totalItems = countResult[0].total;
      const totalPages = Math.ceil(totalItems / itemsPerPage);
      return { data: rows, pagination: { page, totalPages, totalItems, itemsPerPage } };
    }

    const [rows] = await pool.execute(perpanjanganQueries.getAll, [itemsPerPage, offset]);
    const search = params.search || null;
    const status = params.status || null;
    const [countResult] = await pool.execute(perpanjanganQueries.countAll, [
      search, search, status, status
    ]);
    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return { data: rows, pagination: { page, totalPages, totalItems, itemsPerPage } };
  },

  // Ambil perpanjangan by ID
  getById: async (id) => {
    const [rows] = await pool.execute(perpanjanganQueries.getById, [id]);
    return rows[0] || null;
  },

  // Admin menyetujui perpanjangan
  approve: async (id, user) => {
    const perpanjangan = await perpanjanganService.getById(id);
    if (!perpanjangan) {
      throw new Error('Perpanjangan tidak ditemukan');
    }
    if (perpanjangan.status !== 'Menunggu Persetujuan') {
      throw new Error('Perpanjangan tidak dapat disetujui');
    }

    // Update status perpanjangan
    await pool.execute(perpanjanganQueries.approve, [id]);

    // Update tanggal kembali rencana pada peminjaman
    await pool.execute(perpanjanganQueries.updatePeminjamanDate, [
      perpanjangan.tanggal_kembali_baru,
      perpanjangan.peminjaman_id,
    ]);

    // Audit log
    await auditService.log({
      userId: user?.id,
      username: user?.username,
      action: 'APPROVE',
      module: 'perpanjangan',
      recordId: id,
      details: { peminjaman_id: perpanjangan.peminjaman_id, tanggal_baru: perpanjangan.tanggal_kembali_baru },
      ipAddress: user?.ip,
    });

    // Notifikasi ke pegawai
    if (perpanjangan.pegawai_id) {
      await notificationService.create({
        pegawaiId: perpanjangan.pegawai_id,
        title: 'Perpanjangan Disetujui',
        message: `Perpanjangan peminjaman ${perpanjangan.nomor_peminjaman} telah disetujui hingga ${perpanjangan.tanggal_kembali_baru}`,
        type: 'success',
        module: 'perpanjangan',
        recordId: id,
      });
    }

    return { id, status: 'Disetujui' };
  },

  // Admin menolak perpanjangan
  reject: async (id, user) => {
    const perpanjangan = await perpanjanganService.getById(id);
    if (!perpanjangan) {
      throw new Error('Perpanjangan tidak ditemukan');
    }
    if (perpanjangan.status !== 'Menunggu Persetujuan') {
      throw new Error('Perpanjangan tidak dapat ditolak');
    }

    await pool.execute(perpanjanganQueries.reject, [id]);

    // Audit log
    await auditService.log({
      userId: user?.id,
      username: user?.username,
      action: 'REJECT',
      module: 'perpanjangan',
      recordId: id,
      ipAddress: user?.ip,
    });

    // Notifikasi ke pegawai
    if (perpanjangan.pegawai_id) {
      await notificationService.create({
        pegawaiId: perpanjangan.pegawai_id,
        title: 'Perpanjangan Ditolak',
        message: `Perpanjangan peminjaman ${perpanjangan.nomor_peminjaman} telah ditolak`,
        type: 'danger',
        module: 'perpanjangan',
        recordId: id,
      });
    }

    return { id, status: 'Ditolak' };
  },
};

module.exports = perpanjanganService;