// ============================================
// PEGAWAI QUERIES - Sistem Peminjaman Barang TVRI
// ============================================

const pegawaiQueries = {
  getAll: `
    SELECT p.*, u.username, u.email AS user_email, u.role AS user_role
    FROM pegawai p
    LEFT JOIN users u ON p.user_id = u.id
    WHERE (? IS NULL OR p.nama LIKE CONCAT('%', ?, '%'))
    AND (? IS NULL OR p.divisi = ?)
    ORDER BY p.nama ASC
    LIMIT ? OFFSET ?
  `,

  countAll: `
    SELECT COUNT(*) AS total FROM pegawai
    WHERE (? IS NULL OR nama LIKE CONCAT('%', ?, '%'))
    AND (? IS NULL OR divisi = ?)
  `,

  getById: `
    SELECT p.*, u.username, u.email AS user_email, u.role AS user_role
    FROM pegawai p
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `,

  getByUserId: `
    SELECT p.*, u.username, u.email AS user_email, u.role AS user_role
    FROM pegawai p
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.user_id = ?
  `,

  create: `
    INSERT INTO pegawai (user_id, nip, nama, jabatan, divisi, email, nomor_hp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `,

  update: `
    UPDATE pegawai SET nip = ?, nama = ?, jabatan = ?, divisi = ?, email = ?, nomor_hp = ?
    WHERE id = ?
  `,

  delete: `DELETE FROM pegawai WHERE id = ?`,

  // Check if username exists
  checkUsername: `SELECT id FROM users WHERE username = ?`,

  // Check if email exists in users table
  checkEmail: `SELECT id FROM users WHERE email = ?`,

  // Check if NIP exists
  checkNip: `SELECT id FROM pegawai WHERE nip = ? AND id != ?`,
};

module.exports = pegawaiQueries;