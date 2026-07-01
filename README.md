# 📺 SISPINBAR - Sistem Peminjaman Barang TVRI Jawa Timur

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue)
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

### 4. Login Admin

```
Username: admin
Password: admin123
```

> **Catatan:** Setiap pegawai baru ditambahkan oleh admin melalui menu Data Pegawai.
> Admin menginput data pegawai beserta username dan password untuk login pegawai.

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
| POST | `/api/pengembalian` | Buat Pengembalian |
| **Riwayat** | | |
| GET | `/api/riwayat` | List Riwayat (pegawai: hanya milik sendiri) |

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

### Admin
- Username: `admin` | Password: `admin123`
- Akses penuh: Dashboard, Barang, Kategori, Pegawai, Peminjaman, Pengembalian, Riwayat
- Dapat membuat peminjaman untuk pegawai mana pun
- Dapat menyetujui/menolak peminjaman
- Dapat mengelola data pegawai (termasuk buat akun & reset password)

### Pegawai
- Username & Password didaftarkan oleh Admin
- Akses terbatas: Dashboard, Peminjaman Saya, Pengembalian, Riwayat Saya
- Hanya melihat peminjaman/pengembalian/riwayat miliknya sendiri
- Dapat mengajukan peminjaman barang (auto-assign pegawai_id)
- Tidak dapat approve/reject peminjaman
- Tidak dapat mengakses menu Barang, Kategori, Pegawai

### Alur Pendaftaran Pegawai

1. Admin login ke sistem
2. Admin membuka menu **Data Pegawai**
3. Admin mengklik **Tambah Pegawai**
4. Admin mengisi data pegawai: NIP, Nama, Jabatan, Divisi, Email, Nomor HP
5. Admin mengisi **Username** dan **Password** untuk akun login pegawai
6. Pegawai dapat login menggunakan username dan password yang didaftarkan admin

```
┌──────────┐        ┌──────────┐        ┌──────────┐
│  ADMIN   │───────>│  INPUT   │───────>│  PEGAWAI │
│  Login   │        │  DATA +  │        │  DAPAT   │
│          │        │  AKUN    │        │  LOGIN   │
└──────────┘        └──────────┘        └──────────┘
```

### Menu Berdasarkan Role

| Menu | Admin | Pegawai |
|------|-------|----------|
| Dashboard | ✅ | ✅ |
| Barang | ✅ | ❌ |
| Kategori | ✅ | ❌ |
| Pegawai | ✅ | ❌ |
| Peminjaman | ✅ (semua) | ✅ (milik sendiri) |
| Pengembalian | ✅ (semua) | ✅ (milik sendiri) |
| Riwayat | ✅ (semua) | ✅ (milik sendiri) |
| Profil | ✅ | ✅ |

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