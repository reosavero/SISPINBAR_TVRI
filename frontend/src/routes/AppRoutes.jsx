// ============================================
// APP ROUTES - Sistem Peminjaman Barang TVRI
// ============================================

import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import ProtectedRoute from './ProtectedRoute';

// Pages
import Login from '../pages/Login/Login';
import Dashboard from '../pages/Dashboard/Dashboard';
import Kategori from '../pages/Kategori/Kategori';
import Pegawai from '../pages/Pegawai/Pegawai';
import Peminjaman from '../pages/Peminjaman/Peminjaman';
import Pengembalian from '../pages/Pengembalian/Pengembalian';
import Riwayat from '../pages/Riwayat/Riwayat';
import Profil from '../pages/Profil/Profil';

// Redirect berdasarkan role setelah login
const HomeRedirect = () => {
  const { isAdmin } = (() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return { isAdmin: user?.role === 'admin' };
    } catch {
      return { isAdmin: false };
    }
  })();

  return <Navigate to={isAdmin ? '/dashboard' : '/peminjaman'} replace />;
};

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
        {/* Root redirect: admin → Dashboard, pegawai → Peminjaman */}
        <Route index element={<HomeRedirect />} />

        {/* Dashboard — admin only, pegawai diarahkan ke /peminjaman */}
        <Route path="dashboard" element={<ProtectedRoute requireAdmin><Dashboard /></ProtectedRoute>} />

        {/* Admin only pages */}
        <Route path="kategori" element={<ProtectedRoute requireAdmin><Kategori /></ProtectedRoute>} />
        <Route path="pegawai" element={<ProtectedRoute requireAdmin><Pegawai /></ProtectedRoute>} />

        {/* Shared pages (data filtered by role on backend) */}
        <Route path="peminjaman" element={<Peminjaman />} />
        <Route path="pengembalian" element={<Pengembalian />} />
        <Route path="riwayat" element={<Riwayat />} />
        <Route path="profil" element={<Profil />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;