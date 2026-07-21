

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiLock, FiEye, FiEyeOff, FiArrowLeft, FiPhone, FiMessageCircle, FiCheckCircle, FiMail, FiSend, FiRefreshCw, FiShield } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { APP_NAME, APP_FULL_NAME, APP_ORGANIZATION } from '../../utils/constants';
import { useMasterData } from '../../context/MasterDataContext';
import logoTvri from '../../assets/logo-tvri.svg';
import toast from 'react-hot-toast';
import api from '../../services/api';
import DropdownSelect from '../../components/ui/DropdownSelect';

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isSuperAdmin, isAdmin, loading: authLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { jabatanList, divisiList } = useMasterData();

  
  const [regForm, setRegForm] = useState({
    nama: '', nip: '', jabatan: '', divisi: '', email: '', nomor_hp: '', username: '', password: '',
  });
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regStep, setRegStep] = useState(1); 
  const [regErrors, setRegErrors] = useState({});
  const [regSuccess, setRegSuccess] = useState(false);
  const [emailVerifying, setEmailVerifying] = useState(false);
  const [emailVerified, setEmailVerified] = useState(null); 

  
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState('');

  
  const [view, setView] = useState('login'); 

  
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      if (isSuperAdmin || isAdmin) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/peminjaman', { replace: true });
      }
    }
  }, [isAuthenticated, isAdmin, authLoading, navigate]);

  
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Username dan password harus diisi');
      return;
    }
    setLoading(true);
    try {
      const result = await login(username.trim(), password);
      if (result.success) {
        toast.success('Login berhasil!');
        if (result.role === 'super_admin' || result.role === 'admin') {
          navigate('/dashboard');
        } else {
          navigate('/peminjaman');
        }
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      toast.error('Terjadi kesalahan koneksi');
    }
    setLoading(false);
  };

  
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!otpVerified) {
      toast.error('Email belum diverifikasi. Silakan verifikasi email Anda terlebih dahulu.');
      setRegStep(2);
      return;
    }
    const f = regForm;
    if (!f.nama || !f.nip || !f.username || !f.password) {
      toast.error('Nama, NIP, Username, dan Password wajib diisi');
      return;
    }
    if (f.password.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }
    if (f.username.length < 3) {
      toast.error('Username minimal 3 karakter');
      return;
    }
    setRegLoading(true);
    try {
      await api.post('/auth/register', f);
      setRegSuccess(true);
      setView('success');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mendaftar. Silakan coba lagi.');
    }
    setRegLoading(false);
  };

  const validateStep1 = () => {
    const errors = {};
    if (!regForm.nip.trim()) errors.nip = 'NIP wajib diisi';
    if (!regForm.nama.trim()) errors.nama = 'Nama wajib diisi';
    if (!regForm.email.trim()) {
      errors.email = 'Email wajib diisi';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regForm.email.trim())) {
      errors.email = 'Format email tidak valid';
    } else if (emailVerified === false) {
      errors.email = regErrors.email || 'Email tidak valid atau tidak dapat menerima pesan';
    }
    setRegErrors(errors);
    return Object.keys(errors).length === 0;
  };

  
  const handleEmailBlur = async () => {
    const email = regForm.email.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailVerified(null);
      return;
    }

    setEmailVerifying(true);
    setEmailVerified(null);
    try {
      const res = await api.post('/auth/verify-email', { email });
      if (res.data.success) {
        const result = res.data.data;
        if (result.valid) {
          setEmailVerified(true);
          setRegErrors(prev => ({ ...prev, email: '' }));
        } else {
          setEmailVerified(false);
          setRegErrors(prev => ({ ...prev, email: result.reason }));
        }
      }
    } catch (err) {
      
      setEmailVerified(null);
    } finally {
      setEmailVerifying(false);
    }
  };

  const handleEmailChange = (value) => {
    setRegForm({ ...regForm, email: value });
    
    if (emailVerified !== null) {
      setEmailVerified(null);
      setRegErrors(prev => ({ ...prev, email: '' }));
    }
    
    if (otpSent) {
      setOtpSent(false);
      setOtpVerified(false);
      setOtpCode('');
      setOtpError('');
    }
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setRegStep(2);
      setRegErrors({});
      
      if (!otpSent) {
        handleSendOtp();
      }
    }
  };

  
  const handleSendOtp = async () => {
    setOtpLoading(true);
    setOtpError('');
    try {
      const res = await api.post('/auth/send-otp', { email: regForm.email.trim() });
      if (res.data.success) {
        setOtpSent(true);
        setOtpVerified(false);
        setOtpCode('');
        toast.success('Kode verifikasi telah dikirim ke email Anda');
        
        setOtpCooldown(60);
        const timer = setInterval(() => {
          setOtpCooldown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Gagal mengirim kode verifikasi');
    }
    setOtpLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setOtpError('Masukkan 6 digit kode verifikasi');
      return;
    }
    setOtpVerifying(true);
    setOtpError('');
    try {
      const res = await api.post('/auth/verify-otp', { email: regForm.email.trim(), otp: otpCode });
      if (res.data.success) {
        setOtpVerified(true);
        toast.success('Email berhasil diverifikasi!');
      }
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Kode verifikasi salah');
    }
    setOtpVerifying(false);
  };

  const resetOtpState = () => {
    setOtpSent(false);
    setOtpVerified(false);
    setOtpCode('');
    setOtpError('');
    setOtpCooldown(0);
  };

  
  const ADMIN_PHONE = '082174948586';
  const ADMIN_PHONE_FORMATTED = '0821-7494-8586';
  const ADMIN_WA_LINK = `https://wa.me/6282174948586?text=${encodeURIComponent('Halo Admin, saya lupa password akun SISPINBAR. Mohon bantuan untuk reset password.')}`;

  
  const renderLogo = () => (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="text-center mb-8"
    >
      <img
        src={logoTvri}
        alt="Logo TVRI"
        className="w-20 h-20 mx-auto mb-4 object-contain drop-shadow-lg"
      />
      <h1 className="text-2xl font-bold text-white">{APP_NAME}</h1>
      <p className="text-white/70 text-sm mt-1">{APP_FULL_NAME}</p>
      <p className="text-white/50 text-xs mt-0.5">{APP_ORGANIZATION}</p>
    </motion.div>
  );

  
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

        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => setView('forgot')}
            className="text-sm text-[#005BAC] hover:underline font-medium"
          >
            Lupa password?
          </button>
          <button
            type="button"
            onClick={() => { setRegSuccess(false); setRegStep(1); setRegErrors({}); setView('register'); }}
            className="text-sm text-[#005BAC] hover:underline font-medium"
          >
            Buat akun
          </button>
        </div>

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
          ) : 'Masuk'}
        </button>
      </form>
    </motion.div>
  );

  
  const renderRegister = () => (
    <motion.div
      key="register"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.3 }}
      className="glass-card-strong p-5 sm:p-8 shadow-2xl">
            <div className="text-center mb-5">
        <h2 className="text-xl font-bold text-gray-800">Buat Akun Pegawai</h2>
        <p className="text-sm text-gray-500 mt-1">{regStep === 1 ? 'Lengkapi data pegawai Anda' : regStep === 2 ? 'Verifikasi email Anda' : 'Buat username dan password'}</p>
      </div>

      {
}
      <div className="flex items-center justify-center gap-2 mb-6">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${regStep >= 2 ? 'bg-emerald-100 text-emerald-700' : 'bg-[#005BAC] text-white'}`}>
          {regStep > 1 && <FiCheckCircle className="w-3.5 h-3.5" />}
          <span>1. Data</span>
        </div>
        <div className={`w-6 h-0.5 ${regStep >= 2 ? 'bg-emerald-400' : 'bg-gray-200'}`} />
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${regStep === 2 ? 'bg-[#005BAC] text-white' : regStep >= 3 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
          {regStep >= 3 && <FiCheckCircle className="w-3.5 h-3.5" />}
          <span>2. Verifikasi</span>
        </div>
        <div className={`w-6 h-0.5 ${regStep >= 3 ? 'bg-emerald-400' : 'bg-gray-200'}`} />
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${regStep === 3 ? 'bg-[#005BAC] text-white' : 'bg-gray-100 text-gray-400'}`}>
          <span>3. Akun</span>
        </div>
      </div>

      {regStep === 1 ? (
        

        <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">NIP <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={regForm.nip}
                onChange={(e) => { setRegForm({ ...regForm, nip: e.target.value }); setRegErrors({ ...regErrors, nip: '' }); }}
                placeholder="Masukkan NIP"
                className={`input-field ${regErrors.nip ? 'border-red-400 focus:border-red-500' : ''}`}
              />
              {regErrors.nip && <p className="text-xs text-red-500 mt-1">{regErrors.nip}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Lengkap <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={regForm.nama}
                onChange={(e) => { setRegForm({ ...regForm, nama: e.target.value }); setRegErrors({ ...regErrors, nama: '' }); }}
                placeholder="Masukkan nama lengkap"
                className={`input-field ${regErrors.nama ? 'border-red-400 focus:border-red-500' : ''}`}
              />
              {regErrors.nama && <p className="text-xs text-red-500 mt-1">{regErrors.nama}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Jabatan</label>
                <DropdownSelect
                  value={regForm.jabatan}
                  onChange={(e) => setRegForm({ ...regForm, jabatan: e.target.value })}
                  options={jabatanList.map(j => ({ value: j, label: j }))}
                  placeholder="Pilih jabatan"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Divisi</label>
                <DropdownSelect
                  value={regForm.divisi}
                  onChange={(e) => setRegForm({ ...regForm, divisi: e.target.value })}
                  options={divisiList.map(d => ({ value: d, label: d }))}
                  placeholder="Pilih divisi"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email <span className="text-red-500">*</span></label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="email"
                  value={regForm.email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  onBlur={handleEmailBlur}
                  placeholder="email@gmail.com"
                  className={`input-field pl-10 pr-10 ${regErrors.email ? 'border-red-400 focus:border-red-500' : emailVerified ? 'border-green-400 focus:border-green-500' : ''}`}
                  required
                />
                {emailVerifying && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {!emailVerifying && emailVerified && (
                  <FiCheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 w-4 h-4" />
                )}
              </div>
              {regErrors.email && <p className="text-xs text-red-500 mt-1">{regErrors.email}</p>}
              {!regErrors.email && emailVerified && !emailVerifying && (
                <p className="text-xs text-green-600 mt-1">Email valid &amp; dapat menerima notifikasi</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">No. HP</label>
              <div className="relative">
                <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={regForm.nomor_hp}
                  onChange={(e) => setRegForm({ ...regForm, nomor_hp: e.target.value })}
                  placeholder="08xxxxxxxxxx"
                  className="input-field pl-10"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={emailVerifying || emailVerified === false}
            className={`w-full py-3 rounded-xl font-semibold text-white transition-all shadow-lg mt-6 ${
              emailVerifying || emailVerified === false
                ? 'bg-gray-400 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-[#005BAC] to-[#003B71] hover:from-[#006CC4] hover:to-[#004A8F] hover:shadow-xl'
            }`}
          >
            {emailVerifying ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Memverifikasi email...
              </span>
            ) : (
              'Selanjutnya'
            )}
          </button>

          <button
            type="button"
            onClick={() => { setView('login'); resetOtpState(); setEmailVerified(null); setEmailVerifying(false); }}
            className="w-full py-3 rounded-xl font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all mt-2 flex items-center justify-center gap-2"
          >
            <FiArrowLeft className="w-4 h-4" />
            Kembali ke Halaman Login
          </button>
        </form>
      ) : regStep === 2 ? (
        

        <div className="space-y-4">
          {
}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <FiMail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-blue-800">Verifikasi Email</p>
                <p className="text-xs text-blue-600 mt-1">
                  Kode verifikasi 6 digit telah dikirim ke:
                </p>
                <p className="text-sm font-bold text-blue-800 mt-1 break-all">
                  {regForm.email}
                </p>
              </div>
            </div>
          </div>

          {
}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <div className="flex items-start gap-2">
              <span className="text-base leading-none mt-0.5">⚠️</span>
              <p className="text-xs text-amber-800 leading-relaxed">
                <strong>Tidak menerima kode?</strong> Cek folder <strong>Spam</strong> di email Anda. Email dari sistem sering masuk ke folder spam.
              </p>
            </div>
          </div>

          {
}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Kode Verifikasi</label>
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <input
                  key={i}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={otpCode[i] || ''}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    if (val) {
                      const newOtp = otpCode.split('');
                      newOtp[i] = val[val.length - 1];
                      setOtpCode(newOtp.join(''));
                      setOtpError('');
                      
                      if (i < 5) {
                        const nextInput = e.target.parentElement?.children?.[i + 1];
                        if (nextInput) nextInput.focus();
                      }
                    } else {
                      const newOtp = otpCode.split('');
                      newOtp[i] = '';
                      setOtpCode(newOtp.join(''));
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !otpCode[i] && i > 0) {
                      const prevInput = e.target.parentElement?.children?.[i - 1];
                      if (prevInput) prevInput.focus();
                    }
                  }}
                  disabled={otpVerified}
                  className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 focus:outline-none focus:ring-2 transition-all ${
                    otpVerified ? 'border-emerald-400 bg-emerald-50 text-emerald-700' :
                    otpError ? 'border-red-300 bg-red-50 text-red-700' :
                    otpCode[i] ? 'border-[#005BAC] bg-blue-50 text-[#005BAC]' :
                    'border-gray-200 bg-white text-gray-700'
                  }`}
                />
              ))}
            </div>
            {otpError && <p className="text-xs text-red-500 mt-2">{otpError}</p>}
            {otpVerified && <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1"><FiCheckCircle className="w-3.5 h-3.5" /> Email berhasil diverifikasi</p>}
          </div>

          {
}
          {!otpVerified ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={otpCode.length !== 6 || otpVerifying}
                className={`w-full py-3 rounded-xl font-semibold transition-all shadow-lg ${
                  otpCode.length !== 6 || otpVerifying
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-[#005BAC] to-[#003B71] text-white hover:from-[#006CC4] hover:to-[#004A8F] hover:shadow-xl'
                }`}
              >
                {otpVerifying ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Memverifikasi...
                  </span>
                ) : 'Verifikasi Kode'}
              </button>

              <div className="text-center">
                {!otpSent ? (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpLoading}
                    className="text-sm text-[#005BAC] hover:underline font-medium disabled:opacity-50"
                  >
                    {otpLoading ? 'Mengirim...' : 'Kirim Kode Verifikasi'}
                  </button>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xs text-gray-500">Tidak menerima kode?</span>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={otpCooldown > 0 || otpLoading}
                      className="text-xs text-[#005BAC] hover:underline font-medium disabled:opacity-50 disabled:no-underline"
                    >
                      {otpCooldown > 0 ? `Kirim ulang (${otpCooldown}s)` : otpLoading ? 'Mengirim...' : 'Kirim ulang'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => { setRegStep(3); setRegErrors({}); }}
              className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[#005BAC] to-[#003B71] hover:from-[#006CC4] hover:to-[#004A8F] transition-all shadow-lg hover:shadow-xl"
            >
              Lanjutkan
            </button>
          )}

          <button
            type="button"
            onClick={() => { setRegStep(1); resetOtpState(); }}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-colors mt-2"
          >
            <FiArrowLeft className="w-4 h-4" />
            Kembali
          </button>
        </div>
      ) : (
        

        <form onSubmit={handleRegister}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Username <span className="text-red-500">*</span></label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={regForm.username}
                  onChange={(e) => setRegForm({ ...regForm, username: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '') })}
                  placeholder="Minimal 3 karakter"
                  className="input-field pl-10"
                  required
                  minLength={3}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  value={regForm.password}
                  onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                  placeholder="Minimal 6 karakter"
                  className="input-field pl-10 pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showRegPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs text-amber-700">
                <span className="font-semibold">⚠️ Perhatian:</span> Akun memerlukan persetujuan admin sebelum dapat digunakan.
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={() => setRegStep(2)}
              className="flex-1 py-3 rounded-xl font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all"
            >
              Kembali
            </button>
            <button
              type="submit"
              disabled={regLoading}
              className="flex-1 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[#005BAC] to-[#003B71] hover:from-[#006CC4] hover:to-[#004A8F] transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {regLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Mendaftar...
                </span>
              ) : 'Konfirmasi'}
            </button>
          </div>
        </form>
      )}
    </motion.div>
  );

  
  const renderSuccess = () => (
    <motion.div
      key="success"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="glass-card-strong p-5 sm:p-8 shadow-2xl text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5"
      >
        <FiCheckCircle className="w-10 h-10 text-emerald-600" />
      </motion.div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">Registrasi Berhasil!</h2>
      <p className="text-sm text-gray-600 mb-4 leading-relaxed">
        Akun Anda telah didaftarkan dan sedang <strong>menunggu persetujuan admin</strong>.
        Notifikasi akan dikirim ke email Anda ketika akun disetujui atau ditolak.
      </p>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5">
        <div className="flex items-start gap-2">
          <span className="text-base leading-none mt-0.5">⚠️</span>
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>Penting:</strong> Cek folder <strong>Spam</strong> di email Anda untuk menemukan notifikasi persetujuan akun. Email dari sistem sering masuk ke folder spam.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => { setView('login'); setRegSuccess(false); setRegForm({ nama: '', nip: '', jabatan: '', divisi: '', email: '', nomor_hp: '', username: '', password: '' }); setRegStep(1); setRegErrors({}); setEmailVerified(null); setEmailVerifying(false); resetOtpState(); }}
        className="w-full py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-[#005BAC] to-[#003B71] hover:from-[#006CC4] hover:to-[#004A8F] transition-all shadow-lg hover:shadow-xl"
      >
        Kembali ke Halaman Login
      </button>
    </motion.div>
  );

  
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

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-br from-[#005BAC]/5 to-[#003B71]/5 border border-[#005BAC]/20 rounded-2xl p-5 mb-6"
      >
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-3">Hubungi Admin melalui:</p>
          <div className="flex items-center justify-center gap-2 mb-4">
            <FiPhone className="w-5 h-5 text-[#005BAC]" />
            <a href={`tel:+62${ADMIN_PHONE.substring(1)}`} className="text-xl sm:text-2xl font-bold text-[#005BAC] hover:text-[#003B71] transition-colors tracking-wider">
              {ADMIN_PHONE_FORMATTED}
            </a>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <a href={`tel:+62${ADMIN_PHONE.substring(1)}`} className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-[#005BAC] to-[#003B71] hover:from-[#006CC4] hover:to-[#004A8F] transition-all shadow-md hover:shadow-lg text-sm">
              <FiPhone className="w-4 h-4" /> Telepon
            </a>
            <a href={ADMIN_WA_LINK} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#2BE882] hover:to-[#14A085] transition-all shadow-md hover:shadow-lg text-sm">
              <FiMessageCircle className="w-4 h-4" /> WhatsApp
            </a>
          </div>
        </div>
      </motion.div>

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
        className="w-full py-3 rounded-xl font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
      >
        <FiArrowLeft className="w-4 h-4" />
        Kembali ke Halaman Login
      </button>
    </motion.div>
  );

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

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#003B71] via-[#005BAC] to-[#0077D6]">
      {
}
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
          {view === 'register' && renderRegister()}
          {view === 'success' && renderSuccess()}
        </AnimatePresence>

        <p className="text-center text-white/40 text-xs mt-6">
          © 2024 {APP_ORGANIZATION}. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
};

export default Login;