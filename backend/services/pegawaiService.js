// ============================================
// PEGAWAI SERVICE - Sistem Peminjaman Barang TVRI
// Now using users table directly (pegawai merged into users)
// ============================================

const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const pegawaiQueries = require('../queries/pegawaiQueries');
const auditService = require('./auditService');

const pegawaiService = {
  // ========== GET ALL PEGAWAI ==========
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

  // ========== GET PEGAWAI BY ID ==========
  getById: async (id) => {
    const [rows] = await pool.execute(pegawaiQueries.getById, [id]);
    return rows[0] || null;
  },

  // ========== GET PEGAWAI BY USER ID (same as getById now) ==========
  getByUserId: async (userId) => {
    const [rows] = await pool.execute(pegawaiQueries.getByUserId, [userId]);
    return rows[0] || null;
  },

  // ========== CREATE - Buat akun pegawai ==========
  create: async (data) => {
    const { nip, nama, jabatan, divisi, email, nomor_hp, username, password } = data;

    // Validasi wajib
    if (!nip || !nama || !username || !password) {
      throw new Error('NIP, nama, username, dan password wajib diisi');
    }

    if (password.length < 6) {
      throw new Error('Password minimal 6 karakter');
    }

    if (username.length < 3) {
      throw new Error('Username minimal 3 karakter');
    }

    // Cek duplikat username
    const [existingUsername] = await pool.execute(pegawaiQueries.checkUsername, [username]);
    if (existingUsername.length > 0) {
      throw new Error('Username sudah digunakan. Silakan pilih username lain.');
    }

    // Cek duplikat NIP
    const [existingNip] = await pool.execute(pegawaiQueries.checkNip, [nip, 0]);
    if (existingNip.length > 0) {
      throw new Error('NIP sudah terdaftar. Silakan gunakan NIP lain.');
    }

    // Cek duplikat email jika diisi
    if (email) {
      const [existingEmail] = await pool.execute(pegawaiQueries.checkEmail, [email]);
      if (existingEmail.length > 0) {
        throw new Error('Email sudah terdaftar. Silakan gunakan email lain.');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Buat akun pegawai (single table now)
    const [result] = await pool.execute(
      pegawaiQueries.create,
      [username, email || null, hashedPassword, nama, 'pegawai', nip, jabatan || null, divisi || null, nomor_hp || null, 1]
    );

    // Return created pegawai
    const [newPegawai] = await pool.execute(pegawaiQueries.getById, [result.insertId]);
    return newPegawai[0];
  },

  // ========== UPDATE - Update data pegawai ==========
  update: async (id, data) => {
    const { nip, nama, jabatan, divisi, email, nomor_hp, username } = data;

    // Ambil data pegawai saat ini
    const [currentRows] = await pool.execute(pegawaiQueries.getById, [id]);
    if (currentRows.length === 0) {
      throw new Error('Pegawai tidak ditemukan');
    }

    const pegawai = currentRows[0];

    // Cek duplikat NIP (kecuali dirinya sendiri)
    const [existingNip] = await pool.execute(pegawaiQueries.checkNip, [nip, id]);
    if (existingNip.length > 0) {
      throw new Error('NIP sudah digunakan oleh pegawai lain.');
    }

    // Jika username diubah, cek duplikat
    if (username && username !== pegawai.username) {
      const [existingUsername] = await pool.execute(pegawaiQueries.checkUsername, [username]);
      if (existingUsername.length > 0) {
        throw new Error('Username sudah digunakan. Silakan pilih username lain.');
      }

      // Update username + other fields
      await pool.execute(
        'UPDATE users SET username = ?, nama = ?, nip = ?, jabatan = ?, divisi = ?, email = ?, nomor_hp = ?, updated_at = NOW() WHERE id = ?',
        [username, nama, nip, jabatan || null, divisi || null, email || null, nomor_hp || null, id]
      );
    } else {
      // Update without username change
      await pool.execute(
        'UPDATE users SET nama = ?, nip = ?, jabatan = ?, divisi = ?, email = ?, nomor_hp = ?, updated_at = NOW() WHERE id = ?',
        [nama, nip, jabatan || null, divisi || null, email || null, nomor_hp || null, id]
      );
    }

    // Update password jika dikirim
    if (data.password && data.password.length >= 6) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      await pool.execute('UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?', [hashedPassword, id]);
    }

    // Return updated data
    const [updatedRows] = await pool.execute(pegawaiQueries.getById, [id]);
    return updatedRows[0];
  },

  // ========== DELETE - Hard delete pegawai ==========
  delete: async (id, user) => {
    // Ambil data pegawai
    const [pegawaiRows] = await pool.execute(pegawaiQueries.getById, [id]);
    if (pegawaiRows.length === 0) {
      throw new Error('Pegawai tidak ditemukan');
    }

    const pegawai = pegawaiRows[0];

    // Cek apakah pegawai memiliki peminjaman aktif
    const [activeCount] = await pool.execute(pegawaiQueries.hasActivePeminjaman, [id]);
    if (activeCount[0].count > 0) {
      throw new Error('Pegawai tidak dapat dihapus karena masih memiliki peminjaman aktif. Batalkan atau selesaikan peminjaman terlebih dahulu.');
    }

    // Nullify pegawai_id on all peminjaman records
    await pool.execute(pegawaiQueries.nullifyPeminjamanPegawai, [id]);

    // Nullify user_id on audit_log records (preserve audit history)
    await pool.execute(pegawaiQueries.nullifyAuditLogUser, [id]);

    // Hard delete user (pegawai)
    await pool.execute(pegawaiQueries.hardDeleteUser, [id]);

    // Audit log
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

  // ========== RESET PASSWORD - Admin reset password pegawai ==========
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
};

module.exports = pegawaiService;