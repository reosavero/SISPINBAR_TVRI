

const pegawaiQueries = {
  getAll: `
    SELECT id, username, nama, nip, jabatan, divisi, email, nomor_hp, role, is_active, registration_status, login_attempts, locked_until
    FROM users
    WHERE role = 'pegawai' AND registration_status = 'approved' AND deleted_at IS NULL
    ORDER BY nama ASC
  `,

  getAllCount: `
    SELECT COUNT(*) AS total FROM users WHERE role = 'pegawai' AND registration_status = 'approved' AND deleted_at IS NULL
  `,

  getById: `
    SELECT id, username, nama, nip, jabatan, divisi, email, nomor_hp, role, is_active, registration_status, avatar, login_attempts, locked_until
    FROM users
    WHERE id = ? AND role = 'pegawai'
  `,

  getByUserId: `
    SELECT id, username, nama, nip, jabatan, divisi, email, nomor_hp, role, is_active, registration_status, avatar, login_attempts, locked_until
    FROM users
    WHERE id = ? AND role = 'pegawai'
  `,

  create: `
    INSERT INTO users (username, email, password, nama, role, nip, jabatan, divisi, nomor_hp, is_active, registration_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved')
  `,

  update: `
    UPDATE users SET nip = ?, nama = ?, jabatan = ?, divisi = ?, email = ?, nomor_hp = ?, updated_at = NOW()
    WHERE id = ?
  `,

  
  hasActivePeminjaman: `
    SELECT COUNT(*) AS count
    FROM peminjaman
    WHERE pegawai_id = ? AND status IN ('Menunggu Persetujuan', 'Disetujui', 'Dipinjam', 'Menunggu Konfirmasi')
  `,

  
  nullifyPeminjamanPegawai: `
    UPDATE peminjaman SET pegawai_id = NULL WHERE pegawai_id = ?
  `,

  
  nullifyAuditLogUser: `
    UPDATE audit_log SET user_id = NULL WHERE user_id = ?
  `,

  
  hardDeleteUser: `DELETE FROM users WHERE id = ?`,

  
  checkUsername: `SELECT id FROM users WHERE username = ?`,

  
  checkEmail: `SELECT id FROM users WHERE email = ?`,

  
  checkNip: `SELECT id FROM users WHERE nip = ? AND id != ?`,
};

module.exports = pegawaiQueries;