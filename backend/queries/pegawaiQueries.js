// ============================================
// PEGAWAI QUERIES - Sistem Peminjaman Barang TVRI
// Now using users table directly (pegawai merged into users)
// ============================================

const pegawaiQueries = {
  getAll: `
    SELECT id, username, nama, nip, jabatan, divisi, email, nomor_hp, role, is_active, registration_status
    FROM users
    WHERE role = 'pegawai' AND registration_status = 'approved' AND deleted_at IS NULL
    ORDER BY nama ASC
  `,

  getAllCount: `
    SELECT COUNT(*) AS total FROM users WHERE role = 'pegawai' AND registration_status = 'approved' AND deleted_at IS NULL
  `,

  getById: `
    SELECT id, username, nama, nip, jabatan, divisi, email, nomor_hp, role, is_active, registration_status, avatar
    FROM users
    WHERE id = ? AND role = 'pegawai'
  `,

  getByUserId: `
    SELECT id, username, nama, nip, jabatan, divisi, email, nomor_hp, role, is_active, registration_status, avatar
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

  // Check if pegawai has active peminjaman
  hasActivePeminjaman: `
    SELECT COUNT(*) AS count
    FROM peminjaman
    WHERE pegawai_id = ? AND status IN ('Menunggu Persetujuan', 'Disetujui', 'Dipinjam', 'Menunggu Konfirmasi')
  `,

  // Nullify pegawai_id on ALL peminjaman records
  nullifyPeminjamanPegawai: `
    UPDATE peminjaman SET pegawai_id = NULL WHERE pegawai_id = ?
  `,

  // Nullify user_id on audit_log records referencing the user being deleted
  nullifyAuditLogUser: `
    UPDATE audit_log SET user_id = NULL WHERE user_id = ?
  `,

  // Hard delete user (pegawai)
  hardDeleteUser: `DELETE FROM users WHERE id = ?`,

  // Check if username exists
  checkUsername: `SELECT id FROM users WHERE username = ?`,

  // Check if email exists in users table
  checkEmail: `SELECT id FROM users WHERE email = ?`,

  // Check if NIP exists
  checkNip: `SELECT id FROM users WHERE nip = ? AND id != ?`,
};

module.exports = pegawaiQueries;