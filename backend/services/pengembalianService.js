// ============================================
// PENGEMBALIAN SERVICE - Sistem Peminjaman Barang TVRI
// ============================================

const pool = require('../config/db');
const pengembalianQueries = require('../queries/pengembalianQueries');
const { paginate } = require('../utils/helpers');
const { updateBarangStatus } = require('./barangService');

const pengembalianService = {
  getAll: async (params = {}) => {
    const page = parseInt(params.page) || 1;
    const pegawai_id = params.pegawai_id || null;
    const { offset } = paginate(page, 10);
    const itemsPerPage = 10;

    // Build query with optional pegawai_id filter
    let whereClause = '';
    let queryParams = [];

    if (pegawai_id) {
      whereClause = 'WHERE p.pegawai_id = ?';
      queryParams.push(pegawai_id);
    }

    const [rows] = await pool.execute(
      `SELECT pk.*, p.nomor_peminjaman, p.jumlah, p.tanggal_pinjam, p.tanggal_kembali_rencana,
              pg.nama AS pegawai_nama, b.nama_barang AS barang_nama, b.foto AS barang_foto,
              k.nama AS kategori_nama
       FROM pengembalian pk
       LEFT JOIN peminjaman p ON pk.peminjaman_id = p.id
       LEFT JOIN pegawai pg ON p.pegawai_id = pg.id
       LEFT JOIN barang b ON p.barang_id = b.id
       LEFT JOIN kategori k ON b.kategori_id = k.id
       ${whereClause}
       ORDER BY pk.created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, itemsPerPage, offset]
    );

    const [countResult] = await pool.execute(
      `SELECT COUNT(*) AS total FROM pengembalian pk
       LEFT JOIN peminjaman p ON pk.peminjaman_id = p.id
       ${whereClause}`,
      queryParams
    );

    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return {
      data: rows,
      pagination: { page, totalPages, totalItems, itemsPerPage },
    };
  },

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

    // Validate peminjaman status — only Dipinjam or Disetujui can be returned
    if (peminjaman.status !== 'Dipinjam' && peminjaman.status !== 'Disetujui') {
      if (peminjaman.status === 'Menunggu Persetujuan') {
        throw new Error('Peminjaman ini masih menunggu persetujuan admin dan belum dapat dikembalikan');
      }
      if (peminjaman.status === 'Dikembalikan') {
        throw new Error('Peminjaman ini sudah dikembalikan');
      }
      throw new Error(`Peminjaman ini tidak dapat dikembalikan karena statusnya "${peminjaman.status}"`);
    }

    // Check if already returned
    const [existingReturn] = await pool.execute(
      'SELECT id FROM pengembalian WHERE peminjaman_id = ?',
      [peminjaman_id]
    );
    if (existingReturn.length > 0) {
      throw new Error('Peminjaman ini sudah dikembalikan');
    }

    const tanggal_kembali_aktual = new Date().toISOString().split('T')[0];

    // Create pengembalian record
    const [result] = await pool.execute(pengembalianQueries.create, [
      peminjaman_id, tanggal_kembali_aktual, kondisi_barang || 'Baik', catatan || null, foto || null,
    ]);

    // Update peminjaman status to Dikembalikan
    await pool.execute(pengembalianQueries.updatePeminjamanStatus, [peminjaman_id]);

    // Update barang status based on condition
    if (kondisi_barang === 'Rusak Berat') {
      await pool.execute('UPDATE barang SET status = ? WHERE id = ?', ['Rusak', peminjaman.barang_id]);
    } else {
      await updateBarangStatus(peminjaman.barang_id);
    }

    // Fetch the created pengembalian with related data for response
    const [newRows] = await pool.execute(
      `SELECT pk.*, p.nomor_peminjaman, p.jumlah, p.tanggal_pinjam, p.tanggal_kembali_rencana,
              pg.nama AS pegawai_nama, b.nama_barang AS barang_nama, b.foto AS barang_foto,
              k.nama AS kategori_nama
       FROM pengembalian pk
       LEFT JOIN peminjaman p ON pk.peminjaman_id = p.id
       LEFT JOIN pegawai pg ON p.pegawai_id = pg.id
       LEFT JOIN barang b ON p.barang_id = b.id
       LEFT JOIN kategori k ON b.kategori_id = k.id
       WHERE pk.id = ?`,
      [result.insertId]
    );

    return newRows[0] || { id: result.insertId, peminjaman_id, ...data };
  },
};

module.exports = pengembalianService;