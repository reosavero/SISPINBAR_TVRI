// ============================================
// PROFIL PAGE - Sistem Peminjaman Barang TVRI
// ============================================

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiPhone, FiLock, FiSave, FiEye, FiEyeOff, FiCheck, FiShield, FiCamera } from 'react-icons/fi';
import { MdAssignment, MdAssignmentTurnedIn } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import { getInitials, getAvatarUrl } from '../../utils/format';
import { DIVISI, JABATAN } from '../../utils/constants';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Profil = () => {
  const { user, refreshProfile, updateAvatar } = useAuth();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profil';
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  // Profile form
  const [profileForm, setProfileForm] = useState({
    nama: user?.nama || 'Administrator',
    email: user?.email || 'admin@tvri.go.id',
    jabatan: user?.jabatan || 'Administrator',
    divisi: user?.divisi || 'IT',
    nomor_hp: user?.nomor_hp || '081234567890',
  });
  const [saving, setSaving] = useState(false);

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Avatar — computed directly from user context
  const avatarSrc = user?.avatar ? getAvatarUrl(user.avatar) : null;
  const [avatarError, setAvatarError] = useState(false);
  const [avatarBust, setAvatarBust] = useState(Date.now());
  const avatarUrl = avatarSrc ? `${avatarSrc}?t=${avatarBust}` : null;

  // Reset error state when avatar source changes
  useEffect(() => {
    setAvatarError(false);
  }, [user?.avatar]);

  // Stats
  const [stats, setStats] = useState({
    totalPeminjaman: 0,
    aktif: 0,
    selesai: 0,
  });

  useEffect(() => {
    // Fetch real stats from dashboard
    const fetchStats = async () => {
      // Jangan fetch jika sudah logout
      if (!sessionStorage.getItem('token')) return;
      try {
        const res = await api.get('/dashboard/stats');
        if (!sessionStorage.getItem('token')) return; // Cek lagi setelah async
        const d = res.data.data;
        setStats({
          totalPeminjaman: d.peminjamanHariIni || 0,
          aktif: d.barangDipinjam || 0,
          selesai: d.pengembalianHariIni || 0,
        });
      } catch {
        // keep defaults
      }
    };
    fetchStats();
  }, []);

  // Sync user data to form when user changes
  useEffect(() => {
    if (user) {
      setProfileForm(prev => ({
        ...prev,
        nama: user.nama || prev.nama,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WebP');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await api.put('/auth/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        const newAvatarPath = res.data.data.avatar;
        // Update context immediately
        updateAvatar(newAvatarPath);
        // Force browser to re-fetch the image by busting cache
        setAvatarBust(Date.now());
        setAvatarError(false);
        toast.success('Foto profil berhasil diperbarui');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengunggah foto profil');
    }
    setUploading(false);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/auth/profile', profileForm);
      toast.success('Profil berhasil diperbarui');
      // Refresh profile data
      refreshProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui profil');
    }
    setSaving(false);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword) {
      toast.error('Masukkan password lama');
      return;
    }
    if (!passwordForm.newPassword) {
      toast.error('Masukkan password baru');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password baru minimal 6 karakter');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Konfirmasi password tidak cocok');
      return;
    }

    setPasswordSaving(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password berhasil diubah');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengubah password');
    }
    setPasswordSaving(false);
  };

  const tabs = [
    { id: 'profil', label: 'Informasi Profil', icon: FiUser },
    { id: 'keamanan', label: 'Keamanan', icon: FiShield },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Profil Saya</h1>
        <p className="page-subtitle">Kelola informasi akun dan keamanan Anda</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Profile Card - Sidebar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1"
        >
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* Avatar & Name */}
            <div className="bg-gradient-to-br from-[#005BAC] to-[#003B71] px-6 pt-10 pb-8 text-center">
              {/* Clickable Avatar */}
              <div className="relative inline-block group cursor-pointer mb-5" onClick={handleAvatarClick}>
                <div className="w-28 h-28 rounded-3xl overflow-hidden bg-white/20 backdrop-blur-sm flex items-center justify-center ring-4 ring-white/30 shadow-xl">
                  {avatarUrl && !avatarError ? (
                    <img
                      src={avatarUrl}
                      alt="Foto Profil"
                      className="w-full h-full object-cover"
                      style={{ imageRendering: 'auto' }}
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <span className="text-white text-3xl font-bold">
                      {getInitials(profileForm.nama)}
                    </span>
                  )}
                </div>
                {/* Camera Overlay */}
                <div className="absolute inset-0 rounded-3xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center ring-4 ring-white/30">
                  {uploading ? (
                    <div className="animate-spin rounded-full h-7 w-7 border-2 border-white border-t-transparent" />
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <FiCamera className="w-7 h-7 text-white" />
                      <span className="text-white text-[10px] font-medium">Ubah Foto</span>
                    </div>
                  )}
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <h2 className="text-lg font-bold text-white">{profileForm.nama}</h2>
              <p className="text-white/70 text-sm mt-1">{profileForm.email}</p>
              <span className="inline-block mt-3 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium">
                {user?.role === 'admin' ? 'Administrator' : user?.role || 'Operator'}
              </span>
            </div>

            {/* Quick Stats */}
            <div className="p-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-xl bg-gray-50">
                  <p className="text-lg font-bold text-gray-800">{stats.totalPeminjaman}</p>
                  <p className="text-[10px] text-gray-500">Total</p>
                </div>
                <div className="p-2 rounded-xl bg-amber-50">
                  <p className="text-lg font-bold text-amber-600">{stats.aktif}</p>
                  <p className="text-[10px] text-gray-500">Aktif</p>
                </div>
                <div className="p-2 rounded-xl bg-emerald-50">
                  <p className="text-lg font-bold text-emerald-600">{stats.selesai}</p>
                  <p className="text-[10px] text-gray-500">Selesai</p>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="px-4 pb-4">
              <div className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        const url = tab.id === 'profil' ? '/profil' : '/profil?tab=keamanan';
                        window.history.pushState({}, '', url);
                        window.dispatchEvent(new PopStateEvent('popstate'));
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'bg-[#E8F1FA] text-[#005BAC]'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-3"
        >
          {activeTab === 'profil' ? (
            /* ===== TAB: INFORMASI PROFIL ===== */
            <div className="bg-white rounded-2xl shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-800">Informasi Profil</h3>
                <p className="text-sm text-gray-500 mt-0.5">Perbarui informasi akun Anda</p>
              </div>
                <form onSubmit={handleProfileSave} className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Lengkap</label>
                      <div className="relative">
                        <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          value={profileForm.nama}
                          onChange={(e) => setProfileForm({ ...profileForm, nama: e.target.value })}
                          className="input-field pl-10"
                          placeholder="Nama lengkap"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                      <div className="relative">
                        <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="email"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                          className="input-field pl-10"
                          placeholder="email@tvri.go.id"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Jabatan</label>
                      <select
                        value={profileForm.jabatan}
                        onChange={(e) => setProfileForm({ ...profileForm, jabatan: e.target.value })}
                        className="input-field appearance-none bg-no-repeat bg-right"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                          backgroundPosition: 'right 0.5rem center',
                          backgroundSize: '1.5em 1.5em',
                          paddingRight: '2.5rem',
                        }}
                      >
                        {JABATAN.map(j => <option key={j} value={j}>{j}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Divisi</label>
                      <select
                        value={profileForm.divisi}
                        onChange={(e) => setProfileForm({ ...profileForm, divisi: e.target.value })}
                        className="input-field appearance-none bg-no-repeat bg-right"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                          backgroundPosition: 'right 0.5rem center',
                          backgroundSize: '1.5em 1.5em',
                          paddingRight: '2.5rem',
                        }}
                      >
                        {DIVISI.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Nomor HP</label>
                      <div className="relative">
                        <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="tel"
                          value={profileForm.nomor_hp}
                          onChange={(e) => setProfileForm({ ...profileForm, nomor_hp: e.target.value })}
                          className="input-field pl-10"
                          placeholder="08xxxxxxxxxx"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn-primary inline-flex items-center gap-2"
                    >
                      {saving ? (
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <FiSave className="w-4 h-4" />
                      )}
                      Simpan Perubahan
                    </button>
                  </div>
                </form>
              </div>
          ) : (
            /* ===== TAB: KEAMANAN / UBAH PASSWORD ===== */
            <div className="bg-white rounded-2xl shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-800">Ubah Password</h3>
                <p className="text-sm text-gray-500 mt-0.5">Perbarui password akun Anda secara berkala untuk keamanan</p>
              </div>

              <form onSubmit={handlePasswordChange} className="p-6 max-w-lg">
                {/* Current Password */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password Saat Ini</label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="input-field pl-10 pr-10"
                      placeholder="Masukkan password saat ini"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrent ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password Baru</label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="input-field pl-10 pr-10"
                      placeholder="Minimal 6 karakter"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNew ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordForm.newPassword && (
                    <div className="mt-2 space-y-1">
                      <div className={`flex items-center gap-1.5 text-xs ${passwordForm.newPassword.length >= 6 ? 'text-emerald-600' : 'text-gray-400'}`}>
                        <FiCheck className="w-3 h-3" />
                        <span>Minimal 6 karakter</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Konfirmasi Password Baru</label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="input-field pl-10 pr-10"
                      placeholder="Ulangi password baru"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirm ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordForm.confirmPassword && passwordForm.newPassword && (
                    <div className={`flex items-center gap-1.5 text-xs mt-2 ${passwordForm.newPassword === passwordForm.confirmPassword ? 'text-emerald-600' : 'text-red-500'}`}>
                      <FiCheck className="w-3 h-3" />
                      <span>{passwordForm.newPassword === passwordForm.confirmPassword ? 'Password cocok' : 'Password tidak cocok'}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <button
                    type="submit"
                    disabled={passwordSaving}
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    {passwordSaving ? (
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <FiLock className="w-4 h-4" />
                    )}
                    Ubah Password
                  </button>
                </div>
              </form>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Profil;