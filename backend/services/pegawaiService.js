

const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const pegawaiQueries = require('../queries/pegawaiQueries');
const auditService = require('./auditService');

const pegawaiService = {
  
  getAll: async (params = {}) => {
    const search = params.search || null;
    const divisi = params.divisi || null;
    const jabatan = params.jabatan || null;

    let sql = pegawaiQueries.getAll;
    let queryParams = [];

    const conditions = [];
    if (search) {
      conditions.push('(nama LIKE ? OR nip LIKE ? OR username LIKE ? OR email LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (divisi) {
      conditions.push('divisi = ?');
      queryParams.push(divisi);
    }
    if (jabatan) {
      conditions.push('jabatan = ?');
      queryParams.push(jabatan);
    }

    if (conditions.length > 0) {
      sql += ' AND ' + conditions.join(' AND ');
    }

    const [rows] = await pool.execute(sql, queryParams);
    return { data: rows, total: rows.length };
  },

  
  getById: async (id) => {
    const [rows] = await pool.execute(pegawaiQueries.getById, [id]);
    return rows[0] || null;
  },

  
  getByUserId: async (userId) => {
    const [rows] = await pool.execute(pegawaiQueries.getByUserId, [userId]);
    return rows[0] || null;
  },

  
  create: async (data) => {
    const { nip, nama, jabatan, divisi, email, nomor_hp, username, password } = data;

    
    if (!nip || !nama || !username || !password) {
      throw new Error('NIP, nama, username, dan password wajib diisi');
    }

    if (password.length < 6) {
      throw new Error('Password minimal 6 karakter');
    }

    if (username.length < 3) {
      throw new Error('Username minimal 3 karakter');
    }

    
    const [existingUsername] = await pool.execute(pegawaiQueries.checkUsername, [username]);
    if (existingUsername.length > 0) {
      throw new Error('Username sudah digunakan. Silakan pilih username lain.');
    }

    
    const [existingNip] = await pool.execute(pegawaiQueries.checkNip, [nip, 0]);
    if (existingNip.length > 0) {
      throw new Error('NIP sudah terdaftar. Silakan gunakan NIP lain.');
    }

    
    if (email) {
      const [existingEmail] = await pool.execute(pegawaiQueries.checkEmail, [email]);
      if (existingEmail.length > 0) {
        throw new Error('Email sudah terdaftar. Silakan gunakan email lain.');
      }
    }

    
    const hashedPassword = await bcrypt.hash(password, 10);

    
    const [result] = await pool.execute(
      pegawaiQueries.create,
      [username, email || null, hashedPassword, nama, 'pegawai', nip, jabatan || null, divisi || null, nomor_hp || null, 1]
    );

    
    const [newPegawai] = await pool.execute(pegawaiQueries.getById, [result.insertId]);
    return newPegawai[0];
  },

  
  update: async (id, data) => {
    const { nip, nama, jabatan, divisi, email, nomor_hp, username } = data;

    
    const [currentRows] = await pool.execute(pegawaiQueries.getById, [id]);
    if (currentRows.length === 0) {
      throw new Error('Pegawai tidak ditemukan');
    }

    const pegawai = currentRows[0];

    
    const [existingNip] = await pool.execute(pegawaiQueries.checkNip, [nip, id]);
    if (existingNip.length > 0) {
      throw new Error('NIP sudah digunakan oleh pegawai lain.');
    }

    
    if (username && username !== pegawai.username) {
      const [existingUsername] = await pool.execute(pegawaiQueries.checkUsername, [username]);
      if (existingUsername.length > 0) {
        throw new Error('Username sudah digunakan. Silakan pilih username lain.');
      }

      
      await pool.execute(
        'UPDATE users SET username = ?, nama = ?, nip = ?, jabatan = ?, divisi = ?, email = ?, nomor_hp = ?, updated_at = NOW() WHERE id = ?',
        [username, nama, nip, jabatan || null, divisi || null, email || null, nomor_hp || null, id]
      );
    } else {
      
      await pool.execute(
        'UPDATE users SET nama = ?, nip = ?, jabatan = ?, divisi = ?, email = ?, nomor_hp = ?, updated_at = NOW() WHERE id = ?',
        [nama, nip, jabatan || null, divisi || null, email || null, nomor_hp || null, id]
      );
    }

    
    if (data.password && data.password.length >= 6) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      await pool.execute('UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?', [hashedPassword, id]);
    }

    
    const [updatedRows] = await pool.execute(pegawaiQueries.getById, [id]);
    return updatedRows[0];
  },

  
  delete: async (id, user) => {
    
    const [pegawaiRows] = await pool.execute(pegawaiQueries.getById, [id]);
    if (pegawaiRows.length === 0) {
      throw new Error('Pegawai tidak ditemukan');
    }

    const pegawai = pegawaiRows[0];

    
    const [activeCount] = await pool.execute(pegawaiQueries.hasActivePeminjaman, [id]);
    if (activeCount[0].count > 0) {
      throw new Error('Pegawai tidak dapat dihapus karena masih memiliki peminjaman aktif. Batalkan atau selesaikan peminjaman terlebih dahulu.');
    }

    
    await pool.execute(pegawaiQueries.nullifyPeminjamanPegawai, [id]);

    
    await pool.execute(pegawaiQueries.nullifyAuditLogUser, [id]);

    
    await pool.execute(pegawaiQueries.hardDeleteUser, [id]);

    
    await auditService.log({
      userId: user?.id,
      username: user?.username,
      action: 'DELETE',
      module: 'pegawai',
      recordId: id,
      details: { pegawai_nama: pegawai.nama, nip: pegawai.nip, method: 'hard_delete' },
      ipAddress: user?.ip,
    });

    return { id };
  },

  
  resetPassword: async (id, newPassword) => {
    const [pegawaiRows] = await pool.execute(pegawaiQueries.getById, [id]);
    if (pegawaiRows.length === 0) {
      throw new Error('Pegawai tidak ditemukan');
    }

    if (!newPassword || newPassword.length < 6) {
      throw new Error('Password baru minimal 6 karakter');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.execute('UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?', [hashedPassword, id]);

    return { id, message: 'Password berhasil direset' };
  },

  
  resetLock: async (id) => {
    const [pegawaiRows] = await pool.execute(pegawaiQueries.getById, [id]);
    if (pegawaiRows.length === 0) {
      throw new Error('Pegawai tidak ditemukan');
    }

    await pool.execute(
      'UPDATE users SET login_attempts = 0, locked_until = NULL, updated_at = NOW() WHERE id = ?',
      [id]
    );

    return { id, message: 'Lock percobaan login berhasil direset' };
  },
};

module.exports = pegawaiService;