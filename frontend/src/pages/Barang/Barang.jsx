

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiEye, FiUpload, FiX, FiPackage, FiCrop } from 'react-icons/fi';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import DropdownSelect from '../../components/ui/DropdownSelect';
import ImageCropModal from '../../components/ui/ImageCropModal';
import { generateKodeBarang, getBarangFotoUrl } from '../../utils/format';
import { KATEGORI_DEFAULT, STATUS_BARANG, KONDISI_BARANG } from '../../utils/constants';
import lokasiService from '../../services/lokasiService';
import toast from 'react-hot-toast';
import api from '../../services/api';

const Barang = () => {
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || '';

  const [barang, setBarang] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState('');
  const [filterStatus, setFilterStatus] = useState(initialStatus);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  
  const [imgErrors, setImgErrors] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [saving, setSaving] = useState(false);

  
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoFile, setFotoFile] = useState(null);

  
  const [showCropModal, setShowCropModal] = useState(false);
  const [originalImageUrl, setOriginalImageUrl] = useState(null);
  const fotoInputRef = useRef(null);

  
  const [form, setForm] = useState({
    kode_barang: '',
    nama_barang: '',
    kategori_id: '',
    lokasi: 'Studio Podcast',
    lokasi_id: '',
    kondisi: 'Baik',
    status: 'Tersedia',
    deskripsi: '',
  });

  const [categories, setCategories] = useState([]);
  const [lokasiList, setLokasiList] = useState([]);

  useEffect(() => {
    fetchBarang();
    fetchCategories();
    fetchLokasi();
  }, [currentPage, search, filterKategori, filterStatus]);

  const fetchLokasi = async () => {
    try {
      const res = await lokasiService.getActive();
      setLokasiList(res.data || []);
    } catch {
      setLokasiList([]);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/kategori');
      setCategories(res.data.data || []);
    } catch {
      setCategories(KATEGORI_DEFAULT.map((k, i) => ({ id: i + 1, nama: k })));
    }
  };

  const fetchBarang = async () => {
    setLoading(true);
    try {
      const params = { page: currentPage };
      if (search) params.search = search;
      if (filterKategori) params.kategori = filterKategori;
      if (filterStatus) params.status = filterStatus;
      const res = await api.get('/barang', { params });
      setBarang(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotalItems(res.data.pagination?.totalItems || 0);
    } catch (err) {
      toast.error('Gagal memuat data barang');
      setBarang([]);
      setTotalPages(1);
      setTotalItems(0);
    }
    setLoading(false);
  };

  const handleOpenAdd = async () => {
    setEditItem(null);
    setFotoPreview(null);
    setFotoFile(null);
    setOriginalImageUrl(null);
    if (fotoInputRef.current) fotoInputRef.current.value = '';
    try {
      const res = await api.get('/barang', { params: { page: 1 } });
      const totalCount = res.data.pagination?.totalItems || barang.length;
      setForm({
        kode_barang: generateKodeBarang('KAM', totalCount + 1),
        nama_barang: '',
        kategori_id: '',
        lokasi: lokasiList.length > 0 ? lokasiList[0].nama_lokasi : 'Studio Podcast',
        lokasi_id: lokasiList.length > 0 ? String(lokasiList[0].id) : '',
        kondisi: 'Baik',
        status: 'Tersedia',
        deskripsi: '',
        jumlah: 1,
      });
    } catch {
      setForm({
        kode_barang: generateKodeBarang('KAM', barang.length + 1),
        nama_barang: '',
        kategori_id: '',
        lokasi: lokasiList.length > 0 ? lokasiList[0].nama_lokasi : 'Studio Podcast',
        lokasi_id: lokasiList.length > 0 ? String(lokasiList[0].id) : '',
        kondisi: 'Baik',
        status: 'Tersedia',
        deskripsi: '',
        jumlah: 1,
      });
    }
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditItem(item);
    setFotoPreview(item.foto ? getBarangFotoUrl(item.foto) : null);
    setFotoFile(null);
    setOriginalImageUrl(null);
    if (fotoInputRef.current) fotoInputRef.current.value = '';
    setForm({
      kode_barang: item.kode_barang,
      nama_barang: item.nama_barang,
      kategori_id: String(item.kategori_id || item.kategori_nama),
      lokasi: item.lokasi_nama || item.lokasi,
      lokasi_id: item.lokasi_id ? String(item.lokasi_id) : '',
      kondisi: item.kondisi,
      status: item.status,
      deskripsi: item.deskripsi || '',
      jumlah: item.jumlah || 1,
      foto: item.foto || '',
    });
    setShowModal(true);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nama_barang || !form.kategori_id) {
      toast.error('Nama barang dan kategori wajib diisi');
      return;
    }
    
    const duplicateName = barang.find(
      b => b.nama_barang.toLowerCase().trim() === form.nama_barang.toLowerCase().trim() && (!editItem || b.id !== editItem.id)
    );
    if (duplicateName) {
      toast.error(`Nama barang "${form.nama_barang.trim()}" sudah digunakan. Gunakan nama lain.`);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        kategori_id: parseInt(form.kategori_id),
        lokasi_id: form.lokasi_id ? parseInt(form.lokasi_id) : null,
      };
      if (editItem) {
        await api.put(`/barang/${editItem.id}`, payload);
        
        if (fotoFile) {
          const formData = new FormData();
          formData.append('foto', fotoFile);
          await api.post(`/barang/${editItem.id}/foto`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
        toast.success('Barang berhasil diperbarui');
      } else {
        const res = await api.post('/barang', payload);
        
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
      setShowModal(false);
      fetchBarang();
    } catch (err) {
      const message = err.response?.data?.message || 'Terjadi kesalahan. Silakan coba lagi.';
      toast.error(message);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/barang/${deleteItem.id}`);
      toast.success('Barang berhasil dihapus');
    } catch (err) {
      const message = err.response?.data?.message || 'Gagal menghapus barang. Silakan coba lagi.';
      toast.error(message);
    }
    setShowDelete(false);
    fetchBarang();
  };

  const getKategoriPrefix = (kategoriId) => {
    const kategori = categories.find(c => String(c.id) === String(kategoriId));
    if (kategori) {
      return kategori.nama.substring(0, 3).toUpperCase();
    }
    return 'BRG';
  };

  const handleChange = (e) => {
    const newForm = { ...form, [e.target.name]: e.target.value };
    if (e.target.name === 'kategori_id' && !editItem) {
      const prefix = getKategoriPrefix(e.target.value);
      newForm.kode_barang = generateKodeBarang(prefix, barang.length + 1);
    }
    setForm(newForm);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Data Barang</h1>
        <p className="page-subtitle">Kelola data barang inventaris TVRI Jawa Timur</p>
      </div>

      {
}
      <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm mb-3 sm:mb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col sm:flex-row flex-1 gap-2 sm:gap-3 sm:items-center">
            <div className="relative flex-1 w-full sm:max-w-md">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                placeholder="Cari barang..."
                className="input-field pl-10"
              />
            </div>
            <div className="flex gap-2">
              <DropdownSelect
                value={filterKategori}
                onChange={(e) => { setFilterKategori(e.target.value); setCurrentPage(1); }}
                options={categories.map(c => ({ value: c.id || c.nama, label: c.nama }))}
                placeholder="Semua Kategori"
                className="w-full sm:w-auto"
              />
              <DropdownSelect
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                options={[
                  { value: 'Tersedia', label: 'Tersedia' },
                  { value: 'Dipinjam', label: 'Dipinjam' },
                  { value: 'Rusak', label: 'Rusak' },
                  { value: 'Dalam Perbaikan', label: 'Dalam Perbaikan' },
                ]}
                placeholder="Semua Status"
                className="w-full sm:w-auto"
              />
            </div>
          </div>
          <Button icon={FiPlus} onClick={handleOpenAdd} className="w-full sm:w-auto">
            Tambah Barang
          </Button>
        </div>
      </div>

      {
}
      <div className="table-container">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F5F7FA]">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Foto</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama Barang</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Kategori</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Jumlah</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Lokasi</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Kondisi</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {barang.map((item, idx) => {
                const fotoUrl = item.foto ? getBarangFotoUrl(item.foto) : null;
                return (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                        {fotoUrl && !imgErrors[item.id] ? (
                          <img src={fotoUrl} alt={item.nama_barang} className="w-full h-full object-cover" onError={() => setImgErrors(prev => ({ ...prev, [item.id]: true }))} />
                        ) : (
                          <FiPackage className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-800">{item.nama_barang}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{item.kategori_nama || item.kategori_id}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">{item.jumlah || 1}</span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{item.lokasi}</td>
                    <td className="py-3 px-4"><Badge status={item.kondisi} /></td>
                    <td className="py-3 px-4"><Badge status={item.status} /></td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => { setDetailItem(item); setShowDetail(true); }} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="Detail">
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
              })}
            </tbody>
          </table>
        </div>

        {
}
        <div className="md:hidden mobile-cards">
          <div className="p-3 space-y-3">
            {barang.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <FiPackage className="w-12 h-12 text-gray-300" />
                <p className="text-sm mt-2">Belum ada data barang</p>
              </div>
            ) : (
              barang.map((item) => {
                const fotoUrl = item.foto ? getBarangFotoUrl(item.foto) : null;
                return (
                  <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                        {fotoUrl && !imgErrors[item.id] ? (
                          <img src={fotoUrl} alt={item.nama_barang} className="w-full h-full object-cover" onError={() => setImgErrors(prev => ({ ...prev, [item.id]: true }))} />
                        ) : (
                          <FiPackage className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{item.nama_barang}</p>
                        <p className="text-xs text-gray-400">{item.kategori_nama || item.kategori_id}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => { setDetailItem(item); setShowDetail(true); }} className="p-2 rounded-lg hover:bg-blue-50 active:bg-blue-100 text-blue-600 transition-colors touch-manipulation" title="Detail">
                          <FiEye className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleOpenEdit(item)} className="p-2 rounded-lg hover:bg-amber-50 active:bg-amber-100 text-amber-600 transition-colors touch-manipulation" title="Edit">
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setDeleteItem(item); setShowDelete(true); }} className="p-2 rounded-lg hover:bg-red-50 active:bg-red-100 text-red-500 transition-colors touch-manipulation" title="Hapus">
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs text-gray-500 mb-2">
                      <div><span className="text-gray-400">Jumlah:</span> <span className="font-medium text-gray-700">{item.jumlah || 1}</span></div>
                      <div><span className="text-gray-400">Lokasi:</span> <span className="font-medium text-gray-700 truncate">{item.lokasi}</span></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge status={item.kondisi} />
                      <Badge status={item.status} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={totalItems} itemsPerPage={itemsPerPage} />
      </div>

      {
}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Barang' : 'Tambah Barang'} size="lg">
        <form onSubmit={handleSubmit}>
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

            <input type="hidden" name="kode_barang" value={form.kode_barang} />
            <Input label="Nama Barang" name="nama_barang" value={form.nama_barang} onChange={handleChange} placeholder="Masukkan nama barang" required />
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Jumlah <span className="text-gray-400 font-normal">(stok)</span></label>
              <input
                type="number"
                name="jumlah"
                value={form.jumlah || 1}
                onChange={handleChange}
                className="input-field"
                min="1"
                placeholder="Jumlah barang"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Kategori</label>
              <DropdownSelect
                value={form.kategori_id}
                onChange={(e) => setForm({ ...form, kategori_id: e.target.value })}
                options={categories.map(c => ({ value: c.id || c.nama, label: c.nama }))}
                placeholder="Pilih kategori"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Lokasi Barang</label>
              <DropdownSelect
                value={form.lokasi}
                onChange={(e) => {
                  const selectedLokasi = lokasiList.find(l => l.nama_lokasi === e.target.value);
                  setForm({ ...form, lokasi: e.target.value, lokasi_id: selectedLokasi ? String(selectedLokasi.id) : '' });
                }}
                options={lokasiList.length > 0
                  ? lokasiList.map(l => ({ value: l.nama_lokasi, label: `${l.nama_lokasi}${l.gedung ? ` — ${l.gedung}` : ''}${l.lantai ? ` Lt. ${l.lantai}` : ''}` }))
                  : [{ value: '', label: 'Memuat lokasi...' }]
                }
                placeholder="Pilih lokasi"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Kondisi</label>
              <DropdownSelect
                value={form.kondisi}
                onChange={(e) => setForm({ ...form, kondisi: e.target.value })}
                options={Object.values(KONDISI_BARANG).map(k => ({ value: k, label: k }))}
                placeholder="Pilih kondisi"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <DropdownSelect
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                options={Object.values(STATUS_BARANG).map(s => ({ value: s, label: s }))}
                placeholder="Pilih status"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi</label>
              <textarea name="deskripsi" value={form.deskripsi} onChange={handleChange} placeholder="Deskripsi barang (opsional)" rows={3} className="input-field" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={() => setShowModal(false)}>Batal</Button>
            <Button type="submit" loading={saving}>{editItem ? 'Simpan Perubahan' : 'Tambah Barang'}</Button>
          </div>
        </form>
      </Modal>

      {
}
      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Detail Barang" size="md">
        {detailItem && (() => {
          const fotoUrl = detailItem.foto ? getBarangFotoUrl(detailItem.foto) : null;
          return (
            <div className="space-y-4">
              {fotoUrl && !imgErrors[`detail-${detailItem.id}`] && (
                <div className="rounded-xl overflow-hidden bg-gray-100">
                  <img src={fotoUrl} alt={detailItem.nama_barang} className="w-full aspect-[4/3] object-cover" onError={() => setImgErrors(prev => ({ ...prev, [`detail-${detailItem.id}`]: true }))} />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-500">Nama Barang</p><p className="text-sm font-semibold">{detailItem.nama_barang}</p></div>
                <div><p className="text-xs text-gray-500">Kategori</p><p className="text-sm">{detailItem.kategori_nama || detailItem.kategori_id}</p></div>
                <div><p className="text-xs text-gray-500">Jumlah</p><p className="text-sm font-semibold">{detailItem.jumlah || 1} unit</p></div>
                <div><p className="text-xs text-gray-500">Lokasi</p><p className="text-sm">{detailItem.lokasi_nama || detailItem.lokasi}{detailItem.lokasi_gedung ? ` — ${detailItem.lokasi_gedung}` : ''}{detailItem.lokasi_lantai ? ` Lt. ${detailItem.lokasi_lantai}` : ''}{detailItem.lokasi_ruangan ? `, ${detailItem.lokasi_ruangan}` : ''}</p></div>
                <div><p className="text-xs text-gray-500">Kondisi</p><Badge status={detailItem.kondisi} /></div>
                <div><p className="text-xs text-gray-500">Status</p><Badge status={detailItem.status} /></div>
              </div>
              {detailItem.deskripsi && (
                <div><p className="text-xs text-gray-500">Deskripsi</p><p className="text-sm mt-1">{detailItem.deskripsi}</p></div>
              )}
            </div>
          );
        })()}
      </Modal>

      {
}
      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Hapus Barang"
        message={`Apakah Anda yakin ingin menghapus "${deleteItem?.nama_barang}"? Tindakan ini tidak dapat dibatalkan.`}
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
};

export default Barang;