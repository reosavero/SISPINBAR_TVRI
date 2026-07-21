

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FiPackage, FiEdit2, FiTrash2, FiCornerDownLeft, FiCheckCircle, FiClock, FiRefreshCw, FiCheck, FiX, FiEye, FiXCircle, FiCamera } from 'react-icons/fi';
import { MdAssignmentTurnedIn } from 'react-icons/md';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { KONDISI_BARANG } from '../../utils/constants';
import CameraUpload from '../../components/ui/CameraUpload';
import NumberInput from '../../components/ui/NumberInput';
import { formatDate, formatDatePukul, formatTimeAlways, getBarangFotoUrl, getPengembalianFotoUrl } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Pengembalian = () => {
  const { isAdmin } = useAuth();
  const [peminjamanAktif, setPeminjamanAktif] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imgErrors, setImgErrors] = useState({});

  
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedPeminjaman, setSelectedPeminjaman] = useState(null);

  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    barang_id: '', jumlah: 1, tanggal_pinjam: '', tanggal_kembali_rencana: '', keperluan: '',
  });
  const [editFotoPreview, setEditFotoPreview] = useState(null);
  const [editFotoFile, setEditFotoFile] = useState(null);
  const [editFotoLama, setEditFotoLama] = useState(null);
  const [availableBarang, setAvailableBarang] = useState([]);

  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);

  
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoFile, setFotoFile] = useState(null);

  
  const [returnSuccess, setReturnSuccess] = useState(false);
  const [returnedItem, setReturnedItem] = useState(null);

  
  const [menungguKonfirmasi, setMenungguKonfirmasi] = useState([]);
  const [confirmLoading, setConfirmLoading] = useState({});
  const [bulkConfirmLoading, setBulkConfirmLoading] = useState(false);

  
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectItem, setRejectItem] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);

  const [form, setForm] = useState({
    kondisi_barang: 'Baik',
    catatan: '',
  });

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const peminjamanParams = { status: 'Menunggu Persetujuan,Disetujui,Dipinjam,Menunggu Konfirmasi' };
      const peminjamanRes = await api.get('/peminjaman', { params: peminjamanParams });
      setPeminjamanAktif(peminjamanRes.data.data || []);

      
      if (isAdmin) {
        try {
          const res = await api.get('/pengembalian', { params: { status: 'Menunggu Konfirmasi' } });
          setMenungguKonfirmasi(res.data.data || []);
        } catch {
          setMenungguKonfirmasi([]);
        }
      }
    } catch (err) {
      toast.error('Gagal memuat data peminjaman');
      setPeminjamanAktif([]);
    }
    setLoading(false);
  }, [isAdmin]);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  const fetchAvailableBarang = async () => {
    try {
      const res = await api.get('/barang/available');
      setAvailableBarang(res.data.data || res.data || []);
    } catch {
      setAvailableBarang([]);
    }
  };

  
  const handleOpenReturn = (item) => {
    setSelectedPeminjaman(item);
    setForm({ kondisi_barang: 'Baik', catatan: '' });
    setFotoPreview(null);
    setFotoFile(null);
    setReturnSuccess(false);
    setReturnedItem(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fotoFile) {
      toast.error('Foto bukti pengembalian wajib diambil dari kamera');
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('peminjaman_id', selectedPeminjaman.id);
      formData.append('kondisi_barang', form.kondisi_barang);
      formData.append('catatan', form.catatan || '');
      formData.append('foto', fotoFile);

      const res = await api.post('/pengembalian', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Pengembalian berhasil dicatat! Menunggu konfirmasi admin bahwa barang telah diterima.');
      setReturnSuccess(true);
      setReturnedItem(res.data.data || selectedPeminjaman);
      setFotoPreview(null);
      setFotoFile(null);

      
      setTimeout(() => {
        fetchAllData();
      }, 500);
    } catch (err) {
      const message = err.response?.data?.message || 'Gagal memproses pengembalian';
      toast.error(message);
    }
    setSaving(false);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setReturnSuccess(false);
    setReturnedItem(null);
  };

  
  const handleConfirmReturn = async (pengembalianId) => {
    setConfirmLoading(prev => ({ ...prev, [pengembalianId]: true }));
    try {
      await api.put(`/pengembalian/${pengembalianId}/confirm`);
      toast.success('Barang berhasil dikonfirmasi diterima!');
      fetchAllData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengkonfirmasi pengembalian');
    }
    setConfirmLoading(prev => ({ ...prev, [pengembalianId]: false }));
  };

  
  const handleOpenDetail = async (pengembalianId) => {
    setDetailLoading(true);
    setShowDetailModal(true);
    try {
      const res = await api.get(`/pengembalian/${pengembalianId}`);
      setDetailData(res.data.data || null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memuat detail pengembalian');
      setShowDetailModal(false);
    }
    setDetailLoading(false);
  };

  
  const handleOpenReject = (item) => {
    setRejectItem(item);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectItem) return;
    setRejectLoading(true);
    try {
      await api.put(`/pengembalian/${rejectItem.id}/reject`, {
        catatan_admin: rejectReason || null,
      });
      toast.success('Pengembalian berhasil ditolak');
      setShowRejectModal(false);
      setRejectItem(null);
      setRejectReason('');
      fetchAllData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menolak pengembalian');
    }
    setRejectLoading(false);
  };

  
  const handleOpenEdit = (item) => {
    setEditItem(item);
    setEditForm({
      barang_id: String(item.barang_id),
      jumlah: item.jumlah || 1,
      tanggal_pinjam: item.tanggal_pinjam ? item.tanggal_pinjam.split('T')[0].split(' ')[0] : '',
      tanggal_kembali_rencana: item.tanggal_kembali_rencana ? item.tanggal_kembali_rencana.split('T')[0].split(' ')[0] : '',
      keperluan: item.keperluan || '',
    });
    setEditFotoPreview(item.foto ? getBarangFotoUrl(item.foto) : null);
    setEditFotoFile(null);
    setEditFotoLama(item.foto || null);
    fetchAvailableBarang();
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    const today = new Date().toISOString().split('T')[0];
    if (editForm.tanggal_pinjam < today) {
      toast.error('Tanggal pinjam tidak boleh sebelum hari ini');
      return;
    }
    setEditSaving(true);
    try {
      const formData = new FormData();
      formData.append('barang_id', editForm.barang_id);
      formData.append('jumlah', editForm.jumlah);
      formData.append('tanggal_pinjam', editForm.tanggal_pinjam);
      formData.append('tanggal_kembali_rencana', editForm.tanggal_kembali_rencana);
      formData.append('keperluan', editForm.keperluan);
      if (editFotoFile) {
        formData.append('foto', editFotoFile);
      } else {
        formData.append('foto_lama', editFotoLama || '');
      }

      await api.put(`/peminjaman/${editItem.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Peminjaman berhasil diperbarui');
      setShowEditModal(false);
      fetchAllData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui peminjaman');
    }
    setEditSaving(false);
  };

  
  const handleOpenDelete = (item) => {
    setDeleteItem(item);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/peminjaman/${deleteItem.id}/cancel`);
      toast.success('Peminjaman berhasil dibatalkan');
      setShowDeleteConfirm(false);
      setDeleteItem(null);
      fetchAllData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membatalkan peminjaman');
    }
  };

  
  const selectedEditBarang = availableBarang.find(b => String(b.id) === String(editForm.barang_id));

  
  const menungguPersetujuan = peminjamanAktif.filter(p => p.status === 'Menunggu Persetujuan');
  const dipinjamItems = peminjamanAktif.filter(p => p.status === 'Dipinjam' || p.status === 'Disetujui');
  const menungguKonfirmasiItems = peminjamanAktif.filter(p => p.status === 'Menunggu Konfirmasi');

  
  const groupedMenungguKonfirmasi = useMemo(() => {
    if (!isAdmin) return [];
    const groups = {};
    menungguKonfirmasi.forEach((item) => {
      const key = item.pegawai_id;
      if (!groups[key]) {
        groups[key] = {
          pegawai_id: item.pegawai_id,
          pegawai_nama: item.pegawai_nama,
          items: [],
        };
      }
      groups[key].items.push(item);
    });
    
    return Object.values(groups).filter(g => g.items.length >= 2);
  }, [isAdmin, menungguKonfirmasi]);

  
  const groupedKonfirmasiIds = useMemo(() => new Set(groupedMenungguKonfirmasi.flatMap(g => g.items.map(i => i.peminjaman_id))), [groupedMenungguKonfirmasi]);

  
  const handleBulkConfirm = async (group) => {
    const ids = group.items.map(item => item.id);
    setBulkConfirmLoading(true);
    try {
      const res = await api.post('/pengembalian/bulk-confirm', { ids });
      toast.success(res.data.message || `${ids.length} pengembalian berhasil dikonfirmasi`);
      fetchAllData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengkonfirmasi pengembalian');
    }
    setBulkConfirmLoading(false);
  };

  
  const renderAdminActions = (item, isGrouped = false) => {
    const isLoading = confirmLoading[item.id];
    return (
      <div className="flex items-center gap-1.5">
        {
}
        <button
          onClick={() => handleOpenDetail(item.id)}
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-blue-600 text-xs font-semibold transition-all duration-200 touch-manipulation ${isGrouped ? '' : 'min-h-[36px]'}`}
          title="Lihat Detail"
        >
          <FiEye className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Detail</span>
        </button>
        {
}
        <button
          onClick={() => handleConfirmReturn(item.id)}
          disabled={isLoading}
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-xs font-semibold shadow-sm shadow-emerald-200 hover:shadow-md transition-all duration-200 active:scale-95 disabled:opacity-50 touch-manipulation ${isGrouped ? '' : 'min-h-[36px]'}`}
          title="Terima Pengembalian"
        >
          {isLoading ? (
            <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <FiCheck className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">Terima</span>
        </button>
        {
}
        <button
          onClick={() => handleOpenReject(item)}
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-xs font-semibold shadow-sm shadow-red-200 hover:shadow-md transition-all duration-200 active:scale-95 touch-manipulation ${isGrouped ? '' : 'min-h-[36px]'}`}
          title="Tolak Pengembalian"
        >
          <FiX className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Tolak</span>
        </button>
      </div>
    );
  };

  
  const renderKondisiBadge = (kondisi) => {
    const colorMap = {
      'Baik': 'bg-emerald-50 text-emerald-700',
      'Rusak Ringan': 'bg-amber-50 text-amber-700',
      'Rusak Berat': 'bg-red-50 text-red-700',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorMap[kondisi] || 'bg-gray-50 text-gray-700'}`}>
        {kondisi}
      </span>
    );
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">{isAdmin ? 'Pengembalian Barang' : 'Pengembalian Saya'}</h1>
        <p className="page-subtitle">
          {isAdmin ? 'Proses dan kelola pengembalian barang' : 'Kembalikan barang yang Anda pinjam'}
        </p>
      </div>

      {
}
      <div className="bg-white rounded-2xl shadow-sm mb-6">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <FiCornerDownLeft className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-800">
                  {isAdmin ? 'Peminjaman Aktif' : 'Barang Sedang Dipinjam'}
                </h2>
                <p className="text-xs text-gray-500">
                  {dipinjamItems.length} barang dapat dikembalikan
                </p>
              </div>
            </div>
            <button onClick={fetchAllData} className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation" title="Refresh data">
              <FiRefreshCw className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {dipinjamItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <MdAssignmentTurnedIn className="w-12 h-12 text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">Tidak ada barang yang sedang dipinjam</p>
            <p className="text-xs text-gray-400 mt-1">Barang yang Anda pinjam akan muncul di sini</p>
          </div>
        ) : (
          <>
            {
}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#F5F7FA]">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Barang</th>
                    {isAdmin && <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Pegawai</th>}
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Jumlah</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Tgl Pinjam</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Pukul</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Rencana Kembali</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {dipinjamItems.map((item, idx) => {
                    const fotoUrl = item.barang_foto ? getBarangFotoUrl(item.barang_foto) : null;
                    const imgError = imgErrors[`aktif-${item.id}`];
                    const canReturn = item.status === 'Dipinjam' || item.status === 'Disetujui';
                    return (
                      <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }} className="hover:bg-gray-50/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                              {fotoUrl && !imgError ? (
                                <img src={fotoUrl} alt={item.barang_nama} className="w-full h-full object-cover" onError={() => setImgErrors(prev => ({ ...prev, [`aktif-${item.id}`]: true }))} />
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
                        {isAdmin && <td className="py-3 px-4 text-sm font-medium text-gray-800">{item.pegawai_nama}</td>}
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">{item.jumlah || 1}</span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {formatDate(item.tanggal_pinjam)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500 font-medium">
                          {formatTimeAlways(item.tanggal_pinjam)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{formatDate(item.tanggal_kembali_rencana)}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col items-start gap-0.5">
                            <Badge status={item.status} />
                            {item.status === 'Disetujui' && (
                              <span className="text-[10px] text-amber-600 font-medium">Belum diambil</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            {canReturn && (
                              <button
                                onClick={() => handleOpenReturn(item)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-xs font-semibold shadow-sm shadow-emerald-200 hover:shadow-md hover:shadow-emerald-200 transition-all duration-200 active:scale-95 touch-manipulation min-h-[36px]"
                              >
                                <FiCornerDownLeft className="w-3.5 h-3.5" />
                                Kembalikan
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {
}
            <div className="md:hidden space-y-3 p-4">
              {dipinjamItems.map((item) => {
                const fotoUrl = item.barang_foto ? getBarangFotoUrl(item.barang_foto) : null;
                const imgError = imgErrors[`aktif-${item.id}`];
                const canReturn = item.status === 'Dipinjam' || item.status === 'Disetujui';
                return (
                  <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                        {fotoUrl && !imgError ? (
                          <img src={fotoUrl} alt={item.barang_nama} className="w-full h-full object-cover" onError={() => setImgErrors(prev => ({ ...prev, [`aktif-${item.id}`]: true }))} />
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
                    {isAdmin && <p className="text-xs text-gray-500 mb-2">Pegawai: <span className="font-medium text-gray-700">{item.pegawai_nama}</span></p>}
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
                      <div><span className="text-gray-400">Jumlah:</span> <span className="font-medium text-gray-700">{item.jumlah || 1}</span></div>
                      <div><span className="text-gray-400">Pinjam:</span> <span className="font-medium text-gray-700">{formatDate(item.tanggal_pinjam)}</span></div>
                      <div><span className="text-gray-400">Pukul:</span> <span className="font-medium text-gray-700">{formatTimeAlways(item.tanggal_pinjam)}</span></div>
                      <div className="col-span-2"><span className="text-gray-400">Rencana Kembali:</span> <span className="font-medium text-gray-700">{formatDate(item.tanggal_kembali_rencana)}</span></div>
                    </div>
                    {canReturn && (
                      <button
                        onClick={() => handleOpenReturn(item)}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-200 hover:shadow-md transition-all duration-200 active:scale-95 flex items-center justify-center gap-1.5 touch-manipulation min-h-[44px]"
                      >
                        <FiCornerDownLeft className="w-4 h-4" />
                        Kembalikan Barang
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {
}
      {isAdmin && menungguKonfirmasi.length > 0 && (
        <>
          {
}
          {groupedMenungguKonfirmasi.length > 0 && (
            <div className="space-y-4 mb-4">
              <div className="flex items-center gap-2">
                <FiCheckCircle className="w-5 h-5 text-blue-500" />
                <h2 className="text-base font-bold text-gray-800">Menunggu Konfirmasi</h2>
                <span className="text-xs text-gray-400">{menungguKonfirmasi.length} pengembalian menunggu konfirmasi</span>
              </div>
              {groupedMenungguKonfirmasi.map((group) => (
                <div key={group.pegawai_id} className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden">
                  {
}
                  <div className="bg-blue-50 border-b border-blue-100 px-4 sm:px-5 py-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#005BAC] to-[#003B71] flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">{group.pegawai_nama?.charAt(0)?.toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">{group.pegawai_nama}</p>
                          <p className="text-xs text-blue-600 font-medium">{group.items.length} barang menunggu konfirmasi</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleBulkConfirm(group)}
                          disabled={bulkConfirmLoading}
                          className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-200 hover:shadow-md hover:shadow-emerald-200 transition-all duration-200 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 touch-manipulation min-h-[44px] sm:min-h-0"
                        >
                          <FiCheckCircle className="w-3.5 h-3.5" />
                          Setujui Semua
                        </button>
                      </div>
                    </div>
                  </div>
                  {
}
                  <div className="divide-y divide-gray-50">
                    {group.items.map((item) => {
                      const fotoUrl = item.barang_foto ? getBarangFotoUrl(item.barang_foto) : null;
                      const imgError = imgErrors[`konf-${item.id}`];
                      return (
                        <div key={item.id} className="flex items-center gap-4 px-4 sm:px-5 py-3 hover:bg-gray-50/50">
                          <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                            {fotoUrl && !imgError ? (
                              <img src={fotoUrl} alt={item.barang_nama} className="w-full h-full object-cover" onError={() => setImgErrors(prev => ({ ...prev, [`konf-${item.id}`]: true }))} />
                            ) : (
                              <FiPackage className="w-4 h-4 text-gray-300" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{item.barang_nama}</p>
                            <p className="text-xs text-gray-400">{item.kategori_nama} · {item.kondisi_barang} · {formatDatePukul(item.tanggal_kembali_aktual)}</p>
                          </div>
                          <div className="hidden sm:flex items-center gap-1.5">
                            {renderAdminActions(item, true)}
                          </div>
                          {
}
                          <div className="flex sm:hidden items-center gap-1">
                            <button onClick={() => handleOpenDetail(item.id)} className="p-2 rounded-lg hover:bg-blue-50 active:bg-blue-100 text-blue-600 touch-manipulation" title="Detail">
                              <FiEye className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleConfirmReturn(item.id)} disabled={confirmLoading[item.id]} className="p-2 rounded-lg hover:bg-emerald-50 active:bg-emerald-100 text-emerald-600 touch-manipulation disabled:opacity-50" title="Terima">
                              {confirmLoading[item.id] ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg> : <FiCheck className="w-4 h-4" />}
                            </button>
                            <button onClick={() => handleOpenReject(item)} className="p-2 rounded-lg hover:bg-red-50 active:bg-red-100 text-red-500 touch-manipulation" title="Tolak">
                              <FiX className="w-4 h-4" />
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

          {
}
          {(() => {
            const ungroupedItems = menungguKonfirmasi.filter(item => !groupedKonfirmasiIds.has(item.peminjaman_id));
            if (ungroupedItems.length === 0) return null;
            return (
              <div className="bg-white rounded-2xl shadow-sm mb-6">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <FiCheckCircle className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-gray-800">Menunggu Konfirmasi</h2>
                        <p className="text-xs text-gray-500">{ungroupedItems.length} barang menunggu konfirmasi penerimaan</p>
                      </div>
                    </div>
                  </div>
                </div>

                {
}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#F5F7FA]">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Barang</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Pegawai</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Kondisi</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Tgl Kembali</th>
                        <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {ungroupedItems.map((item) => {
                        const fotoUrl = item.barang_foto ? getBarangFotoUrl(item.barang_foto) : null;
                        const imgError = imgErrors[`konf-${item.id}`];
                        return (
                          <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gray-50/50">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                                  {fotoUrl && !imgError ? (
                                    <img src={fotoUrl} alt={item.barang_nama} className="w-full h-full object-cover" onError={() => setImgErrors(prev => ({ ...prev, [`konf-${item.id}`]: true }))} />
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
                            <td className="py-3 px-4">{renderKondisiBadge(item.kondisi_barang)}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{formatDatePukul(item.tanggal_kembali_aktual)}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-center">
                                {renderAdminActions(item)}
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {
}
                <div className="md:hidden space-y-3 p-4">
                  {ungroupedItems.map((item) => {
                    const fotoUrl = item.barang_foto ? getBarangFotoUrl(item.barang_foto) : null;
                    const imgError = imgErrors[`konf-${item.id}`];
                    return (
                      <div key={item.id} className="bg-blue-50/30 rounded-xl p-4 border border-blue-100">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                            {fotoUrl && !imgError ? (
                              <img src={fotoUrl} alt={item.barang_nama} className="w-full h-full object-cover" onError={() => setImgErrors(prev => ({ ...prev, [`konf-${item.id}`]: true }))} />
                            ) : (
                              <FiPackage className="w-6 h-6 text-gray-300" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{item.barang_nama}</p>
                            <p className="text-xs text-gray-400">{item.kategori_nama}</p>
                          </div>
                          {renderKondisiBadge(item.kondisi_barang)}
                        </div>
                        {isAdmin && <p className="text-xs text-gray-500 mb-2">Pegawai: <span className="font-medium text-gray-700">{item.pegawai_nama}</span></p>}
                        <div className="text-xs text-gray-500 mb-3">⏳ Dikembalikan: <span className="font-medium text-gray-700">{formatDatePukul(item.tanggal_kembali_aktual)}</span></div>
                        {
}
                        <div className="flex items-center gap-2 pt-3 border-t border-blue-200">
                          <button
                            onClick={() => handleOpenDetail(item.id)}
                            className="flex-1 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-blue-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 touch-manipulation min-h-[44px]"
                          >
                            <FiEye className="w-4 h-4" />
                            Detail
                          </button>
                          <button
                            onClick={() => handleConfirmReturn(item.id)}
                            disabled={confirmLoading[item.id]}
                            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-200 hover:shadow-md transition-all duration-200 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 touch-manipulation min-h-[44px]"
                          >
                            {confirmLoading[item.id] ? (
                              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            ) : (
                              <FiCheck className="w-4 h-4" />
                            )}
                            Terima
                          </button>
                          <button
                            onClick={() => handleOpenReject(item)}
                            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-xs font-bold shadow-sm shadow-red-200 hover:shadow-md transition-all duration-200 active:scale-95 flex items-center justify-center gap-1.5 touch-manipulation min-h-[44px]"
                          >
                            <FiX className="w-4 h-4" />
                            Tolak
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </>
      )}

      {
}
      {!isAdmin && menungguKonfirmasiItems.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm mb-6">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <FiCheckCircle className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-800">Menunggu Konfirmasi</h2>
                <p className="text-xs text-gray-500">{menungguKonfirmasiItems.length} barang menunggu konfirmasi admin</p>
              </div>
            </div>
          </div>

          <div className="md:hidden space-y-3 p-4">
            {menungguKonfirmasiItems.map((item) => {
              const fotoUrl = item.barang_foto ? getBarangFotoUrl(item.barang_foto) : null;
              const imgError = imgErrors[`mk-${item.id}`];
              return (
                <div key={item.id} className="bg-blue-50/30 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                      {fotoUrl && !imgError ? (
                        <img src={fotoUrl} alt={item.barang_nama} className="w-full h-full object-cover" onError={() => setImgErrors(prev => ({ ...prev, [`mk-${item.id}`]: true }))} />
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
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-2">
                    <div><span className="text-gray-400">Jumlah:</span> <span className="font-medium text-gray-700">{item.jumlah || 1}</span></div>
                    <div><span className="text-gray-400">Pinjam:</span> <span className="font-medium text-gray-700">{formatDatePukul(item.tanggal_pinjam)}</span></div>
                  </div>
                  <div className="text-xs text-blue-600 font-medium">⏳ Menunggu admin mengkonfirmasi penerimaan barang</div>
                </div>
              );
            })}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F5F7FA]">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Barang</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Jumlah</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Tgl Pinjam</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {menungguKonfirmasiItems.map((item) => {
                  const fotoUrl = item.barang_foto ? getBarangFotoUrl(item.barang_foto) : null;
                  const imgError = imgErrors[`mk-${item.id}`];
                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                            {fotoUrl && !imgError ? (
                              <img src={fotoUrl} alt={item.barang_nama} className="w-full h-full object-cover" onError={() => setImgErrors(prev => ({ ...prev, [`mk-${item.id}`]: true }))} />
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
                      <td className="py-3 px-4"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">{item.jumlah || 1}</span></td>
                      <td className="py-3 px-4 text-sm text-gray-600">{formatDatePukul(item.tanggal_pinjam)}</td>
                      <td className="py-3 px-4"><Badge status={item.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {
}
      {!isAdmin && menungguPersetujuan.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm mb-6">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <FiClock className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-800">Menunggu Persetujuan</h2>
                <p className="text-xs text-gray-500">{menungguPersetujuan.length} peminjaman menunggu persetujuan admin</p>
              </div>
            </div>
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F5F7FA]">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Barang</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Jumlah</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Tgl Pinjam</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Rencana Kembali</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {menungguPersetujuan.map((item) => {
                  const fotoUrl = item.barang_foto ? getBarangFotoUrl(item.barang_foto) : null;
                  const imgError = imgErrors[`pending-${item.id}`];
                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                            {fotoUrl && !imgError ? (
                              <img src={fotoUrl} alt={item.barang_nama} className="w-full h-full object-cover" onError={() => setImgErrors(prev => ({ ...prev, [`pending-${item.id}`]: true }))} />
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
                      <td className="py-3 px-4"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">{item.jumlah || 1}</span></td>
                      <td className="py-3 px-4 text-sm text-gray-600">{formatDatePukul(item.tanggal_pinjam)}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{formatDate(item.tanggal_kembali_rencana)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleOpenEdit(item)} className="p-2 rounded-lg hover:bg-blue-50 active:bg-blue-100 text-blue-600 touch-manipulation" title="Edit"><FiEdit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleOpenDelete(item)} className="p-2 rounded-lg hover:bg-red-50 active:bg-red-100 text-red-500 touch-manipulation" title="Batalkan"><FiTrash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3 p-4">
            {menungguPersetujuan.map((item) => {
              const fotoUrl = item.barang_foto ? getBarangFotoUrl(item.barang_foto) : null;
              const imgError = imgErrors[`pending-${item.id}`];
              return (
                <div key={item.id} className="bg-amber-50/50 rounded-xl p-4 border border-amber-100">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                      {fotoUrl && !imgError ? (
                        <img src={fotoUrl} alt={item.barang_nama} className="w-full h-full object-cover" onError={() => setImgErrors(prev => ({ ...prev, [`pending-${item.id}`]: true }))} />
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
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
                    <div><span className="text-gray-400">Jumlah:</span> <span className="font-medium text-gray-700">{item.jumlah || 1}</span></div>
                    <div><span className="text-gray-400">Pinjam:</span> <span className="font-medium text-gray-700">{formatDatePukul(item.tanggal_pinjam)}</span></div>
                    <div className="col-span-2"><span className="text-gray-400">Rencana Kembali:</span> <span className="font-medium text-gray-700">{formatDate(item.tanggal_kembali_rencana)}</span></div>
                  </div>
                  <div className="flex items-center gap-2 pt-3 border-t border-amber-200">
                    <button onClick={() => handleOpenEdit(item)} className="flex-1 py-2.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 active:bg-blue-200 transition-colors touch-manipulation min-h-[44px] flex items-center justify-center gap-1">
                      <FiEdit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button onClick={() => handleOpenDelete(item)} className="flex-1 py-2.5 rounded-xl bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 active:bg-red-200 transition-colors touch-manipulation min-h-[44px] flex items-center justify-center gap-1">
                      <FiTrash2 className="w-3.5 h-3.5" /> Batalkan
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {
}
      <Modal isOpen={showModal} onClose={handleCloseModal} title={returnSuccess ? 'Pengembalian Berhasil!' : 'Konfirmasi Pengembalian'} size="md">
        {returnSuccess ? (
          

          <div className="text-center py-6">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <FiCheckCircle className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Barang Berhasil Dikembalikan!</h3>
            <p className="text-sm text-gray-500 mb-4">
              Pengembalian <strong>{returnedItem?.barang_nama || selectedPeminjaman?.barang_nama}</strong> telah dicatat.
              <span className="block mt-1 text-blue-600 font-medium">Menunggu konfirmasi admin bahwa barang telah diterima.</span>
            </p>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 text-left">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400">No. Peminjaman</p>
                  <p className="font-semibold text-gray-800">{returnedItem?.nomor_peminjaman || selectedPeminjaman?.nomor_peminjaman}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Tgl Kembali</p>
                  <p className="font-semibold text-gray-800">{formatDatePukul(new Date().toISOString())}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Kondisi</p>
                  <p className="font-semibold text-gray-800">{form.kondisi_barang}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Status</p>
                  <p className="font-semibold text-blue-600">⏳ Menunggu Konfirmasi</p>
                </div>
              </div>
            </div>
            <Button variant="primary" onClick={handleCloseModal} className="min-h-[44px]">
              Selesai
            </Button>
          </div>
        ) : (
          

          <form onSubmit={handleSubmit}>
            <div className="mb-5 p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/60 border border-emerald-200/60 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                  <FiCornerDownLeft className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-800">No. Peminjaman</p>
                  <p className="text-xs font-semibold text-emerald-600">{selectedPeminjaman?.nomor_peminjaman}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
                <div>
                  <p className="text-xs text-gray-400">Barang</p>
                  <p className="font-semibold text-gray-800">{selectedPeminjaman?.barang_nama}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Jumlah</p>
                  <p className="font-semibold text-gray-800">{selectedPeminjaman?.jumlah || 1} unit</p>
                </div>
                {isAdmin && (
                  <div>
                    <p className="text-xs text-gray-400">Peminjam</p>
                    <p className="font-semibold text-gray-800">{selectedPeminjaman?.pegawai_nama}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-400">Rencana Kembali</p>
                  <p className="font-semibold text-gray-800">{formatDate(selectedPeminjaman?.tanggal_kembali_rencana)}</p>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Foto Bukti Pengembalian <span className="text-red-500">*</span>
              </label>
              <CameraUpload
                preview={fotoPreview}
                onFileSelect={(file, previewUrl) => { setFotoFile(file); setFotoPreview(previewUrl); }}
                onRemove={() => { setFotoFile(null); setFotoPreview(null); }}
                required
              />
            </div>

            <Select label="Kondisi Barang" name="kondisi_barang" value={form.kondisi_barang} onChange={(e) => setForm({...form, kondisi_barang: e.target.value})} options={Object.values(KONDISI_BARANG).map(k => ({ value: k, label: k }))} placeholder="" required />

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Catatan</label>
              <textarea name="catatan" value={form.catatan} onChange={(e) => setForm({...form, catatan: e.target.value})} placeholder="Catatan pengembalian (opsional)" rows={3} className="input-field" />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button variant="outline" onClick={handleCloseModal}>Batal</Button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold shadow-sm shadow-emerald-200 hover:shadow-md hover:shadow-emerald-200 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Memproses...
                  </>
                ) : (
                  <>
                    <FiCornerDownLeft className="w-4 h-4" />
                    Konfirmasi Pengembalian
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {
}
      <Modal isOpen={showDetailModal} onClose={() => { setShowDetailModal(false); setDetailData(null); }} title="Detail Pengembalian" size="md">
        {detailLoading ? (
          <div className="flex items-center justify-center py-12">
            <svg className="animate-spin w-8 h-8 text-[#005BAC]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : detailData ? (
          <div className="space-y-4">
            {
}
            {detailData.foto && (
              <div className="rounded-xl overflow-hidden bg-gray-100">
                <img
                  src={getPengembalianFotoUrl(detailData.foto)}
                  alt="Bukti Pengembalian"
                  className="w-full aspect-video object-contain"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
            )}

            {
}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <p className="text-lg font-bold text-[#005BAC]">{detailData.nomor_peminjaman || '-'}</p>
                <p className="text-sm text-gray-500">Dikembalikan {formatDatePukul(detailData.tanggal_kembali_aktual)}</p>
              </div>
              <Badge status={detailData.status} />
            </div>

            {
}
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-gray-500">Pegawai</p><p className="text-sm font-semibold">{detailData.pegawai_nama || '-'}</p></div>
              <div><p className="text-xs text-gray-500">Barang</p><p className="text-sm font-semibold">{detailData.barang_nama || '-'}</p></div>
              <div><p className="text-xs text-gray-500">Jumlah</p><p className="text-sm font-semibold">{detailData.jumlah || 1} unit</p></div>
              <div><p className="text-xs text-gray-500">Kondisi Barang</p><div className="mt-0.5">{renderKondisiBadge(detailData.kondisi_barang)}</div></div>
              <div><p className="text-xs text-gray-500">Tanggal Pinjam</p><p className="text-sm">{formatDatePukul(detailData.tanggal_pinjam)}</p></div>
              <div><p className="text-xs text-gray-500">Rencana Kembali</p><p className="text-sm">{formatDate(detailData.tanggal_kembali_rencana)}</p></div>
            </div>

            {
}
            {detailData.keperluan && (
              <div><p className="text-xs text-gray-500">Keperluan</p><p className="text-sm">{detailData.keperluan}</p></div>
            )}

            {
}
            {detailData.catatan && (
              <div><p className="text-xs text-gray-500">Catatan Pegawai</p><p className="text-sm">{detailData.catatan}</p></div>
            )}

            {
}
            {detailData.catatan_admin && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-600 font-medium">Alasan Penolakan</p>
                <p className="text-sm text-red-700 mt-0.5">{detailData.catatan_admin}</p>
              </div>
            )}

            {
}
            {detailData.status === 'Menunggu Konfirmasi' && (
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => { setShowDetailModal(false); setDetailData(null); handleConfirmReturn(detailData.id); }}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold shadow-sm shadow-emerald-200 hover:shadow-md transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <FiCheckCircle className="w-4 h-4" />
                  Terima
                </button>
                <button
                  onClick={() => { setShowDetailModal(false); setDetailData(null); handleOpenReject(detailData); }}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold shadow-sm shadow-red-200 hover:shadow-md transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <FiXCircle className="w-4 h-4" />
                  Tolak
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">Data tidak ditemukan</p>
          </div>
        )}
      </Modal>

      {
}
      <Modal isOpen={showRejectModal} onClose={() => { setShowRejectModal(false); setRejectItem(null); setRejectReason(''); }} title="Tolak Pengembalian" size="md">
        {rejectItem && (
          <div>
            {
}
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                  <FiXCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-red-800">Tolak Pengembalian Barang</p>
                  <p className="text-xs text-red-600 mt-1">
                    Jika ditolak, peminjaman akan kembali berstatus <strong>"Dipinjam"</strong> dan pegawai perlu mengembalikan ulang barang tersebut.
                  </p>
                </div>
              </div>
            </div>

            {
}
            <div className="mb-4 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                {rejectItem.barang_foto ? (
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <img src={getBarangFotoUrl(rejectItem.barang_foto)} alt={rejectItem.barang_nama} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <FiPackage className="w-5 h-5 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{rejectItem.barang_nama}</p>
                  <p className="text-xs text-gray-500">{rejectItem.kategori_nama}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                {isAdmin && (
                  <div>
                    <span className="text-gray-400">Pegawai:</span>{' '}
                    <span className="font-medium text-gray-700">{rejectItem.pegawai_nama}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-400">Kondisi:</span>{' '}
                  <span className="font-medium text-gray-700">{rejectItem.kondisi_barang}</span>
                </div>
                <div>
                  <span className="text-gray-400">Dikembalikan:</span>{' '}
                  <span className="font-medium text-gray-700">{formatDatePukul(rejectItem.tanggal_kembali_aktual)}</span>
                </div>
              </div>
            </div>

            {
}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Alasan Penolakan <span className="text-gray-400 text-xs">(opsional)</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Masukkan alasan penolakan, misalnya: Barang dalam kondisi rusak, bukti foto tidak jelas, dll."
                rows={3}
                className="input-field"
              />
              <p className="text-xs text-gray-400 mt-1">Alasan ini akan dikirimkan sebagai notifikasi kepada pegawai</p>
            </div>

            {
}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
              <Button variant="outline" onClick={() => { setShowRejectModal(false); setRejectItem(null); setRejectReason(''); }} className="flex-1 min-h-[44px]">
                Batal
              </Button>
              <button
                onClick={handleRejectConfirm}
                disabled={rejectLoading}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold shadow-sm shadow-red-200 hover:shadow-md transition-all duration-200 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]"
              >
                {rejectLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Memproses...
                  </>
                ) : (
                  <>
                    <FiXCircle className="w-4 h-4" />
                    Tolak Pengembalian
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {
}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Peminjaman" size="md">
        {editItem && (
          <form onSubmit={handleEditSubmit}>
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-sm text-amber-700">
                <span className="font-semibold">Perhatian:</span> Peminjaman hanya bisa diedit selama status masih "Menunggu Persetujuan". Setelah disetujui, peminjaman tidak dapat diubah.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Barang</label>
              <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                  {editItem.barang_foto ? (
                    <img src={getBarangFotoUrl(editItem.barang_foto)} alt={editItem.barang_nama} className="w-full h-full object-cover" onError={() => setImgErrors(prev => ({ ...prev, [`edit-${editItem.id}`]: true }))} />
                  ) : (
                    <FiPackage className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{editItem.barang_nama}</p>

                </div>
              </div>
            </div>

            {selectedEditBarang && (
              <div className="mb-4 p-3 bg-[#E8F1FA] rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
                    {selectedEditBarang.foto ? (
                      <img src={getBarangFotoUrl(selectedEditBarang.foto)} alt={selectedEditBarang.nama_barang} className="w-full h-full object-cover" />
                    ) : (
                      <FiPackage className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{selectedEditBarang.nama_barang}</p>
                    <p className="text-xs text-emerald-600 font-medium">Tersedia: {(() => {
                      const avail = selectedEditBarang.tersedia != null ? selectedEditBarang.tersedia : selectedEditBarang.jumlah;
                      return avail + (editItem?.jumlah || 1);
                    })()} unit</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <NumberInput
                  label="Jumlah"
                  value={editForm.jumlah}
                  onChange={(val) => setEditForm({ ...editForm, jumlah: val })}
                  min={1}
                  max={(() => {
                    if (!selectedEditBarang) return 99;
                    const avail = selectedEditBarang.tersedia != null ? selectedEditBarang.tersedia : selectedEditBarang.jumlah;
                    return avail + (editItem?.jumlah || 1);
                  })()}
                  hint={(() => {
                    if (!selectedEditBarang) return '';
                    const avail = selectedEditBarang.tersedia != null ? selectedEditBarang.tersedia : selectedEditBarang.jumlah;
                    return `Maks: ${avail + (editItem?.jumlah || 1)} unit`;
                  })()}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tanggal Pinjam <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={editForm.tanggal_pinjam}
                  onChange={(e) => setEditForm({ ...editForm, tanggal_pinjam: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Rencana Tgl Kembali <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={editForm.tanggal_kembali_rencana}
                onChange={(e) => setEditForm({ ...editForm, tanggal_kembali_rencana: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Keperluan <span className="text-red-500">*</span></label>
              <textarea
                value={editForm.keperluan}
                onChange={(e) => setEditForm({ ...editForm, keperluan: e.target.value })}
                placeholder="Jelaskan keperluan peminjaman"
                rows={3}
                className="input-field"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Foto Bukti Peminjaman</label>
              <CameraUpload
                preview={editFotoPreview}
                onFileSelect={(file, previewUrl) => { setEditFotoFile(file); setEditFotoPreview(previewUrl); }}
                onRemove={() => { setEditFotoFile(null); setEditFotoPreview(null); }}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>Batal</Button>
              <Button type="submit" loading={editSaving} icon={FiEdit2}>Simpan Perubahan</Button>
            </div>
          </form>
        )}
      </Modal>

      {
}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setDeleteItem(null); }}
        onConfirm={handleDeleteConfirm}
        title="Batalkan Peminjaman"
        message={`Apakah Anda yakin ingin membatalkan peminjaman "${deleteItem?.barang_nama}"? Tindakan ini tidak dapat dibatalkan.`}
        type="danger"
      />
    </div>
  );
};

export default Pengembalian;