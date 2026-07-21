

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlus, FiSearch, FiEdit2, FiTrash2, FiArrowLeft,
  FiChevronRight, FiUsers, FiMapPin, FiBriefcase, FiGrid,
  FiCheckCircle, FiXCircle, FiToggleLeft, FiToggleRight,
  FiMail, FiPhone, FiUser,
} from 'react-icons/fi';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import lokasiService from '../../services/lokasiService';
import jabatanService from '../../services/jabatanService';
import divisiService from '../../services/divisiService';
import userService from '../../services/userService';
import { useMasterData } from '../../context/MasterDataContext';
import { getInitials, getAvatarUrl } from '../../utils/format';
import toast from 'react-hot-toast';

const KATEGORI_USER_ITEMS = [
  {
    key: 'lokasi',
    label: 'Lokasi',
    labelSingular: 'Lokasi',
    icon: FiMapPin,
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    description: 'Kelola lokasi gedung dan ruangan TVRI',
    placeholder: 'Contoh: Studio Podcast, Ruang Master Control',
  },
  {
    key: 'jabatan',
    label: 'Jabatan',
    labelSingular: 'Jabatan',
    icon: FiBriefcase,
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50',
    description: 'Kelola jabatan dan posisi pegawai TVRI',
    placeholder: 'Contoh: Kamerawan Senior, Produser',
  },
  {
    key: 'divisi',
    label: 'Divisi',
    labelSingular: 'Divisi',
    icon: FiGrid,
    color: 'from-emerald-500 to-emerald-600',
    bgColor: 'bg-emerald-50',
    description: 'Kelola divisi dan departemen TVRI',
    placeholder: 'Contoh: Produksi, Teknik, Digital Media',
  },
];

const extractList = (res) => {
  if (!res) return [];
  if (Array.isArray(res.data)) return res.data;
  if (res.data && Array.isArray(res.data.data)) return res.data.data;
  if (Array.isArray(res)) return res;
  return [];
};

const extractTotal = (res) => {
  if (!res) return 0;
  if (res.pagination?.totalItems) return res.pagination.totalItems;
  if (res.data?.pagination?.totalItems) return res.data.pagination.totalItems;
  return extractList(res).length;
};

const KategoriUser = () => {
  
  const { refreshMasterData } = useMasterData();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  
  const [lokasiData, setLokasiData] = useState({ items: [], total: 0 });
  const [jabatanData, setJabatanData] = useState({ items: [], total: 0 });
  const [divisiData, setDivisiData] = useState({ items: [], total: 0 });

  
  const [selectedKategori, setSelectedKategori] = useState(null);
  const [detailItems, setDetailItems] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailSearch, setDetailSearch] = useState('');

  
  const [selectedItem, setSelectedItem] = useState(null); 
  const [pegawaiList, setPegawaiList] = useState([]);
  const [pegawaiLoading, setPegawaiLoading] = useState(false);
  const [pegawaiTotal, setPegawaiTotal] = useState(0);

  
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nama: '', deskripsi: '', gedung: '', lantai: '', ruangan: '' });

  
  const [imgErrors, setImgErrors] = useState(new Set());

  const handleAvatarError = (userId) => {
    setImgErrors(prev => {
      const next = new Set(prev);
      next.add(userId);
      return next;
    });
  };

  
  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const [lokasiRes, jabatanRes, divisiRes] = await Promise.all([
        lokasiService.getAll({ limit: 100 }).catch(() => null),
        jabatanService.getAll({ limit: 100 }).catch(() => null),
        divisiService.getAll({ limit: 100 }).catch(() => null),
      ]);

      setLokasiData({ items: extractList(lokasiRes), total: extractTotal(lokasiRes) });
      setJabatanData({ items: extractList(jabatanRes), total: extractTotal(jabatanRes) });
      setDivisiData({ items: extractList(divisiRes), total: extractTotal(divisiRes) });
    } catch (err) {
      console.error('Failed to fetch overview:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchOverview(); }, [fetchOverview]);

  
  const fetchDetail = useCallback(async () => {
    if (!selectedKategori) return;
    setDetailLoading(true);
    try {
      let res;
      if (selectedKategori === 'lokasi') {
        res = await lokasiService.getAll({ limit: 100 });
      } else if (selectedKategori === 'jabatan') {
        res = await jabatanService.getAll({ limit: 100 });
      } else if (selectedKategori === 'divisi') {
        res = await divisiService.getAll({ limit: 100 });
      }
      const items = extractList(res);
      setDetailItems(items);
    } catch (err) {
      console.error('Failed to fetch detail:', err);
      setDetailItems([]);
    }
    setDetailLoading(false);
  }, [selectedKategori]);

  useEffect(() => {
    if (selectedKategori) fetchDetail();
  }, [selectedKategori, fetchDetail]);

  
  useEffect(() => {
    if (!selectedKategori) return;
    const timer = setTimeout(() => fetchDetail(), 300);
    return () => clearTimeout(timer);
  }, [detailSearch]); 

  
  const fetchPegawai = useCallback(async (type, value) => {
    setPegawaiLoading(true);
    try {
      const res = await userService.getByJabatanOrDivisi({ type, value, limit: 100 });
      const data = res.data || [];
      setPegawaiList(data);
      setPegawaiTotal(res.pagination?.totalItems || data.length);
    } catch (err) {
      console.error('Failed to fetch pegawai:', err);
      setPegawaiList([]);
      setPegawaiTotal(0);
    }
    setPegawaiLoading(false);
  }, []);

  
  const getConfig = () => KATEGORI_USER_ITEMS.find(k => k.key === selectedKategori) || KATEGORI_USER_ITEMS[0];

  const handleCardClick = (key) => {
    setSelectedKategori(key);
    setDetailSearch('');
    setSelectedItem(null);
  };

  const handleBackToList = () => {
    setSelectedKategori(null);
    setDetailItems([]);
    setSelectedItem(null);
    setPegawaiList([]);
    fetchOverview();
  };

  const handleItemCardClick = (item) => {
    if (selectedKategori === 'lokasi') return; 
    setSelectedItem({ id: item.id, nama: item.nama || item.nama_lokasi, type: selectedKategori });
    fetchPegawai(selectedKategori, item.nama || item.nama_lokasi);
  };

  const handleBackToItems = () => {
    setSelectedItem(null);
    setPegawaiList([]);
  };

  const handleOpenAdd = () => {
    setEditItem(null);
    setForm({ nama: '', deskripsi: '', gedung: '', lantai: '', ruangan: '' });
    setShowModal(true);
  };

  const handleOverviewAdd = (key) => {
    setSelectedKategori(key);
    setDetailSearch('');
    setShowAddCategory(false);
    setTimeout(() => {
      setEditItem(null);
      setForm({ nama: '', deskripsi: '', gedung: '', lantai: '', ruangan: '' });
      setShowModal(true);
    }, 200);
  };

  const handleOpenEdit = (item) => {
    setEditItem(item);
    setForm({
      nama: item.nama || item.nama_lokasi || '',
      deskripsi: item.deskripsi || '',
      gedung: item.gedung || '',
      lantai: item.lantai || '',
      ruangan: item.ruangan || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nama.trim()) { toast.error('Nama wajib diisi'); return; }

    setSaving(true);
    try {
      if (selectedKategori === 'lokasi') {
        const payload = {
          nama_lokasi: form.nama.trim(),
          deskripsi: form.deskripsi?.trim() || null,
          status: editItem?.status || 'Aktif',
          gedung: form.gedung?.trim() || null,
          lantai: form.lantai?.trim() || null,
          ruangan: form.ruangan?.trim() || null,
        };
        if (editItem) { await lokasiService.update(editItem.id, payload); toast.success('Lokasi berhasil diperbarui'); }
        else { await lokasiService.create(payload); toast.success('Lokasi berhasil ditambahkan'); }
      } else if (selectedKategori === 'jabatan') {
        const payload = { nama: form.nama.trim(), deskripsi: form.deskripsi?.trim() || null };
        if (editItem) { await jabatanService.update(editItem.id, payload); toast.success('Jabatan berhasil diperbarui'); }
        else { await jabatanService.create(payload); toast.success('Jabatan berhasil ditambahkan'); }
      } else if (selectedKategori === 'divisi') {
        const payload = { nama: form.nama.trim(), deskripsi: form.deskripsi?.trim() || null };
        if (editItem) { await divisiService.update(editItem.id, payload); toast.success('Divisi berhasil diperbarui'); }
        else { await divisiService.create(payload); toast.success('Divisi berhasil ditambahkan'); }
      }
      setShowModal(false);
      refreshMasterData();
      if (selectedKategori) fetchDetail();
      fetchOverview();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Terjadi kesalahan');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    try {
      if (selectedKategori === 'lokasi') { await lokasiService.delete(deleteItem.id); toast.success('Lokasi berhasil dihapus'); }
      else if (selectedKategori === 'jabatan') { await jabatanService.delete(deleteItem.id); toast.success('Jabatan berhasil dihapus'); }
      else { await divisiService.delete(deleteItem.id); toast.success('Divisi berhasil dihapus'); }
      refreshMasterData();
      if (selectedKategori) fetchDetail();
      fetchOverview();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus');
    }
    setShowDelete(false);
  };

  const handleToggleActive = async (item) => {
    try {
      if (selectedKategori === 'jabatan') await jabatanService.toggleActive(item.id);
      else if (selectedKategori === 'divisi') await divisiService.toggleActive(item.id);
      toast.success(`"${item.nama}" ${item.is_active ? 'dinonaktifkan' : 'diaktifkan'}`);
      refreshMasterData();
      if (selectedKategori) fetchDetail();
      fetchOverview();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Gagal mengubah status');
    }
  };

  
  const getItemNama = (item) => item?.nama || item?.nama_lokasi || '';
  const getItemActive = (item) => {
    if (!item) return true;
    if (item.is_active !== undefined) return !!item.is_active;
    if (item.status === 'Tidak Aktif') return false;
    return true;
  };
  const getItemCount = (item) => item?.total_pegawai || item?.total_barang || 0;
  const getItemCountLabel = (key) => key === 'lokasi' ? 'barang' : 'pegawai';

  const getOverviewData = (key) => {
    if (key === 'lokasi') return lokasiData;
    if (key === 'jabatan') return jabatanData;
    if (key === 'divisi') return divisiData;
    return { items: [], total: 0 };
  };

  
  const getFilteredList = () => {
    if (!detailSearch.trim()) return detailItems;
    const q = detailSearch.toLowerCase();
    return detailItems.filter(item => getItemNama(item).toLowerCase().includes(q));
  };

  
  const getFilteredCards = () => {
    if (!search.trim()) return KATEGORI_USER_ITEMS;
    const q = search.toLowerCase();
    return KATEGORI_USER_ITEMS.filter(kat =>
      kat.label.toLowerCase().includes(q) || kat.description.toLowerCase().includes(q)
    );
  };

  
  
  
  if (selectedItem) {
    const config = getConfig();
    const IconComp = config.icon;

    return (
      <div className="page-container">
        {
}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={handleBackToItems} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-[#005BAC]/30 text-[#005BAC] font-semibold text-sm transition-all duration-200 group">
            <FiArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Kembali</span>
          </button>
          <div className="h-6 w-px bg-gray-200" />
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <button onClick={handleBackToList} className="hover:text-[#005BAC] transition-colors cursor-pointer">Kategori User</button>
            <FiChevronRight className="w-3 h-3" />
            <button onClick={handleBackToItems} className="hover:text-[#005BAC] transition-colors cursor-pointer">{config.label}</button>
            <FiChevronRight className="w-3 h-3" />
            <span className="text-gray-700 font-medium">{selectedItem.nama}</span>
          </div>
        </div>

        {
}
        <div className={`rounded-2xl p-6 mb-6 ${config.bgColor}`}>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center shadow-lg`}>
              <FiUsers className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-800">Pegawai dengan {config.label} "{selectedItem.nama}"</h1>
              <p className="text-sm text-gray-500 mt-1">Daftar pegawai yang memiliki {config.label.toLowerCase()} {selectedItem.nama}</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-800">{pegawaiTotal}</p>
              <p className="text-xs text-gray-500">Pegawai</p>
            </div>
          </div>
        </div>

        {
}
        {pegawaiLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#005BAC]" />
            <span className="ml-3 text-gray-500">Memuat data pegawai...</span>
          </div>
        ) : pegawaiList.length === 0 ? (
          <EmptyState
            icon={FiUsers}
            title={`Belum Ada Pegawai`}
            description={`Tidak ada pegawai dengan ${config.label.toLowerCase()} "${selectedItem.nama}"`}
          />
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {
}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#F5F7FA]">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Pegawai</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">NIP</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Jabatan</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Divisi</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Kontak</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pegawaiList.map((p) => (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#005BAC] to-[#003B71] flex-shrink-0">
                            {p.avatar && !imgErrors.has(p.id) ? (
                              <img src={getAvatarUrl(p.avatar)} alt="" className="w-full h-full object-cover" onError={() => handleAvatarError(p.id)} />
                            ) : (
                              <span className="text-white text-xs font-bold">{getInitials(p.nama) || 'P'}</span>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{p.nama}</p>
                            <p className="text-xs text-gray-400">@{p.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{p.nip || '-'}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{p.jabatan || '-'}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{p.divisi || '-'}</td>
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          {p.email && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <FiMail className="w-3 h-3" />
                              <span className="truncate max-w-[180px]">{p.email}</span>
                            </div>
                          )}
                          {p.nomor_hp && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <FiPhone className="w-3 h-3" />
                              <span>{p.nomor_hp}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {p.is_active ? (
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
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {
}
            <div className="md:hidden p-3 space-y-3">
              {pegawaiList.map((p) => (
                <div key={p.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#005BAC] to-[#003B71] flex-shrink-0">
                      {p.avatar && !imgErrors.has(p.id) ? (
                        <img src={getAvatarUrl(p.avatar)} alt="" className="w-full h-full object-cover" onError={() => handleAvatarError(p.id)} />
                      ) : (
                        <span className="text-white text-sm font-bold">{getInitials(p.nama) || 'P'}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{p.nama}</p>
                      <p className="text-xs text-gray-400">@{p.username}</p>
                      {p.nip && <p className="text-xs text-gray-500 mt-0.5">NIP: {p.nip}</p>}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {p.jabatan && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded">{p.jabatan}</span>
                        )}
                        {p.divisi && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded">{p.divisi}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        {p.email && (
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <FiMail className="w-3 h-3" />
                            <span className="truncate max-w-[140px]">{p.email}</span>
                          </div>
                        )}
                        {p.nomor_hp && (
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <FiPhone className="w-3 h-3" />
                            <span>{p.nomor_hp}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0 ${p.is_active ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                      {p.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  
  
  
  if (selectedKategori) {
    const config = getConfig();
    const IconComp = config.icon;
    const filteredList = getFilteredList();
    const canShowPegawai = selectedKategori === 'jabatan' || selectedKategori === 'divisi';

    return (
      <div className="page-container">
        {
}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={handleBackToList} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-[#005BAC]/30 text-[#005BAC] font-semibold text-sm transition-all duration-200 group">
            <FiArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Kembali</span>
          </button>
          <div className="h-6 w-px bg-gray-200" />
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>Kategori User</span>
            <FiChevronRight className="w-3 h-3" />
            <span className="text-gray-700 font-medium">{config.label}</span>
          </div>
        </div>

        {
}
        <div className={`rounded-2xl p-6 mb-6 ${config.bgColor}`}>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center shadow-lg`}>
              <IconComp className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-800">{config.label}</h1>
              <p className="text-sm text-gray-500 mt-1">{config.description}</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-800">{detailItems.length}</p>
              <p className="text-xs text-gray-500">Total {config.label}</p>
            </div>
          </div>
        </div>

        {
}
        <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm mb-3 sm:mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="text" value={detailSearch} onChange={(e) => setDetailSearch(e.target.value)} placeholder={`Cari ${config.label.toLowerCase()}...`} className="input-field pl-10" />
            </div>
            <Button icon={FiPlus} onClick={handleOpenAdd}>Tambah {config.labelSingular}</Button>
          </div>
        </div>

        {
}
        {detailLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#005BAC]" />
            <span className="ml-3 text-gray-500">Memuat data...</span>
          </div>
        ) : filteredList.length === 0 ? (
          <EmptyState
            icon={IconComp}
            title={detailSearch ? `${config.label} Tidak Ditemukan` : `Belum Ada ${config.label}`}
            description={detailSearch ? `Tidak ada ${config.label.toLowerCase()} yang sesuai dengan pencarian` : `Tambahkan ${config.label.toLowerCase()} baru untuk mengelola data referensi`}
            actionLabel={!detailSearch ? `Tambah ${config.labelSingular}` : undefined}
            onAction={!detailSearch ? handleOpenAdd : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredList.map((item, idx) => {
                const nama = getItemNama(item);
                const isActive = getItemActive(item);
                const totalCount = getItemCount(item);
                const subInfo = item?.deskripsi || [item?.gedung, item?.lantai ? `Lt. ${item.lantai}` : '', item?.ruangan].filter(Boolean).join(' • ') || '';
                const isClickable = canShowPegawai;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => isClickable && handleItemCardClick(item)}
                    className={`bg-white rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all group border border-transparent hover:border-[#005BAC]/20 ${isClickable ? 'cursor-pointer' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center`}>
                        <IconComp className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {(selectedKategori === 'jabatan' || selectedKategori === 'divisi') && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleToggleActive(item); }}
                            className={`p-1.5 rounded-lg transition-colors ${isActive ? 'text-emerald-500 hover:bg-emerald-50' : 'text-gray-300 hover:bg-gray-50'}`}
                            title={isActive ? 'Nonaktifkan' : 'Aktifkan'}
                          >
                            {isActive ? <FiToggleRight className="w-4 h-4" /> : <FiToggleLeft className="w-4 h-4" />}
                          </button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); handleOpenEdit(item); }} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors" title="Edit">
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setDeleteItem(item); setShowDelete(true); }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="Hapus">
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-gray-800 line-clamp-1">{nama}</h3>
                    {subInfo && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{subInfo}</p>}

                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                        {isActive ? <FiCheckCircle className="w-3 h-3" /> : <FiXCircle className="w-3 h-3" />}
                        {isActive ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <FiUsers className="w-3 h-3" />
                        <span>{totalCount} {getItemCountLabel(selectedKategori)}</span>
                      </div>
                    </div>

                    {
}
                    {isClickable && (
                      <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-[#005BAC] opacity-0 group-hover:opacity-100 transition-opacity">
                        <FiUsers className="w-3 h-3" />
                        <span>Lihat pegawai</span>
                        <FiChevronRight className="w-3 h-3" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {
}
        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? `Edit ${config.labelSingular}` : `Tambah ${config.labelSingular}`}>
          <form onSubmit={handleSubmit}>
            <Input label={`Nama ${config.labelSingular}`} name="nama" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder={config.placeholder} required />
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi</label>
              <textarea name="deskripsi" value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} placeholder="Deskripsi (opsional)" rows={3} className="input-field" />
            </div>
            {selectedKategori === 'lokasi' && (
              <>
                <Input label="Gedung" name="gedung" value={form.gedung} onChange={(e) => setForm({ ...form, gedung: e.target.value })} placeholder="Contoh: Gedung Produksi" />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Lantai" name="lantai" value={form.lantai} onChange={(e) => setForm({ ...form, lantai: e.target.value })} placeholder="Contoh: 2" />
                  <Input label="Ruangan" name="ruangan" value={form.ruangan} onChange={(e) => setForm({ ...form, ruangan: e.target.value })} placeholder="Contoh: Studio A" />
                </div>
              </>
            )}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button variant="outline" onClick={() => setShowModal(false)}>Batal</Button>
              <Button type="submit" loading={saving}>{editItem ? 'Simpan Perubahan' : 'Tambah'}</Button>
            </div>
          </form>
        </Modal>

        {
}
        <ConfirmDialog isOpen={showDelete} onClose={() => setShowDelete(false)} onConfirm={handleDelete} title={`Hapus ${config.labelSingular}`} message={`Apakah Anda yakin ingin menghapus "${getItemNama(deleteItem)}"? Tindakan ini tidak dapat dibatalkan.`} />
      </div>
    );
  }

  
  
  
  const filteredCards = getFilteredCards();

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Kategori User</h1>
        <p className="page-subtitle">Kelola data referensi untuk data diri pegawai baru</p>
      </div>

      {
}
      <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari kategori..." className="input-field pl-10" />
          </div>
          <Button icon={FiPlus} onClick={() => setShowAddCategory(true)}>Tambah Data</Button>
        </div>
      </div>

      {
}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#005BAC]" />
          <span className="ml-3 text-gray-500">Memuat data...</span>
        </div>
      ) : filteredCards.length === 0 ? (
        <EmptyState icon={FiGrid} title="Kategori Tidak Ditemukan" description="Tidak ada kategori yang sesuai dengan pencarian Anda" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCards.map((kat, idx) => {
            const IconComp = kat.icon;
            const data = getOverviewData(kat.key);

            return (
              <motion.div
                key={kat.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => handleCardClick(kat.key)}
                className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all cursor-pointer group border border-transparent hover:border-[#005BAC]/20"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${kat.color} flex items-center justify-center`}>
                    <IconComp className="w-5 h-5 text-white" />
                  </div>
                  <FiChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#005BAC] transition-colors" />
                </div>
                <h3 className="text-base font-bold text-gray-800">{kat.label}</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{kat.description}</p>
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-400">{data.total} {getItemCountLabel(kat.key)}</span>
                  <FiChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#005BAC] transition-colors" />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {
}
      <Modal isOpen={showAddCategory} onClose={() => setShowAddCategory(false)} title="Pilih Kategori">
        <div className="space-y-3">
          {KATEGORI_USER_ITEMS.map((kat) => {
            const IconComp = kat.icon;
            return (
              <button
                key={kat.key}
                onClick={() => handleOverviewAdd(kat.key)}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-[#005BAC]/40 hover:bg-[#E8F1FA]/30 transition-all text-left group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${kat.color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                  <IconComp className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-800">{kat.label}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{kat.description}</p>
                </div>
                <FiChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#005BAC] transition-colors" />
              </button>
            );
          })}
        </div>
      </Modal>
    </div>
  );
};

export default KategoriUser;