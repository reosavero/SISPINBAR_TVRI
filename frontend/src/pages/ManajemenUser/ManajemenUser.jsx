// ============================================
// MANAJEMEN USER PAGE - Sistem Peminjaman Barang TVRI
// Admin & Super Admin: Manage users & approve registrations
// ============================================

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiShield, FiUserCheck, FiUserX, FiUsers, FiUser, FiChevronDown, FiLock, FiMail, FiPhone, FiClock, FiCheck, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { MdAdminPanelSettings, MdPeople, MdPersonAdd } from 'react-icons/md';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import DropdownSelect from '../../components/ui/DropdownSelect';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import { ROLE_LABELS, ROLE_COLORS } from '../../utils/constants';
import { useMasterData } from '../../context/MasterDataContext';
import { getInitials, getAvatarUrl } from '../../utils/format';
import toast from 'react-hot-toast';
import api from '../../services/api';
import pegawaiService from '../../services/pegawaiService';

const ManajemenUser = () => {
  const { user: currentUser } = useAuth();
  const { jabatanList, divisiList } = useMasterData();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'admin';
  const validTabs = ['admin', 'pegawai', 'all'];
  const [activeTab, setActiveTab] = useState(validTabs.includes(initialTab) ? initialTab : 'admin');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [stats, setStats] = useState(null);
  const itemsPerPage = 10;

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    username: '',
    email: '',
    nama: '',
    password: '',
  });

  const [editForm, setEditForm] = useState({
    username: '',
    nama: '',
    nip: '',
    email: '',
    jabatan: '',
    divisi: '',
    nomor_hp: '',
  });

  // Edit user password toggle
  const [editResetPassword, setEditResetPassword] = useState({ enabled: false, newPassword: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);

  // Tambah Pegawai state
  const [showPegawaiModal, setShowPegawaiModal] = useState(false);
  const [pegawaiSaving, setPegawaiSaving] = useState(false);
  const [imgErrors, setImgErrors] = useState(new Set());
  const [pegawaiForm, setPegawaiForm] = useState({
    nip: '', nama: '', jabatan: '', divisi: '', email: '', nomor_hp: '', username: '', password: '',
  });

  // Multi-step add pegawai form
  const [addStep, setAddStep] = useState(1); // 1=Data, 2=Verifikasi OTP, 3=Akun Login
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState('');
  const otpRefs = useRef([]);

  // Pending registrations state
  const [pendingUsers, setPendingUsers] = useState([]);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showPegawaiPassword, setShowPegawaiPassword] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchStats();
    fetchPending();
  }, [currentPage, search, activeTab]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/users/stats');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      // silently fail
    }
  };

  const fetchPending = async () => {
    try {
      const res = await api.get('/users/pending');
      if (res.data.success) {
        setPendingUsers(res.data.data || []);
      }
    } catch (err) {
      // silently fail
    }
  };

  const handleAvatarError = (userId) => {
    setImgErrors(prev => {
      const next = new Set(prev);
      next.add(userId);
      return next;
    });
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = { page: currentPage };
      if (search) params.search = search;

      let endpoint = '/users';
      if (activeTab === 'admin') {
        endpoint = '/users/admins';
      } else {
        params.role = activeTab === 'pegawai' ? 'pegawai' : undefined;
      }

      const res = await api.get(endpoint, { params });
      setUsers(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotalItems(res.data.pagination?.totalItems || 0);
    } catch (err) {
      toast.error('Gagal memuat data user');
      setUsers([]);
    }
    setLoading(false);
  };

  const handleOpenAdd = () => {
    setForm({ username: '', email: '', nama: '', password: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setEditForm({
      username: user.username || '',
      nama: user.nama || '',
      nip: user.nip || '',
      email: user.email || '',
      jabatan: user.jabatan || '',
      divisi: user.divisi || '',
      nomor_hp: user.nomor_hp || '',
    });
    setEditResetPassword({ enabled: false, newPassword: '', confirmPassword: '' });
    setShowEditModal(true);
  };

  const handleOpenDelete = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!form.username || !form.nama || !form.password) {
      toast.error('Username, nama, dan password wajib diisi');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }
    setSaving(true);
    try {
      await api.post('/users/admin', form);
      toast.success('Admin berhasil ditambahkan');
      setShowModal(false);
      fetchUsers();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menambahkan admin');
    }
    setSaving(false);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editForm.nama) {
      toast.error('Nama wajib diisi');
      return;
    }
    if (!editForm.username || editForm.username.length < 3) {
      toast.error('Username minimal 3 karakter');
      return;
    }
    if (editResetPassword.enabled) {
      if (!editResetPassword.newPassword) { toast.error('Password baru wajib diisi'); return; }
      if (editResetPassword.newPassword.length < 6) { toast.error('Password baru minimal 6 karakter'); return; }
      if (editResetPassword.newPassword !== editResetPassword.confirmPassword) { toast.error('Konfirmasi password tidak cocok'); return; }
    }

    setSaving(true);
    try {
      const data = {
        username: editForm.username.toLowerCase().replace(/[^a-z0-9._-]/g, ''),
        nama: editForm.nama,
        email: editForm.email || null,
        nip: editForm.nip || null,
        jabatan: editForm.jabatan || null,
        divisi: editForm.divisi || null,
        nomor_hp: editForm.nomor_hp || null,
      };

      // Password change
      if (editResetPassword.enabled) {
        data.password = editResetPassword.newPassword;
      }

      await api.put(`/users/${selectedUser.id}`, data);
      toast.success(editResetPassword.enabled ? 'User dan password berhasil diperbarui' : 'User berhasil diperbarui');
      setShowEditModal(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui user');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/users/${selectedUser.id}`);
      toast.success('User berhasil dihapus');
      setShowDeleteModal(false);
      fetchUsers();
      fetchStats();
      fetchPending();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus user');
    }
  };

  const handleToggleActive = async (user) => {
    try {
      const res = await api.put(`/users/${user.id}/toggle-active`);
      toast.success(res.data?.message || (user.is_active ? 'User dinonaktifkan' : 'User diaktifkan'));
      fetchUsers();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengubah status');
    }
  };

  // ===== TAMBAH PEGAWAI (Multi-Step with OTP) =====
  const handleOpenAddPegawai = () => {
    setPegawaiForm({ nip: '', nama: '', jabatan: '', divisi: '', email: '', nomor_hp: '', username: '', password: '' });
    setAddStep(1);
    setOtpCode('');
    setOtpSent(false);
    setOtpCooldown(0);
    setOtpVerified(false);
    setOtpVerifying(false);
    setOtpError('');
    setShowPegawaiPassword(false);
    setShowPegawaiModal(true);
  };

  // ========== STEP VALIDATION ==========
  const validatePegawaiStep1 = () => {
    if (!pegawaiForm.nama.trim()) { toast.error('Nama wajib diisi'); return false; }
    if (!pegawaiForm.nip.trim()) { toast.error('NIP wajib diisi'); return false; }
    if (!pegawaiForm.email.trim()) { toast.error('Email wajib diisi'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pegawaiForm.email.trim())) { toast.error('Format email tidak valid'); return false; }
    return true;
  };

  const validatePegawaiStep3 = () => {
    if (!pegawaiForm.username.trim()) { toast.error('Username wajib diisi'); return false; }
    if (pegawaiForm.username.length < 3) { toast.error('Username minimal 3 karakter'); return false; }
    if (!pegawaiForm.password) { toast.error('Password wajib diisi'); return false; }
    if (pegawaiForm.password.length < 6) { toast.error('Password minimal 6 karakter'); return false; }
    return true;
  };

  // ========== OTP HANDLERS ==========
  const handleSendOtpPegawai = async () => {
    if (!pegawaiForm.email.trim()) { toast.error('Email wajib diisi terlebih dahulu'); return; }

    setOtpLoading(true);
    setOtpError('');
    try {
      const res = await api.post('/pegawai/send-otp', { email: pegawaiForm.email.trim() });
      if (res.data.success) {
        setOtpSent(true);
        toast.success('Kode verifikasi telah dikirim ke email pegawai');
        setOtpCooldown(60);
        const interval = setInterval(() => {
          setOtpCooldown(prev => {
            if (prev <= 1) { clearInterval(interval); return 0; }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengirim kode verifikasi');
    }
    setOtpLoading(false);
  };

  const handleVerifyOtpPegawai = async () => {
    if (!otpCode || otpCode.length !== 6) { setOtpError('Masukkan 6 digit kode verifikasi'); return; }
    setOtpVerifying(true);
    setOtpError('');
    try {
      const res = await api.post('/pegawai/verify-otp', { email: pegawaiForm.email.trim(), otp: otpCode });
      if (res.data.success) {
        setOtpVerified(true);
        toast.success('Email berhasil diverifikasi!');
      }
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Kode verifikasi salah');
    }
    setOtpVerifying(false);
  };

  const handlePegawaiNextStep = () => {
    if (addStep === 1) {
      if (!validatePegawaiStep1()) return;
      setAddStep(2);
      // Auto-send OTP when moving to step 2
      if (!otpSent) {
        setTimeout(() => handleSendOtpPegawai(), 300);
      }
    } else if (addStep === 2) {
      if (!otpVerified) { toast.error('Verifikasi email terlebih dahulu'); return; }
      setAddStep(3);
    }
  };

  const handleAddPegawai = async (e) => {
    if (e) e.preventDefault();

    // Final step validation
    if (!validatePegawaiStep3()) return;
    if (!otpVerified) { toast.error('Email belum diverifikasi'); return; }

    setPegawaiSaving(true);
    try {
      await pegawaiService.create(pegawaiForm);
      toast.success('Pegawai berhasil ditambahkan. Akun login telah dibuat.');
      setShowPegawaiModal(false);
      fetchUsers();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menambahkan pegawai');
    }
    setPegawaiSaving(false);
  };

  // ===== APPROVE / REJECT REGISTRATION =====
  const handleApprove = async (userId) => {
    try {
      const res = await api.put(`/users/${userId}/approve`);
      const emailNotif = res.data.emailNotif;
      if (emailNotif?.sent) {
        toast.success('Registrasi disetujui. Notifikasi email berhasil dikirim');
      } else if (emailNotif && !emailNotif.sent) {
        toast.success('Registrasi disetujui, tapi email notifikasi gagal dikirim');
      } else {
        toast.success('Registrasi berhasil disetujui');
      }
      fetchPending();
      fetchUsers();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyetujui registrasi');
    }
  };

  const handleOpenReject = (user) => {
    setSelectedUser(user);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    try {
      const res = await api.put(`/users/${selectedUser.id}/reject`, { reason: rejectReason });
      const emailNotif = res.data.emailNotif;
      if (emailNotif?.sent) {
        toast.success('Registrasi ditolak. Notifikasi email berhasil dikirim');
      } else if (emailNotif && !emailNotif.sent) {
        toast.success('Registrasi ditolak, tapi email notifikasi gagal dikirim');
      } else {
        toast.success('Registrasi berhasil ditolak');
      }
      setShowRejectModal(false);
      fetchPending();
      fetchUsers();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menolak registrasi');
    }
  };

  const roleColor = (role) => ROLE_COLORS[role] || ROLE_COLORS.pegawai;
  const roleLabel = (role) => ROLE_LABELS[role] || role;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="page-title">Manajemen User</h1>
        <p className="page-subtitle">Kelola akun Admin dan Pegawai dalam sistem</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <FiShield className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-[11px] text-gray-400 font-medium">Super Admin</p>
                <p className="text-xl font-bold text-gray-800">{stats.super_admin}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <MdAdminPanelSettings className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-[11px] text-gray-400 font-medium">Admin</p>
                <p className="text-xl font-bold text-gray-800">{stats.admin}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <MdPeople className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-[11px] text-gray-400 font-medium">Pegawai</p>
                <p className="text-xl font-bold text-gray-800">{stats.pegawai}</p>
              </div>
            </div>
          </div>
          {stats.pending > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-amber-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <FiUserCheck className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-[11px] text-amber-600 font-medium">Menunggu</p>
                  <p className="text-xl font-bold text-amber-700">{stats.pending}</p>
                </div>
              </div>
            </div>
          )}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                <FiUsers className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-[11px] text-gray-400 font-medium">Total User</p>
                <p className="text-xl font-bold text-gray-800">{stats.total}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Bar + Search + Action */}
      {/* Pending Registrations Banner */}
      {pendingUsers.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <FiClock className="w-4 h-4 text-amber-600" />
            </div>
            <h3 className="text-sm font-bold text-amber-800">Registrasi Menunggu Persetujuan ({pendingUsers.length})</h3>
          </div>
          <div className="space-y-2">
            {pendingUsers.map((user) => (
              <div key={user.id} className="bg-white rounded-xl p-3 sm:p-4 border border-amber-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-amber-400 to-amber-600">
                      {user.avatar && !imgErrors.has(user.id) ? (
                        <img key={user.id} src={getAvatarUrl(user.avatar)} alt="" className="w-full h-full object-cover" onError={() => handleAvatarError(user.id)} />
                      ) : (
                        <span className="text-white text-sm font-bold">{getInitials(user.nama)}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{user.nama}</p>
                        {user.email && <span className="text-[10px] px-1.5 py-0.5 bg-gray-50 text-gray-500 rounded truncate max-w-[160px]">{user.email}</span>}
                      </div>
                      <p className="text-xs text-gray-400">@{user.username} · NIP: {user.nip || '-'}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {user.jabatan && <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">{user.jabatan}</span>}
                        {user.divisi && <span className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded">{user.divisi}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleApprove(user.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors touch-manipulation"
                    >
                      <FiCheckCircle className="w-3.5 h-3.5" /> Setujui
                    </button>
                    <button
                      onClick={() => handleOpenReject(user)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors touch-manipulation"
                    >
                      <FiXCircle className="w-3.5 h-3.5" /> Tolak
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm mb-3 sm:mb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {[
              { key: 'admin', label: 'Admin' },
              { key: 'pegawai', label: 'Pegawai' },
              { key: 'all', label: 'Semua' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setCurrentPage(1); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-white text-[#005BAC] shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 sm:w-64">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                placeholder="Cari user..."
                className="input-field pl-10"
              />
            </div>
            {currentUser?.role === 'super_admin' && activeTab === 'admin' && (
              <Button icon={MdPersonAdd} onClick={handleOpenAdd} className="w-full sm:w-auto">
                Tambah Admin
              </Button>
            )}
            {currentUser?.role === 'super_admin' && activeTab === 'pegawai' && (
              <Button icon={MdPersonAdd} onClick={handleOpenAddPegawai} className="w-full sm:w-auto">
                Tambah Pegawai
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* User Table */}
      <div className="table-container">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F5F7FA]">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Username</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => {
                const rc = roleColor(user.role);
                return (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#005BAC] to-[#003B71] flex-shrink-0">
                          {user.avatar && !imgErrors.has(user.id) ? (
                            <img key={user.id} src={getAvatarUrl(user.avatar)} alt="" className="w-full h-full object-cover" onError={() => handleAvatarError(user.id)} />
                          ) : (
                            <span className="text-white text-xs font-bold">{getInitials(user.nama) || 'U'}</span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{user.nama}</p>
                          <p className="text-xs text-gray-400">{user.email || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{user.username}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${rc.bg} ${rc.text} border ${rc.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${rc.dot}`}></span>
                        {roleLabel(user.role)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {user.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-500 border border-gray-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        {/* Don't show actions for super_admin */}
                        {user.role !== 'super_admin' && (
                          <>
                            <button onClick={() => handleOpenEdit(user)} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors" title="Edit">
                              <FiEdit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleToggleActive(user)} className={`p-1.5 rounded-lg transition-colors ${user.is_active ? 'hover:bg-gray-100 text-gray-500' : 'hover:bg-emerald-50 text-emerald-600'}`} title={user.is_active ? 'Nonaktifkan' : 'Aktifkan'}>
                              {user.is_active ? <FiUserX className="w-4 h-4" /> : <FiUserCheck className="w-4 h-4" />}
                            </button>

                            <button onClick={() => handleOpenDelete(user)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="Hapus">
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {user.role === 'super_admin' && (
                          <span className="text-xs text-gray-400 italic">Protected</span>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden p-3 space-y-3">
          {users.map((user) => {
            const rc = roleColor(user.role);
            return (
              <div key={user.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#005BAC] to-[#003B71] flex-shrink-0">
                      {user.avatar && !imgErrors.has(user.id) ? (
                        <img key={user.id} src={getAvatarUrl(user.avatar)} alt="" className="w-full h-full object-cover" onError={() => handleAvatarError(user.id)} />
                      ) : (
                        <span className="text-white text-sm font-bold">{getInitials(user.nama) || 'U'}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{user.nama}</p>
                      <p className="text-xs text-gray-400">@{user.username}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${rc.bg} ${rc.text} border ${rc.border}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${rc.dot}`}></span>
                    {roleLabel(user.role)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${user.is_active ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                    {user.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                  {user.role !== 'super_admin' && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleOpenEdit(user)} className="p-2 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors touch-manipulation">
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleToggleActive(user)} className={`p-2 rounded-lg transition-colors touch-manipulation ${user.is_active ? 'hover:bg-gray-100 text-gray-500' : 'hover:bg-emerald-50 text-emerald-600'}`}>
                        {user.is_active ? <FiUserX className="w-4 h-4" /> : <FiUserCheck className="w-4 h-4" />}
                      </button>

                      <button onClick={() => handleOpenDelete(user)} className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors touch-manipulation">
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={totalItems} itemsPerPage={itemsPerPage} />
      </div>

      {/* Add Admin Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Tambah Admin" size="md">
        <form onSubmit={handleAddAdmin}>
          <div className="space-y-4">
            <Input label="Nama Lengkap" name="nama" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Masukkan nama lengkap" required />
            <Input label="Username" name="username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="Username untuk login" required />
            <Input label="Email" name="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email (opsional)" />
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Minimal 6 karakter"
                  className="input-field pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700">
              <p className="font-medium mb-1">ℹ️ Informasi</p>
              <p>Akun admin dapat mengelola Pegawai, Barang, Kategori, Peminjaman, dan Pengembalian. Admin tidak dapat mengelola akun Admin lain atau mengakses System Settings.</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={() => setShowModal(false)}>Batal</Button>
            <Button type="submit" loading={saving}>Tambah Admin</Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title={`Edit ${selectedUser?.role === 'pegawai' ? 'Pegawai' : 'Admin'}`} size="lg">
        <form onSubmit={handleEdit}>
          {/* Section: Akun Login */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-[#005BAC]/10 flex items-center justify-center">
                <FiLock className="w-3.5 h-3.5 text-[#005BAC]" />
              </div>
              <h3 className="text-sm font-semibold text-gray-800">Akun Login</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-9">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input type="text" value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '') })} placeholder="contoh: admin.tvri" className="input-field pl-10" minLength={3} />
                </div>
                <p className="text-xs text-gray-400 mt-1">Minimal 3 karakter. Hanya huruf kecil, angka, titik, strip, dan underscore.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="flex items-center gap-3 mt-1">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={editResetPassword.enabled} onChange={(e) => setEditResetPassword({ ...editResetPassword, enabled: e.target.checked, newPassword: '', confirmPassword: '' })} className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#005BAC]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#005BAC]"></div>
                  </label>
                  <span className="text-sm text-gray-600">Ubah password</span>
                </div>
              </div>
            </div>
            {editResetPassword.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-9 mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password Baru <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input type="password" value={editResetPassword.newPassword} onChange={(e) => setEditResetPassword({ ...editResetPassword, newPassword: e.target.value })} placeholder="Minimal 6 karakter" className="input-field pl-10" minLength={6} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Konfirmasi Password <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input type="password" value={editResetPassword.confirmPassword} onChange={(e) => setEditResetPassword({ ...editResetPassword, confirmPassword: e.target.value })} placeholder="Ulangi password baru" className="input-field pl-10" minLength={6} />
                  </div>
                  {editResetPassword.newPassword && editResetPassword.confirmPassword && (
                    <div className={`flex items-center gap-1.5 text-xs mt-1.5 ${editResetPassword.newPassword === editResetPassword.confirmPassword ? 'text-emerald-600' : 'text-red-500'}`}>
                      <FiCheck className="w-3 h-3" />
                      <span>{editResetPassword.newPassword === editResetPassword.confirmPassword ? 'Password cocok' : 'Password tidak cocok'}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 my-5"></div>

          {/* Section: Data User */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                <MdPeople className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-800">Data Diri</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-9">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">NIP</label>
                <input type="text" value={editForm.nip} onChange={(e) => setEditForm({ ...editForm, nip: e.target.value })} placeholder="Masukkan NIP" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Lengkap <span className="text-red-500">*</span></label>
                <input type="text" value={editForm.nama} onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })} placeholder="Masukkan nama lengkap" className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Jabatan</label>
                <DropdownSelect
                  value={editForm.jabatan}
                  onChange={(e) => setEditForm({ ...editForm, jabatan: e.target.value })}
                  options={jabatanList.map(j => ({ value: j, label: j }))}
                  placeholder="Pilih jabatan"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Divisi</label>
                <DropdownSelect
                  value={editForm.divisi}
                  onChange={(e) => setEditForm({ ...editForm, divisi: e.target.value })}
                  options={divisiList.map(d => ({ value: d, label: d }))}
                  placeholder="Pilih divisi"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} placeholder="email@tvri.go.id" className="input-field pl-10" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nomor HP</label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input type="text" value={editForm.nomor_hp} onChange={(e) => setEditForm({ ...editForm, nomor_hp: e.target.value })} placeholder="08xxxxxxxxxx" className="input-field pl-10" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>Batal</Button>
            <Button type="submit" loading={saving}>Simpan Perubahan</Button>
          </div>
        </form>
      </Modal>



      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Hapus User"
        message={`Apakah Anda yakin ingin menghapus user "${selectedUser?.nama}"? Data pegawai terkait juga akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.`}
      />

      {/* Reject Registration Modal */}
      <Modal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)} title="Tolak Registrasi" size="sm">
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-sm text-red-700">
              Menolak registrasi dari <strong>{selectedUser?.nama}</strong> (@{selectedUser?.username})
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Alasan Penolakan <span className="text-gray-400 font-normal">(opsional)</span></label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Masukkan alasan penolakan..."
              rows={3}
              className="input-field"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <Button variant="outline" onClick={() => setShowRejectModal(false)}>Batal</Button>
          <Button onClick={handleReject} className="bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700">Tolak Registrasi</Button>
        </div>
      </Modal>

      {/* ========== TAMBAH PEGAWAI MODAL (Multi-Step with OTP) ========== */}
      <Modal isOpen={showPegawaiModal} onClose={() => setShowPegawaiModal(false)} title="Tambah Pegawai Baru" size="lg">
        <div className="space-y-5">
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${addStep >= 2 ? 'bg-emerald-100 text-emerald-700' : 'bg-[#005BAC] text-white'}`}>
              {addStep > 1 && <FiCheckCircle className="w-3.5 h-3.5" />}
              <span>1. Data</span>
            </div>
            <div className={`w-6 h-0.5 ${addStep >= 2 ? 'bg-emerald-400' : 'bg-gray-200'}`} />
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${addStep === 2 ? 'bg-[#005BAC] text-white' : addStep >= 3 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
              {addStep >= 3 && <FiCheckCircle className="w-3.5 h-3.5" />}
              <span>2. Verifikasi</span>
            </div>
            <div className={`w-6 h-0.5 ${addStep >= 3 ? 'bg-emerald-400' : 'bg-gray-200'}`} />
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${addStep === 3 ? 'bg-[#005BAC] text-white' : 'bg-gray-100 text-gray-400'}`}>
              <span>3. Akun</span>
            </div>
          </div>

          {/* ===== STEP 1: Data Pegawai ===== */}
          {addStep === 1 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <FiMail className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-700">Masukkan data pegawai. Email akan diverifikasi pada langkah berikutnya sebelum akun dibuat.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">NIP <span className="text-red-500">*</span></label>
                  <input type="text" value={pegawaiForm.nip} onChange={(e) => setPegawaiForm({ ...pegawaiForm, nip: e.target.value })} placeholder="Masukkan NIP" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Lengkap <span className="text-red-500">*</span></label>
                  <input type="text" value={pegawaiForm.nama} onChange={(e) => setPegawaiForm({ ...pegawaiForm, nama: e.target.value })} placeholder="Masukkan nama lengkap" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Jabatan</label>
                  <DropdownSelect
                    value={pegawaiForm.jabatan}
                    onChange={(e) => setPegawaiForm({ ...pegawaiForm, jabatan: e.target.value })}
                    options={jabatanList.map(j => ({ value: j, label: j }))}
                    placeholder="Pilih jabatan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Divisi</label>
                  <DropdownSelect
                    value={pegawaiForm.divisi}
                    onChange={(e) => setPegawaiForm({ ...pegawaiForm, divisi: e.target.value })}
                    options={divisiList.map(d => ({ value: d, label: d }))}
                    placeholder="Pilih divisi"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input type="email" value={pegawaiForm.email} onChange={(e) => { setPegawaiForm({ ...pegawaiForm, email: e.target.value }); if (otpVerified) { setOtpVerified(false); setOtpSent(false); setOtpCode(''); } }} placeholder="email@gmail.com" className="input-field pl-10" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nomor HP</label>
                  <div className="relative">
                    <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input type="text" value={pegawaiForm.nomor_hp} onChange={(e) => setPegawaiForm({ ...pegawaiForm, nomor_hp: e.target.value })} placeholder="08xxxxxxxxxx" className="input-field pl-10" />
                  </div>
                </div>
              </div>
              <div className="flex justify-between pt-4 border-t border-gray-100">
                <Button variant="outline" onClick={() => setShowPegawaiModal(false)}>Batal</Button>
                <Button onClick={handlePegawaiNextStep}>Selanjutnya</Button>
              </div>
            </div>
          )}

          {/* ===== STEP 2: Verifikasi Email (OTP) ===== */}
          {addStep === 2 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <FiMail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-blue-800">Verifikasi Email</p>
                    <p className="text-xs text-blue-600 mt-1">Kode verifikasi 6 digit telah dikirim ke:</p>
                    <p className="text-sm font-bold text-blue-800 mt-1 break-all">{pegawaiForm.email}</p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <span className="text-base leading-none mt-0.5">⚠️</span>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Tidak menerima kode?</strong> Cek folder <strong>Spam</strong> di email pegawai. Email dari sistem sering masuk ke folder spam.
                  </p>
                </div>
              </div>

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

              <div className="flex justify-between pt-4 border-t border-gray-100">
                <Button variant="outline" onClick={() => { setAddStep(1); setOtpVerified(false); setOtpCode(''); setOtpError(''); }}>Kembali</Button>
                <div className="flex items-center gap-3">
                  {!otpVerified ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSendOtpPegawai}
                        disabled={otpCooldown > 0 || otpLoading}
                        className={`text-xs font-medium transition-colors ${otpCooldown > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-[#005BAC] hover:text-[#003B71]'}`}
                      >
                        {otpLoading ? 'Mengirim...' : otpCooldown > 0 ? `Kirim ulang (${otpCooldown}s)` : 'Kirim ulang kode'}
                      </button>
                      <button
                        type="button"
                        onClick={handleVerifyOtpPegawai}
                        disabled={otpCode.length !== 6 || otpVerifying}
                        className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                          otpCode.length !== 6 || otpVerifying
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-[#005BAC] to-[#003B71] text-white hover:from-[#006CC4] hover:to-[#004A8F]'
                        }`}
                      >
                        {otpVerifying ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Memverifikasi...
                          </span>
                        ) : 'Verifikasi Kode'}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handlePegawaiNextStep}
                      className="px-4 py-2 rounded-xl font-semibold bg-gradient-to-r from-[#005BAC] to-[#003B71] text-white hover:from-[#006CC4] hover:to-[#004A8F] transition-all"
                    >
                      Selanjutnya
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ===== STEP 3: Akun Login ===== */}
          {addStep === 3 && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <FiCheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-emerald-800">Email terverifikasi</p>
                    <p className="text-xs text-emerald-600 mt-0.5 break-all">{pegawaiForm.email}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 my-2"></div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-[#005BAC]/10 flex items-center justify-center">
                    <FiLock className="w-3.5 h-3.5 text-[#005BAC]" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-800">Buat Akun Login</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-9">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Username <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input type="text" value={pegawaiForm.username} onChange={(e) => setPegawaiForm({ ...pegawaiForm, username: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '') })} placeholder="contoh: budi.santoso" className="input-field pl-10" minLength={3} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Password <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type={showPegawaiPassword ? 'text' : 'password'}
                        value={pegawaiForm.password}
                        onChange={(e) => setPegawaiForm({ ...pegawaiForm, password: e.target.value })}
                        placeholder="Minimal 6 karakter"
                        className="input-field pl-10 pr-10"
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPegawaiPassword(!showPegawaiPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPegawaiPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <span className="text-base leading-none mt-0.5">⚠️</span>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Penting:</strong> Catat username dan password ini. Akun akan langsung aktif setelah dibuat karena dibuat oleh super admin.
                  </p>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-700">
                <p className="font-medium mb-1">ℹ️ Informasi</p>
                <p>Akun pegawai akan otomatis dibuat dengan role <strong>Pegawai</strong>. Pegawai dapat mengajukan peminjaman dan melihat riwayat peminjaman sendiri.</p>
              </div>

              <div className="flex justify-between pt-4 border-t border-gray-100">
                <Button variant="outline" onClick={() => setAddStep(2)}>Kembali</Button>
                <Button onClick={handleAddPegawai} loading={pegawaiSaving}>Buat Akun Pegawai</Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ManajemenUser;