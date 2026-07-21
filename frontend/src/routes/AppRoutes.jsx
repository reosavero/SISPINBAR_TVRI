

import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../context/AuthContext';

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
import KategoriUser from '../pages/KategoriUser/KategoriUser';

import { lazy, Suspense } from 'react';
import Loading from '../components/ui/Loading';

const ManajemenUser = lazy(() => import('../pages/ManajemenUser/ManajemenUser'));
const ActivityLog = lazy(() => import('../pages/ActivityLog/ActivityLog'));
const Settings = lazy(() => import('../pages/Settings/Settings'));

const HomeRedirect = () => {
  const { isSuperAdmin, isAdmin, isPegawai } = useAuth();
  
  if (isSuperAdmin || isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
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
        {
}
        <Route index element={<HomeRedirect />} />

        {
}
        
        {
}
        <Route path="dashboard" element={<ProtectedRoute requireAdmin><Dashboard /></ProtectedRoute>} />

        {
}
        <Route path="manajemen-user" element={
          <ProtectedRoute requireSuperAdmin>
            <SuspenseWrapper><ManajemenUser /></SuspenseWrapper>
          </ProtectedRoute>
        } />

        {
}
        <Route path="kategori" element={<ProtectedRoute requireAdmin><Kategori /></ProtectedRoute>} />

        {
}
        <Route path="lokasi" element={<ProtectedRoute requireAdmin><Lokasi /></ProtectedRoute>} />

        {
}
        <Route path="kategori-user" element={<ProtectedRoute requireAdmin><KategoriUser /></ProtectedRoute>} />

        {
}
        <Route path="pegawai" element={<ProtectedRoute requireAdmin><Pegawai /></ProtectedRoute>} />

        {
}
        <Route path="barang" element={<ProtectedRoute requireAdmin><Barang /></ProtectedRoute>} />

        {
}
        
        {
}
        <Route path="peminjaman" element={<Peminjaman />} />
        
        {
}
        <Route path="pengembalian" element={<ProtectedRoute><Pengembalian /></ProtectedRoute>} />
        
        {
}
        <Route path="riwayat" element={<ProtectedRoute><Riwayat /></ProtectedRoute>} />

        {
}
        <Route path="activity-log" element={
          <ProtectedRoute requireSuperAdmin>
            <SuspenseWrapper><ActivityLog /></SuspenseWrapper>
          </ProtectedRoute>
        } />

        {
}
        <Route path="settings" element={
          <ProtectedRoute requireSuperAdmin>
            <SuspenseWrapper><Settings /></SuspenseWrapper>
          </ProtectedRoute>
        } />

        {
}
        <Route path="profil" element={<ProtectedRoute><Profil /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;