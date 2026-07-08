// ============================================
// SETTINGS PAGE - Sistem Peminjaman Barang TVRI
// Super Admin Only: System Settings
// ============================================

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSettings, FiSave, FiInfo, FiServer, FiShield, FiDatabase, FiClock, FiTrash2 } from 'react-icons/fi';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';
import api from '../../services/api';

const Settings = () => {
  const [settings, setSettings] = useState({});
  const [appInfo, setAppInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchAppInfo();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data.success) {
        const settingsMap = {};
        res.data.data.forEach(s => {
          settingsMap[s.setting_key] = s.setting_value;
        });
        setSettings(settingsMap);
      }
    } catch (err) {
      toast.error('Gagal memuat pengaturan');
    }
  };

  const fetchAppInfo = async () => {
    try {
      const res = await api.get('/settings/app-info');
      if (res.data.success) {
        setAppInfo(res.data.data);
      }
    } catch (err) {
      // silently fail
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(settings).map(([key, value]) => ({ key, value }));
      await api.put('/settings/batch', { settings: updates });
      toast.success('Pengaturan berhasil disimpan');
    } catch (err) {
      toast.error('Gagal menyimpan pengaturan');
    }
    setSaving(false);
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#005BAC] mx-auto mb-4"></div>
          <p className="text-gray-500">Memuat pengaturan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="page-title">System Settings</h1>
        <p className="page-subtitle">Konfigurasi dan informasi sistem</p>
      </div>

      {/* App Info Card */}
      {appInfo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-4 sm:mb-6 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-[#005BAC] to-[#003B71] p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <FiServer className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{appInfo.settings?.app_name || 'SISPINBAR'}</h2>
                <p className="text-white/70 text-sm">{appInfo.settings?.app_full_name || 'Sistem Peminjaman Barang'}</p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-2xl font-bold text-[#005BAC]">{appInfo.stats?.total_admin || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Admin</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-2xl font-bold text-emerald-600">{appInfo.stats?.total_pegawai || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Pegawai</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-2xl font-bold text-amber-600">{appInfo.stats?.total_barang || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Barang</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-2xl font-bold text-purple-600">{appInfo.stats?.total_peminjaman || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Peminjaman</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <FiShield className="w-4 h-4 text-red-500" />
                <span>Organisasi: <strong>{appInfo.settings?.app_organization || 'TVRI Jawa Timur'}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <FiDatabase className="w-4 h-4 text-blue-500" />
                <span>Versi: <strong>{appInfo.version || '1.0.0'}</strong></span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Settings Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#005BAC]/10 flex items-center justify-center">
            <FiSettings className="w-5 h-5 text-[#005BAC]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Pengaturan Aplikasi</h3>
            <p className="text-sm text-gray-500">Konfigurasi umum sistem</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* App Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Aplikasi</label>
            <input
              type="text"
              value={settings.app_name || ''}
              onChange={(e) => handleChange('app_name', e.target.value)}
              className="input-field"
              placeholder="Nama aplikasi"
            />
          </div>

          {/* App Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Lengkap Aplikasi</label>
            <input
              type="text"
              value={settings.app_full_name || ''}
              onChange={(e) => handleChange('app_full_name', e.target.value)}
              className="input-field"
              placeholder="Nama lengkap aplikasi"
            />
          </div>

          {/* Organization */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Organisasi</label>
            <input
              type="text"
              value={settings.app_organization || ''}
              onChange={(e) => handleChange('app_organization', e.target.value)}
              className="input-field"
              placeholder="Nama organisasi"
            />
          </div>

          {/* Session Timeout */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <div className="flex items-center gap-1.5">
                <FiClock className="w-4 h-4 text-gray-400" />
                Session Timeout (jam)
              </div>
            </label>
            <input
              type="number"
              min="1"
              max="168"
              value={settings.session_timeout || '24'}
              onChange={(e) => handleChange('session_timeout', e.target.value)}
              className="input-field"
              placeholder="Durasi session dalam jam"
            />
            <p className="text-xs text-gray-400 mt-1">Durasi token JWT tetap aktif setelah login. Rentang 1–168 jam (1 jam s/d 7 hari). Berlaku untuk login baru.</p>
          </div>

          {/* Max Login Attempts */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Maksimal Percobaan Login</label>
            <input
              type="number"
              min="1"
              max="10"
              value={settings.max_login_attempts || '5'}
              onChange={(e) => handleChange('max_login_attempts', e.target.value)}
              className="input-field"
              placeholder="Jumlah maksimal percobaan login"
            />
            <p className="text-xs text-gray-400 mt-1">Jika melebihi batas, akun akan terkunci selama 30 menit.</p>
          </div>

          {/* Default Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Default Password Akun Baru</label>
            <input
              type="text"
              value={settings.default_password || ''}
              onChange={(e) => handleChange('default_password', e.target.value)}
              className="input-field"
              placeholder="Password default untuk akun baru"
            />
            <p className="text-xs text-gray-400 mt-1">Password ini akan digunakan saat membuat akun baru pegawai</p>
          </div>

          {/* Audit Log Retention */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <div className="flex items-center gap-1.5">
                <FiTrash2 className="w-4 h-4 text-gray-400" />
                Retensi Activity Log (hari)
              </div>
            </label>
            <input
              type="number"
              min="7"
              max="365"
              value={settings.audit_log_retention_days || '30'}
              onChange={(e) => handleChange('audit_log_retention_days', e.target.value)}
              className="input-field"
              placeholder="Jumlah hari retensi log"
            />
            <p className="text-xs text-gray-400 mt-1">Log aktivitas yang lebih dari jumlah hari ini akan dihapus otomatis setiap hari. Rentang 7–365 hari. Default: 30 hari.</p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
          <Button icon={FiSave} onClick={handleSave} loading={saving}>
            Simpan Pengaturan
          </Button>
        </div>
      </motion.div>

      {/* Warning */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-6"
      >
        <div className="flex items-start gap-3">
          <FiInfo className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-amber-800">Perhatian</h4>
            <p className="text-sm text-amber-700 mt-1">
              Halaman ini hanya dapat diakses oleh <strong>Super Admin</strong>. Perubahan pada <strong>Session Timeout</strong> dan <strong>Maksimal Percobaan Login</strong> langsung berlaku untuk login berikutnya. Perubahan <strong>Retensi Activity Log</strong> berlaku pada pembersihan otomatis berikutnya (setiap hari 00:00). Pastikan Anda memahami dampak dari setiap perubahan sebelum menyimpan.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Settings;