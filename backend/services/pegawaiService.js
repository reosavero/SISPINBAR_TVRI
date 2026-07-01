// ============================================
// PEGAWAI SERVICE - Sistem Peminjaman Barang TVRI
// ============================================

const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const pegawaiQueries = require('../queries/pegawaiQueries');
const { paginate } = require('../utils/helpers');
const auditService = require('./auditService');

const pegawaiService = {
  getAll: async (params = {}) => {
    const page = parseInt(params.page) || 1;
    const search = params.search || null;
    const divisi = params.divisi || null;
    const { offset } = paginate(page, 10);
    const itemsPerPage = 10;

    const [rows] = await pool.execute(pegawaiQueries.getAll, [
      search, search, divisi, divisi,
      itemsPerPage, offset,
    ]);

    const [countResult] = await pool.execute(pegawaiQueries.countAll, [
      search, search, divisi, divisi,
    ]);

    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return {
      data: rows,
      pagination: { page, totalPages, totalItems, itemsPerPage },
    };
  },

  getById: async (id) => {
    const [rows] = await pool.execute(pegawaiQueries.getById, [id]);
    return rows[0] || null;
  },

  // ========== CREATE - Buat akun user + data pegawai sekaligus ==========
  create: async (data) => {
    const { nip, nama, jabatan, divisi, email, nomor_hp, username, password } = data;

    // Validasi wajib
    if (!nip || !nama || !username || !password) {
      throw new Error('NIP, nama, username, dan password wajib diisi');
    }

    if (password.length < 6) {
      throw new Error('Password minimal 6 karakter');
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

    // Buat akun user terlebih dahulu
    const [userResult] = await pool.execute(
      'INSERT INTO users (username, email, password, nama, role) VALUES (?, ?, ?, ?, ?)',
      [username, email || null, hashedPassword, nama, 'operator']
    );

    const userId = userResult.insertId;

    // Buat data pegawai dan link ke user
    try {
      const [pegawaiResult] = await pool.execute(pegawaiQueries.create, [
        userId, nip, nama, jabatan || null, divisi || null, email || null, nomor_hp || null,
      ]);

      // Return pegawai data with user info
      const [newPegawai] = await pool.execute(pegawaiQueries.getById, [pegawaiResult.insertId]);
      return newPegawai[0];
    } catch (error) {
      // Jika gagal buat pegawai, hapus user yang sudah dibuat
      await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
      throw error;
    }
  },

  // ========== UPDATE - Update data pegawai + akun user ==========
  update: async (id, data) => {
    const { nip, nama, jabatan, divisi, email, nomor_hp, username } = data;

    // Ambil data pegawai saat ini
    const [currentPegawai] = await pool.execute(pegawaiQueries.getById, [id]);
    if (currentPegawai.length === 0) {
      throw new Error('Pegawai tidak ditemukan');
    }

    const pegawai = currentPegawai[0];

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

      // Update username di tabel users
      await pool.execute(
        'UPDATE users SET username = ?, nama = ?, email = ?, updated_at = NOW() WHERE id = ?',
        [username, nama, email || null, pegawai.user_id]
      );
    } else if (pegawai.user_id) {
      // Update nama dan email di tabel users jika tidak ubah username
      await pool.execute(
        'UPDATE users SET nama = ?, email = ?, updated_at = NOW() WHERE id = ?',
        [nama, email || null, pegawai.user_id]
      );
    }

    // Update password jika dikirim
    if (data.password && data.password.length >= 6 && pegawai.user_id) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      await pool.execute('UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?', [hashedPassword, pegawai.user_id]);
    }

    // Update data pegawai
    await pool.execute(pegawaiQueries.update, [
      nip, nama, jabatan || null, divisi || null, email || null, nomor_hp || null, id,
    ]);

    // Return updated data
    const [updatedPegawai] = await pool.execute(pegawaiQueries.getById, [id]);
    return updatedPegawai[0];
  },

  // ========== DELETE - Hapus pegawai + akun user ==========
  delete: async (id, user) => {
    // Ambil data pegawai untuk mendapatkan user_id
    const [pegawaiRows] = await pool.execute(pegawaiQueries.getById, [id]);
    if (pegawaiRows.length === 0) {
      throw new Error('Pegawai tidak ditemukan');
    }

    const pegawai = pegawaiRows[0];
    const userId = pegawai.user_id;

    // Soft delete pegawai — set deleted_at
    await pool.execute(pegawaiQueries.softDelete, [id]);

    // Also disable the linked user account (soft-delete by setting deleted_at if column exists)
    if (userId) {
      await pool.execute(pegawaiQueries.softDeleteUser, [userId]);
    }

    // Audit log
    await auditService.log({
      userId: user?.id,
      username: user?.username,
      action: 'DELETE',
      module: 'pegawai',
      recordId: id,
      details: { pegawai_nama: pegawai.nama, nip: pegawai.nip, method: 'soft_delete' },
      ipAddress: user?.ip,
    });

    return { id };
  },

  // ========== RESET PASSWORD - Admin reset password pegawai ==========
  resetPassword: async (id, newPassword) => {
    // Ambil data pegawai untuk mendapatkan user_id
    const [pegawaiRows] = await pool.execute(pegawaiQueries.getById, [id]);
    if (pegawaiRows.length === 0) {
      throw new Error('Pegawai tidak ditemukan');
    }

    const pegawai = pegawaiRows[0];
    const userId = pegawai.user_id;

    if (!userId) {
      throw new Error('Pegawai ini tidak memiliki akun login');
    }

    // Hash password baru
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.execute('UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?', [hashedPassword, userId]);

    return { id, message: 'Password berhasil direset' };
  },
};

module.exports = pegawaiService;