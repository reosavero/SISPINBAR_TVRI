// ============================================
// CONSTANTS - Sistem Peminjaman Barang TVRI
// Updated: Super Admin Role System (3 roles)
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

export const STATUS_LOKASI = {
  AKTIF: 'Aktif',
  TIDAK_AKTIF: 'Tidak Aktif',
};

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  PEGAWAI: 'pegawai',
};

export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  pegawai: 'Pegawai',
};

export const ROLE_COLORS = {
  super_admin: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-200',
    dot: 'bg-red-500',
  },
  admin: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  pegawai: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
};

// ========== SIDEBAR MENUS ==========

export const SIDEBAR_MENU_SUPER_ADMIN = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: 'MdDashboard',
  },
  {
    label: 'Manajemen User',
    path: '/manajemen-user',
    icon: 'MdAdminPanelSettings',
  },
  {
    label: 'Barang',
    path: '/barang',
    icon: 'MdInventory2',
  },
  {
    label: 'Kategori',
    path: '/kategori',
    icon: 'MdCategory',
  },
  {
    label: 'Kelola Lokasi',
    path: '/lokasi',
    icon: 'MdLocationOn',
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
  {
    label: 'Activity Log',
    path: '/activity-log',
    icon: 'MdTrackChanges',
  },
  {
    label: 'System Settings',
    path: '/settings',
    icon: 'MdSettings',
  },
];

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
    label: 'Kelola Lokasi',
    path: '/lokasi',
    icon: 'MdLocationOn',
  },
  {
    label: 'Pegawai',
    path: '/pegawai',
    icon: 'MdPeople',
  },
  {
    label: 'Barang',
    path: '/barang',
    icon: 'MdInventory2',
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
    label: 'Riwayat Saya',
    path: '/riwayat',
    icon: 'MdHistory',
  },
];

// Legacy - kept for backward compatibility
export const SIDEBAR_MENU = SIDEBAR_MENU_ADMIN;