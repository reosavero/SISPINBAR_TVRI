

const pool = require('../config/db');
const peminjamanQueries = require('../queries/peminjamanQueries');
const { paginate } = require('../utils/helpers');
const { updateBarangStatus } = require('./barangService');
const auditService = require('./auditService');
const notificationService = require('./notificationService');

const peminjamanService = {
  getAll: async (params = {}) => {
    const page = parseInt(params.page) || 1;
    const search = params.search || null;
    const status = params.status || null;
    const pegawai_id = params.pegawai_id || null; 
    const { offset } = paginate(page, 10);
    const itemsPerPage = 10;

    
    let whereConditions = [];
    let whereParams = [];

    if (search) {
      whereConditions.push('(u.nama LIKE CONCAT(\'%\', ?, \'%\') OR p.nomor_peminjaman LIKE CONCAT(\'%\', ?, \'%\') OR b.nama_barang LIKE CONCAT(\'%\', ?, \'%\'))');
      whereParams.push(search, search, search);
    }

    if (status) {
      const statuses = status.split(',');
      const placeholders = statuses.map(() => '?').join(', ');
      whereConditions.push(`p.status IN (${placeholders})`);
      whereParams.push(...statuses);
    }

    if (pegawai_id) {
      whereConditions.push('p.pegawai_id = ?');
      whereParams.push(pegawai_id);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    const [rows] = await pool.execute(
      `SELECT p.*, u.nama AS pegawai_nama, b.nama_barang AS barang_nama, b.kode_barang, b.foto AS barang_foto, k.nama AS kategori_nama
       FROM peminjaman p
       LEFT JOIN users u ON p.pegawai_id = u.id
       LEFT JOIN barang b ON p.barang_id = b.id
       LEFT JOIN kategori k ON b.kategori_id = k.id
       ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [...whereParams, itemsPerPage, offset]
    );

    const [countResult] = await pool.execute(
      `SELECT COUNT(*) AS total FROM peminjaman p
       LEFT JOIN users u ON p.pegawai_id = u.id
       LEFT JOIN barang b ON p.barang_id = b.id
       ${whereClause}`,
      whereParams
    );

    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return {
      data: rows,
      pagination: { page, totalPages, totalItems, itemsPerPage },
    };
  },

  getById: async (id) => {
    const [rows] = await pool.execute(peminjamanQueries.getById, [id]);
    return rows[0] || null;
  },

  getActiveLoans: async () => {
    const [rows] = await pool.execute(peminjamanQueries.getActiveLoans);
    return rows;
  },

  create: async (data) => {
    const { pegawai_id, barang_id, jumlah, tanggal_pinjam, tanggal_kembali_rencana, keperluan, foto } = data;

    if (!pegawai_id) throw new Error('Pegawai wajib diisi');
    if (!barang_id) throw new Error('Barang wajib diisi');
    const [[barang]] = await pool.execute('SELECT jumlah FROM barang WHERE id = ?', [barang_id]);
    if (!barang) throw new Error('Barang tidak ditemukan');

    const [[borrowed]] = await pool.execute(
      `SELECT COALESCE(SUM(jumlah), 0) AS total_dipinjam FROM peminjaman WHERE barang_id = ? AND status IN ('Menunggu Persetujuan', 'Disetujui', 'Dipinjam', 'Menunggu Konfirmasi')`,
      [barang_id]
    );
    const tersedia = barang.jumlah - Number(borrowed.total_dipinjam);
    const requestedJumlah = jumlah || 1;

    if (requestedJumlah > tersedia) {
      throw new Error(`Hanya tersedia ${tersedia} unit. Tidak bisa meminjam ${requestedJumlah} unit`);
    }

    
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `PIN-${year}${month}-`;
    const [maxResult] = await pool.execute(
      `SELECT nomor_peminjaman FROM peminjaman WHERE nomor_peminjaman LIKE ? ORDER BY nomor_peminjaman DESC LIMIT 1`,
      [`${prefix}%`]
    );
    let urutan = 1;
    if (maxResult.length > 0) {
      const lastNum = parseInt(maxResult[0].nomor_peminjaman.split('-')[2], 10);
      urutan = lastNum + 1;
    }
    const nomor = `PIN-${year}${month}-${String(urutan).padStart(4, '0')}`;

    
    const todayCreate = new Date().toISOString().split('T')[0];
    if (tanggal_pinjam && tanggal_pinjam < todayCreate) {
      throw new Error('Tanggal pinjam tidak boleh sebelum hari ini');
    }

    const [result] = await pool.execute(peminjamanQueries.create, [
      nomor, pegawai_id, barang_id, jumlah || 1,
      tanggal_pinjam || null,
      
      tanggal_kembali_rencana ? (tanggal_kembali_rencana.includes(' ') ? tanggal_kembali_rencana : tanggal_kembali_rencana + ' 23:59:59') : null,
      keperluan || null, foto || null,
    ]);

    
    await updateBarangStatus(barang_id);

    
    try {
      const [pegawaiRows] = await pool.execute('SELECT nama FROM users WHERE id = ?', [pegawai_id]);
      const [barangRows] = await pool.execute('SELECT nama_barang FROM barang WHERE id = ?', [barang_id]);
      const pegawaiNama = pegawaiRows[0]?.nama || 'Pegawai';
      const barangNama = barangRows[0]?.nama_barang || 'barang';
      await notificationService.create({
        userId: null, 
        title: 'Permintaan Peminjaman Baru',
        message: `${pegawaiNama} mengajukan peminjaman ${barangNama} (${nomor})`,
        type: 'peminjaman',
        module: 'peminjaman',
        recordId: result.insertId,
      });
    } catch (notifErr) {
      console.error('Failed to send peminjaman notification:', notifErr.message);
    }

    return { id: result.insertId, nomor_peminjaman: nomor, ...data };
  },

  approve: async (id, user) => {
    const [rows] = await pool.execute(peminjamanQueries.getById, [id]);
    if (!rows[0]) throw new Error('Peminjaman tidak ditemukan');
    if (rows[0].status !== 'Menunggu Persetujuan') throw new Error('Peminjaman tidak dapat disetujui');

    
    await pool.execute(
      'UPDATE peminjaman SET status = ?, tanggal_pinjam = NOW() WHERE id = ?',
      ['Dipinjam', id]
    );

    
    await updateBarangStatus(rows[0].barang_id);

    
    await auditService.log({
      userId: user?.id,
      username: user?.username,
      action: 'APPROVE',
      module: 'peminjaman',
      recordId: id,
      details: { nomor_peminjaman: rows[0].nomor_peminjaman },
      ipAddress: user?.ip,
    });

    
    if (rows[0].pegawai_id) {
      await notificationService.create({
        pegawaiId: rows[0].pegawai_id,
        title: 'Peminjaman Disetujui',
        message: `Peminjaman ${rows[0].nomor_peminjaman} telah disetujui`,
        type: 'persetujuan',
        module: 'peminjaman',
        recordId: id,
      });
    }

    return { id, status: 'Dipinjam' };
  },

  reject: async (id, user) => {
    const [rows] = await pool.execute(peminjamanQueries.getById, [id]);
    const peminjaman = rows[0];
    if (!peminjaman) throw new Error('Peminjaman tidak ditemukan');
    await pool.execute(peminjamanQueries.reject, [id]);

    
    if (peminjaman) {
      await updateBarangStatus(peminjaman.barang_id);
    }

    
    await auditService.log({
      userId: user?.id,
      username: user?.username,
      action: 'REJECT',
      module: 'peminjaman',
      recordId: id,
      details: { nomor_peminjaman: peminjaman.nomor_peminjaman },
      ipAddress: user?.ip,
    });

    
    if (peminjaman.pegawai_id) {
      await notificationService.create({
        pegawaiId: peminjaman.pegawai_id,
        title: 'Peminjaman Ditolak',
        message: `Peminjaman ${peminjaman.nomor_peminjaman} telah ditolak`,
        type: 'danger',
        module: 'peminjaman',
        recordId: id,
      });
    }

    return { id, status: 'Ditolak' };
  },

  delete: async (id) => {
    await pool.execute(peminjamanQueries.delete, [id]);
    return { id };
  },

  
  update: async (id, data, pegawaiId) => {
    
    const [rows] = await pool.execute(peminjamanQueries.getById, [id]);
    const peminjaman = rows[0];
    if (!peminjaman) throw new Error('Peminjaman tidak ditemukan');
    if (peminjaman.pegawai_id !== pegawaiId) throw new Error('Anda tidak memiliki akses untuk mengedit peminjaman ini');
    if (peminjaman.status !== 'Menunggu Persetujuan') throw new Error('Peminjaman yang sudah diproses tidak dapat diedit');

    
    const barang_id = peminjaman.barang_id;
    const { jumlah, tanggal_pinjam, tanggal_kembali_rencana, keperluan, foto } = data;
    const requestedJumlah = jumlah || 1;

    const [[barang]] = await pool.execute('SELECT jumlah FROM barang WHERE id = ?', [barang_id]);
    if (!barang) throw new Error('Barang tidak ditemukan');

    
    const [[borrowed]] = await pool.execute(
      `SELECT COALESCE(SUM(jumlah), 0) AS total_dipinjam FROM peminjaman WHERE barang_id = ? AND status IN ('Menunggu Persetujuan', 'Disetujui', 'Dipinjam', 'Menunggu Konfirmasi') AND id != ?`,
      [barang_id, id]
    );
    const tersedia = barang.jumlah - Number(borrowed.total_dipinjam);

    if (requestedJumlah > tersedia) {
      throw new Error(`Hanya tersedia ${tersedia} unit. Tidak bisa meminjam ${requestedJumlah} unit`);
    }

    
    const todayUpdate = new Date().toISOString().split('T')[0];
    if (tanggal_pinjam && tanggal_pinjam < todayUpdate) {
      throw new Error('Tanggal pinjam tidak boleh sebelum hari ini');
    }

    await pool.execute(peminjamanQueries.update, [barang_id, requestedJumlah, tanggal_pinjam || null, tanggal_kembali_rencana ? (tanggal_kembali_rencana.includes(' ') ? tanggal_kembali_rencana : tanggal_kembali_rencana + ' 23:59:59') : null, keperluan || null, foto, id]);

    
    await updateBarangStatus(barang_id);

    return { id, barang_id, ...data };
  },

  
  deleteByPegawai: async (id, pegawaiId) => {
    
    const [rows] = await pool.execute(peminjamanQueries.getById, [id]);
    const peminjaman = rows[0];
    if (!peminjaman) throw new Error('Peminjaman tidak ditemukan');
    if (peminjaman.pegawai_id !== pegawaiId) throw new Error('Anda tidak memiliki akses untuk menghapus peminjaman ini');
    if (peminjaman.status !== 'Menunggu Persetujuan') throw new Error('Peminjaman yang sudah diproses tidak dapat dihapus');

    const barangId = peminjaman.barang_id;
    await pool.execute(peminjamanQueries.delete, [id]);

    
    await updateBarangStatus(barangId);

    return { id };
  },
};

module.exports = peminjamanService;