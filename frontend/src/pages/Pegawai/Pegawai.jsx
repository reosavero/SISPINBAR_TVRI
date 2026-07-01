// ============================================
// PEGAWAI PAGE - Sistem Peminjaman Barang TVRI
// ============================================

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiMail, FiPhone, FiUser, FiLock, FiCheck } from 'react-icons/fi';
import { MdPeople } from 'react-icons/md';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { DIVISI, JABATAN } from '../../utils/constants';
import { getInitials } from '../../utils/format';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Pegawai = () => {
  const [pegawai, setPegawai] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
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

  useEffect(() => { fetchPegawai(); }, [currentPage, search]);

  const fetchPegawai = async () => {
    setLoading(true);
    try {
      const params = { page: currentPage };
      if (search) params.search = search;
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nama || !form.nip) { toast.error('NIP dan Nama wajib diisi'); return; }

    // Validasi untuk pegawai baru
    if (!editItem) {
      if (!form.username) { toast.error('Username wajib diisi untuk pegawai baru'); return; }
      if (!form.password) { toast.error('Password wajib diisi untuk pegawai baru'); return; }
      if (form.password.length < 6) { toast.error('Password minimal 6 karakter'); return; }
      if (form.username.length < 3) { toast.error('Username minimal 3 karakter'); return; }
    }

    // Validasi reset password jika diaktifkan
    if (editItem && resetPassword.enabled) {
      if (!resetPassword.newPassword) { toast.error('Password baru wajib diisi'); return; }
      if (resetPassword.newPassword.length < 6) { toast.error('Password baru minimal 6 karakter'); return; }
      if (resetPassword.newPassword !== resetPassword.confirmPassword) { toast.error('Konfirmasi password tidak cocok'); return; }
    }

    setSaving(true);
    try {
      if (editItem) {
        // Edit pegawai
        const updateData = { ...form };
        if (!updateData.password) delete updateData.password;

        // Jika reset password diaktifkan, kirim password baru
        if (resetPassword.enabled) {
          updateData.password = resetPassword.newPassword;
        }

        await api.put(`/pegawai/${editItem.id}`, updateData);

        // Reset password via endpoint terpisah jika diaktifkan
        // (sudah include di updateData.password di atas)

        toast.success(resetPassword.enabled
          ? 'Pegawai dan password berhasil diperbarui'
          : 'Pegawai berhasil diperbarui'
        );
      } else {
        // Tambah baru
        await api.post('/pegawai', form);
        toast.success('Pegawai berhasil ditambahkan. Akun login telah dibuat.');
      }
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
        <div className="relative w-full sm:w-72">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} placeholder="Cari pegawai..." className="input-field pl-10" />
        </div>
      </div>

      {/* Info Banner + Tambah Pegawai */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4 flex-1">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <FiUser className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800">Pendaftaran Pegawai Baru</p>
              <p className="text-xs text-blue-600 mt-0.5">Setiap pegawai yang ditambahkan akan otomatis mendapatkan akun login. Pegawai dapat login menggunakan username dan password yang didaftarkan admin.</p>
            </div>
          </div>
        </div>
        <Button icon={FiPlus} onClick={handleOpenAdd}>Tambah Pegawai</Button>
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Username {editItem ? '' : <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '') })}
                    placeholder="contoh: budi.santoso"
                    className="input-field pl-10"
                    required={!editItem}
                    minLength={3}
                    disabled={!!editItem}
                  />
                </div>
                {editItem && <p className="text-xs text-gray-400 mt-1">Username tidak dapat diubah</p>}
              </div>
              {!editItem ? (
                /* Password field untuk TAMBAH BARU */
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="Minimal 6 karakter"
                      className="input-field pl-10"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              ) : (
                /* Saat EDIT: toggle reset password */
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <div className="flex items-center gap-3 mt-1">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={resetPassword.enabled}
                        onChange={(e) => setResetPassword({ ...resetPassword, enabled: e.target.checked, newPassword: '', confirmPassword: '' })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#005BAC]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#005BAC]"></div>
                    </label>
                    <span className="text-sm text-gray-600">Ubah password</span>
                  </div>
                </div>
              )}
            </div>

            {/* Password fields saat edit & toggle aktif */}
            {editItem && resetPassword.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-9 mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Password Baru <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="password"
                      value={resetPassword.newPassword}
                      onChange={(e) => setResetPassword({ ...resetPassword, newPassword: e.target.value })}
                      placeholder="Minimal 6 karakter"
                      className="input-field pl-10"
                      minLength={6}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Konfirmasi Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="password"
                      value={resetPassword.confirmPassword}
                      onChange={(e) => setResetPassword({ ...resetPassword, confirmPassword: e.target.value })}
                      placeholder="Ulangi password baru"
                      className="input-field pl-10"
                      minLength={6}
                    />
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

          {/* Divider */}
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
                <input
                  type="text"
                  value={form.nip}
                  onChange={(e) => setForm({ ...form, nip: e.target.value })}
                  placeholder="Masukkan NIP"
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Lengkap <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  placeholder="Masukkan nama lengkap"
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Jabatan</label>
                <select
                  value={form.jabatan}
                  onChange={(e) => setForm({ ...form, jabatan: e.target.value })}
                  className="input-field"
                >
                  <option value="">Pilih jabatan</option>
                  {JABATAN.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Divisi</label>
                <select
                  value={form.divisi}
                  onChange={(e) => setForm({ ...form, divisi: e.target.value })}
                  className="input-field"
                >
                  <option value="">Pilih divisi</option>
                  {DIVISI.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="nama@tvri.go.id"
                    className="input-field pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nomor HP</label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={form.nomor_hp}
                    onChange={(e) => setForm({ ...form, nomor_hp: e.target.value })}
                    placeholder="08xxxxxxxxxx"
                    className="input-field pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={() => setShowModal(false)}>Batal</Button>
            <Button type="submit" loading={saving}>
              {editItem ? 'Simpan Perubahan' : 'Tambah Pegawai'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========== KONFIRMASI HAPUS ========== */}
      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Hapus Pegawai"
        message={`Apakah Anda yakin ingin menghapus data pegawai "${deleteItem?.nama}"? Akun login pegawai ini juga akan dihapus.`}
      />
    </div>
  );
};

export default Pegawai;