// ============================================
// PENGEMBALIAN SERVICE - Sistem Peminjaman Barang TVRI
// Alur: Pegawai kembalikan → Menunggu Konfirmasi → Admin konfirmasi → Dikembalikan
// ============================================

const pool = require('../config/db');
const pengembalianQueries = require('../queries/pengembalianQueries');
const { paginate, getWIBDateTime } = require('../utils/helpers');
const { updateBarangStatus } = require('./barangService');
const auditService = require('./auditService');
const notificationService = require('./notificationService');

const pengembalianService = {
  getAll: async (params = {}) => {
    const page = parseInt(params.page) || 1;
    const pegawai_id = params.pegawai_id || null;
    const status = params.status || null;
    const { offset } = paginate(page, 10);
    const itemsPerPage = 10;

    let whereConditions = [];
    let queryParams = [];

    if (pegawai_id) {
      whereConditions.push('p.pegawai_id = ?');
      queryParams.push(pegawai_id);
    }
    if (status) {
      whereConditions.push('pk.status = ?');
      queryParams.push(status);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    const [rows] = await pool.execute(
      `SELECT pk.*, p.nomor_peminjaman, p.jumlah, p.tanggal_pinjam, p.tanggal_kembali_rencana, p.status AS peminjaman_status,
              p.pegawai_id, p.barang_id,
              u.nama AS pegawai_nama, b.nama_barang AS barang_nama, b.foto AS barang_foto,
              k.nama AS kategori_nama
       FROM pengembalian pk
       LEFT JOIN peminjaman p ON pk.peminjaman_id = p.id
       LEFT JOIN users u ON p.pegawai_id = u.id
       LEFT JOIN barang b ON p.barang_id = b.id
       LEFT JOIN kategori k ON b.kategori_id = k.id
       ${whereClause}
       ORDER BY pk.created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, itemsPerPage, offset]
    );

    const countQuery = `
      SELECT COUNT(*) AS total FROM pengembalian pk
      LEFT JOIN peminjaman p ON pk.peminjaman_id = p.id
      ${whereClause}`;

    const [countResult] = await pool.execute(countQuery, queryParams);

    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return {
      data: rows,
      pagination: { page, totalPages, totalItems, itemsPerPage },
    };
  },

  // Pegawai mengembalikan barang → status Menunggu Konfirmasi
  create: async (data) => {
    const { peminjaman_id, kondisi_barang, catatan, foto } = data;

    // Get peminjaman data
    const [peminjamanRows] = await pool.execute(
      'SELECT * FROM peminjaman WHERE id = ?',
      [peminjaman_id]
    );

    if (!peminjamanRows[0]) {
      throw new Error('Data peminjaman tidak ditemukan');
    }

    const peminjaman = peminjamanRows[0];

    // Validate peminjaman status
    if (peminjaman.status !== 'Dipinjam' && peminjaman.status !== 'Disetujui') {
      if (peminjaman.status === 'Menunggu Persetujuan') {
        throw new Error('Peminjaman ini masih menunggu persetujuan admin dan belum dapat dikembalikan');
      }
      if (peminjaman.status === 'Dikembalikan') {
        throw new Error('Peminjaman ini sudah dikembalikan');
      }
      if (peminjaman.status === 'Menunggu Konfirmasi') {
        throw new Error('Peminjaman ini sudah dikembalikan dan menunggu konfirmasi admin');
      }
      throw new Error(`Peminjaman ini tidak dapat dikembalikan karena statusnya "${peminjaman.status}"`);
    }

    // Check if there's an active (non-rejected) return already
    const [existingReturn] = await pool.execute(
      "SELECT id, status FROM pengembalian WHERE peminjaman_id = ? AND status IN ('Menunggu Konfirmasi', 'Diterima')",
      [peminjaman_id]
    );
    if (existingReturn.length > 0) {
      if (existingReturn[0].status === 'Diterima') {
        throw new Error('Peminjaman ini sudah dikembalikan');
      }
      throw new Error('Peminjaman ini sudah dikembalikan dan menunggu konfirmasi admin');
    }

    const tanggal_kembali_aktual = getWIBDateTime();

    // Create pengembalian record with status Menunggu Konfirmasi
    const [result] = await pool.execute(pengembalianQueries.create, [
      peminjaman_id, tanggal_kembali_aktual, kondisi_barang || 'Baik', catatan || null, foto || null,
    ]);

    // Update peminjaman status to Menunggu Konfirmasi (NOT Dikembalikan yet)
    await pool.execute(pengembalianQueries.updatePeminjamanStatus, [peminjaman_id]);

    // Fetch the created pengembalian with related data
    const [newRows] = await pool.execute(pengembalianQueries.getById, [result.insertId]);

    // Send notification to admins about the return
    try {
      const pengembalianData = newRows[0] || {};
      await notificationService.create({
        userId: null,
        title: 'Pengembalian Barang',
        message: `${pengembalianData.pegawai_nama || 'Pegawai'} mengembalikan ${pengembalianData.barang_nama || 'barang'} (${pengembalianData.nomor_peminjaman || '-'}) dalam kondisi ${kondisi_barang || 'Baik'}`,
        type: 'pengembalian',
        module: 'pengembalian',
        recordId: result.insertId,
      });
    } catch (notifErr) {
      console.error('Failed to send pengembalian notification:', notifErr.message);
    }

    return newRows[0] || { id: result.insertId, peminjaman_id, ...data };
  },

  // Admin mengkonfirmasi barang telah diterima
  confirm: async (id, user) => {
    // Get pengembalian data with related peminjaman info (includes pegawai_id, barang_id)
    const [rows] = await pool.execute(pengembalianQueries.getById, [id]);
    if (!rows[0]) {
      throw new Error('Data pengembalian tidak ditemukan');
    }

    const pengembalian = rows[0];

    if (pengembalian.status === 'Diterima') {
      throw new Error('Pengembalian ini sudah dikonfirmasi sebelumnya');
    }

    // Resolve barang_id from joined peminjaman data
    const barangId = pengembalian.barang_id;
    if (!barangId) {
      throw new Error('Data barang terkait tidak ditemukan');
    }

    // Resolve pegawai_id from joined peminjaman data
    const pegawaiId = pengembalian.pegawai_id;

    // Update pengembalian status to Diterima
    await pool.execute(pengembalianQueries.confirmPengembalian, [id]);

    // Update peminjaman status to Dikembalikan
    await pool.execute(pengembalianQueries.confirmPeminjamanStatus, [pengembalian.peminjaman_id]);

    // Update barang status
    if (pengembalian.kondisi_barang === 'Rusak Berat') {
      await pool.execute('UPDATE barang SET status = ? WHERE id = ?', ['Rusak', barangId]);
    } else {
      await updateBarangStatus(barangId);
    }

    // Audit log
    await auditService.log({
      userId: user?.id,
      username: user?.username,
      action: 'CONFIRM_RETURN',
      module: 'pengembalian',
      recordId: id,
      details: { nomor_peminjaman: pengembalian.nomor_peminjaman, kondisi: pengembalian.kondisi_barang, barang_id: barangId },
      ipAddress: user?.ip,
    });

    // Notification to pegawai that return is confirmed
    if (pegawaiId) {
      try {
        await notificationService.create({
          pegawaiId: pegawaiId,
          title: 'Pengembalian Dikonfirmasi',
          message: `Pengembalian ${pengembalian.nomor_peminjaman || ''} telah dikonfirmasi admin. Barang dinyatakan ${pengembalian.kondisi_barang || 'Baik'}.`,
          type: 'persetujuan',
          module: 'pengembalian',
          recordId: id,
        });
      } catch (notifErr) {
        console.error('Failed to send return confirmation notification:', notifErr.message);
      }
    }

    // Fetch updated data
    const [updatedRows] = await pool.execute(pengembalianQueries.getById, [id]);
    return updatedRows[0] || pengembalian;
  },

  // Get detail pengembalian by ID
  getById: async (id) => {
    const [rows] = await pool.execute(pengembalianQueries.getById, [id]);
    if (!rows[0]) {
      throw new Error('Data pengembalian tidak ditemukan');
    }
    return rows[0];
  },

  // Admin menolak pengembalian
  reject: async (id, catatan_admin, user) => {
    // Get pengembalian data
    const [rows] = await pool.execute(pengembalianQueries.getById, [id]);
    if (!rows[0]) {
      throw new Error('Data pengembalian tidak ditemukan');
    }

    const pengembalian = rows[0];

    if (pengembalian.status === 'Diterima') {
      throw new Error('Pengembalian ini sudah dikonfirmasi dan tidak dapat ditolak');
    }
    if (pengembalian.status === 'Ditolak') {
      throw new Error('Pengembalian ini sudah ditolak sebelumnya');
    }

    // Update pengembalian status to Ditolak
    await pool.execute(pengembalianQueries.rejectPengembalian, [catatan_admin || null, id]);

    // Revert peminjaman status back to Dipinjam
    await pool.execute(pengembalianQueries.revertPeminjamanStatus, [pengembalian.peminjaman_id]);

    // Audit log
    await auditService.log({
      userId: user?.id,
      username: user?.username,
      action: 'REJECT_RETURN',
      module: 'pengembalian',
      recordId: id,
      details: { 
        nomor_peminjaman: pengembalian.nomor_peminjaman, 
        catatan_admin: catatan_admin || null,
        barang_id: pengembalian.barang_id 
      },
      ipAddress: user?.ip,
    });

    // Notification to pegawai that return was rejected
    if (pengembalian.pegawai_id) {
      try {
        await notificationService.create({
          pegawaiId: pengembalian.pegawai_id,
          title: 'Pengembalian Ditolak',
          message: `Pengembalian ${pengembalian.nomor_peminjaman || ''} ditolak oleh admin. ${catatan_admin ? 'Alasan: ' + catatan_admin : 'Silakan hubungi admin untuk informasi lebih lanjut.'}`,
          type: 'danger',
          module: 'pengembalian',
          recordId: id,
        });
      } catch (notifErr) {
        console.error('Failed to send return rejection notification:', notifErr.message);
      }
    }

    // Fetch updated data
    const [updatedRows] = await pool.execute(pengembalianQueries.getById, [id]);
    return updatedRows[0] || pengembalian;
  },

  // Admin menyetujui semua pengembalian sekaligus (bulk confirm)
  bulkConfirm: async (ids, user) => {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new Error('Pilih minimal satu pengembalian');
    }

    const results = [];
    for (const id of ids) {
      try {
        const result = await pengembalianService.confirm(id, user);
        results.push({ id, success: true, data: result });
      } catch (err) {
        results.push({ id, success: false, message: err.message });
      }
    }
    return results;
  },
};

module.exports = pengembalianService;