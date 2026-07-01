// ============================================
// KATEGORI QUERIES - Sistem Peminjaman Barang TVRI
// ============================================

const kategoriQueries = {
  getAll: `
    SELECT k.*, (SELECT COUNT(*) FROM barang WHERE kategori_id = k.id) AS total_barang
    FROM kategori k
    WHERE (? IS NULL OR k.nama LIKE CONCAT('%', ?, '%'))
    ORDER BY k.nama ASC
    LIMIT ? OFFSET ?
  `,

  countAll: `
    SELECT COUNT(*) AS total FROM kategori
    WHERE (? IS NULL OR nama LIKE CONCAT('%', ?, '%'))
  `,

  getById: `SELECT * FROM kategori WHERE id = ?`,

  create: `INSERT INTO kategori (nama, deskripsi) VALUES (?, ?)`,

  update: `UPDATE kategori SET nama = ?, deskripsi = ? WHERE id = ?`,

  delete: `DELETE FROM kategori WHERE id = ?`,
};

module.exports = kategoriQueries;