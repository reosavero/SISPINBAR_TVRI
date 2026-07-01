// ============================================
// FORMAT UTILITIES - Sistem Peminjaman Barang TVRI
// ============================================

export const formatCurrency = (value) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
};

export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

export const formatDateShort = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const generateKodeBarang = (kategori, urutan) => {
  const prefix = kategori.substring(0, 3).toUpperCase();
  return `TVRI-${prefix}-${String(urutan).padStart(4, '0')}`;
};

export const generateNomorPeminjaman = (urutan) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `PIN-${year}${month}-${String(urutan).padStart(4, '0')}`;
};

export const getStatusColor = (status) => {
  const colorMap = {
    'Tersedia': 'badge-success',
    'Dipinjam': 'badge-warning',
    'Rusak': 'badge-danger',
    'Dalam Perbaikan': 'badge-gray',
    'Menunggu Persetujuan': 'badge-warning',
    'Disetujui': 'badge-info',
    'Dipinjam': 'badge-primary',
    'Dikembalikan': 'badge-success',
    'Ditolak': 'badge-danger',
    'Baik': 'badge-success',
    'Rusak Ringan': 'badge-warning',
    'Rusak Berat': 'badge-danger',
  };
  return colorMap[status] || 'badge-gray';
};

export const getInitials = (name) => {
  if (!name) return '';
  const words = name.split(' ');
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export const truncateText = (text, maxLength = 30) => {
  if (!text) return '-';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const getAvatarUrl = (avatar) => {
  if (!avatar) return null;
  if (avatar.startsWith('http')) return avatar;
  const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
  return `${baseUrl}${avatar}`;
};

export const getBarangFotoUrl = (foto) => {
  if (!foto) return null;
  if (foto.startsWith('http')) return foto;
  const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
  return `${baseUrl}${foto}`;
};

export const debounce = (func, wait = 300) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};