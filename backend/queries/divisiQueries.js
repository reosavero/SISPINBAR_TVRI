

const divisiQueries = {
  getAll: `
    SELECT d.*, 
      (SELECT COUNT(*) FROM users WHERE divisi = d.nama AND role = 'pegawai' AND deleted_at IS NULL) AS total_pegawai
    FROM divisi d
    WHERE (? IS NULL OR d.nama LIKE CONCAT('%', ?, '%'))
    ORDER BY d.nama ASC
    LIMIT ? OFFSET ?
  `,

  countAll: `
    SELECT COUNT(*) AS total FROM divisi
    WHERE (? IS NULL OR nama LIKE CONCAT('%', ?, '%'))
  `,

  getAllActive: `
    SELECT id, nama, deskripsi FROM divisi WHERE is_active = 1 ORDER BY nama ASC
  `,

  getById: `SELECT * FROM divisi WHERE id = ?`,

  checkNama: `SELECT id FROM divisi WHERE nama = ? AND id != ?`,

  create: `INSERT INTO divisi (nama, deskripsi) VALUES (?, ?)`,

  update: `UPDATE divisi SET nama = ?, deskripsi = ? WHERE id = ?`,

  toggleActive: `UPDATE divisi SET is_active = NOT is_active WHERE id = ?`,

  delete: `DELETE FROM divisi WHERE id = ?`,
};

module.exports = divisiQueries;