// ============================================
// PEMINJAMAN PAGE - Sistem Peminjaman Barang TVRI
// ============================================
// Pegawai: Pilih kategori → Lihat barang → Ajukan pinjam
// Admin: Tabel penuh dengan approve/reject
// ============================================

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FiPlus, FiSearch, FiEye, FiCheck, FiX, FiPrinter, FiCalendar,
  FiArrowLeft, FiChevronRight, FiShoppingCart, FiPackage, FiCamera,
  FiCheckCircle, FiXCircle
} from 'react-icons/fi';
import {
  MdAssignment, MdCameraAlt, MdLaptop, MdComputer, MdMonitor, MdLocalPrintshop
} from 'react-icons/md';
import { HiMicrophone } from 'react-icons/hi';
import { GiVideoCamera } from 'react-icons/gi';
import { LuLightbulb, LuCable } from 'react-icons/lu';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import DropdownSelect from '../../components/ui/DropdownSelect';
import CameraUpload from '../../components/ui/CameraUpload';
import NumberInput from '../../components/ui/NumberInput';
import { formatDate, formatDatePukul, getBarangFotoUrl } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

// Icon mapping untuk kategori
const getCategoryIcon = (nama) => {
  const lower = (nama || '').toLowerCase();
  if (lower.includes('kamera') || lower.includes('camera')) return MdCameraAlt;
  if (lower.includes('laptop') || lower.includes('notebook')) return MdLaptop;
  if (lower.includes('mikrofon') || lower.includes('microphone') || lower.includes('mic') || lower.includes('audio')) return HiMicrophone;
  if (lower.includes('lighting') || lower.includes('lampu') || lower.includes('cahaya')) return LuLightbulb;
  if (lower.includes('tripod') || lower.includes('stabilizer')) return GiVideoCamera;
  if (lower.includes('komputer') || lower.includes('computer') || lower.includes('desktop')) return MdComputer;
  if (lower.includes('monitor') || lower.includes('display')) return MdMonitor;
  if (lower.includes('printer') || lower.includes('print')) return MdLocalPrintshop;
  if (lower.includes('kabel') || lower.includes('cable') || lower.includes('wire')) return LuCable;
  if (lower.includes('studio') || lower.includes('produksi') || lower.includes('peralatan')) return GiVideoCamera;
  return MdCameraAlt;
};

const categoryColors = [
  'from-blue-500 to-blue-600',
  'from-purple-500 to-purple-600',
  'from-emerald-500 to-emerald-600',
  'from-amber-500 to-amber-600',
  'from-rose-500 to-rose-600',
  'from-cyan-500 to-cyan-600',
  'from-indigo-500 to-indigo-600',
  'from-pink-500 to-pink-600',
  'from-teal-500 to-teal-600',
  'from-orange-500 to-orange-600',
];

const categoryBgColors = [
  'bg-blue-50', 'bg-purple-50', 'bg-emerald-50', 'bg-amber-50', 'bg-rose-50',
  'bg-cyan-50', 'bg-indigo-50', 'bg-pink-50', 'bg-teal-50', 'bg-orange-50',
];

const categoryTextColors = [
  'text-blue-600', 'text-purple-600', 'text-emerald-600', 'text-amber-600', 'text-rose-600',
  'text-cyan-600', 'text-indigo-600', 'text-pink-600', 'text-teal-600', 'text-orange-600',
];

const Peminjaman = () => {
  const { user, isAdmin } = useAuth();

  // ============ SHARED STATE ============
  const [peminjaman, setPeminjaman] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imgErrors, setImgErrors] = useState({});
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  // Detail & action modals
  const [showDetail, setShowDetail] = useState(false);
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [actionItem, setActionItem] = useState(null);

  // ============ PEGAWAI: KATEGORI VIEW ============
  const [categories, setCategories] = useState([]);
  const [selectedKategori, setSelectedKategori] = useState(null);
  const [barangKategori, setBarangKategori] = useState([]);
  const [barangLoading, setBarangLoading] = useState(false);
  const [showPinjamModal, setShowPinjamModal] = useState(false);
  const [selectedBarang, setSelectedBarang] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formPinjam, setFormPinjam] = useState({
    tanggal_pinjam: '',
    tanggal_kembali_rencana: '',
    keperluan: '',
    jumlah: 1,
  });

  // Pegawai pinjam foto state
  const [pinjamFotoPreview, setPinjamFotoPreview] = useState(null);
  const [pinjamFotoFile, setPinjamFotoFile] = useState(null);



  // ============ ADMIN: MODAL STATE ============
  const [pegawaiList, setPegawaiList] = useState([]);
  const [availableBarang, setAvailableBarang] = useState([]);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminForm, setAdminForm] = useState({
    pegawai_id: '', barang_id: '', jumlah: 1,
    tanggal_pinjam: '', tanggal_kembali_rencana: '', keperluan: '',
  });

  // Admin pinjam foto state
  const [adminFotoPreview, setAdminFotoPreview] = useState(null);
  const [adminFotoFile, setAdminFotoFile] = useState(null);


  // ============ FETCH DATA ============
  useEffect(() => { if (isAdmin) fetchPeminjaman(); }, [currentPage, search]);
  useEffect(() => {
    if (isAdmin) {
      fetchPegawai();
    } else {
      fetchCategories();
    }
  }, []);



  const fetchPeminjaman = async () => {
    setLoading(true);
    try {
      const params = { page: currentPage };
      if (search) params.search = search;
      params.status = 'Menunggu Persetujuan';
      const res = await api.get('/peminjaman', { params });
      setPeminjaman(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotalItems(res.data.pagination?.totalItems || 0);
    } catch {
      toast.error('Gagal memuat data peminjaman');
      setPeminjaman([]);
      setTotalPages(1);
      setTotalItems(0);
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    try {
      const [kategoriRes, availableRes] = await Promise.all([
        api.get('/kategori'),
        api.get('/barang/available'),
      ]);
      const allKategori = kategoriRes.data.data || [];
      const availableBarang = availableRes.data.data || [];
      // Filter: hanya tampilkan kategori yang punya barang tersedia
      const kategoriIdsWithBarang = new Set(availableBarang.map(b => String(b.kategori_id)));
      const filtered = allKategori.filter(cat => kategoriIdsWithBarang.has(String(cat.id)));
      setCategories(filtered);
    } catch {
      setCategories([]);
    }
  };

  const fetchBarangByKategori = async (kategoriId) => {
    setBarangLoading(true);
    try {
      // Fetch available barang filtered by kategori
      const res = await api.get('/barang/available');
      const allBarang = res.data.data || [];
      const filtered = allBarang.filter(b => String(b.kategori_id) === String(kategoriId));
      setBarangKategori(filtered);
    } catch {
      setBarangKategori([]);
    }
    setBarangLoading(false);
  };

  const fetchPegawai = async () => {
    try {
      const res = await api.get('/pegawai');
      setPegawaiList(res.data.data || []);
    } catch {
      setPegawaiList([]);
    }
  };

  const fetchAvailableBarang = async () => {
    try {
      const res = await api.get('/barang/available');
      setAvailableBarang(res.data.data || []);
    } catch {
      setAvailableBarang([]);
    }
  };

  // ============ PEGAWAI: KATEGORI CLICK ============
  const handleKategoriClick = (cat) => {
    setSelectedKategori(cat);
    fetchBarangByKategori(cat.id);
  };

  const handleBackToCategories = () => {
    setSelectedKategori(null);
    setBarangKategori([]);
  };

  // ============ PEGAWAI: PINJAM BARANG ============
  const handlePinjamClick = (barang) => {
    setSelectedBarang(barang);
    setFormPinjam({
      tanggal_pinjam: new Date().toISOString().split('T')[0],
      tanggal_kembali_rencana: '',
      keperluan: '',
      jumlah: 1,
    });
    setPinjamFotoPreview(null);
    setPinjamFotoFile(null);

    setShowPinjamModal(true);
  };

  const handlePinjamSubmit = async (e) => {
    e.preventDefault();
    if (!formPinjam.tanggal_pinjam || !formPinjam.tanggal_kembali_rencana) {
      toast.error('Tanggal pinjam dan tanggal kembali wajib diisi');
      return;
    }
    const maxJumlah = selectedBarang.tersedia != null ? selectedBarang.tersedia : selectedBarang.jumlah;
    if (formPinjam.jumlah < 1 || formPinjam.jumlah > maxJumlah) {
      toast.error(`Jumlah tidak boleh melebihi ${maxJumlah} unit tersedia`);
      return;
    }
    if (!formPinjam.keperluan) {
      toast.error('Keperluan wajib diisi');
      return;
    }
    if (!pinjamFotoFile) {
      toast.error('Foto bukti peminjaman wajib diambil dari kamera');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('barang_id', selectedBarang.id);
      formData.append('jumlah', formPinjam.jumlah);
      formData.append('tanggal_pinjam', formPinjam.tanggal_pinjam);
      formData.append('tanggal_kembali_rencana', formPinjam.tanggal_kembali_rencana);
      formData.append('keperluan', formPinjam.keperluan);
      if (pinjamFotoFile) {
        formData.append('foto', pinjamFotoFile);
      }
      await api.post('/peminjaman', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Peminjaman berhasil diajukan! Menunggu persetujuan admin.');
      setShowPinjamModal(false);
      setSelectedBarang(null);
      setPinjamFotoPreview(null);
      setPinjamFotoFile(null);
      fetchPeminjaman();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengajukan peminjaman');
    }
    setSaving(false);
  };

  // ============ ADMIN: BUAT PEMINJAMAN ============
  const handleAdminAdd = async () => {
    setAdminForm({
      pegawai_id: '', barang_id: '', jumlah: 1,
      tanggal_pinjam: new Date().toISOString().split('T')[0],
      tanggal_kembali_rencana: '', keperluan: '',
    });
    setAdminFotoPreview(null);
    setAdminFotoFile(null);

    await fetchAvailableBarang();
    setShowAdminModal(true);
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    if (!adminForm.pegawai_id || !adminForm.barang_id) {
      toast.error('Pilih pegawai dan barang');
      return;
    }
    if (!adminForm.tanggal_pinjam || !adminForm.tanggal_kembali_rencana) {
      toast.error('Tanggal pinjam dan tanggal kembali wajib diisi');
      return;
    }
    if (!adminForm.keperluan) {
      toast.error('Keperluan wajib diisi');
      return;
    }
    if (!adminFotoFile) {
      toast.error('Foto bukti peminjaman wajib diambil dari kamera');
      return;
    }
    // Validate jumlah against available stock
    const selectedBarangAdmin = availableBarang.find(b => String(b.id) === String(adminForm.barang_id));
    if (selectedBarangAdmin) {
      const maxJumlah = selectedBarangAdmin.tersedia != null ? selectedBarangAdmin.tersedia : selectedBarangAdmin.jumlah;
      if (adminForm.jumlah < 1 || adminForm.jumlah > maxJumlah) {
        toast.error(`Jumlah tidak boleh melebihi ${maxJumlah} unit tersedia`);
        return;
      }
    }

    setAdminSaving(true);
    try {
      const formData = new FormData();
      formData.append('pegawai_id', adminForm.pegawai_id);
      formData.append('barang_id', adminForm.barang_id);
      formData.append('jumlah', adminForm.jumlah);
      formData.append('tanggal_pinjam', adminForm.tanggal_pinjam);
      formData.append('tanggal_kembali_rencana', adminForm.tanggal_kembali_rencana);
      formData.append('keperluan', adminForm.keperluan);
      if (adminFotoFile) {
        formData.append('foto', adminFotoFile);
      }
      await api.post('/peminjaman', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Peminjaman berhasil dibuat');
      setShowAdminModal(false);
      setAdminFotoPreview(null);
      setAdminFotoFile(null);
      fetchPeminjaman();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membuat peminjaman');
    }
    setAdminSaving(false);
  };

  // ============ ADMIN: APPROVE / REJECT ============
  const handleApprove = async () => {
    try {
      await api.put(`/peminjaman/${actionItem.id}/approve`);
      toast.success('Peminjaman disetujui');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyetujui peminjaman');
    }
    setShowApprove(false);
    fetchPeminjaman();
  };

  const handleReject = async () => {
    try {
      await api.put(`/peminjaman/${actionItem.id}/reject`);
      toast.success('Peminjaman ditolak');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menolak peminjaman');
    }
    setShowReject(false);
    fetchPeminjaman();
  };

  // ===== HELPER: Render action buttons for admin (matches Pengembalian style) =====
  const renderAdminActions = (item, variant = 'default') => {
    const isPending = item.status === 'Menunggu Persetujuan';
    return (
      <div className="flex items-center gap-1.5">
        {/* Detail */}
        <button
          onClick={() => { setDetailItem(item); setShowDetail(true); }}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-blue-600 text-xs font-semibold transition-all duration-200 touch-manipulation min-h-[36px]"
          title="Lihat Detail"
        >
          <FiEye className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Detail</span>
        </button>
        {/* Setujui */}
        {isPending && (
          <button
            onClick={() => { setActionItem(item); setShowApprove(true); }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-xs font-semibold shadow-sm shadow-emerald-200 hover:shadow-md transition-all duration-200 active:scale-95 touch-manipulation min-h-[36px]"
            title="Setujui Peminjaman"
          >
            <FiCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Setujui</span>
          </button>
        )}
        {/* Tolak */}
        {isPending && (
          <button
            onClick={() => { setActionItem(item); setShowReject(true); }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-xs font-semibold shadow-sm shadow-red-200 hover:shadow-md transition-all duration-200 active:scale-95 touch-manipulation min-h-[36px]"
            title="Tolak Peminjaman"
          >
            <FiX className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tolak</span>
          </button>
        )}
        {/* Cetak */}
        {variant === 'full' && (
          <button
            onClick={() => handlePrint(item)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 active:bg-gray-200 text-gray-500 text-xs font-semibold transition-all duration-200 touch-manipulation min-h-[36px]"
            title="Cetak"
          >
            <FiPrinter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cetak</span>
          </button>
        )}
      </div>
    );
  };

  // ============ BULK ACTIONS ============
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Group pending items by pegawai
  const groupedPending = useMemo(() => {
    const pending = peminjaman.filter(p => p.status === 'Menunggu Persetujuan');
    const groups = {};
    pending.forEach(p => {
      const key = p.pegawai_id;
      if (!groups[key]) {
        groups[key] = {
          pegawai_id: p.pegawai_id,
          pegawai_nama: p.pegawai_nama,
          items: [],
        };
      }
      groups[key].items.push(p);
    });
    // Only show groups with 2+ items
    return Object.values(groups).filter(g => g.items.length >= 2);
  }, [peminjaman]);

  const handleBulkAction = async (pegawaiGroup, action) => {
    const ids = pegawaiGroup.items.map(p => p.id);
    const actionText = action === 'approve' ? 'menyetujui' : 'menolak';
    setBulkActionLoading(true);
    try {
      const res = await api.post('/peminjaman/bulk-action', { ids, action });
      toast.success(res.data.message || `${ids.length} peminjaman berhasil ${actionText}`);
      fetchPeminjaman();
    } catch (err) {
      toast.error(err.response?.data?.message || `Gagal ${actionText} peminjaman`);
    }
    setBulkActionLoading(false);
  };

  const handlePrint = (item) => {
    const printContent = `
      <html><head><title>Bukti Peminjaman</title></head><body style="font-family:Arial;padding:40px;">
      <h2 style="color:#005BAC;">TVRI JAWA TIMUR</h2><h3>BUKTI PEMINJAMAN BARANG</h3><hr/>
      <p><strong>No:</strong> ${item.nomor_peminjaman}</p>
      <p><strong>Pegawai:</strong> ${item.pegawai_nama}</p>
      <p><strong>Barang:</strong> ${item.barang_nama}</p>
      <p><strong>Jumlah:</strong> ${item.jumlah}</p>
      <p><strong>Tgl Pinjam:</strong> ${formatDatePukul(item.tanggal_pinjam)}</p>
      <p><strong>Tgl Kembali:</strong> ${formatDate(item.tanggal_kembali_rencana)}</p>
      <p><strong>Keperluan:</strong> ${item.keperluan}</p>
      <p><strong>Status:</strong> ${item.status}</p><br/><br/>
      <p>TTD Peminjam: _______________ &nbsp;&nbsp; TTD Admin: _______________</p>
      </body></html>`;
    const w = window.open('', '_blank');
    w.document.write(printContent);
    w.document.close();
    w.print();
  };

  // Stats


  // ============ PEGAWAI VIEW ============
  if (!isAdmin) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Peminjaman Barang</h1>
          <p className="page-subtitle">Pilih kategori barang, lalu ajukan peminjaman</p>
        </div>

        {/* KATEGORI VIEW or BARANG VIEW */}
        {!selectedKategori ? (
          /* ======= KATEGORI GRID ======= */
          <>
            <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800">Pilih Kategori Barang</h2>
                <span className="text-sm text-gray-500">{categories.length} kategori</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
              {categories.map((cat, idx) => {
                const IconComp = getCategoryIcon(cat.nama);
                return (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => handleKategoriClick(cat)}
                    className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all cursor-pointer group border border-transparent hover:border-[#005BAC]/20"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${categoryColors[idx % categoryColors.length]} flex items-center justify-center shadow-sm`}>
                        <IconComp className="w-6 h-6 text-white" />
                      </div>
                      <FiChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#005BAC] group-hover:translate-x-1 transition-all" />
                    </div>
                    <h3 className="text-base font-bold text-gray-800">{cat.nama}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{cat.deskripsi || 'Tidak ada deskripsi'}</p>
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs text-gray-400">{cat.total_barang || 0} barang</span>
                      <span className="text-xs font-medium text-[#005BAC] opacity-0 group-hover:opacity-100 transition-opacity">Lihat Barang →</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>


          </>
        ) : (
          /* ======= BARANG BY KATEGORI VIEW ======= */
          <>
            <button
              onClick={handleBackToCategories}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-gray-300 text-gray-700 hover:text-[#005BAC] transition-all group mb-4"
            >
              <FiArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span className="font-medium text-sm">Kembali ke Kategori</span>
            </button>

            {/* Kategori Header */}
            {(() => {
              const colorIdx = (categories.findIndex(c => c.id === selectedKategori.id)) % categoryColors.length;
              const IconComp = getCategoryIcon(selectedKategori.nama);
              return (
                <div className={`rounded-2xl p-6 mb-6 ${categoryBgColors[colorIdx >= 0 ? colorIdx : 0]}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${categoryColors[colorIdx >= 0 ? colorIdx : 0]} flex items-center justify-center shadow-lg`}>
                      <IconComp className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h1 className="text-2xl font-bold text-gray-800">{selectedKategori.nama}</h1>
                      <p className="text-sm text-gray-500 mt-1">{selectedKategori.deskripsi || 'Pilih barang yang ingin Anda pinjam'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-gray-800">{barangKategori.filter(b => b.status === 'Tersedia').length}</p>
                      <p className="text-xs text-gray-500">Tersedia</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Barang Cards */}
            {barangLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#005BAC]"></div>
                <span className="ml-3 text-gray-500">Memuat data barang...</span>
              </div>
            ) : barangKategori.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <FiPackage className="w-16 h-16 text-gray-200 mb-3" />
                <p className="text-lg font-medium text-gray-500">Tidak Ada Barang</p>
                <p className="text-sm">Belum ada barang dalam kategori "{selectedKategori.nama}"</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {barangKategori.map((barang, idx) => {
                  const tersedia = barang.tersedia != null ? barang.tersedia : (barang.jumlah || 1);
                  const isAvailable = tersedia > 0;
                  const fotoUrl = barang.foto ? getBarangFotoUrl(barang.foto) : null;
                  const imgError = imgErrors[barang.id];
                  const catColorIdx = (categories.findIndex(c => c.id === selectedKategori.id)) % categoryColors.length;
                  const safeCatColorIdx = catColorIdx >= 0 ? catColorIdx : 0;
                  const KategoriIcon = getCategoryIcon(selectedKategori.nama);
                  return (
                    <motion.div
                      key={barang.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all ${
                        isAvailable ? 'border-transparent hover:shadow-lg hover:border-[#005BAC]/20' : 'border-gray-100 opacity-75'
                      }`}
                    >
                      {/* Image */}
                      <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-50 overflow-hidden">
                        {fotoUrl && !imgError ? (
                          <img
                            src={fotoUrl}
                            alt={barang.nama_barang}
                            className="w-full h-full object-cover"
                            onError={() => setImgErrors(prev => ({ ...prev, [barang.id]: true }))}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${categoryColors[safeCatColorIdx]} flex items-center justify-center shadow-md`}>
                              <KategoriIcon className="w-7 h-7 text-white" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-bold text-gray-800 line-clamp-1 flex-1">{barang.nama_barang}</h3>
                          <Badge status={barang.kondisi} />
                        </div>
                        <p className="text-xs text-gray-400 mb-3 line-clamp-2">{barang.deskripsi || 'Tidak ada deskripsi'}</p>
                        <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                          <span>{barang.lokasi}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${tersedia > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                            Tersedia: {tersedia}/{barang.jumlah || 1}
                          </span>
                        </div>
                        {isAvailable ? (
                          <button
                            onClick={() => handlePinjamClick(barang)}
                            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#005BAC] to-[#003B71] text-white text-sm font-bold hover:from-[#006CC4] hover:to-[#004A8F] shadow-sm shadow-blue-200 hover:shadow-md hover:shadow-blue-200 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
                          >
                            <FiShoppingCart className="w-4 h-4" />
                            Ajukan Pinjam
                          </button>
                        ) : (
                          <div className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-400 text-sm font-medium text-center">
                            Tidak Tersedia
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ========== MODAL PINJAM BARANG (PEGAWAI) ========== */}
        <Modal isOpen={showPinjamModal} onClose={() => setShowPinjamModal(false)} title="Ajukan Peminjaman" size="md">
          {selectedBarang && (
            <form onSubmit={handlePinjamSubmit}>
              {/* Info Barang */}
              <div className="bg-[#E8F1FA] rounded-xl p-4 mb-5">
                <div className="flex items-center gap-3">
                  {(() => {
                    const fotoUrl = selectedBarang.foto ? getBarangFotoUrl(selectedBarang.foto) : null;
                    const imgError = imgErrors[`pinjam-${selectedBarang.id}`];
                    return (
                      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#005BAC] to-[#003B71] flex items-center justify-center">
                        {fotoUrl && !imgError ? (
                          <img src={fotoUrl} alt={selectedBarang.nama_barang} className="w-full h-full object-cover" onError={() => setImgErrors(prev => ({ ...prev, [`pinjam-${selectedBarang.id}`]: true }))} />
                        ) : (
                          <FiPackage className="w-6 h-6 text-white" />
                        )}
                      </div>
                    );
                  })()}
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{selectedBarang.nama_barang}</p>
                    <p className="text-xs text-gray-400">{selectedBarang.lokasi} · Kondisi: {selectedBarang.kondisi}</p>
                    <p className="text-xs text-emerald-600 font-medium">Tersedia: {selectedBarang.tersedia != null ? selectedBarang.tersedia : selectedBarang.jumlah} unit</p>
                  </div>
                </div>
              </div>

              {/* Peminjam */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Peminjam</label>
                <div className="input-field bg-gray-50 text-gray-600">{user?.nama}</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <NumberInput
                    label="Jumlah"
                    value={formPinjam.jumlah}
                    onChange={(val) => setFormPinjam({ ...formPinjam, jumlah: val })}
                    min={1}
                    max={selectedBarang.tersedia != null ? selectedBarang.tersedia : selectedBarang.jumlah}
                    hint={`Maks: ${selectedBarang.tersedia != null ? selectedBarang.tersedia : selectedBarang.jumlah} unit`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <span className="flex items-center gap-1"><FiCalendar className="w-3.5 h-3.5" /> Tanggal Pinjam <span className="text-red-500">*</span></span>
                  </label>
                  <input
                    type="date"
                    value={formPinjam.tanggal_pinjam}
                    onChange={(e) => setFormPinjam({ ...formPinjam, tanggal_pinjam: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <span className="flex items-center gap-1"><FiCalendar className="w-3.5 h-3.5" /> Tanggal Kembali <span className="text-red-500">*</span></span>
                  </label>
                  <input
                    type="date"
                    value={formPinjam.tanggal_kembali_rencana}
                    onChange={(e) => setFormPinjam({ ...formPinjam, tanggal_kembali_rencana: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Keperluan <span className="text-red-500">*</span></label>
                  <textarea
                    value={formPinjam.keperluan}
                    onChange={(e) => setFormPinjam({ ...formPinjam, keperluan: e.target.value })}
                    placeholder="Jelaskan keperluan peminjaman"
                    rows={3}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              {/* Foto Bukti Peminjaman */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Foto Bukti Peminjaman <span className="text-red-500">*</span>
                </label>
                <CameraUpload
                  preview={pinjamFotoPreview}
                  onFileSelect={(file, previewUrl) => { setPinjamFotoFile(file); setPinjamFotoPreview(previewUrl); }}
                  onRemove={() => { setPinjamFotoFile(null); setPinjamFotoPreview(null); }}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <Button variant="outline" onClick={() => setShowPinjamModal(false)}>Batal</Button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#005BAC] to-[#003B71] hover:from-[#006CC4] hover:to-[#004A8F] text-white font-semibold shadow-sm shadow-blue-200 hover:shadow-md hover:shadow-blue-200 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <FiShoppingCart className="w-4 h-4" />
                      Ajukan Pinjam
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </Modal>

        {/* ========== MODAL DETAIL (PEGAWAI) ========== */}
        <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Detail Peminjaman" size="md">
          {detailItem && (
            <div className="space-y-4">
              {detailItem.foto && (
                <div className="rounded-xl overflow-hidden bg-gray-100 mb-2">
                  <img src={getBarangFotoUrl(detailItem.foto)} alt="Foto bukti peminjaman" className="w-full aspect-video object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
                </div>
              )}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <p className="text-lg font-bold text-[#005BAC]">{detailItem.nomor_peminjaman}</p>
                  <p className="text-sm text-gray-500">{formatDatePukul(detailItem.tanggal_pinjam)}</p>
                </div>
                <Badge status={detailItem.status} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-500">Barang</p><p className="text-sm font-semibold">{detailItem.barang_nama}</p></div>
                <div><p className="text-xs text-gray-500">Jumlah</p><p className="text-sm font-semibold">{detailItem.jumlah}</p></div>
                <div><p className="text-xs text-gray-500">Tanggal Pinjam</p><p className="text-sm">{formatDatePukul(detailItem.tanggal_pinjam)}</p></div>
                <div><p className="text-xs text-gray-500">Tgl Kembali (Rencana)</p><p className="text-sm">{formatDate(detailItem.tanggal_kembali_rencana)}</p></div>
              </div>
              <div><p className="text-xs text-gray-500">Keperluan</p><p className="text-sm">{detailItem.keperluan}</p></div>
            </div>
          )}
        </Modal>

        {/* ========== MODAL DETAIL (PEGAWAI) ========== */}
      </div>
    );
  }

  // ============ ADMIN VIEW ============
  // IDs of pending items shown in groups (to mark in table)
  const groupedPendingIds = useMemo(() => new Set(groupedPending.flatMap(g => g.items.map(i => i.id))), [groupedPending]);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Peminjaman Barang</h1>
        <p className="page-subtitle">Kelola peminjaman barang inventaris</p>
      </div>

      <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm mb-3 sm:mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex flex-1 items-center gap-2 sm:gap-3">
            <div className="relative flex-1 w-full sm:max-w-md">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} placeholder="Cari peminjaman..." className="input-field pl-10" />
            </div>
          </div>
          <Button icon={FiPlus} onClick={handleAdminAdd}>Buat Peminjaman</Button>
        </div>
      </div>

      {/* ======= GROUPED PENDING REQUESTS ======= */}
      {groupedPending.length > 0 && (
        <div className="space-y-4 mb-4">
          <div className="flex items-center gap-2">
            <FiCheckCircle className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-gray-800">Menunggu Persetujuan</h2>
            <span className="text-xs text-gray-400">{groupedPending.reduce((acc, g) => acc + g.items.length, 0)} permintaan dari {groupedPending.length} pegawai</span>
          </div>
          {groupedPending.map((group) => (
            <div key={group.pegawai_id} className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden">
              {/* Group header */}
              <div className="bg-amber-50 border-b border-amber-100 px-4 sm:px-5 py-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#005BAC] to-[#003B71] flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">{group.pegawai_nama?.charAt(0)?.toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{group.pegawai_nama}</p>
                      <p className="text-xs text-amber-600 font-medium">{group.items.length} barang menunggu persetujuan</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleBulkAction(group, 'approve')}
                      disabled={bulkActionLoading}
                      className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-200 hover:shadow-md hover:shadow-emerald-200 transition-all duration-200 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 touch-manipulation min-h-[44px] sm:min-h-0"
                    >
                      <FiCheckCircle className="w-3.5 h-3.5" />
                      Setujui Semua
                    </button>
                    <button
                      onClick={() => handleBulkAction(group, 'reject')}
                      disabled={bulkActionLoading}
                      className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-xs font-bold shadow-sm shadow-red-200 hover:shadow-md hover:shadow-red-200 transition-all duration-200 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 touch-manipulation min-h-[44px] sm:min-h-0"
                    >
                      <FiXCircle className="w-3.5 h-3.5" />
                      Tolak Semua
                    </button>
                  </div>
                </div>
              </div>
              {/* Items list */}
              <div className="divide-y divide-gray-50">
                {group.items.map((item) => {
                  const fotoUrl = item.barang_foto ? getBarangFotoUrl(item.barang_foto) : null;
                  const imgError = imgErrors[`group-${item.id}`];
                  return (
                    <div key={item.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50/50">
                      <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                        {fotoUrl && !imgError ? (
                          <img src={fotoUrl} alt={item.barang_nama} className="w-full h-full object-cover" onError={() => setImgErrors(prev => ({ ...prev, [`group-${item.id}`]: true }))} />
                        ) : (
                          <FiPackage className="w-4 h-4 text-gray-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{item.barang_nama}</p>
                        <p className="text-xs text-gray-400">{item.kategori_nama} · {item.jumlah || 1} unit · {formatDatePukul(item.tanggal_pinjam)}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => { setDetailItem(item); setShowDetail(true); }} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-blue-600 text-xs font-semibold transition-all duration-200 touch-manipulation min-h-[36px]" title="Detail">
                          <FiEye className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Detail</span>
                        </button>
                        <button onClick={() => { setActionItem(item); setShowApprove(true); }} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-xs font-semibold shadow-sm shadow-emerald-200 hover:shadow-md transition-all duration-200 active:scale-95 touch-manipulation min-h-[36px]" title="Setujui">
                          <FiCheck className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Setujui</span>
                        </button>
                        <button onClick={() => { setActionItem(item); setShowReject(true); }} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-xs font-semibold shadow-sm shadow-red-200 hover:shadow-md transition-all duration-200 active:scale-95 touch-manipulation min-h-[36px]" title="Tolak">
                          <FiX className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Tolak</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="table-container">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F5F7FA]">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Barang</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Pegawai</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Jumlah</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Tgl Pinjam</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Tgl Kembali</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {peminjaman.length === 0 && !loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <MdAssignment className="w-12 h-12 text-gray-300" />
                      <p className="text-sm">Belum ada data peminjaman</p>
                    </div>
                  </td>
                </tr>
              ) : (
                peminjaman.map((item, idx) => {
                  const fotoUrl = item.barang_foto ? getBarangFotoUrl(item.barang_foto) : null;
                  const imgError = imgErrors[`admin-${item.id}`];
                  const isGrouped = groupedPendingIds.has(item.id);
                  return (
                    <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }} className={`${isGrouped ? 'bg-amber-50/40' : 'hover:bg-gray-50/50'}`}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                            {fotoUrl && !imgError ? (
                              <img src={fotoUrl} alt={item.barang_nama} className="w-full h-full object-cover" onError={() => setImgErrors(prev => ({ ...prev, [`admin-${item.id}`]: true }))} />
                            ) : (
                              <FiPackage className="w-5 h-5 text-gray-300" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{item.barang_nama}</p>
                            <p className="text-xs text-gray-400">{item.kategori_nama}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-800">{item.pegawai_nama}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">{item.jumlah || 1}</span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{formatDatePukul(item.tanggal_pinjam)}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{formatDate(item.tanggal_kembali_rencana)}</td>
                      <td className="py-3 px-4"><Badge status={item.status} /></td>
                      <td className="py-3 px-4">
                        {renderAdminActions(item, 'full')}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3 p-4">
          {peminjaman.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <MdAssignment className="w-12 h-12 text-gray-300" />
              <p className="text-sm mt-2">Belum ada data peminjaman</p>
            </div>
          ) : (
            peminjaman.map((item) => {
              const fotoUrl = item.barang_foto ? getBarangFotoUrl(item.barang_foto) : null;
              const imgError = imgErrors[`admin-${item.id}`];
              return (
                <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                      {fotoUrl && !imgError ? (
                        <img src={fotoUrl} alt={item.barang_nama} className="w-full h-full object-cover" onError={() => setImgErrors(prev => ({ ...prev, [`admin-${item.id}`]: true }))} />
                      ) : (
                        <FiPackage className="w-6 h-6 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{item.barang_nama}</p>
                      <p className="text-xs text-gray-400">{item.kategori_nama}</p>
                    </div>
                    <Badge status={item.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs text-gray-500 mb-3">
                    <div><span className="text-gray-400">Pegawai:</span> <span className="font-medium text-gray-700">{item.pegawai_nama}</span></div>
                    <div><span className="text-gray-400">Jumlah:</span> <span className="font-medium text-gray-700">{item.jumlah || 1}</span></div>
                    <div><span className="text-gray-400">Pinjam:</span> <span className="font-medium text-gray-700">{formatDatePukul(item.tanggal_pinjam)}</span></div>
                    <div><span className="text-gray-400">Kembali:</span> <span className="font-medium text-gray-700">{formatDate(item.tanggal_kembali_rencana)}</span></div>
                  </div>
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    {renderAdminActions(item, 'full')}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={totalItems} itemsPerPage={itemsPerPage} />
      </div>

      {/* Admin Create Modal */}
      <Modal isOpen={showAdminModal} onClose={() => setShowAdminModal(false)} title="Buat Peminjaman" size="lg">
        <form onSubmit={handleAdminSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Pegawai <span className="text-red-500">*</span></label>
              <DropdownSelect
                value={adminForm.pegawai_id}
                onChange={(e) => setAdminForm({ ...adminForm, pegawai_id: e.target.value })}
                options={pegawaiList.map(p => ({ value: p.id, label: `${p.nama} — ${p.divisi || 'Tanpa divisi'}` }))}
                placeholder="Pilih pegawai"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Barang <span className="text-red-500">*</span></label>
              <DropdownSelect
                value={adminForm.barang_id}
                onChange={(e) => setAdminForm({ ...adminForm, barang_id: e.target.value, jumlah: 1 })}
                options={availableBarang.map(b => ({ value: b.id, label: `${b.nama_barang} (Tersedia: ${b.tersedia != null ? b.tersedia : b.jumlah})` }))}
                placeholder="Pilih barang"
              />
            </div>
            <div>
              <NumberInput
                label="Jumlah"
                value={adminForm.jumlah}
                onChange={(val) => setAdminForm({ ...adminForm, jumlah: val })}
                min={1}
                max={(() => { const sel = availableBarang.find(b => String(b.id) === String(adminForm.barang_id)); return sel ? (sel.tersedia != null ? sel.tersedia : sel.jumlah) : 1; })()}
                hint={(() => { const sel = availableBarang.find(b => String(b.id) === String(adminForm.barang_id)); return sel ? `Maks: ${sel.tersedia != null ? sel.tersedia : sel.jumlah} unit` : ''; })()}
                required
              />
            </div>
            <div></div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tanggal Pinjam <span className="text-red-500">*</span></label>
              <input type="date" value={adminForm.tanggal_pinjam} onChange={(e) => setAdminForm({ ...adminForm, tanggal_pinjam: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tanggal Kembali <span className="text-red-500">*</span></label>
              <input type="date" value={adminForm.tanggal_kembali_rencana} onChange={(e) => setAdminForm({ ...adminForm, tanggal_kembali_rencana: e.target.value })} className="input-field" required />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Keperluan <span className="text-red-500">*</span></label>
              <textarea value={adminForm.keperluan} onChange={(e) => setAdminForm({ ...adminForm, keperluan: e.target.value })} placeholder="Jelaskan keperluan peminjaman" rows={3} className="input-field" required />
            </div>

            {/* Foto Bukti Peminjaman */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Foto Bukti Peminjaman <span className="text-red-500">*</span>
              </label>
              <CameraUpload
                preview={adminFotoPreview}
                onFileSelect={(file, previewUrl) => { setAdminFotoFile(file); setAdminFotoPreview(previewUrl); }}
                onRemove={() => { setAdminFotoFile(null); setAdminFotoPreview(null); }}
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={() => setShowAdminModal(false)}>Batal</Button>
            <Button type="submit" loading={adminSaving}>Buat Peminjaman</Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal (Admin) */}
      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Detail Peminjaman" size="md">
        {detailItem && (
          <div className="space-y-4">
            {/* Foto bukti peminjaman */}
            {detailItem.foto && (
              <div className="rounded-xl overflow-hidden bg-gray-100 mb-2">
                <img src={getBarangFotoUrl(detailItem.foto)} alt="Foto bukti peminjaman" className="w-full aspect-video object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
              </div>
            )}
            {/* Foto barang */}
            {(() => {
              const fotoUrl = detailItem.barang_foto ? getBarangFotoUrl(detailItem.barang_foto) : null;
              const imgErr = imgErrors[`detail-admin-${detailItem.id}`];
              return fotoUrl && !imgErr ? (
                <div className="rounded-xl overflow-hidden bg-gray-100 mb-2">
                  <img src={fotoUrl} alt={detailItem.barang_nama} className="w-full aspect-[4/3] object-cover" onError={() => setImgErrors(prev => ({ ...prev, [`detail-admin-${detailItem.id}`]: true }))} />
                </div>
              ) : null;
            })()}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <p className="text-lg font-bold text-[#005BAC]">{detailItem.nomor_peminjaman}</p>
                <p className="text-sm text-gray-500">{formatDatePukul(detailItem.tanggal_pinjam)}</p>
              </div>
              <Badge status={detailItem.status} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-gray-500">Pegawai</p><p className="text-sm font-semibold">{detailItem.pegawai_nama}</p></div>
              <div><p className="text-xs text-gray-500">Barang</p><p className="text-sm font-semibold">{detailItem.barang_nama}</p></div>
              <div><p className="text-xs text-gray-500">Jumlah</p><p className="text-sm font-semibold">{detailItem.jumlah || 1} unit</p></div>
              <div><p className="text-xs text-gray-500">Tanggal Pinjam</p><p className="text-sm">{formatDatePukul(detailItem.tanggal_pinjam)}</p></div>
              <div><p className="text-xs text-gray-500">Tgl Kembali (Rencana)</p><p className="text-sm">{formatDate(detailItem.tanggal_kembali_rencana)}</p></div>
            </div>
            <div><p className="text-xs text-gray-500">Keperluan</p><p className="text-sm">{detailItem.keperluan}</p></div>
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={showApprove} onClose={() => setShowApprove(false)} onConfirm={handleApprove} title="Setujui Peminjaman" message={`Apakah Anda yakin ingin menyetujui peminjaman "${actionItem?.nomor_peminjaman}"?`} type="info" />
      <ConfirmDialog isOpen={showReject} onClose={() => setShowReject(false)} onConfirm={handleReject} title="Tolak Peminjaman" message={`Apakah Anda yakin ingin menolak peminjaman "${actionItem?.nomor_peminjaman}"?`} type="danger" />

    </div>
  );
};

export default Peminjaman;