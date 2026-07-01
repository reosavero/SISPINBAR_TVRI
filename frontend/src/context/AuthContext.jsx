// ============================================
// AUTH CONTEXT - Sistem Peminjaman Barang TVRI
// ============================================

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
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (!token || !savedUser) {
        // Tidak ada session → pastikan bersih
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setLoading(false);
        return;
      }

      // Ada token → coba parse user data sementara
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser); // Set sementara agar loading screen tidak terlalu lama
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setLoading(false);
        return;
      }

      // Verifikasi token ke backend
      try {
        const res = await api.get('/auth/profile');
        if (res.data.success) {
          // Token valid → update user data terbaru dari server
          const userData = res.data.data;
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } else {
          // Response tidak sukses → hapus session
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      } catch (err) {
        const status = err.response?.status;
        if (status === 401 || status === 403) {
          // Token expired / invalid → hapus session
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
        // Jika server error (500, network error) → tetap pakai data localStorage
        // User bisa tetap menggunakan app, nanti dicoba lagi
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, []);

  // Listen untuk event auth-expired dari API interceptor
  useEffect(() => {
    const handleAuthExpired = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
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
        localStorage.setItem('user', JSON.stringify(userData));
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
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateAvatar = (avatarPath) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, avatar: avatarPath };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';
  const isPegawai = !!user?.pegawai_id;

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated,
    isAdmin,
    isPegawai,
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