// ============================================
// USER SERVICE - Sistem Peminjaman Barang TVRI
// Manajemen User (Admin & Pegawai) oleh Super Admin
// (pegawai merged into users table)
// ============================================

const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const auditService = require('./auditService');
const emailService = require('./emailService');

const userService = {
  // ========== GET ALL USERS (Super Admin) ==========
  getAll: async (params = {}) => {
    const page = parseInt(params.page) || 1;
    const limit = parseInt(params.limit) || 20;
    const search = params.search || null;
    const role = params.role || null;
    const offset = (page - 1) * limit;

    let whereConditions = ['u.deleted_at IS NULL'];
    let queryParams = [];

    if (search) {
      whereConditions.push('(u.nama LIKE ? OR u.username LIKE ? OR u.email LIKE ? OR u.nip LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (role) {
      whereConditions.push('u.role = ?');
      queryParams.push(role);
    }

    const whereClause = 'WHERE ' + whereConditions.join(' AND ');

    const [rows] = await pool.execute(
      `SELECT u.id, u.username, u.email, u.nama, u.role, u.avatar, u.is_active, u.nip, u.jabatan, u.divisi, u.nomor_hp, u.created_at
       FROM users u
       ${whereClause}
       ORDER BY u.role ASC, u.nama ASC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    const [countResult] = await pool.execute(
      `SELECT COUNT(*) AS total FROM users u ${whereClause}`,
      queryParams
    );

    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: rows,
      pagination: { page, totalPages, totalItems, itemsPerPage: limit },
    };
  },

  // ========== GET ALL ADMINS (Super Admin) ==========
  getAdmins: async (params = {}) => {
    const page = parseInt(params.page) || 1;
    const limit = parseInt(params.limit) || 10;
    const search = params.search || null;
    const offset = (page - 1) * limit;

    let whereConditions = ["u.role = 'admin'", 'u.deleted_at IS NULL'];
    let queryParams = [];

    if (search) {
      whereConditions.push('(u.nama LIKE ? OR u.username LIKE ? OR u.email LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = 'WHERE ' + whereConditions.join(' AND ');

    const [rows] = await pool.execute(
      `SELECT u.id, u.username, u.email, u.nama, u.role, u.avatar, u.is_active, u.nip, u.jabatan, u.divisi, u.nomor_hp, u.created_at
       FROM users u
       ${whereClause}
       ORDER BY u.nama ASC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    const [countResult] = await pool.execute(
      `SELECT COUNT(*) AS total FROM users u ${whereClause}`,
      queryParams
    );

    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: rows,
      pagination: { page, totalPages, totalItems, itemsPerPage: limit },
    };
  },

  // ========== GET PEGAWAI BY JABATAN OR DIVISI ==========
  getByJabatanOrDivisi: async (params = {}) => {
    const { type, value } = params;
    if (!type || !value) return { data: [], pagination: { page: 1, totalPages: 0, totalItems: 0, itemsPerPage: 20 } };

    const page = parseInt(params.page) || 1;
    const limit = parseInt(params.limit) || 50;
    const offset = (page - 1) * limit;

    const column = type === 'jabatan' ? 'u.jabatan' : 'u.divisi';

    const [rows] = await pool.execute(
      `SELECT u.id, u.username, u.email, u.nama, u.role, u.avatar, u.is_active, u.nip, u.jabatan, u.divisi, u.nomor_hp, u.registration_status, u.created_at
       FROM users u
       WHERE ${column} = ? AND u.role = 'pegawai' AND u.deleted_at IS NULL AND u.registration_status = 'approved'
       ORDER BY u.nama ASC
       LIMIT ? OFFSET ?`,
      [value, limit, offset]
    );

    const [countResult] = await pool.execute(
      `SELECT COUNT(*) AS total FROM users u WHERE ${column} = ? AND u.role = 'pegawai' AND u.deleted_at IS NULL AND u.registration_status = 'approved'`,
      [value]
    );

    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: rows,
      pagination: { page, totalPages, totalItems, itemsPerPage: limit },
    };
  },

  // ========== GET USER BY ID ==========
  getById: async (id) => {
    const [rows] = await pool.execute(
      `SELECT u.id, u.username, u.email, u.nama, u.role, u.avatar, u.is_active, u.nip, u.jabatan, u.divisi, u.nomor_hp, u.created_at
       FROM users u
       WHERE u.id = ? AND u.deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  },

  // ========== CREATE ADMIN (Super Admin only) ==========
  createAdmin: async (data, createdBy) => {
    const { username, email, nama, password } = data;

    if (!username || !nama || !password) {
      throw new Error('Username, nama, dan password wajib diisi');
    }

    if (password.length < 6) {
      throw new Error('Password minimal 6 karakter');
    }

    const [existingUsername] = await pool.execute(
      'SELECT id FROM users WHERE username = ? AND deleted_at IS NULL',
      [username]
    );
    if (existingUsername.length > 0) {
      throw new Error('Username sudah digunakan. Silakan pilih username lain.');
    }

    if (email) {
      const [existingEmail] = await pool.execute(
        'SELECT id FROM users WHERE email = ? AND deleted_at IS NULL',
        [email]
      );
      if (existingEmail.length > 0) {
        throw new Error('Email sudah digunakan. Silakan gunakan email lain.');
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password, nama, role, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [username, email || null, hashedPassword, nama, 'admin', 1]
    );

    await auditService.log({
      userId: createdBy?.id,
      username: createdBy?.username,
      action: 'CREATE_ADMIN',
      module: 'users',
      recordId: result.insertId,
      details: { username, nama, role: 'admin' },
      ipAddress: createdBy?.ip,
    });

    const [newAdmin] = await pool.execute(
      'SELECT id, username, email, nama, role, is_active, created_at FROM users WHERE id = ?',
      [result.insertId]
    );

    return newAdmin[0];
  },

  // ========== UPDATE USER (Super Admin) ==========
  update: async (id, data, updatedBy) => {
    const [targetUser] = await pool.execute('SELECT id, role, username FROM users WHERE id = ? AND deleted_at IS NULL', [id]);
    if (targetUser.length === 0) {
      throw new Error('User tidak ditemukan');
    }

    if (targetUser[0].role === 'super_admin' && data.role && data.role !== 'super_admin') {
      throw new Error('Role Super Admin tidak dapat diubah');
    }

    if (data.role === 'super_admin') {
      throw new Error('Tidak dapat membuat akun dengan role Super Admin');
    }

    // Check username uniqueness if changing
    if (data.username && data.username !== targetUser[0].username) {
      if (data.username.length < 3) {
        throw new Error('Username minimal 3 karakter');
      }
      const [existingUsername] = await pool.execute(
        'SELECT id FROM users WHERE username = ? AND id != ? AND deleted_at IS NULL',
        [data.username, id]
      );
      if (existingUsername.length > 0) {
        throw new Error('Username sudah digunakan. Silakan pilih username lain.');
      }
    }

    const { nama, email, nip, jabatan, divisi, nomor_hp, is_active, role } = data;
    const updates = [];
    const values = [];

    if (data.username !== undefined && data.username !== targetUser[0].username) { updates.push('username = ?'); values.push(data.username); }
    if (nama !== undefined) { updates.push('nama = ?'); values.push(nama); }
    if (email !== undefined) { updates.push('email = ?'); values.push(email || null); }
    if (nip !== undefined) { updates.push('nip = ?'); values.push(nip || null); }
    if (jabatan !== undefined) { updates.push('jabatan = ?'); values.push(jabatan || null); }
    if (divisi !== undefined) { updates.push('divisi = ?'); values.push(divisi || null); }
    if (nomor_hp !== undefined) { updates.push('nomor_hp = ?'); values.push(nomor_hp || null); }
    if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active ? 1 : 0); }
    if (role !== undefined && role !== 'super_admin') { updates.push('role = ?'); values.push(role); }

    if (updates.length === 0) {
      throw new Error('Tidak ada data yang diperbarui');
    }

    updates.push('updated_at = NOW()');
    values.push(id);

    await pool.execute(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Update password if provided
    if (data.password) {
      if (data.password.length < 6) {
        throw new Error('Password minimal 6 karakter');
      }
      const hashedPassword = await bcrypt.hash(data.password, 10);
      await pool.execute('UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?', [hashedPassword, id]);
    }

    await auditService.log({
      userId: updatedBy?.id,
      username: updatedBy?.username,
      action: 'UPDATE_USER',
      module: 'users',
      recordId: id,
      details: { updated_fields: Object.keys(data).filter(k => data[k] !== undefined), target_username: targetUser[0].username },
      ipAddress: updatedBy?.ip,
    });

    const [updatedUser] = await pool.execute(
      'SELECT id, username, email, nama, role, nip, jabatan, divisi, nomor_hp, is_active, created_at FROM users WHERE id = ?',
      [id]
    );

    return updatedUser[0];
  },

  // ========== DELETE USER (Hard Delete, Super Admin only) ==========
  delete: async (id, deletedBy) => {
    const [targetUser] = await pool.execute('SELECT id, role, username FROM users WHERE id = ?', [id]);
    if (targetUser.length === 0) {
      throw new Error('User tidak ditemukan');
    }

    if (targetUser[0].role === 'super_admin') {
      throw new Error('Akun Super Admin tidak dapat dihapus');
    }

    if (targetUser[0].id === deletedBy?.id) {
      throw new Error('Anda tidak dapat menghapus akun Anda sendiri');
    }

    // Check if user has active peminjaman
    const [activeCount] = await pool.execute(
      "SELECT COUNT(*) AS count FROM peminjaman WHERE pegawai_id = ? AND status IN ('Menunggu Persetujuan', 'Disetujui', 'Dipinjam', 'Menunggu Konfirmasi')",
      [id]
    );
    if (activeCount[0].count > 0) {
      throw new Error('User tidak dapat dihapus karena masih memiliki peminjaman aktif.');
    }

    // Nullify pegawai_id on peminjaman records
    await pool.execute('UPDATE peminjaman SET pegawai_id = NULL WHERE pegawai_id = ?', [id]);

    // Nullify user_id on audit_log records (preserve audit history)
    await pool.execute('UPDATE audit_log SET user_id = NULL WHERE user_id = ?', [id]);

    // Hard delete user
    await pool.execute('DELETE FROM users WHERE id = ?', [id]);

    await auditService.log({
      userId: deletedBy?.id,
      username: deletedBy?.username,
      action: 'DELETE_USER',
      module: 'users',
      recordId: id,
      details: { deleted_username: targetUser[0].username, deleted_role: targetUser[0].role, method: 'hard_delete' },
      ipAddress: deletedBy?.ip,
    });

    return { id, message: 'User berhasil dihapus' };
  },

  // ========== TOGGLE ACTIVE/INACTIVE (Super Admin only) ==========
  toggleActive: async (id, toggledBy) => {
    const [targetUser] = await pool.execute('SELECT id, role, username, is_active FROM users WHERE id = ? AND deleted_at IS NULL', [id]);
    if (targetUser.length === 0) {
      throw new Error('User tidak ditemukan');
    }

    if (targetUser[0].role === 'super_admin') {
      throw new Error('Akun Super Admin tidak dapat dinonaktifkan');
    }

    if (targetUser[0].id === toggledBy?.id) {
      throw new Error('Anda tidak dapat menonaktifkan akun Anda sendiri');
    }

    const newStatus = targetUser[0].is_active ? 0 : 1;
    await pool.execute('UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ?', [newStatus, id]);

    await auditService.log({
      userId: toggledBy?.id,
      username: toggledBy?.username,
      action: newStatus ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
      module: 'users',
      recordId: id,
      details: { target_username: targetUser[0].username, new_status: newStatus ? 'active' : 'inactive' },
      ipAddress: toggledBy?.ip,
    });

    return { id, is_active: newStatus, message: newStatus ? 'Akun berhasil diaktifkan' : 'Akun berhasil dinonaktifkan' };
  },

  // ========== RESET PASSWORD (Super Admin only) ==========
  resetPassword: async (id, newPassword, resetBy) => {
    const [targetUser] = await pool.execute('SELECT id, role, username FROM users WHERE id = ? AND deleted_at IS NULL', [id]);
    if (targetUser.length === 0) {
      throw new Error('User tidak ditemukan');
    }

    if (targetUser[0].role === 'super_admin') {
      throw new Error('Password Super Admin tidak dapat direset melalui aplikasi');
    }

    if (!newPassword || newPassword.length < 6) {
      throw new Error('Password baru minimal 6 karakter');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.execute('UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?', [hashedPassword, id]);

    await auditService.log({
      userId: resetBy?.id,
      username: resetBy?.username,
      action: 'RESET_PASSWORD',
      module: 'users',
      recordId: id,
      details: { target_username: targetUser[0].username },
      ipAddress: resetBy?.ip,
    });

    return { id, message: 'Password berhasil direset' };
  },

  // ========== GET USER STATS (Super Admin) ==========
  getStats: async () => {
    const [superAdminCount] = await pool.execute("SELECT COUNT(*) AS total FROM users WHERE role = 'super_admin' AND deleted_at IS NULL");
    const [adminCount] = await pool.execute("SELECT COUNT(*) AS total FROM users WHERE role = 'admin' AND deleted_at IS NULL");
    const [pegawaiCount] = await pool.execute("SELECT COUNT(*) AS total FROM users WHERE role = 'pegawai' AND registration_status = 'approved' AND deleted_at IS NULL");
    const [activeCount] = await pool.execute("SELECT COUNT(*) AS total FROM users WHERE is_active = 1 AND deleted_at IS NULL");
    const [inactiveCount] = await pool.execute("SELECT COUNT(*) AS total FROM users WHERE is_active = 0 AND deleted_at IS NULL");
    const [pendingCount] = await pool.execute("SELECT COUNT(*) AS total FROM users WHERE registration_status = 'pending' AND deleted_at IS NULL");

    return {
      super_admin: superAdminCount[0].total,
      admin: adminCount[0].total,
      pegawai: pegawaiCount[0].total,
      active: activeCount[0].total,
      inactive: inactiveCount[0].total,
      total: adminCount[0].total + pegawaiCount[0].total + superAdminCount[0].total,
      pending: pendingCount[0].total,
    };
  },

  // ========== GET PENDING REGISTRATIONS ==========
  getPending: async () => {
    const [rows] = await pool.execute(
      `SELECT id, username, email, nama, nip, jabatan, divisi, nomor_hp, created_at
       FROM users
       WHERE registration_status = 'pending' AND deleted_at IS NULL
       ORDER BY created_at ASC`
    );
    return rows;
  },

  // ========== APPROVE REGISTRATION ==========
  approve: async (id, approvedBy) => {
    const [users] = await pool.execute(
      'SELECT id, username, nama, email, role, registration_status FROM users WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    if (users.length === 0) throw new Error('User tidak ditemukan');
    const user = users[0];
    if (user.registration_status !== 'pending') throw new Error('User ini bukan registrasi yang menunggu persetujuan');

    await pool.execute(
      "UPDATE users SET registration_status = 'approved', is_active = 1, updated_at = NOW() WHERE id = ?",
      [id]
    );

    await auditService.log({
      userId: approvedBy.id,
      username: approvedBy.username,
      action: 'APPROVE_REGISTRATION',
      module: 'auth',
      details: { approved_user_id: id, approved_username: user.username, approved_nama: user.nama },
      ipAddress: approvedBy.ip,
    });

    let emailResult = { sent: false, reason: 'Email tidak tersedia' };
    if (user.email) {
      try {
        emailResult = await emailService.sendApprovalEmail(user.email, user.nama, user.username);
      } catch (err) {
        console.error('[EMAIL] Failed to send approval email:', err.message);
        emailResult = { sent: false, reason: err.message };
      }
    }

    const [updated] = await pool.execute('SELECT id, username, nama, role, is_active, registration_status FROM users WHERE id = ?', [id]);
    return { ...updated[0], emailNotif: emailResult };
  },

  // ========== REJECT REGISTRATION ==========
  reject: async (id, reason, rejectedBy) => {
    const [users] = await pool.execute(
      'SELECT id, username, nama, email, role, registration_status FROM users WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    if (users.length === 0) throw new Error('User tidak ditemukan');
    const user = users[0];
    if (user.registration_status !== 'pending') throw new Error('User ini bukan registrasi yang menunggu persetujuan');

    await pool.execute(
      "UPDATE users SET registration_status = 'rejected', rejection_reason = ?, updated_at = NOW() WHERE id = ?",
      [reason || null, id]
    );

    await auditService.log({
      userId: rejectedBy.id,
      username: rejectedBy.username,
      action: 'REJECT_REGISTRATION',
      module: 'auth',
      details: { rejected_user_id: id, rejected_username: user.username, rejected_nama: user.nama, reason },
      ipAddress: rejectedBy.ip,
    });

    let emailResult = { sent: false, reason: 'Email tidak tersedia' };
    if (user.email) {
      try {
        emailResult = await emailService.sendRejectionEmail(user.email, user.nama, reason);
      } catch (err) {
        console.error('[EMAIL] Failed to send rejection email:', err.message);
        emailResult = { sent: false, reason: err.message };
      }
    }

    const [updated] = await pool.execute('SELECT id, username, nama, role, is_active, registration_status, rejection_reason FROM users WHERE id = ?', [id]);
    return { ...updated[0], emailNotif: emailResult };
  },
};

module.exports = userService;