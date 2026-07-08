// ============================================
// AUTH CONTEXT - Sistem Peminjaman Barang TVRI
// Updated: Super Admin Role System (3 roles)
// ============================================
// Menggunakan sessionStorage agar session otomatis hilang
// saat browser ditutup atau tab baru dibuka (harus login ulang)

import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verifikasi token saat app pertama kali load
  useEffect(() => {
    const verifyAuth = async () => {
      const token = sessionStorage.getItem('token');
      const savedUser = sessionStorage.getItem('user');

      if (!token || !savedUser) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        setUser(null);
        setLoading(false);
        return;
      }

      // Ada token → coba parse user data sementara
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser); // Set sementara agar loading screen tidak terlalu lama
      } catch {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        setUser(null);
        setLoading(false);
        return;
      }

      // Verifikasi token ke backend
      try {
        const res = await api.get('/auth/profile');
        if (res.data.success) {
          const userData = res.data.data;
          setUser(userData);
          sessionStorage.setItem('user', JSON.stringify(userData));
        } else {
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
          setUser(null);
        }
      } catch (err) {
        const status = err.response?.status;
        if (status === 401 || status === 403) {
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
          setUser(null);
        } else {
          // Server tidak bisa dijangkau → Token tidak bisa diverifikasi, hapus session
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, []);

  // Listen untuk event auth-expired dari API interceptor
  useEffect(() => {
    const handleAuthExpired = () => {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      setUser(null);
    };

    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, []);

  // Fetch fresh profile from server
  const refreshProfile = async () => {
    try {
      const res = await api.get('/auth/profile');
      if (res.data.success) {
        const userData = res.data.data;
        setUser(userData);
        sessionStorage.setItem('user', JSON.stringify(userData));
        return userData;
      }
    } catch {
      // Silently fail — keep existing user data
    }
    return null;
  };

  // Login menggunakan username (bukan email)
  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      const { token, user: userData } = response.data.data;
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return { success: true, role: userData.role, user: userData };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login gagal',
      };
    }
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setUser(null);
  };

  const updateAvatar = (avatarPath) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, avatar: avatarPath };
      sessionStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  const isAuthenticated = !!user;

  // ========== Role Checks ==========
  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isPegawai = user?.role === 'pegawai';

  // Specific role name for display
  const roleName = user?.role === 'super_admin' ? 'Super Admin'
    : user?.role === 'admin' ? 'Admin'
    : user?.role === 'pegawai' ? 'Pegawai'
    : '';

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated,
    isSuperAdmin,
    isAdmin,
    isPegawai,
    roleName,
    refreshProfile,
    updateAvatar,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;