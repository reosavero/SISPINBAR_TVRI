

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

  
  if (requireSuperAdmin && user?.role !== 'super_admin') {
    return <Navigate to="/dashboard" replace />;
  }

  
  if (requireAdmin && !['super_admin', 'admin'].includes(user?.role)) {
    
    return <Navigate to="/peminjaman" replace />;
  }

  
  if (roles.length > 0 && !roles.includes(user?.role)) {
    
    if (user?.role === 'super_admin' || user?.role === 'admin') {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/peminjaman" replace />;
  }

  return children;
};

export default ProtectedRoute;