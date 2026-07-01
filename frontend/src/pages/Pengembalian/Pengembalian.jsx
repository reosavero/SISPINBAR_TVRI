// ============================================
// PENGEMBALIAN PAGE - Sistem Peminjaman Barang TVRI
// Pegawai: Lihat peminjaman aktif → Kembalikan barang
// Admin: Proses dan kelola pengembalian
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiPackage, FiEdit2, FiTrash2, FiCornerDownLeft, FiCheckCircle, FiClock, FiRefreshCw } from 'react-icons/fi';
import { MdAssignmentTurnedIn } from 'react-icons/md';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { KONDISI_BARANG } from '../../utils/constants';
import CameraUpload from '../../components/ui/CameraUpload';
import { formatDate, getBarangFotoUrl } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Pengembalian = () => {
  const { isAdmin } = useAuth();
  const [peminjamanAktif, setPeminjamanAktif] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imgErrors, setImgErrors] = useState({});

  // Return modal
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedPeminjaman, setSelectedPeminjaman] = useState(null);

  // Edit modal
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

  // Delete confirm
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);

  // Foto state (return)
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoFile, setFotoFile] = useState(null);

  // Success state
  const [returnSuccess, setReturnSuccess] = useState(false);
  const [returnedItem, setReturnedItem] = useState(null);

  const [form, setForm] = useState({
    kondisi_barang: 'Baik',
    catatan: '',
  });

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch active peminjaman
      const peminjamanParams = { status: 'Menunggu Persetujuan,Disetujui,Dipinjam' };
      const peminjamanRes = await api.get('/peminjaman', { params: peminjamanParams });
      setPeminjamanAktif(peminjamanRes.data.data || []);
    } catch (err) {
      toast.error('Gagal memuat data peminjaman');
      setPeminjamanAktif([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  const fetchAvailableBarang = async () => {
    try {
      const res = await api.get('/barang/available');
      setAvailableBarang(res.data.data || res.data || []);
    } catch {
      setAvailableBarang([]);
    }
  };

  // ===== RETURN =====
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
      toast.error('Foto kondisi barang wajib diunggah sebagai bukti pengembalian');
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

      toast.success('Pengembalian berhasil diproses! Barang telah dikembalikan.');
      setReturnSuccess(true);
      setReturnedItem(res.data.data || selectedPeminjaman);
      setFotoPreview(null);
      setFotoFile(null);

      // Refresh data after short delay
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

  // ===== EDIT =====
  const handleOpenEdit = (item) => {
    setEditItem(item);
    setEditForm({
      barang_id: String(item.barang_id),
      jumlah: item.jumlah || 1,
      tanggal_pinjam: item.tanggal_pinjam ? item.tanggal_pinjam.split('T')[0] : '',
      tanggal_kembali_rencana: item.tanggal_kembali_rencana ? item.tanggal_kembali_rencana.split('T')[0] : '',
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

  // ===== DELETE =====
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

  // Get selected barang for edit form
  const selectedEditBarang = availableBarang.find(b => String(b.id) === String(editForm.barang_id));

  // Separate active peminjaman by status
  const menungguPersetujuan = peminjamanAktif.filter(p => p.status === 'Menunggu Persetujuan');
  const dipinjamItems = peminjamanAktif.filter(p => p.status === 'Dipinjam' || p.status === 'Disetujui');

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">{isAdmin ? 'Pengembalian Barang' : 'Pengembalian Saya'}</h1>
        <p className="page-subtitle">
          {isAdmin ? 'Proses dan kelola pengembalian barang' : 'Kembalikan barang yang Anda pinjam'}
        </p>
      </div>

      {/* ===== SECTION 1: SEDANG DIPINJAM (can be returned) ===== */}
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
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#F5F7FA]">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Barang</th>
                    {isAdmin && <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Pegawai</th>}
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Jumlah</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Tgl Pinjam</th>
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
                        <td className="py-3 px-4 text-sm text-gray-600">{formatDate(item.tanggal_pinjam)}</td>
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

            {/* Mobile Cards */}
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

      {/* ===== SECTION 2: MENUNGGU PERSETUJUAN (pegawai only) ===== */}
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
                      <td className="py-3 px-4 text-sm text-gray-600">{formatDate(item.tanggal_pinjam)}</td>
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
                    <div><span className="text-gray-400">Pinjam:</span> <span className="font-medium text-gray-700">{formatDate(item.tanggal_pinjam)}</span></div>
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

      {/* ===== RETURN MODAL ===== */}
      <Modal isOpen={showModal} onClose={handleCloseModal} title={returnSuccess ? 'Pengembalian Berhasil!' : 'Konfirmasi Pengembalian'} size="md">
        {returnSuccess ? (
          /* Success State */
          <div className="text-center py-6">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <FiCheckCircle className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Barang Berhasil Dikembalikan!</h3>
            <p className="text-sm text-gray-500 mb-4">
              Pengembalian <strong>{returnedItem?.barang_nama || selectedPeminjaman?.barang_nama}</strong> telah dicatat.
              {returnedItem?.kondisi_barang && returnedItem.kondisi_barang !== 'Baik' && (
                <span className="block mt-1 text-amber-600">Kondisi barang: {returnedItem.kondisi_barang}</span>
              )}
            </p>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 text-left">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400">No. Peminjaman</p>
                  <p className="font-semibold text-gray-800">{returnedItem?.nomor_peminjaman || selectedPeminjaman?.nomor_peminjaman}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Tgl Kembali</p>
                  <p className="font-semibold text-gray-800">{formatDate(new Date().toISOString())}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Kondisi</p>
                  <p className="font-semibold text-gray-800">{form.kondisi_barang}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Status</p>
                  <p className="font-semibold text-emerald-600">✓ Dikembalikan</p>
                </div>
              </div>
            </div>
            <Button variant="primary" onClick={handleCloseModal} className="min-h-[44px]">
              Selesai
            </Button>
          </div>
        ) : (
          /* Return Form */
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
                Foto Kondisi Barang <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-400 mb-2">Unggah foto sebagai bukti kondisi barang saat dikembalikan</p>
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

      {/* ===== EDIT MODAL ===== */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Peminjaman" size="md">
        {editItem && (
          <form onSubmit={handleEditSubmit}>
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-sm text-amber-700">
                <span className="font-semibold">Perhatian:</span> Peminjaman hanya bisa diedit selama status masih "Menunggu Persetujuan". Setelah disetujui, peminjaman tidak dapat diubah.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Barang <span className="text-red-500">*</span></label>
              <select
                value={editForm.barang_id}
                onChange={(e) => {
                  const newBarangId = e.target.value;
                  setEditForm(prev => ({ ...prev, barang_id: newBarangId, jumlah: 1 }));
                }}
                className="input-field"
                required
              >
                <option value="">Pilih Barang</option>
                {availableBarang.map(b => {
                  const isSameItem = String(b.id) === String(editItem?.barang_id);
                  const avail = b.tersedia != null ? b.tersedia : b.jumlah;
                  const displayAvail = isSameItem ? avail + (editItem?.jumlah || 1) : avail;
                  return (
                    <option key={b.id} value={b.id}>{b.nama_barang} — Tersedia: {displayAvail}</option>
                  );
                })}
              </select>
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
                      const isSameItem = String(selectedEditBarang.id) === String(editItem?.barang_id);
                      const avail = selectedEditBarang.tersedia != null ? selectedEditBarang.tersedia : selectedEditBarang.jumlah;
                      return isSameItem ? avail + (editItem?.jumlah || 1) : avail;
                    })()} unit</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Jumlah <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  value={editForm.jumlah}
                  onChange={(e) => setEditForm({ ...editForm, jumlah: parseInt(e.target.value) || 1 })}
                  className="input-field"
                  min="1"
                  max={(() => {
                    if (!selectedEditBarang) return 99;
                    const isSameItem = String(selectedEditBarang.id) === String(editItem?.barang_id);
                    const avail = selectedEditBarang.tersedia != null ? selectedEditBarang.tersedia : selectedEditBarang.jumlah;
                    return isSameItem ? avail + (editItem?.jumlah || 1) : avail;
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Foto Kondisi Saat Peminjaman</label>
              <p className="text-xs text-gray-400 mb-2">Unggah foto baru untuk mengganti, atau biarkan jika tidak ingin mengubah</p>
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

      {/* ===== DELETE CONFIRM ===== */}
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