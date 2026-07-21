

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  FiPlus, FiSearch, FiEdit2, FiTrash2, FiArrowLeft,
  FiChevronRight, FiUpload, FiX, FiPackage, FiCrop, FiRefreshCw
} from 'react-icons/fi';
import {
  MdCameraAlt, MdLaptop, MdComputer, MdMonitor, MdLocalPrintshop
} from 'react-icons/md';
import { HiMicrophone, HiPhotograph } from 'react-icons/hi';
import { GiVideoCamera } from 'react-icons/gi';
import { LuLightbulb, LuCable } from 'react-icons/lu';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { KATEGORI_DEFAULT, STATUS_BARANG, KONDISI_BARANG } from '../../utils/constants';
import lokasiService from '../../services/lokasiService';
import Modal from '../../components/ui/Modal';
import DropdownSelect from '../../components/ui/DropdownSelect';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import ImageCropModal from '../../components/ui/ImageCropModal';
import { getBarangFotoUrl } from '../../utils/format';
import api from '../../services/api';
import toast from 'react-hot-toast';

const getCategoryIcon = (nama) => {
  const lower = (nama || '').toLowerCase();
  if (lower.includes('kamera') || lower.includes('camera')) return MdCameraAlt;
  if (lower.includes('laptop') || lower.includes('notebook')) return MdLaptop;
  if (lower.includes('mikrofon') || lower.includes('microphone') || lower.includes('mic') || lower.includes('audio')) return HiMicrophone;
  if (lower.includes('lighting') || lower.includes('lampu') || lower.includes('cahaya')) return LuLightbulb;
  if (lower.includes('tripod') || lower.includes('stabilizer')) return HiPhotograph;
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
  'bg-blue-50',
  'bg-purple-50',
  'bg-emerald-50',
  'bg-amber-50',
  'bg-rose-50',
  'bg-cyan-50',
  'bg-indigo-50',
  'bg-pink-50',
  'bg-teal-50',
  'bg-orange-50',
];

const Kategori = () => {
  const [categories, setCategories] = useState([]);
  const [kategoriLokasiList, setKategoriLokasiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nama: '', deskripsi: '' });

  
  const [selectedKategori, setSelectedKategori] = useState(null);
  const [barangList, setBarangList] = useState([]);
  const [barangLoading, setBarangLoading] = useState(false);

  
  const [showBarangModal, setShowBarangModal] = useState(false);
  const [showBarangDetail, setShowBarangDetail] = useState(false);
  const [showBarangDelete, setShowBarangDelete] = useState(false);
  const [editBarang, setEditBarang] = useState(null);
  const [detailBarang, setDetailBarang] = useState(null);
  const [deleteBarang, setDeleteBarang] = useState(null);
  const [barangSaving, setBarangSaving] = useState(false);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoFile, setFotoFile] = useState(null);
  const [imgErrors, setImgErrors] = useState({});

  
  const [showCropModal, setShowCropModal] = useState(false);
  const [originalImageUrl, setOriginalImageUrl] = useState(null);
  const fotoInputRef = useRef(null);
  const [barangForm, setBarangForm] = useState({
    kode_barang: '', nama_barang: '', kategori_id: '', lokasi: 'Studio Podcast',
    kondisi: 'Baik', status: 'Tersedia', deskripsi: '',
  });

  useEffect(() => { fetchCategories(); fetchLokasi(); }, []);

  const fetchLokasi = async () => {
    try {
      const res = await lokasiService.getActive();
      setKategoriLokasiList(res.data || []);
    } catch {
      setKategoriLokasiList([]);
    }
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/kategori');
      setCategories(res.data.data || []);
    } catch {
      setCategories([]);
    }
    setLoading(false);
  };

  const fetchBarangByKategori = async (kategoriId) => {
    setBarangLoading(true);
    try {
      const res = await api.get('/barang', { params: { kategori: kategoriId, page: 1, limit: 100 } });
      setBarangList(res.data.data || []);
    } catch {
      setBarangList([]);
    }
    setBarangLoading(false);
  };

  const handleCardClick = (cat) => {
    setSelectedKategori(cat);
    fetchBarangByKategori(cat.id);
  };

  const handleBackToList = () => {
    setSelectedKategori(null);
    setBarangList([]);
  };

  
  const handleOpenAdd = () => {
    setEditItem(null);
    setForm({ nama: '', deskripsi: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (e, item) => {
    e.stopPropagation();
    setEditItem(item);
    setForm({ nama: item.nama, deskripsi: item.deskripsi || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nama) { toast.error('Nama kategori wajib diisi'); return; }
    const trimmedNama = form.nama.trim();

    
    const duplicate = categories.find(c => c.nama.toLowerCase() === trimmedNama.toLowerCase());
    if (duplicate && (!editItem || duplicate.id !== editItem.id)) {
      toast.error('Nama kategori sudah digunakan. Silakan gunakan nama lain.');
      return;
    }

    setSaving(true);
    try {
      if (editItem) {
        await api.put(`/kategori/${editItem.id}`, form);
        toast.success('Kategori berhasil diperbarui');
      } else {
        await api.post('/kategori', form);
        toast.success('Kategori berhasil ditambahkan');
      }
      setShowModal(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Terjadi kesalahan');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/kategori/${deleteItem.id}`);
      toast.success('Kategori berhasil dihapus');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus kategori');
    }
    setShowDelete(false);
    if (selectedKategori?.id === deleteItem?.id) {
      setSelectedKategori(null);
      setBarangList([]);
    }
    fetchCategories();
  };

  
  const handleOpenAddBarang = () => {
    setEditBarang(null);
    setFotoPreview(null);
    setFotoFile(null);
    setOriginalImageUrl(null);
    if (fotoInputRef.current) fotoInputRef.current.value = '';
    const totalCount = barangList.length;
    const prefix = (selectedKategori?.nama || 'BRG').substring(0, 3).toUpperCase();
    const kode = `TVRI-${prefix}-${String(totalCount + 1).padStart(4, '0')}`;
    setBarangForm({
      kode_barang: kode,
      nama_barang: '',
      kategori_id: String(selectedKategori?.id || ''),
      lokasi: 'Studio Podcast',
      kondisi: 'Baik',
      status: 'Tersedia',
      jumlah: 1,
      deskripsi: '',
    });
    setShowBarangModal(true);
  };

  const handleOpenEditBarang = (item) => {
    setEditBarang(item);
    setFotoPreview(item.foto ? getBarangFotoUrl(item.foto) : null);
    setFotoFile(null);
    setOriginalImageUrl(null);
    if (fotoInputRef.current) fotoInputRef.current.value = '';
    setBarangForm({
      kode_barang: item.kode_barang,
      nama_barang: item.nama_barang,
      kategori_id: String(selectedKategori?.id || item.kategori_id || item.kategori_nama),
      lokasi: item.lokasi,
      kondisi: item.kondisi,
      status: item.status,
      deskripsi: item.deskripsi || '',
      jumlah: item.jumlah || 1,
      foto: item.foto || '',
    });
    setShowBarangModal(true);
  };

  const handleBarangSubmit = async (e) => {
    e.preventDefault();
    if (!barangForm.nama_barang || !barangForm.kategori_id) {
      toast.error('Nama barang dan kategori wajib diisi');
      return;
    }
    setBarangSaving(true);
    try {
      if (editBarang) {
        
        await api.put(`/barang/${editBarang.id}`, {
          ...barangForm,
          kategori_id: parseInt(barangForm.kategori_id),
        });
        
        if (fotoFile) {
          const formData = new FormData();
          formData.append('foto', fotoFile);
          await api.post(`/barang/${editBarang.id}/foto`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
        toast.success('Barang berhasil diperbarui');
      } else {
        
        const res = await api.post('/barang', {
          ...barangForm,
          kategori_id: parseInt(barangForm.kategori_id),
        });
        
        if (fotoFile) {
          const barangId = res.data?.data?.id;
          if (barangId) {
            const formData = new FormData();
            formData.append('foto', fotoFile);
            await api.post(`/barang/${barangId}/foto`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
          }
        }
        toast.success('Barang berhasil ditambahkan');
      }
      setShowBarangModal(false);
      fetchBarangByKategori(selectedKategori.id);
      fetchCategories(); 
    } catch (err) {
      toast.error(err.response?.data?.message || 'Terjadi kesalahan');
    }
    setBarangSaving(false);
  };

  const handleDeleteBarang = async () => {
    try {
      await api.delete(`/barang/${deleteBarang.id}`);
      toast.success('Barang berhasil dihapus');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus barang');
    }
    setShowBarangDelete(false);
    fetchBarangByKategori(selectedKategori.id);
    fetchCategories();
  };

  const handleFotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setOriginalImageUrl(ev.target.result);
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = ({ blob, url, file }) => {
    setFotoPreview(url);
    setFotoFile(file);
    setOriginalImageUrl(null);
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setOriginalImageUrl(null);
    if (fotoInputRef.current) fotoInputRef.current.value = '';
  };

  const handleReCrop = () => {
    if (originalImageUrl) {
      setShowCropModal(true);
    }
  };

  const handleRemoveFoto = () => {
    setFotoPreview(null);
    setFotoFile(null);
    setOriginalImageUrl(null);
    if (fotoInputRef.current) fotoInputRef.current.value = '';
  };

  const filtered = categories.filter(c => c.nama.toLowerCase().includes(search.toLowerCase()));

  
  if (selectedKategori) {
    const colorIdx = (categories.findIndex(c => c.id === selectedKategori.id)) % categoryColors.length;
    const IconComp = getCategoryIcon(selectedKategori.nama);
    const safeIdx = colorIdx >= 0 ? colorIdx : 0;

    return (
      <div className="page-container">
        {
}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={handleBackToList}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-[#005BAC]/30 text-[#005BAC] font-semibold text-sm transition-all duration-200 group"
          >
            <FiArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Kembali</span>
          </button>
          <div className="h-6 w-px bg-gray-200" />
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>Kategori</span>
            <FiChevronRight className="w-3 h-3" />
            <span className="text-gray-700 font-medium">{selectedKategori.nama}</span>
          </div>
        </div>

        {
}
        <div className={`rounded-2xl p-6 mb-6 ${categoryBgColors[safeIdx]}`}>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${categoryColors[safeIdx]} flex items-center justify-center shadow-lg`}>
              <IconComp className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-800">{selectedKategori.nama}</h1>
              <p className="text-sm text-gray-500 mt-1">{selectedKategori.deskripsi || 'Kelola barang dalam kategori ini'}</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-800">{barangList.length}</p>
              <p className="text-xs text-gray-500">Total Barang</p>
            </div>
          </div>
        </div>

        {
}
        <div className="flex justify-end mb-3 sm:mb-4">
          <Button icon={FiPlus} onClick={handleOpenAddBarang}>Tambah Barang</Button>
        </div>

        {
}
        {barangLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#005BAC]"></div>
            <span className="ml-3 text-gray-500">Memuat data barang...</span>
          </div>
        ) : barangList.length === 0 ? (
          <EmptyState
            icon={IconComp}
            title="Belum Ada Barang"
            description={`Belum ada barang dalam kategori "${selectedKategori.nama}"`}
            actionLabel="Tambah Barang"
            onAction={handleOpenAddBarang}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {barangList.map((item, idx) => {
              const fotoUrl = item.foto ? getBarangFotoUrl(item.foto) : null;
              const imgError = imgErrors[item.id];
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all border border-transparent hover:border-[#005BAC]/20 overflow-hidden group"
               >
                  {
}
                  <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-50 overflow-hidden">
                    {fotoUrl && !imgError ? (
                      <img
                        src={fotoUrl}
                        alt={item.nama_barang}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={() => setImgErrors(prev => ({ ...prev, [item.id]: true }))}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${categoryColors[safeIdx]} flex items-center justify-center shadow-md`}>
                          <IconComp className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    )}
                  </div>

                  {
}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-gray-800 line-clamp-1 flex-1">{item.nama_barang}</h3>
                      <Badge status={item.kondisi} />
                    </div>
                    <p className="text-xs text-gray-400 mb-3 line-clamp-2">{item.deskripsi || 'Tidak ada deskripsi'}</p>
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                      <span>{item.lokasi}</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">Stok: {item.jumlah || 1}</span>
                    </div>

                    {
}
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => { setDetailBarang(item); setShowBarangDetail(true); }}
                        className="flex-1 py-2 rounded-xl bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-100 transition-colors"
                      >
                        Detail
                      </button>
                      <button
                        onClick={() => handleOpenEditBarang(item)}
                        className="flex-1 py-2 rounded-xl bg-amber-50 text-amber-600 text-xs font-medium hover:bg-amber-100 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => { setDeleteBarang(item); setShowBarangDelete(true); }}
                        className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {
}
        <Modal isOpen={showBarangModal} onClose={() => setShowBarangModal(false)} title={editBarang ? 'Edit Barang' : 'Tambah Barang'} size="lg">
          <form onSubmit={handleBarangSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {
}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Foto Barang</label>
                <div className="flex items-start gap-4">
                  <div className="aspect-[4/3] w-52 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 flex-shrink-0">
                    {fotoPreview ? (
                      <img src={fotoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <FiPackage className="w-10 h-10 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#005BAC] text-white text-sm font-medium hover:bg-[#003B71] transition-colors cursor-pointer">
                      <FiUpload className="w-4 h-4" />
                      Pilih Foto
                      <input ref={fotoInputRef} type="file" accept="image/*" onChange={handleFotoChange} className="hidden" />
                    </label>
                    {fotoPreview && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {originalImageUrl && (
                          <button
                            type="button"
                            onClick={handleReCrop}
                            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 transition-colors"
                          >
                            <FiCrop className="w-3.5 h-3.5" />
                            Atur Ulang
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleRemoveFoto}
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-red-50 text-red-500 text-sm font-medium hover:bg-red-100 transition-colors"
                        >
                          <FiX className="w-3.5 h-3.5" />
                          Hapus
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-2">Format: JPG, PNG, WebP. Maks 5MB</p>
                    <p className="text-xs text-blue-500 mt-1">💡 Pilih foto lalu atur rasio & area crop sesuai kebutuhan</p>
                  </div>
                </div>
              </div>

              <input type="hidden" name="kode_barang" value={barangForm.kode_barang} />
              <Input label="Nama Barang" name="nama_barang" value={barangForm.nama_barang} onChange={(e) => setBarangForm({ ...barangForm, nama_barang: e.target.value })} placeholder="Masukkan nama barang" required />

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Jumlah</label>
                <input
                  type="number"
                  value={barangForm.jumlah || 1}
                  onChange={(e) => setBarangForm({ ...barangForm, jumlah: parseInt(e.target.value) || 1 })}
                  className="input-field"
                  min="1"
                  placeholder="Jumlah barang"
                />
                <p className="text-xs text-gray-400 mt-1">Jumlah unit barang yang tersedia</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Kategori</label>
                <div className="input-field bg-gray-50 text-gray-700 font-medium flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-gradient-to-br from-[#005BAC] to-[#003B71] flex items-center justify-center flex-shrink-0">
                    {(() => { const IC = getCategoryIcon(selectedKategori?.nama); return <IC className="w-3.5 h-3.5 text-white" />; })()}
                  </span>
                  {selectedKategori?.nama || '—'}
                </div>
                <input type="hidden" value={barangForm.kategori_id} />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Lokasi</label>
                <DropdownSelect
                  value={barangForm.lokasi}
                  onChange={(e) => {
                    const selectedLokasi = kategoriLokasiList.find(l => l.nama_lokasi === e.target.value);
                    setBarangForm({ ...barangForm, lokasi: e.target.value, lokasi_id: selectedLokasi ? selectedLokasi.id : null });
                  }}
                  options={kategoriLokasiList.length > 0
                    ? kategoriLokasiList.map(l => ({ value: l.nama_lokasi, label: `${l.nama_lokasi}${l.gedung ? ` — ${l.gedung}` : ''}${l.lantai ? ` Lt. ${l.lantai}` : ''}` }))
                    : [{ value: '', label: 'Memuat lokasi...' }]
                  }
                  placeholder="Pilih lokasi"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Kondisi</label>
                <DropdownSelect
                  value={barangForm.kondisi}
                  onChange={(e) => setBarangForm({ ...barangForm, kondisi: e.target.value })}
                  options={[
                    { value: 'Baik', label: 'Baik' },
                    { value: 'Rusak Ringan', label: 'Rusak Ringan' },
                    { value: 'Rusak Berat', label: 'Rusak Berat' },
                  ]}
                  placeholder="Pilih kondisi"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                <div className="input-field bg-gray-50 text-gray-700 font-medium">
                  <Badge status={barangForm.status || 'Tersedia'} />
                </div>
                <input type="hidden" value={barangForm.status || 'Tersedia'} />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi</label>
                <textarea name="deskripsi" value={barangForm.deskripsi} onChange={(e) => setBarangForm({ ...barangForm, deskripsi: e.target.value })} placeholder="Deskripsi barang (opsional)" rows={3} className="input-field" />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <Button variant="outline" onClick={() => setShowBarangModal(false)}>Batal</Button>
              <Button type="submit" loading={barangSaving}>{editBarang ? 'Simpan Perubahan' : 'Tambah Barang'}</Button>
            </div>
          </form>
        </Modal>

        {
}
        <Modal isOpen={showBarangDetail} onClose={() => setShowBarangDetail(false)} title="Detail Barang" size="md">
          {detailBarang && (() => {
            const fotoUrl = detailBarang.foto ? getBarangFotoUrl(detailBarang.foto) : null;
            const imgError = imgErrors[`detail-${detailBarang.id}`];
            return (
              <div className="space-y-4">
                {
}
                {fotoUrl && !imgError ? (
                  <div className="rounded-xl overflow-hidden bg-gray-100 mb-4">
                    <img src={fotoUrl} alt={detailBarang.nama_barang} className="w-full aspect-[4/3] object-cover" onError={() => setImgErrors(prev => ({ ...prev, [`detail-${detailBarang.id}`]: true }))} />
                  </div>
                ) : null}
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-xs text-gray-500">Nama Barang</p><p className="text-sm font-semibold">{detailBarang.nama_barang}</p></div>
                  <div><p className="text-xs text-gray-500">Kategori</p><p className="text-sm">{detailBarang.kategori_nama || detailBarang.kategori_id}</p></div>
                  <div><p className="text-xs text-gray-500">Lokasi</p><p className="text-sm">{detailBarang.lokasi}</p></div>
                  <div><p className="text-xs text-gray-500">Jumlah</p><p className="text-sm font-semibold">{detailBarang.jumlah || 1} unit</p></div>
                  <div><p className="text-xs text-gray-500">Kondisi</p><Badge status={detailBarang.kondisi} /></div>
                  <div><p className="text-xs text-gray-500">Status</p><Badge status={detailBarang.status} /></div>
                </div>
                {detailBarang.deskripsi && (
                  <div><p className="text-xs text-gray-500">Deskripsi</p><p className="text-sm mt-1">{detailBarang.deskripsi}</p></div>
                )}
              </div>
            );
          })()}
        </Modal>

        {
}
        <ConfirmDialog
          isOpen={showBarangDelete}
          onClose={() => setShowBarangDelete(false)}
          onConfirm={handleDeleteBarang}
          title="Hapus Barang"
          message={`Apakah Anda yakin ingin menghapus "${deleteBarang?.nama_barang}"? Tindakan ini tidak dapat dibatalkan.`}
        />

        {
}
        <ImageCropModal
          isOpen={showCropModal}
          onClose={handleCropCancel}
          imageSrc={originalImageUrl}
          onCropComplete={handleCropComplete}
          defaultAspect={4/3}
        />
      </div>
    );
  }

  
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Kategori Barang</h1>
        <p className="page-subtitle">Kelola kategori untuk pengelompokan barang inventaris</p>
      </div>

      <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari kategori..." className="input-field pl-10" />
          </div>
          <Button icon={FiPlus} onClick={handleOpenAdd}>Tambah Kategori</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((cat, idx) => {
          const IconComp = getCategoryIcon(cat.nama);
          return (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => handleCardClick(cat)}
              className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all cursor-pointer group border border-transparent hover:border-[#005BAC]/20"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${categoryColors[idx % categoryColors.length]} flex items-center justify-center`}>
                  <IconComp className="w-5 h-5 text-white" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => handleOpenEdit(e, cat)} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors">
                    <FiEdit2 className="w-4 h-4" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setDeleteItem(cat); setShowDelete(true); }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-base font-bold text-gray-800">{cat.nama}</h3>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{cat.deskripsi || '-'}</p>
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">{cat.total_barang || 0} barang</span>
                <FiChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#005BAC] transition-colors" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && !loading && (
        <EmptyState
          icon={GiVideoCamera}
          title="Kategori Tidak Ditemukan"
          description="Tidak ada kategori yang sesuai dengan pencarian Anda"
        />
      )}

      {
}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Kategori' : 'Tambah Kategori'}>
        <form onSubmit={handleSubmit}>
          <Input label="Nama Kategori" name="nama" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Masukkan nama kategori" required />
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi</label>
            <textarea name="deskripsi" value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} placeholder="Deskripsi kategori (opsional)" rows={3} className="input-field" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={() => setShowModal(false)}>Batal</Button>
            <Button type="submit" loading={saving}>{editItem ? 'Simpan' : 'Tambah'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={showDelete} onClose={() => setShowDelete(false)} onConfirm={handleDelete} title="Hapus Kategori" message={`Apakah Anda yakin ingin menghapus kategori "${deleteItem?.nama}"?`} />
    </div>
  );
};

export default Kategori;