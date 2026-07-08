# 📺 SISPINBAR - Sistem Peminjaman Barang TVRI Jawa Timur

<div align="center">

![Version](https://img.shields.io/badge/version-2.1.0-blue)
![React](https://img.shields.io/badge/React-19-61DAFB)
![Node](https://img.shields.io/badge/Node.js-18+-339933)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1)
![License](https://img.shields.io/badge/license-MIT-green)

**Sistem Peminjaman Barang** untuk mengelola inventaris, peminjaman, dan pengembalian barang di TVRI Jawa Timur.

</div>

---

## 📋 Deskripsi Project

SISPINBAR adalah aplikasi web enterprise yang dirancang untuk mengelola:
- 📦 Data Barang Inventaris
- 📂 Kategori Barang
- 📍 Kelola Lokasi Barang
- 👥 Data Pegawai
- 📋 Peminjaman Barang
- 🔄 Pengembalian Barang
- 📊 Riwayat Transaksi
- 📈 Dashboard Statistik

## 🛠️ Tech Stack

### Frontend
| Technology | Kegunaan |
|------------|----------|
| React 19 | UI Library |
| Vite | Build Tool |
| TailwindCSS v4 | Styling |
| Framer Motion | Animasi |
| React Router DOM | Routing |
| Axios | HTTP Client |
| React Icons | Icon Library |
| React Hot Toast | Notification |
| Recharts | Charts (optional) |

### Backend
| Technology | Kegunaan |
|------------|----------|
| Node.js | Runtime |
| Express.js | Web Framework |
| mysql2 | Database Driver |
| JWT | Authentication |
| bcryptjs | Password Hashing |
| cors | CORS Handler |
| helmet | Security |
| morgan | Logging |

### Database
| Technology | Kegunaan |
|------------|----------|
| MySQL 8.0 | Database |
| Query Manual | Tanpa ORM |
| Prepared Statement | Anti SQL Injection |
| Connection Pool | Performance |

## 📁 Struktur Project

```
D:\Peminjaman_Barang_TVRI\
├── frontend/                 # React + Vite Frontend
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── layout/       # Sidebar, Header, Layout
│   │   │   ├── ui/           # Button, Input, Modal, dll
│   │   │   ├── cards/        # StatCard
│   │   │   ├── tables/       # DataTable
│   │   │   └── charts/       # BarChart, PieChart
│   │   ├── pages/
│   │   │   ├── Dashboard/
│   │   │   ├── Barang/
│   │   │   ├── Kategori/
│   │   │   ├── Pegawai/
│   │   │   ├── Peminjaman/
│   │   │   ├── Pengembalian/
│   │   │   ├── Riwayat/
│   │   │   └── Login/
│   │   ├── context/          # AuthContext
│   │   ├── hooks/            # Custom Hooks
│   │   ├── services/         # API Services
│   │   ├── routes/           # AppRoutes, ProtectedRoute
│   │   ├── utils/            # Constants, Format
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── backend/                   # Node.js + Express Backend
│   ├── config/
│   │   └── db.js            # Database Connection Pool
│   ├── controllers/          # Route Controllers
│   ├── middleware/            # Auth, Error Handler
│   ├── queries/              # SQL Queries
│   ├── routes/               # API Routes
│   ├── services/             # Business Logic
│   ├── utils/                # Helpers
│   ├── database/
│   │   ├── schema.sql        # Database Schema
│   │   └── seed.sql          # Dummy Data
│   ├── uploads/              # File Uploads
│   ├── app.js                # Express App
│   ├── server.js             # Server Entry
│   ├── init-db.js            # Database Init Script
│   └── package.json
│
└── README.md
```

## 🚀 Cara Menjalankan

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- npm atau yarn

### 1. Setup Database

```bash
# Login ke MySQL
mysql -u root -p

# Atau jalankan init script
cd backend
npm run init-db

# Atau jalankan migrasi v6 (Super Admin)
npm run migrate:v6
```

Atau manual:
```bash
mysql -u root -p < backend/database/schema.sql
mysql -u root -p < backend/database/seed.sql
```

### 2. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Copy .env file (sudah ada default)
# Sesuaikan konfigurasi database di .env

# Inisialisasi database
npm run init-db

# Jalankan migrasi v6 (Super Admin role system)
npm run migrate:v6

# Jalankan migrasi v7 (Lokasi module)
npm run migrate:v7

# Jalankan migrasi v8 (Pengembalian reject feature)
npm run migrate:v8

# Jalankan migrasi v9 (Login attempts & account locking)
npm run migrate:v9

# Jalankan migrasi v10 (Kategori unique constraint)
npm run migrate:v10

# Jalankan migrasi v11 (Registrasi pegawai & approval)
npm run migrate:v11

# Jalankan server
npm run dev
```

Server berjalan di: `http://localhost:5000`

### 3. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Jalankan development server
npm run dev
```

Frontend berjalan di: `http://localhost:3000`

### 4. Login

| Role | Username | Password |
|------|----------|----------|
| Super Admin | `superadmin` | `superadmin123` |
| Admin | `admin` | `admin123` |

> **Catatan:** Setiap pegawai baru ditambahkan oleh admin melalui menu Data Pegawai.
> Admin menginput data pegawai beserta username dan password untuk login pegawai.
> ⚠️ Segera ganti password default setelah login!

## 🎨 Tema UI

| Warna | Hex | Kegunaan |
|-------|-----|----------|
| Primary Blue | `#005BAC` | Warna utama |
| Dark Blue | `#003B71` | Aksen gelap |
| White | `#FFFFFF` | Background |
| Gray Light | `#F5F7FA` | Background secondary |
| Gray Dark | `#4B5563` | Teks sekunder |

## 📡 API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| **Auth** | | |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/profile` | Get Profile |
| **Dashboard** | | |
| GET | `/api/dashboard/stats` | Statistik Dashboard |
| GET | `/api/dashboard/monthly-loans` | Peminjaman per Bulan |
| GET | `/api/dashboard/barang-status` | Status Barang |
| GET | `/api/dashboard/recent-activity` | Aktivitas Terkini |
| **Barang** | | |
| GET | `/api/barang` | List Barang |
| GET | `/api/barang/available` | Barang Tersedia |
| GET | `/api/barang/:id` | Detail Barang |
| POST | `/api/barang` | Tambah Barang |
| PUT | `/api/barang/:id` | Update Barang |
| DELETE | `/api/barang/:id` | Hapus Barang |
| **Kategori** | | |
| GET | `/api/kategori` | List Kategori |
| POST | `/api/kategori` | Tambah Kategori |
| PUT | `/api/kategori/:id` | Update Kategori |
| DELETE | `/api/kategori/:id` | Hapus Kategori |
| **Pegawai** | | |
| GET | `/api/pegawai` | List Pegawai |
| POST | `/api/pegawai` | Tambah Pegawai + Buat Akun Login |
| PUT | `/api/pegawai/:id` | Update Pegawai |
| DELETE | `/api/pegawai/:id` | Hapus Pegawai + Akun Login |
| PUT | `/api/pegawai/:id/reset-password` | Reset Password Pegawai |
| **Peminjaman** | | |
| GET | `/api/peminjaman` | List Peminjaman (pegawai: hanya milik sendiri) |
| POST | `/api/peminjaman` | Buat Peminjaman (pegawai: auto-assign pegawai_id) |
| PUT | `/api/peminjaman/:id/approve` | Setujui Peminjaman *(admin only)* |
| PUT | `/api/peminjaman/:id/reject` | Tolak Peminjaman *(admin only)* |
| **Pengembalian** | | |
| GET | `/api/pengembalian` | List Pengembalian (pegawai: hanya milik sendiri) |
| GET | `/api/pengembalian/:id` | Detail Pengembalian |
| POST | `/api/pengembalian` | Buat Pengembalian |
| PUT | `/api/pengembalian/:id/confirm` | Terima Pengembalian *(admin only)* |
| PUT | `/api/pengembalian/:id/reject` | Tolak Pengembalian *(admin only)* |
| **Riwayat** | | |
| GET | `/api/riwayat` | List Riwayat (pegawai: hanya milik sendiri) |
| DELETE | `/api/riwayat/:id` | Hapus Riwayat *(super_admin only)* |
| **Archive** | | |
| GET | `/api/archive/years` | Daftar tahun arsip *(admin+)* |
| GET | `/api/archive/months` | Daftar bulan arsip per tahun *(admin+)* |
| GET | `/api/archive/data` | Data arsip per bulan *(admin+)* |
| POST | `/api/archive/process` | Trigger arsip manual *(super_admin only)* |
| GET | `/api/archive/export/excel` | Export arsip ke Excel *(admin+)* |
| GET | `/api/archive/delete/count` | Preview jumlah data yang akan dihapus *(super_admin only)* |
| DELETE | `/api/archive/bulk` | Hapus semua riwayat selesai per bulan *(super_admin only)* |

## 🗃️ Database Schema

### ERD
```
┌──────────┐     ┌──────────┐     ┌──────────────┐
│ kategori │────<│  barang  │<────│  peminjaman  │
└──────────┘     └──────────┘     └──────────────┘
                        │                │
                        │           ┌────┘
                        │           │
                        │     ┌──────────────┐
                        │     │ pengembalian  │
                        │     └──────────────┘
                        │
                   ┌────┘
                   │
             ┌──────────┐     ┌──────────┐
             │ pegawai  │────>│  users   │
             │          │user_id│ (login)  │
             └──────────┘     └──────────┘
```

### Tabel Utama
- **users** - Akun pengguna sistem
- **kategori** - Kategori barang
- **barang** - Data barang inventaris
- **pegawai** - Data pegawai
- **peminjaman** - Transaksi peminjaman
- **pengembalian** - Transaksi pengembalian

## 📊 Data Awal

| Data | Jumlah |
|------|--------|
| Kategori | 10 |
| Barang | 50 |
| Pegawai | 0 (ditambahkan oleh admin) |
| Peminjaman | 0 (ditambahkan melalui aplikasi) |
| Pengembalian | 0 (ditambahkan melalui aplikasi) |

## 🔐 Alur Login & Role

### Super Admin
- Username: `superadmin` | Password: `superadmin123`
- Akses penuh: Dashboard, Manajemen User, Barang, Kategori, Pegawai, Peminjaman, Pengembalian, Riwayat, Activity Log, System Settings
- Dapat membuat/mengedit/menghapus akun Admin
- Dapat mengelola seluruh sistem
- ⚠️ Tidak dapat dihapus/dinonaktifkan/ubah role melalui aplikasi
- ⚠️ Hanya ada 1 akun Super Admin

### Admin
- Username: `admin` | Password: `admin123`
- Akses: Dashboard, Kategori, Pegawai, Barang, Peminjaman, Pengembalian, Riwayat, Activity Log
- Dapat membuat/mengedit/menghapus pegawai
- Tidak dapat mengelola akun Admin lain
- Tidak dapat mengakses System Settings

### Pegawai
- Username & Password didaftarkan oleh Admin/Super Admin
- Akses terbatas: Dashboard, Ajukan Peminjaman, Barang, Riwayat Saya, Perpanjangan
- Hanya melihat peminjaman/pengembalian/riwayat miliknya sendiri
- Tidak dapat approve/reject peminjaman

### Alur Pendaftaran Pegawai

1. Admin/Super Admin login ke sistem
2. Membuka menu **Data Pegawai**
3. Mengisi data pegawai: NIP, Nama, Jabatan, Divisi, Email, Nomor HP
4. Mengisi **Username** dan **Password** untuk akun login pegawai
5. Pegawai dapat login menggunakan username dan password yang didaftarkan

### Menu Berdasarkan Role

| Menu | Super Admin | Admin | Pegawai |
|------|-------------|-------|---------|
| Dashboard | ✅ | ✅ | ✅ |
| Manajemen User | ✅ | ❌ | ❌ |
| Barang | ✅ | ✅ | ✅ (lihat) |
| Kategori | ✅ | ✅ | ❌ |
| Kelola Lokasi | ✅ | ✅ | ❌ |
| Peminjaman | ✅ (semua) | ✅ (semua) | ✅ (milik sendiri) |
| Pengembalian | ✅ (semua) | ✅ (semua) | ✅ (milik sendiri) |
| Riwayat | ✅ (semua + hapus) | ✅ (semua) | ✅ (milik sendiri) |
| Activity Log | ✅ | ✅ | ❌ |
| System Settings | ✅ | ❌ | ❌ |
| Activity Log | ✅ | ✅ | ❌ |
| System Settings | ✅ | ❌ | ❌ |
| Profil | ✅ | ✅ | ✅ |

### 🔒 System Settings (Super Admin Only)

| Setting | Fungsi | Status Integrasi |
|---------|--------|------------------|
| Nama Aplikasi | Label app di header/sidebar | ✅ Terintegrasi |
| Nama Lengkap Aplikasi | Judul halaman | ✅ Terintegrasi |
| Nama Organisasi | Nama instansi | ✅ Terintegrasi |
| Session Timeout (jam) | Durasi token JWT aktif setelah login | ✅ Terintegrasi (dibaca dinamis dari DB) |
| Maksimal Percobaan Login | Batas gagal login sebelum akun terkunci | ✅ Terintegrasi (30 menit lockout) |
| Default Password | Password default akun baru | ⚙️ Tersimpan di DB |

### 🛡️ Fitur Keamanan

- **Session Timeout**: Dibaca dari `system_settings` secara dinamis saat login. Rentang 1–168 jam. Berlaku untuk login baru.
- **Account Locking**: Jika gagal login melebihi `max_login_attempts`, akun terkunci selama 30 menit. Counter direset setelah login berhasil.
- **Login Attempt Tracking**: Kolom `login_attempts` dan `locked_until` di tabel `users`.
- **Email Notification**: Notifikasi email otomatis saat registrasi disetujui/ditolak. Konfigurasi via `.env`.

### 📧 Konfigurasi Email (Gmail SMTP)

Tambahkan konfigurasi berikut di `backend/.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxx-xxxx-xxxx-xxxx   ← App Password 16 karakter
SMTP_FROM=your-email@gmail.com
FRONTEND_URL=http://localhost:5173
```

#### Cara Membuat Gmail App Password:

1. Buka **https://myaccount.google.com**
2. Pastikan **2-Step Verification** sudah aktif
3. Buka **https://myaccount.google.com/apppasswords**
4. Pilih **Other (Custom name)** → ketik `SISPINBAR`
5. Klik **Generate** → salin 16 karakter password
6. Tempelkan ke `SMTP_PASS` di `.env` (tanpa spasi)

#### Test Konfigurasi Email:

```bash
cd backend
npm run test-email email-tujuan@gmail.com
```

Email dikirim saat:
- ✅ Registrasi **disetujui** admin → email berisi konfirmasi + link login
- ❌ Registrasi **ditolak** admin → email berisi alasan penolakan

## 👨‍💻 Standar Kode

- ✅ Clean Code & Consistent Naming
- ✅ Reusable Components
- ✅ Prepared Statement (Anti SQL Injection)
- ✅ Connection Pool mysql2
- ✅ Error Handling di setiap layer
- ✅ Loading State & Empty State
- ✅ Responsive Design
- ✅ Glassmorphism UI

---

<div align="center">

**© 2024 TVRI Jawa Timur - Sistem Peminjaman Barang**

</div>