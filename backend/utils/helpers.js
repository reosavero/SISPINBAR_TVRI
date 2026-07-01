// ============================================
// HELPER UTILITIES - Sistem Peminjaman Barang TVRI
// ============================================

const generateKodeBarang = (kategori, urutan) => {
  const prefix = kategori.substring(0, 3).toUpperCase();
  return `TVRI-${prefix}-${String(urutan).padStart(4, '0')}`;
};

const generateNomorPeminjaman = (urutan) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `PIN-${year}${month}-${String(urutan).padStart(4, '0')}`;
};

const formatDate = (date) => {
  if (!date) return null;
  return new Date(date).toISOString().split('T')[0];
};

const paginate = (page, itemsPerPage = 10) => {
  const offset = (page - 1) * itemsPerPage;
  return {
    itemsPerPage,
    offset,
  };
};

module.exports = {
  generateKodeBarang,
  generateNomorPeminjaman,
  formatDate,
  paginate,
};