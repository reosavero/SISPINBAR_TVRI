// ============================================
// API SERVICE - Sistem Peminjaman Barang TVRI
// ============================================

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach token dari sessionStorage
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ERR_CANCELED' || error.code === 'ECONNABORTED' || error.name === 'CanceledError') {
      // Request dibatalkan secara sengaja (AbortController) — bukan error
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      // Hanya dispatch event jika memang sedang logged-in (bukan saat proses logout)
      const isLoggingOut = !sessionStorage.getItem('token');
      if (!isLoggingOut) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        window.dispatchEvent(new Event('auth-expired'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;