

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

const getWIBDateTime = (date = new Date()) => {
  const wibOffset = 7 * 60 * 60 * 1000; 
  const wibDate = new Date(date.getTime() + wibOffset);
  const y = wibDate.getUTCFullYear();
  const m = String(wibDate.getUTCMonth() + 1).padStart(2, '0');
  const d = String(wibDate.getUTCDate()).padStart(2, '0');
  const h = String(wibDate.getUTCHours()).padStart(2, '0');
  const min = String(wibDate.getUTCMinutes()).padStart(2, '0');
  const s = String(wibDate.getUTCSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}:${s}`;
};

const getWIBDate = (date = new Date()) => {
  const wibOffset = 7 * 60 * 60 * 1000;
  const wibDate = new Date(date.getTime() + wibOffset);
  const y = wibDate.getUTCFullYear();
  const m = String(wibDate.getUTCMonth() + 1).padStart(2, '0');
  const d = String(wibDate.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatDate = (date) => {
  if (!date) return null;
  return new Date(date).toISOString().split('T')[0];
};

const formatDateTime = (date) => {
  if (!date) return null;
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
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
  getWIBDateTime,
  getWIBDate,
  formatDate,
  formatDateTime,
  paginate,
};