// ============================================
// RIWAYAT PAGE - Sistem Peminjaman Barang TVRI
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiPackage, FiEye, FiDownload, FiArchive, FiCalendar, FiChevronRight, FiChevronLeft, FiFileText, FiTrash2 } from 'react-icons/fi';
import { MdHistory } from 'react-icons/md';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { formatDate, formatDatePukul, formatTime, formatTimeAlways, getBarangFotoUrl } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const BULAN_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const Riwayat = () => {
  const { isAdmin, isSuperAdmin, isPegawai } = useAuth();
  const [riwayat, setRiwayat] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [summary, setSummary] = useState({ total: 0, dikembalikan: 0, dipinjam: 0, ditolak: 0 });
  const itemsPerPage = isAdmin ? 10 : 5;
  const [imgErrors, setImgErrors] = useState({});
  const [exporting, setExporting] = useState(false);

  // Delete states (super_admin only)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Bulk delete states (super_admin only)
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [bulkDeleteInfo, setBulkDeleteInfo] = useState(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Detail modal
  const [showDetail, setShowDetail] = useState(false);
  const [detailItem, setDetailItem] = useState(null);

  // Archive state
  const [archiveYears, setArchiveYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [archiveMonths, setArchiveMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [archiveData, setArchiveData] = useState([]);
  const [archivePagination, setArchivePagination] = useState({ page: 1, totalPages: 1, totalItems: 0 });
  const [archiveSummary, setArchiveSummary] = useState({ total: 0, dikembalikan: 0, dipinjam: 0, ditolak: 0, menunggu: 0 });
  const [loadingArchive, setLoadingArchive] = useState(false);
  const [exportingArchive, setExportingArchive] = useState(false);
  const [archiveBreadcrumb, setArchiveBreadcrumb] = useState([]); // 'years' | 'months' | 'data'

  useEffect(() => { fetchRiwayat(); }, [currentPage, search]);

  // Load archive years on mount (admin only)
  useEffect(() => {
    if (isAdmin) fetchArchiveYears();
  }, [isAdmin]);

  const fetchRiwayat = async () => {
    setLoading(true);
    try {
      const params = { page: currentPage, limit: itemsPerPage };
      if (search) params.search = search;
      const res = await api.get('/riwayat', { params });
      setRiwayat(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotalItems(res.data.pagination?.totalItems || 0);
      const data = res.data.data || [];
      const dikembalikan = data.filter(r => r.status === 'Dikembalikan').length;
      const dipinjam = data.filter(r => r.status === 'Dipinjam' || r.status === 'Disetujui').length;
      const ditolak = data.filter(r => r.status === 'Ditolak').length;
      setSummary({
        total: res.data.pagination?.totalItems || 0,
        dikembalikan,
        dipinjam,
        ditolak,
      });
    } catch (err) {
      toast.error('Gagal memuat data riwayat');
      setRiwayat([]);
      setTotalPages(1);
      setTotalItems(0);
    }
    setLoading(false);
  };

  // ========== ARCHIVE FUNCTIONS ==========
  const fetchArchiveYears = async () => {
    try {
      const res = await api.get('/archive/years');
      setArchiveYears(res.data.data || []);
    } catch (err) {
      console.error('Failed to load archive years:', err);
    }
  };

  const fetchArchiveMonths = async (year) => {
    setLoadingArchive(true);
    try {
      const res = await api.get('/archive/months', { params: { year } });
      setArchiveMonths(res.data.data || []);
      setSelectedYear(year);
      setArchiveBreadcrumb(['years', 'months']);
    } catch (err) {
      toast.error('Gagal memuat bulan arsip');
    }
    setLoadingArchive(false);
  };

  const fetchArchiveData = async (year, month, page = 1) => {
    setLoadingArchive(true);
    try {
      const res = await api.get('/archive/data', { params: { year, month, page } });
      setArchiveData(res.data.data || []);
      setArchivePagination(res.data.pagination || { page: 1, totalPages: 1, totalItems: 0 });
      setArchiveSummary(res.data.summary || {});
      setSelectedMonth(month);
      setArchiveBreadcrumb(['years', 'months', 'data']);
    } catch (err) {
      toast.error('Gagal memuat data arsip');
    }
    setLoadingArchive(false);
  };

  const handleArchiveBack = () => {
    if (archiveBreadcrumb.length === 3) {
      // From data -> months
      setArchiveData([]);
      setSelectedMonth(null);
      setArchiveBreadcrumb(['years', 'months']);
    } else if (archiveBreadcrumb.length === 2) {
      // From months -> years
      setArchiveMonths([]);
      setSelectedYear(null);
      setArchiveBreadcrumb(['years']);
    }
  };

  const handleExportArchiveExcel = async () => {
    if (!selectedYear || !selectedMonth) return;
    setExportingArchive(true);
    try {
      const res = await api.get('/archive/export/excel', {
        params: { year: selectedYear, month: selectedMonth },
        responseType: 'blob',
        timeout: 60000,
      });
      if (res.data.type === 'application/json') {
        const text = await res.data.text();
        const errData = JSON.parse(text);
        toast.error(errData.message || 'Gagal mengekspor arsip');
        return;
      }
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `arsip-riwayat-${selectedYear}-${String(selectedMonth).padStart(2, '0')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Arsip Excel berhasil diunduh');
    } catch (err) {
      console.error('Export archive error:', err);
      if (err.code === 'ECONNABORTED') {
        toast.error('Export timeout. Coba lagi nanti.');
      } else {
        toast.error('Gagal mengekspor arsip');
      }
    }
    setExportingArchive(false);
  };

  const handleOpenDetail = (item) => {
    setDetailItem(item);
    setShowDetail(true);
  };

  // ===== DELETE HANDLERS (super_admin only) =====

  // Delete single record
  const handleDeleteRecord = (item) => {
    setDeleteItem(item);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteRecord = async () => {
    setDeleting(true);
    try {
      const res = await api.delete(`/riwayat/${deleteItem.id}`);
      toast.success(res.data.message || 'Riwayat berhasil dihapus');
      setShowDeleteConfirm(false);
      setDeleteItem(null);
      // Refresh data
      fetchRiwayat();
      if (isAdmin) fetchArchiveYears();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus riwayat');
    } finally {
      setDeleting(false);
    }
  };

  // Bulk delete by month/year (archive)
  const handleBulkDeletePreview = async (year, month) => {
    try {
      const res = await api.get('/archive/delete/count', { params: { year, month } });
      setBulkDeleteInfo({
        ...res.data.data,
        year,
        month,
        monthName: BULAN_NAMES[month - 1],
      });
      setShowBulkDeleteConfirm(true);
    } catch (err) {
      toast.error('Gagal menghitung data yang akan dihapus');
    }
  };

  const confirmBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      const res = await api.delete('/archive/bulk', { data: { year: bulkDeleteInfo.year, month: bulkDeleteInfo.month } });
      toast.success(res.data.message || `Berhasil menghapus ${bulkDeleteInfo.deletable} riwayat`);
      setShowBulkDeleteConfirm(false);
      setBulkDeleteInfo(null);
      // Refresh archive
      fetchArchiveYears();
      // If currently viewing this month's data, refresh
      if (selectedYear === bulkDeleteInfo.year && selectedMonth === bulkDeleteInfo.month) {
        fetchArchiveData(selectedYear, selectedMonth, archivePagination.page);
      }
      // Reset archive view
      setSelectedMonth(null);
      setArchiveData([]);
      setArchiveBreadcrumb(['years']);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus riwayat secara massal');
    } finally {
      setBulkDeleting(false);
    }
  };

  // Export handler for current data
  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const params = {};
      if (search) params.search = search;
      const res = await api.get('/export/riwayat/excel', { params, responseType: 'blob', timeout: 60000 });
      if (res.data.type === 'application/json') {
        const text = await res.data.text();
        const errData = JSON.parse(text);
        toast.error(errData.message || 'Gagal mengekspor Excel');
        return;
      }
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `laporan-riwayat-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Laporan Excel berhasil diunduh');
    } catch (err) {
      console.error('Export Excel error:', err);
      if (err.code === 'ERR_NETWORK') {
        toast.error('Server tidak dapat dijangkau. Pastikan server berjalan.');
      } else if (err.code === 'ECONNABORTED') {
        toast.error('Export Excel timeout. Coba lagi nanti.');
      } else if (err.response?.status === 401) {
        toast.error('Sesi Anda telah berakhir. Silakan login kembali.');
      } else {
        toast.error(err.response?.data?.message || 'Gagal mengekspor Excel');
      }
    }
    setExporting(false);
  };

  return (
    <div className="page-container">
      {/* Header + Search + Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">{isAdmin ? 'Riwayat Transaksi' : 'Riwayat Saya'}</h1>
          <p className="page-subtitle">
            {isAdmin ? 'Semua riwayat peminjaman dan pengembalian barang' : 'Riwayat peminjaman dan pengembalian barang Anda'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} placeholder="Cari transaksi..." className="input-field pl-10" />
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={exporting}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-sm shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[44px] sm:min-h-0"
            >
              {exporting ? (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <FiDownload className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Export Excel</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-4">
        {[
          { label: 'Total Transaksi', value: summary.total, color: 'bg-blue-50 border-blue-200', textColor: 'text-blue-700' },
          { label: 'Dikembalikan', value: summary.dikembalikan, color: 'bg-emerald-50 border-emerald-200', textColor: 'text-emerald-700' },
          { label: 'Sedang Dipinjam', value: summary.dipinjam, color: 'bg-amber-50 border-amber-200', textColor: 'text-amber-700' },
          { label: 'Ditolak', value: summary.ditolak, color: 'bg-red-50 border-red-200', textColor: 'text-red-700' },
        ].map((item) => (
          <div key={item.label} className={`${item.color} border rounded-xl p-3 text-center`}>
            <p className={`text-2xl font-bold ${item.textColor}`}>{item.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F5F7FA]">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Barang</th>
                {isAdmin && <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Pegawai</th>}
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Jumlah</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Tgl Pinjam</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Pukul</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Tgl Kembali</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Pukul</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Keperluan</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {riwayat.length === 0 && !loading ? (
                <tr>
                  <td colSpan={isAdmin ? 10 : 9} className="text-center py-12 text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <MdHistory className="w-12 h-12 text-gray-300" />
                      <p className="text-sm">Belum ada riwayat transaksi bulan ini</p>
                    </div>
                  </td>
                </tr>
              ) : (
                riwayat.map((item, idx) => {
                  const fotoUrl = item.barang_foto ? getBarangFotoUrl(item.barang_foto) : null;
                  const imgError = imgErrors[`riwayat-${item.id}`];
                  return (
                    <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                            {fotoUrl && !imgError ? (
                              <img src={fotoUrl} alt={item.barang_nama || item.nama_barang} className="w-full h-full object-cover" onError={() => setImgErrors(prev => ({ ...prev, [`riwayat-${item.id}`]: true }))} />
                            ) : (
                              <FiPackage className="w-5 h-5 text-gray-300" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{item.barang_nama || item.nama_barang}</p>
                            <p className="text-xs text-gray-400">{item.kategori_nama}</p>
                          </div>
                        </div>
                      </td>
                      {isAdmin && <td className="py-3 px-4 text-sm font-medium text-gray-800">{item.pegawai_nama}</td>}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">{item.jumlah || 1}</span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{formatDate(item.tanggal_pinjam)}</td>
                      <td className="py-3 px-4 text-sm text-gray-500 font-medium">{formatTimeAlways(item.tanggal_pinjam)}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {item.status === 'Dikembalikan' && item.tanggal_kembali_aktual
                          ? formatDate(item.tanggal_kembali_aktual)
                          : item.tanggal_kembali_rencana ? formatDate(item.tanggal_kembali_rencana)
                          : '-'
                        }
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500 font-medium">
                        {item.status === 'Dikembalikan' && item.tanggal_kembali_aktual
                          ? formatTime(item.tanggal_kembali_aktual)
                          : '-'
                        }
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500 max-w-[180px] truncate">{item.keperluan}</td>
                      <td className="py-3 px-4"><Badge status={item.status} /></td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenDetail(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#005BAC] to-[#003B71] hover:from-[#006CC4] hover:to-[#004A8F] text-white text-xs font-semibold shadow-sm shadow-blue-200 hover:shadow-md hover:shadow-blue-200 transition-all duration-200 active:scale-95"
                            title="Lihat Detail"
                          >
                            <FiEye className="w-3.5 h-3.5" />
                            Detail
                          </button>
                          {isSuperAdmin && (
                            <button
                              onClick={() => handleDeleteRecord(item)}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 transition-all duration-200 active:scale-95"
                              title="Hapus Riwayat"
                            >
                              <FiTrash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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
        <div className="md:hidden space-y-3 p-4">
          {riwayat.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <MdHistory className="w-12 h-12 text-gray-300" />
              <p className="text-sm mt-2">Belum ada riwayat transaksi bulan ini</p>
            </div>
          ) : (
            riwayat.map((item) => {
              const fotoUrl = item.barang_foto ? getBarangFotoUrl(item.barang_foto) : null;
              const imgError = imgErrors[`riwayat-${item.id}`];
              return (
                <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                      {fotoUrl && !imgError ? (
                        <img src={fotoUrl} alt={item.barang_nama || item.nama_barang} className="w-full h-full object-cover" onError={() => setImgErrors(prev => ({ ...prev, [`riwayat-${item.id}`]: true }))} />
                      ) : (
                        <FiPackage className="w-6 h-6 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{item.barang_nama || item.nama_barang}</p>
                      <p className="text-xs text-gray-400">{item.kategori_nama}</p>
                    </div>
                    <Badge status={item.status} />
                  </div>
                  {isAdmin && <p className="text-xs text-gray-500 mb-2">Pegawai: <span className="font-medium text-gray-700">{item.pegawai_nama}</span></p>}
                  <div className="grid grid-cols-2 gap-1 text-xs text-gray-500 mb-2">
                    <div><span className="text-gray-400">Jumlah:</span> <span className="font-medium text-gray-700">{item.jumlah || 1}</span></div>
                    <div><span className="text-gray-400">Pinjam:</span> <span className="font-medium text-gray-700">{formatDate(item.tanggal_pinjam)}</span></div>
                    <div><span className="text-gray-400">Pukul:</span> <span className="font-medium text-gray-700">{formatTimeAlways(item.tanggal_pinjam)}</span></div>
                    <div><span className="text-gray-400">Kembali:</span> <span className="font-medium text-gray-700">{item.status === 'Dikembalikan' && item.tanggal_kembali_aktual ? formatDate(item.tanggal_kembali_aktual) : item.tanggal_kembali_rencana ? formatDate(item.tanggal_kembali_rencana) : '-'}</span></div>
                    <div><span className="text-gray-400">Pukul Kembali:</span> <span className="font-medium text-[#005BAC]">{item.status === 'Dikembalikan' && item.tanggal_kembali_aktual ? formatTime(item.tanggal_kembali_aktual) : '-'}</span></div>
                  </div>
                  {item.keperluan && <p className="text-xs text-gray-500 truncate"><span className="text-gray-400">Keperluan:</span> {item.keperluan}</p>}
                  <div className="flex items-center gap-2 pt-3 mt-2 border-t border-gray-100">
                    <button
                      onClick={() => handleOpenDetail(item)}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#005BAC] to-[#003B71] hover:from-[#006CC4] hover:to-[#004A8F] text-white text-xs font-bold shadow-sm shadow-blue-200 active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5 touch-manipulation min-h-[44px]"
                    >
                      <FiEye className="w-3.5 h-3.5" /> Detail
                    </button>
                    {isSuperAdmin && (
                      <button
                        onClick={() => handleDeleteRecord(item)}
                        className="py-2.5 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 text-xs font-bold active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5 touch-manipulation min-h-[44px]"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" /> Hapus
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={totalItems} itemsPerPage={itemsPerPage} />
      </div>

      {/* ========== ARSIP RIWAYAT (Admin Only) ========== */}
      {isAdmin && (
        <div className="mt-8">
          {/* Section Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md shadow-purple-200">
              <FiArchive className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Arsip Riwayat</h2>
              <p className="text-xs text-gray-500">Riwayat transaksi bulan-bulan sebelumnya</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Breadcrumb */}
            {archiveBreadcrumb.length > 0 && (
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2 text-sm">
                <button
                  onClick={() => { setArchiveMonths([]); setArchiveData([]); setSelectedYear(null); setSelectedMonth(null); setArchiveBreadcrumb([]); }}
                  className={`transition-colors ${!selectedYear ? 'text-[#005BAC] font-semibold' : 'text-gray-500 hover:text-[#005BAC]'}`}
                >
                  Pilih Tahun
                </button>
                {selectedYear && (
                  <>
                    <FiChevronRight className="w-3.5 h-3.5 text-gray-400" />
                    <button
                      onClick={handleArchiveBack}
                      className={`transition-colors ${selectedYear && !selectedMonth ? 'text-[#005BAC] font-semibold' : 'text-gray-500 hover:text-[#005BAC]'}`}
                    >
                      {selectedYear}
                    </button>
                  </>
                )}
                {selectedMonth && (
                  <>
                    <FiChevronRight className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-[#005BAC] font-semibold">{BULAN_NAMES[selectedMonth - 1]} {selectedYear}</span>
                  </>
                )}
              </div>
            )}

            {/* Back button when in months or data view */}
            {(archiveBreadcrumb.length > 0) && (
              <div className="px-4 py-2.5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <button
                  onClick={handleArchiveBack}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-[#005BAC]/30 text-sm font-semibold text-gray-600 hover:text-[#005BAC] transition-all duration-200 group"
                >
                  <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-gray-100 group-hover:bg-[#005BAC]/10 transition-colors">
                    <FiChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                  </span>
                  Kembali
                </button>
              </div>
            )}

            <div className="p-4">
              {/* YEARS VIEW */}
              {!selectedYear && (
                <div>
                  {archiveYears.length === 0 ? (
                    <div className="text-center py-12">
                      <FiArchive className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-400">Belum ada arsip riwayat</p>
                      <p className="text-xs text-gray-400 mt-1">Arsip akan tersedia setelah pergantian bulan</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {archiveYears.map(year => (
                        <button
                          key={year}
                          onClick={() => fetchArchiveMonths(year)}
                          className="group relative bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-200 hover:shadow-md transition-all duration-200 text-center"
                        >
                          <FiCalendar className="w-7 h-7 text-[#005BAC] mx-auto mb-2 group-hover:scale-110 transition-transform" />
                          <p className="text-xl font-bold text-gray-800">{year}</p>
                          <p className="text-xs text-gray-500 mt-1">Lihat arsip</p>
                          <FiChevronRight className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 group-hover:text-[#005BAC] transition-colors" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* MONTHS VIEW */}
              {selectedYear && !selectedMonth && (
                <div>
                  {loadingArchive ? (
                    <div className="flex justify-center py-12">
                      <svg className="animate-spin w-8 h-8 text-[#005BAC]" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </div>
                  ) : archiveMonths.length === 0 ? (
                    <div className="text-center py-12">
                      <FiCalendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-400">Tidak ada arsip untuk tahun {selectedYear}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {archiveMonths.map(m => (
                        <button
                          key={m.bulan}
                          onClick={() => fetchArchiveData(selectedYear, m.bulan)}
                          className="group bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-4 hover:from-emerald-100 hover:to-teal-100 hover:border-emerald-200 hover:shadow-md transition-all duration-200 text-center w-full"
                        >
                          <p className="text-base font-bold text-gray-800">{m.nama_bulan}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{m.total_transaksi} transaksi</p>
                          <div className="mt-2 flex items-center justify-center gap-1 text-emerald-600 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            <FiEye className="w-3.5 h-3.5" />
                            Lihat detail
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* DATA VIEW */}
              {selectedYear && selectedMonth && (
                <div>
                  {/* Summary + Export */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                        Total: {archiveSummary.total}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                        Dikembalikan: {archiveSummary.dikembalikan}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">
                        Dipinjam: {archiveSummary.dipinjam}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-xs font-medium">
                        Ditolak: {archiveSummary.ditolak}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isSuperAdmin && (
                        <button
                          onClick={() => handleBulkDeletePreview(selectedYear, selectedMonth)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 text-sm font-medium transition-all border border-red-200 hover:border-red-300"
                        >
                          <FiTrash2 className="w-4 h-4" />
                          Hapus Semua
                        </button>
                      )}
                      <button
                        onClick={handleExportArchiveExcel}
                        disabled={exportingArchive}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {exportingArchive ? (
                          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        ) : (
                          <FiDownload className="w-4 h-4" />
                        )}
                        Export Excel
                      </button>
                    </div>
                  </div>

                  {/* Archive Data Table */}
                  {loadingArchive ? (
                    <div className="flex justify-center py-12">
                      <svg className="animate-spin w-8 h-8 text-[#005BAC]" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </div>
                  ) : archiveData.length === 0 ? (
                    <div className="text-center py-12">
                      <FiFileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-400">Tidak ada data untuk bulan ini</p>
                    </div>
                  ) : (
                    <>
                      {/* Desktop Table */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase">Barang</th>
                              <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase">Pegawai</th>
                              <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase">Jumlah</th>
                              <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase">Tgl Pinjam</th>
                              <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase">Pukul</th>
                              <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase">Tgl Kembali</th>
                              <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase">Pukul</th>
                              <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                              <th className="text-center py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {archiveData.map((item, idx) => {
                              const fotoUrl = item.barang_foto ? getBarangFotoUrl(item.barang_foto) : null;
                              const imgError = imgErrors[`arch-${item.id}`];
                              return (
                                <tr key={item.id} className="hover:bg-gray-50/50">
                                  <td className="py-2.5 px-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                                        {fotoUrl && !imgError ? (
                                          <img src={fotoUrl} alt={item.barang_nama} className="w-full h-full object-cover" onError={() => setImgErrors(prev => ({ ...prev, [`arch-${item.id}`]: true }))} />
                                        ) : (
                                          <FiPackage className="w-4 h-4 text-gray-300" />
                                        )}
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-gray-800">{item.barang_nama || '-'}</p>
                                        <p className="text-xs text-gray-400">{item.kategori_nama}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3 text-sm text-gray-700">{item.pegawai_nama || '-'}</td>
                                  <td className="py-2.5 px-3">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">{item.jumlah || 1}</span>
                                  </td>
                                  <td className="py-2.5 px-3 text-sm text-gray-600">{formatDate(item.tanggal_pinjam)}</td>
                                  <td className="py-2.5 px-3 text-sm text-gray-500 font-medium">{formatTimeAlways(item.tanggal_pinjam)}</td>
                                  <td className="py-2.5 px-3 text-sm text-gray-600">
                                    {item.tanggal_kembali_aktual ? formatDate(item.tanggal_kembali_aktual) : item.tanggal_kembali_rencana ? formatDate(item.tanggal_kembali_rencana) : '-'}
                                  </td>
                                  <td className="py-2.5 px-3 text-sm text-gray-500 font-medium">
                                    {item.tanggal_kembali_aktual ? formatTime(item.tanggal_kembali_aktual) : '-'}
                                  </td>
                                  <td className="py-2.5 px-3"><Badge status={item.status} /></td>
                                  <td className="py-2.5 px-3 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        onClick={() => handleOpenDetail(item)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#005BAC] hover:bg-[#003B71] text-white text-xs font-medium transition-colors"
                                      >
                                        <FiEye className="w-3 h-3" /> Detail
                                      </button>
                                      {isSuperAdmin && (
                                        <button
                                          onClick={() => handleDeleteRecord(item)}
                                          className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 transition-all duration-200 active:scale-95"
                                          title="Hapus Riwayat"
                                        >
                                          <FiTrash2 className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Cards */}
                      <div className="md:hidden space-y-2">
                        {archiveData.map((item) => {
                          const fotoUrl = item.barang_foto ? getBarangFotoUrl(item.barang_foto) : null;
                          const imgError = imgErrors[`arch-${item.id}`];
                          return (
                            <div key={item.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-9 h-9 rounded-lg overflow-hidden bg-white flex items-center justify-center flex-shrink-0">
                                  {fotoUrl && !imgError ? (
                                    <img src={fotoUrl} alt={item.barang_nama} className="w-full h-full object-cover" onError={() => setImgErrors(prev => ({ ...prev, [`arch-${item.id}`]: true }))} />
                                  ) : (
                                    <FiPackage className="w-4 h-4 text-gray-300" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-800 truncate">{item.barang_nama || '-'}</p>
                                  <p className="text-xs text-gray-400">{item.pegawai_nama} · {item.jumlah || 1} unit</p>
                                </div>
                                <Badge status={item.status} />
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span>Pinjam: {formatDate(item.tanggal_pinjam)}</span>
                                <span className="text-[#005BAC] font-medium">Pukul {formatTimeAlways(item.tanggal_pinjam)}</span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                                <span>Kembali: {item.tanggal_kembali_aktual ? formatDate(item.tanggal_kembali_aktual) : item.tanggal_kembali_rencana ? formatDate(item.tanggal_kembali_rencana) : '-'}</span>
                                <span className="text-[#005BAC] font-medium">Pukul {item.tanggal_kembali_aktual ? formatTime(item.tanggal_kembali_aktual) : '-'}</span>
                              </div>
                              <div className="flex gap-2 mt-2">
                                <button
                                  onClick={() => handleOpenDetail(item)}
                                  className="flex-1 py-2 rounded-lg bg-[#005BAC] text-white text-xs font-medium text-center hover:bg-[#003B71] transition-colors min-h-[44px] flex items-center justify-center"
                                >
                                  Lihat Detail
                                </button>
                                {isSuperAdmin && (
                                  <button
                                    onClick={() => handleDeleteRecord(item)}
                                    className="py-2 px-4 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 text-xs font-medium transition-colors min-h-[44px] flex items-center justify-center gap-1"
                                  >
                                    <FiTrash2 className="w-3 h-3" /> Hapus
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Pagination for archive */}
                      <Pagination
                        currentPage={archivePagination.page}
                        totalPages={archivePagination.totalPages}
                        onPageChange={(page) => fetchArchiveData(selectedYear, selectedMonth, page)}
                        totalItems={archivePagination.totalItems}
                        itemsPerPage={10}
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <Modal isOpen={showDetail} onClose={() => { setShowDetail(false); setDetailItem(null); }} title="Detail Riwayat" size="md">
        {detailItem && (() => {
          const fotoPengembalianUrl = detailItem.foto_pengembalian ? getBarangFotoUrl(detailItem.foto_pengembalian) : null;
          const barangFotoUrl = detailItem.barang_foto ? getBarangFotoUrl(detailItem.barang_foto) : null;
          const fotoPeminjamanUrl = (detailItem.foto_peminjaman || detailItem.foto) ? getBarangFotoUrl(detailItem.foto_peminjaman || detailItem.foto) : null;

          return (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <p className="text-lg font-bold text-[#005BAC]">{detailItem.nomor_peminjaman}</p>
                  <p className="text-sm text-gray-500">{formatDatePukul(detailItem.tanggal_pinjam)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge status={detailItem.status} />
                  {isSuperAdmin && (
                    <button
                      onClick={() => { setShowDetail(false); setDetailItem(null); handleDeleteRecord(detailItem); }}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 transition-all duration-200"
                      title="Hapus Riwayat"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                  {barangFotoUrl ? (
                    <img src={barangFotoUrl} alt={detailItem.barang_nama || detailItem.nama_barang} className="w-full h-full object-cover" />
                  ) : (
                    <FiPackage className="w-7 h-7 text-gray-300" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-gray-800">{detailItem.barang_nama || detailItem.nama_barang}</p>
                  <p className="text-sm text-gray-500">{detailItem.kategori_nama} · {detailItem.jumlah || 1} unit</p>
                  {isAdmin && <p className="text-sm text-gray-500">Peminjam: <span className="font-medium text-gray-700">{detailItem.pegawai_nama}</span></p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400">Tanggal Pinjam</p>
                  <p className="text-sm font-semibold text-gray-800">{formatDatePukul(detailItem.tanggal_pinjam)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Rencana Kembali</p>
                  <p className="text-sm font-semibold text-gray-800">{formatDate(detailItem.tanggal_kembali_rencana)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-400">Keperluan</p>
                  <p className="text-sm text-gray-800">{detailItem.keperluan || '-'}</p>
                </div>
              </div>

              {/* Foto Bukti Peminjaman */}
              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-[#005BAC] flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#005BAC]">Foto Bukti Peminjaman</p>
                    <p className="text-xs text-gray-500">Dokumentasi kondisi barang saat diambil</p>
                  </div>
                </div>
                {fotoPeminjamanUrl ? (
                  <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                    <img src={fotoPeminjamanUrl} alt="Foto bukti peminjaman" className="w-full aspect-video object-contain bg-gray-100" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                    <div className="hidden w-full aspect-video items-center justify-center bg-gray-50 text-gray-400 text-sm" style={{ display: 'none' }}>
                      <div className="text-center"><FiPackage className="w-8 h-8 mx-auto mb-1" /><p>Gagal memuat foto</p></div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center aspect-video">
                    <div className="text-center text-gray-400">
                      <FiPackage className="w-8 h-8 mx-auto mb-1" />
                      <p className="text-sm">Foto tidak tersedia</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Informasi Pengembalian */}
              {(detailItem.foto_pengembalian || detailItem.kondisi_pengembalian || detailItem.catatan_pengembalian || detailItem.tanggal_kembali_aktual) && (
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-[#005BAC] flex items-center justify-center">
                      <FiEye className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#005BAC]">Informasi Pengembalian</p>
                      <p className="text-xs text-gray-500">Detail pengembalian barang</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {detailItem.kondisi_pengembalian && (
                      <div>
                        <p className="text-xs text-gray-400">Kondisi Barang</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                          detailItem.kondisi_pengembalian === 'Baik' ? 'bg-emerald-50 text-emerald-700' :
                          detailItem.kondisi_pengembalian === 'Rusak Ringan' ? 'bg-amber-50 text-amber-700' :
                          'bg-red-50 text-red-700'
                        }`}>{detailItem.kondisi_pengembalian}</span>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-400">Dikembalikan</p>
                      <p className="text-sm font-semibold text-gray-800">{detailItem.tanggal_kembali_aktual ? formatDatePukul(detailItem.tanggal_kembali_aktual) : '-'}</p>
                    </div>
                  </div>
                  {detailItem.catatan_pengembalian && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-400 mb-1">Catatan Pengembalian</p>
                      <div className="p-3 bg-gray-50 rounded-xl text-sm text-gray-700">{detailItem.catatan_pengembalian}</div>
                    </div>
                  )}
                  {/* Foto Bukti Pengembalian */}
                  <div>
                    <p className="text-xs text-gray-400 mb-2">Foto Bukti Pengembalian</p>
                    {fotoPengembalianUrl ? (
                      <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                        <img src={fotoPengembalianUrl} alt="Foto bukti pengembalian" className="w-full aspect-video object-contain bg-gray-100" onError={(e) => { e.target.style.display = 'none'; }} />
                      </div>
                    ) : (
                      <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center aspect-video">
                        <div className="text-center text-gray-400">
                          <FiPackage className="w-8 h-8 mx-auto mb-1" />
                          <p className="text-sm">Foto pengembalian tidak tersedia</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {detailItem.status === 'Ditolak' && !detailItem.foto_pengembalian && (
                <div className="border-t border-gray-100 pt-4">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm font-semibold text-red-800">Peminjaman Ditolak</p>
                    <p className="text-xs text-red-600 mt-1">Peminjaman ini telah ditolak oleh admin.</p>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>

      {/* Delete Single Record Confirm (super_admin only) */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setDeleteItem(null); }}
        onConfirm={confirmDeleteRecord}
        title="Hapus Riwayat"
        message={deleteItem ? `Apakah Anda yakin ingin menghapus riwayat peminjaman "${deleteItem.nomor_peminjaman || deleteItem.barang_nama || deleteItem.nama_barang}"? Tindakan ini tidak dapat dibatalkan.` : ''}
        type="danger"
        confirmLabel="Ya, Hapus"
        loading={deleting}
      />

      {/* Bulk Delete Confirm (super_admin only) */}
      <ConfirmDialog
        isOpen={showBulkDeleteConfirm}
        onClose={() => { setShowBulkDeleteConfirm(false); setBulkDeleteInfo(null); }}
        onConfirm={confirmBulkDelete}
        title="Hapus Semua Riwayat Bulan Ini"
        message={bulkDeleteInfo ? (() => {
          const msg = `Apakah Anda yakin ingin menghapus SEMUA riwayat yang sudah selesai (Dikembalikan \u0026 Ditolak) pada bulan ${bulkDeleteInfo.monthName} ${bulkDeleteInfo.year}?`;
          const countMsg = `\n\n📊 ${bulkDeleteInfo.deletable} riwayat akan dihapus secara permanen.`;
          const warnMsg = bulkDeleteInfo.active > 0 ? `\n⚠️ ${bulkDeleteInfo.active} riwayat aktif tidak akan dihapus.` : '';
          return msg + countMsg + warnMsg + '\n\nTindakan ini tidak dapat dibatalkan.';
        })() : ''}
        type="danger"
        confirmLabel="Ya, Hapus Semua"
        loading={bulkDeleting}
      />
    </div>
  );
};

export default Riwayat;