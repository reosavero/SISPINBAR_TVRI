// ============================================
// PROTECTED ROUTE COMPONENT
// Updated: Super Admin Role System (3 roles)
// ============================================

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/ui/Loading';

const ProtectedRoute = ({ children, requireAdmin = false, requireSuperAdmin = false, roles = [] }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <Loading fullPage text="Memuat..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Jika route memerlukan role super_admin dan user bukan super_admin
  if (requireSuperAdmin && user?.role !== 'super_admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // Jika route memerlukan role admin atau lebih tinggi
  if (requireAdmin && !['super_admin', 'admin'].includes(user?.role)) {
    // Pegawai diarahkan ke halaman Peminjaman
    return <Navigate to="/peminjaman" replace />;
  }

  // Jika route memerlukan specific roles
  if (roles.length > 0 && !roles.includes(user?.role)) {
    // Redirect berdasarkan role
    if (user?.role === 'super_admin' || user?.role === 'admin') {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/peminjaman" replace />;
  }

  return children;
};

export default ProtectedRoute;