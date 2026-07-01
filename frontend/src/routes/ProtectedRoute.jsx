// ============================================
// PROTECTED ROUTE COMPONENT
// ============================================

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/ui/Loading';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, loading, isAdmin } = useAuth();

  if (loading) {
    return <Loading fullPage text="Memuat..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Jika route memerlukan role admin dan user bukan admin
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;