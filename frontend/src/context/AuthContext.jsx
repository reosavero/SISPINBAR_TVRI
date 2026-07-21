

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

      
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser); 
      } catch {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        setUser(null);
        setLoading(false);
        return;
      }

      
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

  
  useEffect(() => {
    const handleAuthExpired = () => {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      setUser(null);
    };

    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, []);

  
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
      
    }
    return null;
  };

  
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

  
  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isPegawai = user?.role === 'pegawai';

  
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