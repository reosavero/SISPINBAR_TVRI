// ============================================
// APP ROUTES - Sistem Peminjaman Barang TVRI
// Updated: Super Admin Role System (3 roles)
// ============================================

import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../context/AuthContext';

// Pages
import Login from '../pages/Login/Login';
import Dashboard from '../pages/Dashboard/Dashboard';
import Kategori from '../pages/Kategori/Kategori';
import Pegawai from '../pages/Pegawai/Pegawai';
import Peminjaman from '../pages/Peminjaman/Peminjaman';
import Pengembalian from '../pages/Pengembalian/Pengembalian';
import Riwayat from '../pages/Riwayat/Riwayat';
import Profil from '../pages/Profil/Profil';
import Barang from '../pages/Barang/Barang';
import Lokasi from '../pages/Lokasi/Lokasi';

// Lazy-loaded pages (Super Admin only)
import { lazy, Suspense } from 'react';
import Loading from '../components/ui/Loading';

const ManajemenUser = lazy(() => import('../pages/ManajemenUser/ManajemenUser'));
const ActivityLog = lazy(() => import('../pages/ActivityLog/ActivityLog'));
const Settings = lazy(() => import('../pages/Settings/Settings'));

// Redirect berdasarkan role setelah login
const HomeRedirect = () => {
  const { isSuperAdmin, isAdmin, isPegawai } = useAuth();
  
  if (isSuperAdmin || isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  // Pegawai diarahkan ke Peminjaman
  return <Navigate to="/peminjaman" replace />;
};

const SuspenseWrapper = ({ children }) => (
  <Suspense fallback={<Loading fullPage text="Memuat halaman..." />}>
    {children}
  </Suspense>
);

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Root redirect: berdasarkan role */}
        <Route index element={<HomeRedirect />} />

        {/* ========== SUPER ADMIN & ADMIN PAGES ========== */}
        
        {/* Dashboard Admin — admin & super_admin */}
        <Route path="dashboard" element={<ProtectedRoute requireAdmin><Dashboard /></ProtectedRoute>} />

        {/* Manajemen User — Super Admin only */}
        <Route path="manajemen-user" element={
          <ProtectedRoute requireSuperAdmin>
            <SuspenseWrapper><ManajemenUser /></SuspenseWrapper>
          </ProtectedRoute>
        } />

        {/* Kategori — admin & super_admin */}
        <Route path="kategori" element={<ProtectedRoute requireAdmin><Kategori /></ProtectedRoute>} />

        {/* Kelola Lokasi — admin & super_admin */}
        <Route path="lokasi" element={<ProtectedRoute requireAdmin><Lokasi /></ProtectedRoute>} />

        {/* Pegawai — admin & super_admin */}
        <Route path="pegawai" element={<ProtectedRoute requireAdmin><Pegawai /></ProtectedRoute>} />

        {/* Barang — admin & super_admin */}
        <Route path="barang" element={<ProtectedRoute requireAdmin><Barang /></ProtectedRoute>} />

        {/* ========== SHARED PAGES ========== */}
        
        {/* Peminjaman — semua role */}
        <Route path="peminjaman" element={<Peminjaman />} />
        
        {/* Pengembalian — admin & pegawai */}
        <Route path="pengembalian" element={<ProtectedRoute><Pengembalian /></ProtectedRoute>} />
        
        {/* Riwayat — semua role */}
        <Route path="riwayat" element={<ProtectedRoute><Riwayat /></ProtectedRoute>} />

        {/* Activity Log — Super Admin only */}
        <Route path="activity-log" element={
          <ProtectedRoute requireSuperAdmin>
            <SuspenseWrapper><ActivityLog /></SuspenseWrapper>
          </ProtectedRoute>
        } />

        {/* System Settings — Super Admin only */}
        <Route path="settings" element={
          <ProtectedRoute requireSuperAdmin>
            <SuspenseWrapper><Settings /></SuspenseWrapper>
          </ProtectedRoute>
        } />

        {/* Profil — semua role */}
        <Route path="profil" element={<ProtectedRoute><Profil /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;