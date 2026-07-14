// ============================================
// PEGAWAI PAGE - Sistem Peminjaman Barang TVRI
// ============================================

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiMail, FiPhone, FiUser, FiLock, FiCheck, FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';
import { MdPeople } from 'react-icons/md';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import DropdownSelect from '../../components/ui/DropdownSelect';
import { useMasterData } from '../../context/MasterDataContext';
import { getInitials, getAvatarUrl } from '../../utils/format';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Pegawai = () => {
  const { user: currentUser } = useAuth();
  const { jabatanList, divisiList } = useMasterData();
  const [pegawai, setPegawai] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterJabatan, setFilterJabatan] = useState('');
  const [filterDivisi, setFilterDivisi] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    nip: '', nama: '', jabatan: '', divisi: '', email: '', nomor_hp: '',
    username: '', password: '',
  });

  // Reset password (dalam modal edit)
  const [resetPassword, setResetPassword] = useState({ enabled: false, newPassword: '', confirmPassword: '' });

  // Multi-step add form
  const [addStep, setAddStep] = useState(1); // 1=Data, 2=Verifikasi OTP, 3=Akun Login
  const [imgErrors, setImgErrors] = useState(new Set());
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState('');
  const otpRefs = useRef([]);

  // Pending registrations (admin only)
  const [pendingUsers, setPendingUsers] = useState([]);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingUser, setRejectingUser] = useState(null);

  useEffect(() => { fetchPegawai(); }, [currentPage, search, filterJabatan, filterDivisi]);

  // Fetch pending registrations (admin+)
  useEffect(() => {
    if (currentUser?.role === 'admin' || currentUser?.role === 'super_admin') {
      fetchPending();
    }
  }, [currentUser]);

  const fetchPending = async () => {
    try {
      const res = await api.get('/users/pending');
      if (res.data.success) setPendingUsers(res.data.data || []);
    } catch (err) { /* silently fail */ }
  };

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
      fetchPegawai();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyetujui registrasi');
    }
  };

  const handleReject = async () => {
    try {
      const res = await api.put(`/users/${rejectingUser.id}/reject`, { reason: rejectReason });
      const emailNotif = res.data.emailNotif;
      if (emailNotif?.sent) {
        toast.success('Registrasi ditolak. Notifikasi email berhasil dikirim');
      } else if (emailNotif && !emailNotif.sent) {
        toast.success('Registrasi ditolak, tapi email notifikasi gagal dikirim');
      } else {
        toast.success('Registrasi berhasil ditolak');
      }
      setShowRejectModal(false);
      setRejectingUser(null);
      setRejectReason('');
      fetchPending();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menolak registrasi');
    }
  };

  const handleAvatarError = (userId) => {
    setImgErrors(prev => {
      const next = new Set(prev);
      next.add(userId);
      return next;
    });
  };

  const fetchPegawai = async () => {
    setLoading(true);
    try {
      const params = { page: currentPage };
      if (search) params.search = search;
      if (filterJabatan) params.jabatan = filterJabatan;
      if (filterDivisi) params.divisi = filterDivisi;
      const res = await api.get('/pegawai', { params });
      setPegawai(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotalItems(res.data.pagination?.totalItems || 0);
    } catch (err) {
      toast.error('Gagal memuat data pegawai');
      setPegawai([]);
      setTotalPages(1);
      setTotalItems(0);
    }
    setLoading(false);
  };

  const handleOpenAdd = () => {
    setEditItem(null);
    setForm({ nip: '', nama: '', jabatan: '', divisi: '', email: '', nomor_hp: '', username: '', password: '' });
    setResetPassword({ enabled: false, newPassword: '', confirmPassword: '' });
    setAddStep(1);
    setOtpCode('');
    setOtpSent(false);
    setOtpCooldown(0);
    setOtpVerified(false);
    setOtpVerifying(false);
    setOtpError('');
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditItem(item);
    setForm({
      nip: item.nip || '',
      nama: item.nama || '',
      jabatan: item.jabatan || '',
      divisi: item.divisi || '',
      email: item.email || '',
      nomor_hp: item.nomor_hp || '',
      username: item.username || '',
      password: '',
    });
    setResetPassword({ enabled: false, newPassword: '', confirmPassword: '' });
    setShowModal(true);
  };

  // ========== STEP VALIDATION ==========
  const validateStep1 = () => {
    if (!form.nama.trim()) { toast.error('Nama wajib diisi'); return false; }
    if (!form.nip.trim()) { toast.error('NIP wajib diisi'); return false; }
    if (!form.email.trim()) { toast.error('Email wajib diisi'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) { toast.error('Format email tidak valid'); return false; }
    return true;
  };

  const validateStep3 = () => {
    if (!form.username.trim()) { toast.error('Username wajib diisi'); return false; }
    if (form.username.length < 3) { toast.error('Username minimal 3 karakter'); return false; }
    if (!form.password) { toast.error('Password wajib diisi'); return false; }
    if (form.password.length < 6) { toast.error('Password minimal 6 karakter'); return false; }
    return true;
  };

  // ========== OTP HANDLERS ==========
  const handleSendOtp = async () => {
    if (!form.email.trim()) { toast.error('Email wajib diisi terlebih dahulu'); return; }
    setOtpLoading(true);
    setOtpError('');
    try {
      const res = await api.post('/pegawai/send-otp', { email: form.email.trim() });
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

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) { setOtpError('Masukkan 6 digit kode verifikasi'); return; }
    setOtpVerifying(true);
    setOtpError('');
    try {
      const res = await api.post('/pegawai/verify-otp', { email: form.email.trim(), otp: otpCode });
      if (res.data.success) {
        setOtpVerified(true);
        toast.success('Email berhasil diverifikasi!');
      }
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Kode verifikasi salah');
    }
    setOtpVerifying(false);
  };

  const handleNextStep = () => {
    if (addStep === 1) {
      if (!validateStep1()) return;
      setAddStep(2);
      // Auto-send OTP when moving to step 2
      if (!otpSent) {
        setTimeout(() => handleSendOtp(), 300);
      }
    } else if (addStep === 2) {
      if (!otpVerified) { toast.error('Verifikasi email terlebih dahulu'); return; }
      setAddStep(3);
    }
  };

  // ========== SUBMIT (CREATE PEGAWAI) ==========
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    // Edit mode
    if (editItem) {
      if (!form.nama || !form.nip) { toast.error('NIP dan Nama wajib diisi'); return; }
      if (resetPassword.enabled) {
        if (!resetPassword.newPassword) { toast.error('Password baru wajib diisi'); return; }
        if (resetPassword.newPassword.length < 6) { toast.error('Password baru minimal 6 karakter'); return; }
        if (resetPassword.newPassword !== resetPassword.confirmPassword) { toast.error('Konfirmasi password tidak cocok'); return; }
      }

      setSaving(true);
      try {
        const updateData = { ...form };
        if (!updateData.password) delete updateData.password;
        if (resetPassword.enabled) updateData.password = resetPassword.newPassword;
        await api.put(`/pegawai/${editItem.id}`, updateData);
        toast.success(resetPassword.enabled ? 'Pegawai dan password berhasil diperbarui' : 'Pegawai berhasil diperbarui');
        setShowModal(false);
        fetchPegawai();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Terjadi kesalahan. Silakan coba lagi.');
      }
      setSaving(false);
      return;
    }

    // Add mode - final step
    if (!validateStep3()) return;
    if (!otpVerified) { toast.error('Email belum diverifikasi'); return; }

    setSaving(true);
    try {
      await api.post('/pegawai', form);
      toast.success('Pegawai berhasil ditambahkan. Akun login telah dibuat.');
      setShowModal(false);
      fetchPegawai();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Terjadi kesalahan. Silakan coba lagi.');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/pegawai/${deleteItem.id}`);
      toast.success('Pegawai dan akun login berhasil dihapus');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus pegawai');
    }
    setShowDelete(false);
    fetchPegawai();
    fetchPending();
  };

  const divisiColors = {
    'Produksi': 'bg-blue-100 text-blue-700',
    'Teknik': 'bg-amber-100 text-amber-700',
    'Berita': 'bg-emerald-100 text-emerald-700',
    'SDM': 'bg-purple-100 text-purple-700',
    'Keuangan': 'bg-rose-100 text-rose-700',
    'Program': 'bg-cyan-100 text-cyan-700',
    'IT': 'bg-indigo-100 text-indigo-700',
  };

  return (
    <div className="page-container">
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="page-title">Data Pegawai</h1>
          <p className="page-subtitle">Kelola data pegawai dan akun login TVRI Jawa Timur</p>
        </div>
      </div>

      {/* Pending Registration Approval (admin only) */}
      {(currentUser?.role === 'admin' || currentUser?.role === 'super_admin') && pendingUsers.length > 0 && (
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
                      onClick={() => { setRejectingUser(user); setShowRejectModal(true); }}
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

      {/* Filter & Tambah Pegawai */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} placeholder="Cari pegawai..." className="input-field pl-10" />
            </div>
            <DropdownSelect
              value={filterJabatan}
              onChange={(e) => { setFilterJabatan(e.target.value); setCurrentPage(1); }}
              options={jabatanList.map(j => ({ value: j, label: j }))}
              placeholder="Semua Jabatan"
              className="w-full sm:w-auto min-w-[160px]"
            />
            <DropdownSelect
              value={filterDivisi}
              onChange={(e) => { setFilterDivisi(e.target.value); setCurrentPage(1); }}
              options={divisiList.map(d => ({ value: d, label: d }))}
              placeholder="Semua Divisi"
              className="w-full sm:w-auto min-w-[160px]"
            />
          </div>
          <Button icon={FiPlus} onClick={handleOpenAdd}>Tambah Pegawai</Button>
        </div>
      </div>

      <div className="table-container">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F5F7FA]">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Pegawai</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">NIP</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Jabatan</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Divisi</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Username</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Kontak</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pegawai.map((item, idx) => (
                <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }} className="hover:bg-gray-50/50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#005BAC] to-[#003B71] flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{getInitials(item.nama)}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-800 block">{item.nama}</span>
                        <span className="text-xs text-gray-400">{item.user_role || 'operator'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 font-mono">{item.nip}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{item.jabatan || '-'}</td>
                  <td className="py-3 px-4">
                    <span className={`badge ${(divisiColors[item.divisi] || 'bg-gray-100 text-gray-700')}`}>{item.divisi || '-'}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <FiUser className="w-3 h-3 text-gray-400" />
                      <span className="text-sm text-gray-600 font-mono">{item.username || '-'}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-xs text-gray-500">
                      <div className="flex items-center gap-1"><FiMail className="w-3 h-3" />{item.email || '-'}</div>
                      <div className="flex items-center gap-1 mt-0.5"><FiPhone className="w-3 h-3" />{item.nomor_hp || '-'}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1">

                      <button onClick={() => handleOpenEdit(item)} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600" title="Edit"><FiEdit2 className="w-4 h-4" /></button>
                      <button onClick={() => { setDeleteItem(item); setShowDelete(true); }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500" title="Hapus"><FiTrash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {pegawai.length === 0 && !loading && (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <MdPeople className="w-12 h-12 text-gray-300" />
                      <p className="text-sm">Belum ada data pegawai</p>
                      <p className="text-xs text-gray-400">Klik "Tambah Pegawai" untuk menambahkan pegawai baru</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3 p-4">
          {pegawai.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <MdPeople className="w-12 h-12 text-gray-300" />
              <p className="text-sm mt-2">Belum ada data pegawai</p>
            </div>
          ) : (
            pegawai.map((item) => (
              <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#005BAC] to-[#003B71] flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">{getInitials(item.nama)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{item.nama}</p>
                    <p className="text-xs text-gray-400">{item.user_role || 'operator'}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleOpenEdit(item)} className="p-2 rounded-lg hover:bg-amber-50 text-amber-600"><FiEdit2 className="w-4 h-4" /></button>
                    <button onClick={() => { setDeleteItem(item); setShowDelete(true); }} className="p-2 rounded-lg hover:bg-red-50 text-red-500"><FiTrash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs text-gray-500">
                  <div><span className="text-gray-400">NIP:</span> <span className="font-mono text-gray-700">{item.nip || '-'}</span></div>
                  <div><span className="text-gray-400">Jabatan:</span> <span className="text-gray-700">{item.jabatan || '-'}</span></div>
                  <div><span className="text-gray-400">Divisi:</span> <span className={`badge ${divisiColors[item.divisi] || 'bg-gray-100 text-gray-700'} text-xs`}>{item.divisi || '-'}</span></div>
                  <div><span className="text-gray-400">Username:</span> <span className="font-mono text-gray-700">{item.username || '-'}</span></div>
                </div>
              </div>
            ))
          )}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} dari {totalItems} pegawai
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sebelumnya
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded-lg text-sm ${currentPage === page ? 'bg-[#005BAC] text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========== MODAL TAMBAH/EDIT PEGAWAI ========== */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Pegawai' : 'Tambah Pegawai Baru'} size="lg">
        {editItem ? (
          /* ===== EDIT MODE ===== */
          <form onSubmit={handleSubmit}>
            {/* Section: Data Login */}
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
                    <input type="text" value={editItem.username} className="input-field pl-10 bg-gray-50 text-gray-500" disabled />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Username tidak dapat diubah</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <div className="flex items-center gap-3 mt-1">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={resetPassword.enabled} onChange={(e) => setResetPassword({ ...resetPassword, enabled: e.target.checked, newPassword: '', confirmPassword: '' })} className="sr-only peer" />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#005BAC]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#005BAC]"></div>
                    </label>
                    <span className="text-sm text-gray-600">Ubah password</span>
                  </div>
                </div>
              </div>
              {resetPassword.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-9 mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Password Baru <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input type="password" value={resetPassword.newPassword} onChange={(e) => setResetPassword({ ...resetPassword, newPassword: e.target.value })} placeholder="Minimal 6 karakter" className="input-field pl-10" minLength={6} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Konfirmasi Password <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input type="password" value={resetPassword.confirmPassword} onChange={(e) => setResetPassword({ ...resetPassword, confirmPassword: e.target.value })} placeholder="Ulangi password baru" className="input-field pl-10" minLength={6} />
                    </div>
                    {resetPassword.newPassword && resetPassword.confirmPassword && (
                      <div className={`flex items-center gap-1.5 text-xs mt-1.5 ${resetPassword.newPassword === resetPassword.confirmPassword ? 'text-emerald-600' : 'text-red-500'}`}>
                        <FiCheck className="w-3 h-3" />
                        <span>{resetPassword.newPassword === resetPassword.confirmPassword ? 'Password cocok' : 'Password tidak cocok'}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="border-t border-gray-200 my-5"></div>
            {/* Section: Data Pribadi */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <MdPeople className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-800">Data Pegawai</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-9">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">NIP <span className="text-red-500">*</span></label>
                  <input type="text" value={form.nip} onChange={(e) => setForm({ ...form, nip: e.target.value })} placeholder="Masukkan NIP" className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Lengkap <span className="text-red-500">*</span></label>
                  <input type="text" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Masukkan nama lengkap" className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Jabatan</label>
                  <DropdownSelect
                    value={form.jabatan}
                    onChange={(e) => setForm({ ...form, jabatan: e.target.value })}
                    options={jabatanList.map(j => ({ value: j, label: j }))}
                    placeholder="Pilih jabatan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Divisi</label>
                  <DropdownSelect
                    value={form.divisi}
                    onChange={(e) => setForm({ ...form, divisi: e.target.value })}
                    options={divisiList.map(d => ({ value: d, label: d }))}
                    placeholder="Pilih divisi"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@gmail.com" className="input-field pl-10" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nomor HP</label>
                  <div className="relative">
                    <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input type="text" value={form.nomor_hp} onChange={(e) => setForm({ ...form, nomor_hp: e.target.value })} placeholder="08xxxxxxxxxx" className="input-field pl-10" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <Button variant="outline" onClick={() => setShowModal(false)}>Batal</Button>
              <Button type="submit" loading={saving}>Simpan Perubahan</Button>
            </div>
          </form>
        ) : (
          /* ===== ADD MODE - Multi Step ===== */
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
                    <input type="text" value={form.nip} onChange={(e) => setForm({ ...form, nip: e.target.value })} placeholder="Masukkan NIP" className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Lengkap <span className="text-red-500">*</span></label>
                    <input type="text" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Masukkan nama lengkap" className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Jabatan</label>
                    <DropdownSelect
                      value={form.jabatan}
                      onChange={(e) => setForm({ ...form, jabatan: e.target.value })}
                      options={jabatanList.map(j => ({ value: j, label: j }))}
                      placeholder="Pilih jabatan"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Divisi</label>
                    <DropdownSelect
                      value={form.divisi}
                      onChange={(e) => setForm({ ...form, divisi: e.target.value })}
                      options={divisiList.map(d => ({ value: d, label: d }))}
                      placeholder="Pilih divisi"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input type="email" value={form.email} onChange={(e) => { setForm({ ...form, email: e.target.value }); if (otpVerified) { setOtpVerified(false); setOtpSent(false); setOtpCode(''); } }} placeholder="email@gmail.com" className="input-field pl-10" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nomor HP</label>
                    <div className="relative">
                      <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input type="text" value={form.nomor_hp} onChange={(e) => setForm({ ...form, nomor_hp: e.target.value })} placeholder="08xxxxxxxxxx" className="input-field pl-10" />
                    </div>
                  </div>
                </div>
                <div className="flex justify-between pt-4 border-t border-gray-100">
                  <Button variant="outline" onClick={() => setShowModal(false)}>Batal</Button>
                  <Button onClick={handleNextStep}>Selanjutnya</Button>
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
                      <p className="text-sm font-bold text-blue-800 mt-1 break-all">{form.email}</p>
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
                          onClick={handleSendOtp}
                          disabled={otpCooldown > 0 || otpLoading}
                          className={`text-xs font-medium transition-colors ${otpCooldown > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-[#005BAC] hover:text-[#003B71]'}`}
                        >
                          {otpLoading ? 'Mengirim...' : otpCooldown > 0 ? `Kirim ulang (${otpCooldown}s)` : 'Kirim ulang kode'}
                        </button>
                        <button
                          type="button"
                          onClick={handleVerifyOtp}
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
                        onClick={handleNextStep}
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
                      <p className="text-xs text-emerald-600 mt-0.5 break-all">{form.email}</p>
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
                        <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '') })} placeholder="contoh: budi.santoso" className="input-field pl-10" minLength={3} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Password <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Minimal 6 karakter" className="input-field pl-10" minLength={6} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <div className="flex items-start gap-2">
                    <span className="text-base leading-none mt-0.5">⚠️</span>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      <strong>Penting:</strong> Catat username dan password ini. Akun akan langsung aktif setelah dibuat karena dibuat oleh admin.
                    </p>
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t border-gray-100">
                  <Button variant="outline" onClick={() => setAddStep(2)}>Kembali</Button>
                  <Button onClick={handleSubmit} loading={saving}>Buat Akun Pegawai</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>      {/* ========== KONFIRMASI HAPUS ========== */}
      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Hapus Pegawai"
        message={`Apakah Anda yakin ingin menghapus pegawai "${deleteItem?.nama}"? Akun login pegawai ini juga akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.`}
      />

      {/* ========== REJECT REGISTRATION MODAL ========== */}
      <Modal isOpen={showRejectModal} onClose={() => { setShowRejectModal(false); setRejectingUser(null); }} title="Tolak Registrasi" size="sm">
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-sm text-red-700">
              Menolak registrasi dari <strong>{rejectingUser?.nama}</strong> (@{rejectingUser?.username})
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
          <Button variant="outline" onClick={() => { setShowRejectModal(false); setRejectingUser(null); }}>Batal</Button>
          <Button onClick={handleReject} className="bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700">Tolak Registrasi</Button>
        </div>
      </Modal>
    </div>
  );
};

export default Pegawai;