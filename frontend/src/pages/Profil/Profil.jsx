// ============================================
// PROFIL PAGE - Sistem Peminjaman Barang TVRI
// Read-only profile (hanya bisa ubah foto profil)
// ============================================

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiPhone, FiCamera } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { getInitials, getAvatarUrl } from '../../utils/format';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Profil = () => {
  const { user, updateAvatar } = useAuth();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  // Profile data (read-only)
  const [profileForm, setProfileForm] = useState({
    nama: user?.nama || '',
    email: user?.email || '',
    jabatan: user?.jabatan || '',
    divisi: user?.divisi || '',
    nomor_hp: user?.nomor_hp || '',
  });

  // Avatar
  const avatarSrc = user?.avatar ? getAvatarUrl(user.avatar) : null;
  const [avatarError, setAvatarError] = useState(false);
  const [avatarBust, setAvatarBust] = useState(Date.now());
  const avatarUrl = avatarSrc ? `${avatarSrc}?t=${avatarBust}` : null;

  useEffect(() => { setAvatarError(false); }, [user?.avatar]);

  // Stats
  const [stats, setStats] = useState({
    totalPeminjaman: 0,
    aktif: 0,
    selesai: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!sessionStorage.getItem('token')) return;
      try {
        const res = await api.get('/dashboard/stats');
        if (!sessionStorage.getItem('token')) return;
        const d = res.data.data;
        setStats({
          totalPeminjaman: d.peminjamanHariIni || 0,
          aktif: d.barangDipinjam || 0,
          selesai: d.pengembalianHariIni || 0,
        });
      } catch { /* keep defaults */ }
    };
    fetchStats();
  }, []);

  // Sync user data when user changes
  useEffect(() => {
    if (user) {
      setProfileForm(prev => ({
        ...prev,
        nama: user.nama || prev.nama,
        email: user.email || prev.email,
        jabatan: user.jabatan || prev.jabatan,
        divisi: user.divisi || prev.divisi,
        nomor_hp: user.nomor_hp || prev.nomor_hp,
      }));
    }
  }, [user]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WebP');
      return;
    }
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
        updateAvatar(res.data.data.avatar);
        setAvatarBust(Date.now());
        setAvatarError(false);
        toast.success('Foto profil berhasil diperbarui');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengunggah foto profil');
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Role label
  const roleLabel = user?.role === 'super_admin' ? 'Super Admin' : user?.role === 'admin' ? 'Administrator' : user?.role || 'Operator';

  // Profile info items for read-only display
  const profileInfoItems = [
    { label: 'Nama Lengkap', value: profileForm.nama || '-', icon: FiUser },
    { label: 'Email', value: profileForm.email || '-', icon: FiMail },
    { label: 'Jabatan', value: profileForm.jabatan || '-', icon: FiUser },
    { label: 'Divisi', value: profileForm.divisi || '-', icon: FiUser },
    { label: 'Nomor HP', value: profileForm.nomor_hp || '-', icon: FiPhone },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Profil Saya</h1>
        <p className="page-subtitle">Lihat informasi akun Anda</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Profile Card - Sidebar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* Avatar & Name */}
            <div className="bg-gradient-to-br from-[#005BAC] to-[#003B71] px-6 pt-10 pb-8 text-center">
              {/* Clickable Avatar */}
              <div className="relative inline-block group cursor-pointer mb-5" onClick={handleAvatarClick}>
                <div className="w-28 h-28 rounded-3xl overflow-hidden bg-white/20 backdrop-blur-sm flex items-center justify-center ring-4 ring-white/30 shadow-xl">
                  {avatarUrl && !avatarError ? (
                    <img src={avatarUrl} alt="Foto Profil" className="w-full h-full object-cover" style={{ imageRendering: 'auto' }} onError={() => setAvatarError(true)} />
                  ) : (
                    <span className="text-white text-3xl font-bold">{getInitials(profileForm.nama)}</span>
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
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" onChange={handleAvatarChange} className="hidden" />
              <h2 className="text-lg font-bold text-white">{profileForm.nama}</h2>
              <p className="text-white/70 text-sm mt-1">{profileForm.email}</p>
              <span className="inline-block mt-3 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium">
                {roleLabel}
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
          </div>
        </motion.div>

        {/* Main Content - Read-only Profile */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">Informasi Profil</h3>

            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {profileInfoItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label}>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{item.label}</label>
                      <div className="relative">
                        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          value={item.value}
                          readOnly
                          className="input-field pl-10 bg-gray-50 text-gray-600 cursor-not-allowed border-gray-200"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profil;