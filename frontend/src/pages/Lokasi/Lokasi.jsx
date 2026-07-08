// ============================================
// LOKASI PAGE - Sistem Peminjaman Barang TVRI
// Kelola Lokasi Barang — CRUD modern Data Table
// Akses: Super Admin & Admin only
// ============================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlus, FiSearch, FiEdit2, FiTrash2, FiEye, FiMapPin,
  FiLayers, FiBox, FiCheckCircle, FiXCircle, FiArrowLeft,
} from 'react-icons/fi';
import { MdLocationOn, MdOutlineFolderOff, MdBusiness } from 'react-icons/md';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import { STATUS_LOKASI } from '../../utils/constants';
import lokasiService from '../../services/lokasiService';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  Aktif: { label: 'Aktif', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  'Tidak Aktif': { label: 'Tidak Aktif', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
};

const Lokasi = () => {
  // Data state
  const [lokasiList, setLokasiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterGedung, setFilterGedung] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  // Gedung list for filter (derived from data)
  const [gedungOptions, setGedungOptions] = useState([]);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [saving, setSaving] = useState(false);

  // Detail: barang list
  const [detailBarang, setDetailBarang] = useState([]);
  const [detailBarangLoading, setDetailBarangLoading] = useState(false);

  // Form state
  const [form, setForm] = useState({
    nama_lokasi: '',
    gedung: '',
    lantai: '',
    ruangan: '',
    deskripsi: '',
    status: 'Aktif',
  });

  useEffect(() => {
    fetchLokasi();
  }, [currentPage, search, filterGedung, filterStatus]);

  const fetchLokasi = async () => {
    setLoading(true);
    try {
      const params = { page: currentPage, limit: itemsPerPage };
      if (search) params.search = search;
      if (filterGedung) params.gedung = filterGedung;
      if (filterStatus) params.status = filterStatus;
      const res = await lokasiService.getAll(params);
      setLokasiList(res.data || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotalItems(res.pagination?.totalItems || 0);

      // Extract unique gedung values for filter
      if (res.data && res.data.length > 0) {
        const gedungs = [...new Set(res.data.map(l => l.gedung).filter(Boolean))];
        setGedungOptions(gedungs);
      }
    } catch {
      toast.error('Gagal memuat data lokasi');
      setLokasiList([]);
    }
    setLoading(false);
  };

  const handleOpenAdd = () => {
    setEditItem(null);
    setForm({ nama_lokasi: '', gedung: '', lantai: '', ruangan: '', deskripsi: '', status: 'Aktif' });
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditItem(item);
    setForm({
      nama_lokasi: item.nama_lokasi || '',
      gedung: item.gedung || '',
      lantai: item.lantai || '',
      ruangan: item.ruangan || '',
      deskripsi: item.deskripsi || '',
      status: item.status || 'Aktif',
    });
    setShowModal(true);
  };

  const handleOpenDetail = async (item) => {
    setDetailItem(item);
    setShowDetail(true);
    setDetailBarangLoading(true);
    try {
      const res = await lokasiService.getBarangByLokasi(item.id, { page: 1, limit: 50 });
      setDetailBarang(res.data || []);
    } catch {
      setDetailBarang([]);
    }
    setDetailBarangLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nama_lokasi.trim()) {
      toast.error('Nama lokasi wajib diisi');
      return;
    }

    // Cek duplikat nama lokasi (client-side, case-insensitive)
    const trimmedNama = form.nama_lokasi.trim();
    const duplicate = lokasiList.find(l => l.nama_lokasi.toLowerCase() === trimmedNama.toLowerCase());
    if (duplicate && (!editItem || duplicate.id !== editItem.id)) {
      toast.error('Nama lokasi sudah digunakan. Silakan gunakan nama lokasi lain.');
      return;
    }
    setSaving(true);
    try {
      if (editItem) {
        await lokasiService.update(editItem.id, form);
        toast.success('Lokasi berhasil diperbarui');
      } else {
        await lokasiService.create(form);
        toast.success('Lokasi berhasil ditambahkan');
      }
      setShowModal(false);
      fetchLokasi();
    } catch (err) {
      const msg = err.response?.data?.message || 'Terjadi kesalahan';
      toast.error(msg);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    try {
      await lokasiService.delete(deleteItem.id);
      toast.success('Lokasi berhasil dihapus');
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal menghapus lokasi';
      toast.error(msg);
    }
    setShowDelete(false);
    fetchLokasi();
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const formatLokasiLabel = (item) => {
    const parts = [item.gedung, item.lantai ? `Lt. ${item.lantai}` : '', item.ruangan].filter(Boolean);
    return parts.length > 0 ? parts.join(' • ') : '-';
  };

  // ========== RENDER ==========
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Kelola Lokasi Barang</h1>
        <p className="page-subtitle">Kelola lokasi penyimpanan barang inventaris TVRI Jawa Timur</p>
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm mb-3 sm:mb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col sm:flex-row flex-1 gap-2 sm:gap-3 sm:items-center">
            <div className="relative flex-1 w-full sm:max-w-md">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                placeholder="Cari nama lokasi, gedung, ruangan..."
                className="input-field pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterGedung}
                onChange={(e) => { setFilterGedung(e.target.value); setCurrentPage(1); }}
                className="input-field w-full sm:w-auto"
              >
                <option value="">Semua Gedung</option>
                {gedungOptions.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                className="input-field w-full sm:w-auto"
              >
                <option value="">Semua Status</option>
                <option value="Aktif">Aktif</option>
                <option value="Tidak Aktif">Tidak Aktif</option>
              </select>
            </div>
          </div>
          <Button icon={FiPlus} onClick={handleOpenAdd} className="w-full sm:w-auto">
            Tambah Lokasi
          </Button>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="table-container">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F5F7FA]">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama Lokasi</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Gedung</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Lantai</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ruangan</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Barang</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#005BAC] mx-auto"></div>
                    <p className="text-gray-400 mt-2 text-sm">Memuat data lokasi...</p>
                  </td>
                </tr>
              ) : lokasiList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <EmptyState
                      icon={MdLocationOn}
                      title="Belum Ada Lokasi"
                      description="Tambahkan lokasi baru untuk mengelola penyimpanan barang"
                      actionLabel="Tambah Lokasi"
                      onAction={handleOpenAdd}
                    />
                  </td>
                </tr>
              ) : (
                lokasiList.map((item, idx) => {
                  const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG['Aktif'];
                  return (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.03 }}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-[#005BAC]/10 flex items-center justify-center flex-shrink-0">
                            <MdLocationOn className="w-4 h-4 text-[#005BAC]" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{item.nama_lokasi}</p>
                            {item.deskripsi && (
                              <p className="text-xs text-gray-400 line-clamp-1">{item.deskripsi}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <MdBusiness className="w-3.5 h-3.5 text-gray-400" />
                          {item.gedung || '-'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <FiLayers className="w-3.5 h-3.5 text-gray-400" />
                          {item.lantai ? `Lt. ${item.lantai}` : '-'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{item.ruangan || '-'}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">
                          <FiBox className="w-3 h-3" />
                          {item.total_barang || 0}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusCfg.bg} ${statusCfg.text} border ${statusCfg.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`}></span>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleOpenDetail(item)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="Detail">
                            <FiEye className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleOpenEdit(item)} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors" title="Edit">
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setDeleteItem(item); setShowDelete(true); }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="Hapus">
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden mobile-cards">
          <div className="p-3 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#005BAC]"></div>
              </div>
            ) : lokasiList.length === 0 ? (
              <EmptyState
                icon={MdLocationOn}
                title="Belum Ada Lokasi"
                description="Tambahkan lokasi baru untuk mengelola penyimpanan barang"
                actionLabel="Tambah Lokasi"
                onAction={handleOpenAdd}
              />
            ) : (
              lokasiList.map((item) => {
                const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG['Aktif'];
                return (
                  <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-lg bg-[#005BAC]/10 flex items-center justify-center">
                          <MdLocationOn className="w-5 h-5 text-[#005BAC]" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{item.nama_lokasi}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusCfg.bg} ${statusCfg.text} border ${statusCfg.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`}></span>
                        {statusCfg.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs text-gray-500 mb-2">
                      <div><span className="text-gray-400">Gedung:</span> <span className="font-medium text-gray-700">{item.gedung || '-'}</span></div>
                      <div><span className="text-gray-400">Lantai:</span> <span className="font-medium text-gray-700">{item.lantai ? `Lt. ${item.lantai}` : '-'}</span></div>
                      <div><span className="text-gray-400">Ruangan:</span> <span className="font-medium text-gray-700">{item.ruangan || '-'}</span></div>
                      <div><span className="text-gray-400">Barang:</span> <span className="font-medium text-gray-700">{item.total_barang || 0}</span></div>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                      <button onClick={() => handleOpenDetail(item)} className="flex-1 py-2 rounded-xl bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-100 transition-colors">Detail</button>
                      <button onClick={() => handleOpenEdit(item)} className="flex-1 py-2 rounded-xl bg-amber-50 text-amber-600 text-xs font-medium hover:bg-amber-100 transition-colors">Edit</button>
                      <button onClick={() => { setDeleteItem(item); setShowDelete(true); }} className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors"><FiTrash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={totalItems} itemsPerPage={itemsPerPage} />
      </div>

      {/* ========== ADD/EDIT MODAL ========== */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Lokasi' : 'Tambah Lokasi'} size="md">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {editItem && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Kode Lokasi</label>
                <input type="text" value={editItem.kode_lokasi} className="input-field bg-gray-50 text-gray-500" disabled />
                <p className="text-xs text-gray-400 mt-1">Kode lokasi tidak dapat diubah</p>
              </div>
            )}
            <div className="md:col-span-2">
              <Input label="Nama Lokasi" name="nama_lokasi" value={form.nama_lokasi} onChange={handleChange} placeholder="Contoh: Studio Podcast" required />
            </div>
            <Input label="Gedung" name="gedung" value={form.gedung} onChange={handleChange} placeholder="Contoh: Gedung Produksi" />
            <Input label="Lantai" name="lantai" value={form.lantai} onChange={handleChange} placeholder="Contoh: 2" />
            <Input label="Ruangan" name="ruangan" value={form.ruangan} onChange={handleChange} placeholder="Contoh: Studio A" />
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <select name="status" value={form.status} onChange={handleChange} className="input-field">
                <option value="Aktif">Aktif</option>
                <option value="Tidak Aktif">Tidak Aktif</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi</label>
              <textarea name="deskripsi" value={form.deskripsi} onChange={handleChange} placeholder="Deskripsi lokasi (opsional)" rows={3} className="input-field" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={() => setShowModal(false)}>Batal</Button>
            <Button type="submit" loading={saving}>{editItem ? 'Simpan Perubahan' : 'Tambah Lokasi'}</Button>
          </div>
        </form>
      </Modal>

      {/* ========== DETAIL MODAL ========== */}
      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Detail Lokasi" size="lg">
        {detailItem && (() => {
          const statusCfg = STATUS_CONFIG[detailItem.status] || STATUS_CONFIG['Aktif'];
          return (
            <div className="space-y-6">
              {/* Location Info */}
              <div className="bg-gradient-to-r from-[#005BAC] to-[#003B71] rounded-xl p-5 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono bg-white/20 px-2 py-0.5 rounded">{detailItem.kode_lokasi}</span>
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        detailItem.status === 'Aktif' ? 'bg-emerald-400/20 text-emerald-100' : 'bg-red-400/20 text-red-100'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${detailItem.status === 'Aktif' ? 'bg-emerald-300' : 'bg-red-300'}`}></span>
                        {detailItem.status}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold">{detailItem.nama_lokasi}</h2>
                    <p className="text-white/70 text-sm mt-1">{formatLokasiLabel(detailItem)}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                    <MdLocationOn className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-blue-700">{detailItem.total_barang || 0}</p>
                  <p className="text-xs text-blue-600 font-medium">Total Barang</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-700">{detailItem.barang_tersedia || 0}</p>
                  <p className="text-xs text-emerald-600 font-medium">Tersedia</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-amber-700">{detailItem.barang_dipinjam || 0}</p>
                  <p className="text-xs text-amber-600 font-medium">Dipinjam</p>
                </div>
                <div className="bg-red-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-red-700">{detailItem.barang_maintenance || 0}</p>
                  <p className="text-xs text-red-600 font-medium">Maintenance</p>
                </div>
              </div>

              {/* Detail Info */}
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-500">Gedung</p><p className="text-sm font-semibold">{detailItem.gedung || '-'}</p></div>
                <div><p className="text-xs text-gray-500">Lantai</p><p className="text-sm font-semibold">{detailItem.lantai ? `Lantai ${detailItem.lantai}` : '-'}</p></div>
                <div><p className="text-xs text-gray-500">Ruangan</p><p className="text-sm font-semibold">{detailItem.ruangan || '-'}</p></div>
                <div><p className="text-xs text-gray-500">Status</p><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusCfg.bg} ${statusCfg.text} border ${statusCfg.border}`}><span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`}></span>{statusCfg.label}</span></div>
              </div>
              {detailItem.deskripsi && (
                <div><p className="text-xs text-gray-500">Deskripsi</p><p className="text-sm mt-1">{detailItem.deskripsi}</p></div>
              )}

              {/* Barang List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-800">Daftar Barang di Lokasi Ini</h3>
                  <span className="text-xs text-gray-400">{detailBarang.length} barang</span>
                </div>
                {detailBarangLoading ? (
                  <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#005BAC]"></div></div>
                ) : detailBarang.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <MdOutlineFolderOff className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                    <p className="text-sm">Belum ada barang di lokasi ini</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {detailBarang.map((b) => (
                      <div key={b.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <FiBox className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{b.nama_barang}</p>
                          <p className="text-[11px] text-gray-400">{b.kategori_nama || '-'} • {b.kondisi}</p>
                        </div>
                        <Badge status={b.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ========== DELETE CONFIRM ========== */}
      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Hapus Lokasi"
        message={`Apakah Anda yakin ingin menghapus lokasi "${deleteItem?.nama_lokasi}"? Lokasi yang memiliki barang aktif tidak dapat dihapus.`}
      />
    </div>
  );
};

export default Lokasi;