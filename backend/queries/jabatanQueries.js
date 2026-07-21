

const jabatanQueries = {
  getAll: `
    SELECT j.*, 
      (SELECT COUNT(*) FROM users WHERE jabatan = j.nama AND role = 'pegawai' AND deleted_at IS NULL) AS total_pegawai
    FROM jabatan j
    WHERE (? IS NULL OR j.nama LIKE CONCAT('%', ?, '%'))
    ORDER BY j.nama ASC
    LIMIT ? OFFSET ?
  `,

  countAll: `
    SELECT COUNT(*) AS total FROM jabatan
    WHERE (? IS NULL OR nama LIKE CONCAT('%', ?, '%'))
  `,

  getAllActive: `
    SELECT id, nama, deskripsi FROM jabatan WHERE is_active = 1 ORDER BY nama ASC
  `,

  getById: `SELECT * FROM jabatan WHERE id = ?`,

  checkNama: `SELECT id FROM jabatan WHERE nama = ? AND id != ?`,

  create: `INSERT INTO jabatan (nama, deskripsi) VALUES (?, ?)`,

  update: `UPDATE jabatan SET nama = ?, deskripsi = ? WHERE id = ?`,

  toggleActive: `UPDATE jabatan SET is_active = NOT is_active WHERE id = ?`,

  delete: `DELETE FROM jabatan WHERE id = ?`,
};

module.exports = jabatanQueries;