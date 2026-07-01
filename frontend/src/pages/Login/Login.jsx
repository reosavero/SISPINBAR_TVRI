// ============================================
// LOGIN PAGE - Sistem Peminjaman Barang TVRI
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiLock, FiEye, FiEyeOff, FiTv, FiArrowLeft, FiPhone, FiMessageCircle } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { APP_NAME, APP_FULL_NAME, APP_ORGANIZATION } from '../../utils/constants';
import toast from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirect jika sudah login
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(isAdmin ? '/dashboard' : '/peminjaman', { replace: true });
    }
  }, [isAuthenticated, isAdmin, authLoading, navigate]);

  // Forgot password state
  const [view, setView] = useState('login'); // login | forgot

  // ========== LOGIN ==========
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Username dan password harus diisi');
      return;
    }
    setLoading(true);
    try {
      const result = await login(username, password);
      if (result.success) {
        toast.success('Login berhasil!');
        // Pegawai langsung ke Peminjaman, Admin ke Dashboard
        const role = result.role || (result.user?.role);
        navigate(role === 'admin' ? '/dashboard' : '/peminjaman');
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      toast.error('Terjadi kesalahan koneksi');
    }
    setLoading(false);
  };

  // ========== KONTAK ADMIN ==========
  const ADMIN_PHONE = '082174948586';
  const ADMIN_PHONE_FORMATTED = '0821-7494-8586';
  const ADMIN_WA_LINK = `https://wa.me/6282174948586?text=${encodeURIComponent('Halo Admin, saya lupa password akun SISPINBAR. Mohon bantuan untuk reset password.')}`;

  // ========== SHARED COMPONENTS ==========
  const renderLogo = () => (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="text-center mb-8"
    >
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-xl mb-4">
        <FiTv className="w-8 h-8 text-white" />
      </div>
      <h1 className="text-2xl font-bold text-white">{APP_NAME}</h1>
      <p className="text-white/70 text-sm mt-1">{APP_FULL_NAME}</p>
      <p className="text-white/50 text-xs mt-0.5">{APP_ORGANIZATION}</p>
    </motion.div>
  );

  // ========== VIEW: LOGIN ==========
  const renderLogin = () => (
    <motion.div
      key="login"
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      transition={{ duration: 0.3 }}
      className="glass-card-strong p-5 sm:p-8 shadow-2xl"
    >
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Masuk ke Akun</h2>
        <p className="text-sm text-gray-500 mt-1">Silakan masuk untuk melanjutkan</p>
      </div>

      <form onSubmit={handleLogin}>
        {/* Username */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
          <div className="relative">
            <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
              className="input-field pl-10"
              required
              autoComplete="username"
            />
          </div>
        </div>

        {/* Password */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
          <div className="relative">
            <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              className="input-field pl-10 pr-10"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Lupa Password */}
        <div className="flex justify-end mb-6">
          <button
            type="button"
            onClick={() => setView('forgot')}
            className="text-sm text-[#005BAC] hover:underline font-medium"
          >
            Lupa password?
          </button>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[#005BAC] to-[#003B71] hover:from-[#006CC4] hover:to-[#004A8F] transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Memproses...
            </span>
          ) : (
            'Masuk'
          )}
        </button>
      </form>

      <div className="mt-4 p-3 bg-blue-50 rounded-xl text-center">
        <p className="text-xs text-gray-500">
          Hubungi admin untuk mendaftarkan akun baru
        </p>
      </div>
    </motion.div>
  );

  // ========== VIEW: HUBUNGI ADMIN ==========
  const renderForgot = () => (
    <motion.div
      key="forgot"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.3 }}
      className="glass-card-strong p-5 sm:p-8 shadow-2xl"
    >
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-[#005BAC] to-[#003B71] flex items-center justify-center mx-auto mb-4 shadow-lg"
        >
          <FiPhone className="w-7 h-7 text-white" />
        </motion.div>
        <h2 className="text-xl font-bold text-gray-800">Lupa Password?</h2>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
          Jangan khawatir! Silakan hubungi Admin untuk mereset password akun Anda.
        </p>
      </div>

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-br from-[#005BAC]/5 to-[#003B71]/5 border border-[#005BAC]/20 rounded-2xl p-5 mb-6"
      >
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-3">Hubungi Admin melalui:</p>
          
          {/* Phone Number Display */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <FiPhone className="w-5 h-5 text-[#005BAC]" />
            <a
              href={`tel:+62${ADMIN_PHONE.substring(1)}`}
              className="text-xl sm:text-2xl font-bold text-[#005BAC] hover:text-[#003B71] transition-colors tracking-wider"
            >
              {ADMIN_PHONE_FORMATTED}
            </a>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={`tel:+62${ADMIN_PHONE.substring(1)}`}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-[#005BAC] to-[#003B71] hover:from-[#006CC4] hover:to-[#004A8F] transition-all shadow-md hover:shadow-lg text-sm"
            >
              <FiPhone className="w-4 h-4" />
              Telepon
            </a>
            <a
              href={ADMIN_WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#2BE882] hover:to-[#14A085] transition-all shadow-md hover:shadow-lg text-sm"
            >
              <FiMessageCircle className="w-4 h-4" />
              WhatsApp
            </a>
          </div>
        </div>
      </motion.div>

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-6"
      >
        <p className="text-xs text-amber-700 leading-relaxed">
          <span className="font-semibold">💡 Tips:</span> Admin dapat membantu Anda mereset password agar bisa login kembali ke sistem SISPINBAR.
        </p>
      </motion.div>

      <button
        type="button"
        onClick={() => setView('login')}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-colors"
      >
        <FiArrowLeft className="w-4 h-4" />
        Kembali ke halaman login
      </button>
    </motion.div>
  );

  // Jika auth masih loading, tampilkan loading screen
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#003B71] via-[#005BAC] to-[#0077D6]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70 text-sm">Memuat...</p>
        </div>
      </div>
    );
  }

  // Jika sudah login, jangan render halaman login (akan di-redirect oleh useEffect)
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#003B71] via-[#005BAC] to-[#0077D6]">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute top-20 right-20 w-2 h-2 bg-white/30 rounded-full" />
        <div className="absolute top-40 left-1/4 w-3 h-3 bg-white/20 rounded-full" />
        <div className="absolute bottom-32 left-20 w-2 h-2 bg-white/20 rounded-full" />
        <div className="absolute bottom-1/4 right-1/3 w-4 h-4 bg-white/10 rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md mx-4 sm:mx-auto"
      >
        {renderLogo()}

        <AnimatePresence mode="wait">
          {view === 'login' && renderLogin()}
          {view === 'forgot' && renderForgot()}
        </AnimatePresence>

        {/* Footer */}
        <p className="text-center text-white/40 text-xs mt-6">
          © 2024 {APP_ORGANIZATION}. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
};

export default Login;