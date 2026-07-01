// ============================================
// CONSTANTS - Sistem Peminjaman Barang TVRI
// ============================================

export const APP_NAME = 'SISPINBAR';
export const APP_FULL_NAME = 'Sistem Peminjaman Barang';
export const APP_ORGANIZATION = 'TVRI Jawa Timur';

export const COLORS = {
  primary: '#005BAC',
  primaryDark: '#003B71',
  primaryLight: '#E8F1FA',
  white: '#FFFFFF',
  grayLight: '#F5F7FA',
  grayDark: '#4B5563',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
};

export const STATUS_BARANG = {
  TERSEDIA: 'Tersedia',
  DIPINJAM: 'Dipinjam',
  RUSAK: 'Rusak',
  PERBAIKAN: 'Dalam Perbaikan',
};

export const STATUS_PEMINJAMAN = {
  MENUNGGU: 'Menunggu Persetujuan',
  DISETUJUI: 'Disetujui',
  DIPINJAM: 'Dipinjam',
  DIKEMBALIKAN: 'Dikembalikan',
  DITOLAK: 'Ditolak',
};

export const KONDISI_BARANG = {
  BAIK: 'Baik',
  RUSAK_RINGAN: 'Rusak Ringan',
  RUSAK_BERAT: 'Rusak Berat',
};

export const DIVISI = [
  'Produksi',
  'Teknik',
  'Berita',
  'SDM',
  'Keuangan',
  'Program',
  'IT',
];

export const KATEGORI_DEFAULT = [
  'Kamera',
  'Laptop',
  'Mikrofon',
  'Lighting',
  'Tripod',
  'Komputer',
  'Monitor',
  'Printer',
  'Kabel',
  'Peralatan Studio',
];

export const JABATAN = [
  'Kepala Bagian',
  'Staff Produksi',
  'Kamerawan',
  'Editor',
  'Reporter',
  'Pranata Cara',
  'Teknisi',
  'Admin',
  'Manajer',
  'Supervisor',
];

export const LOKASI = [
  'Gudang Utama',
  'Studio A',
  'Studio B',
  'Rangkaian Produksi',
  'Ruang IT',
  'Ruang Berita',
  'Ruang Editing',
  'Lantai 2',
  'Lantai 3',
  'Outdoor Kit',
];

export const ROLES = {
  ADMIN: 'admin',
  OPERATOR: 'operator',
  VIEWER: 'viewer',
};

export const SIDEBAR_MENU_ADMIN = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: 'MdDashboard',
  },
  {
    label: 'Kategori',
    path: '/kategori',
    icon: 'MdCategory',
  },
  {
    label: 'Pegawai',
    path: '/pegawai',
    icon: 'MdPeople',
  },
  {
    label: 'Peminjaman',
    path: '/peminjaman',
    icon: 'MdAssignment',
  },
  {
    label: 'Pengembalian',
    path: '/pengembalian',
    icon: 'MdAssignmentTurnedIn',
  },
  {
    label: 'Riwayat',
    path: '/riwayat',
    icon: 'MdHistory',
  },
];

export const SIDEBAR_MENU_PEGAWAI = [
  {
    label: 'Peminjaman',
    path: '/peminjaman',
    icon: 'MdAssignment',
  },
  {
    label: 'Pengembalian',
    path: '/pengembalian',
    icon: 'MdAssignmentTurnedIn',
  },
  {
    label: 'Riwayat',
    path: '/riwayat',
    icon: 'MdHistory',
  },
];

// Legacy - kept for backward compatibility
export const SIDEBAR_MENU = SIDEBAR_MENU_ADMIN;