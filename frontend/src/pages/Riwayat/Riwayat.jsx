// ============================================
// RIWAYAT PAGE - Sistem Peminjaman Barang TVRI
// ============================================

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiPackage, FiEye } from 'react-icons/fi';
import { MdHistory } from 'react-icons/md';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import { formatDate, getBarangFotoUrl } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Riwayat = () => {
  const { isAdmin } = useAuth();
  const [riwayat, setRiwayat] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [summary, setSummary] = useState({ total: 0, dikembalikan: 0, dipinjam: 0, ditolak: 0 });
  const itemsPerPage = 10;
  const [imgErrors, setImgErrors] = useState({});

  // Detail modal
  const [showDetail, setShowDetail] = useState(false);
  const [detailItem, setDetailItem] = useState(null);

  useEffect(() => { fetchRiwayat(); }, [currentPage, search]);

  const fetchRiwayat = async () => {
    setLoading(true);
    try {
      const params = { page: currentPage };
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

  const handleOpenDetail = (item) => {
    setDetailItem(item);
    setShowDetail(true);
  };

  return (
    <div className="page-container">
      {/* Header + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">{isAdmin ? 'Riwayat Transaksi' : 'Riwayat Saya'}</h1>
          <p className="page-subtitle">
            {isAdmin ? 'Semua riwayat peminjaman dan pengembalian barang' : 'Riwayat peminjaman dan pengembalian barang Anda'}
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} placeholder="Cari transaksi..." className="input-field pl-10" />
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
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Tgl Kembali</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Keperluan</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {riwayat.length === 0 && !loading ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="text-center py-12 text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <MdHistory className="w-12 h-12 text-gray-300" />
                      <p className="text-sm">Belum ada riwayat transaksi</p>
                    </div>
                  </td>
                </tr>
              ) : (
                riwayat.map((item, idx) => {
                  const fotoUrl = item.barang_foto ? getBarangFotoUrl(item.barang_foto) : null;
                  const imgError = imgErrors[`riwayat-${item.id}`];
                  const hasReturnData = item.foto_pengembalian || item.kondisi_pengembalian || item.catatan_pengembalian || item.tanggal_kembali_aktual;
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
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {item.status === 'Dikembalikan' && item.tanggal_kembali_aktual
                          ? formatDate(item.tanggal_kembali_aktual)
                          : '-'
                        }
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500 max-w-[180px] truncate">{item.keperluan}</td>
                      <td className="py-3 px-4"><Badge status={item.status} /></td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center">
                          {hasReturnData && (
                            <button
                              onClick={() => handleOpenDetail(item)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#005BAC] to-[#003B71] hover:from-[#006CC4] hover:to-[#004A8F] text-white text-xs font-semibold shadow-sm shadow-blue-200 hover:shadow-md hover:shadow-blue-200 transition-all duration-200 active:scale-95"
                              title="Lihat Detail"
                            >
                              <FiEye className="w-3.5 h-3.5" />
                              Detail
                            </button>
                          )}
                          {!hasReturnData && item.status === 'Ditolak' && (
                            <button
                              onClick={() => handleOpenDetail(item)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#005BAC] to-[#003B71] hover:from-[#006CC4] hover:to-[#004A8F] text-white text-xs font-semibold shadow-sm shadow-blue-200 hover:shadow-md hover:shadow-blue-200 transition-all duration-200 active:scale-95"
                              title="Lihat Detail"
                            >
                              <FiEye className="w-3.5 h-3.5" />
                              Detail
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
              <p className="text-sm mt-2">Belum ada riwayat transaksi</p>
            </div>
          ) : (
            riwayat.map((item) => {
              const fotoUrl = item.barang_foto ? getBarangFotoUrl(item.barang_foto) : null;
              const imgError = imgErrors[`riwayat-${item.id}`];
              const hasReturnData = item.foto_pengembalian || item.kondisi_pengembalian || item.catatan_pengembalian || item.tanggal_kembali_aktual;
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
                    <div><span className="text-gray-400">Kembali:</span> <span className="font-medium text-gray-700">{item.status === 'Dikembalikan' && item.tanggal_kembali_aktual ? formatDate(item.tanggal_kembali_aktual) : '-'}</span></div>
                  </div>
                  {item.keperluan && <p className="text-xs text-gray-500 truncate"><span className="text-gray-400">Keperluan:</span> {item.keperluan}</p>}
                  {(hasReturnData || item.status === 'Ditolak') && (
                    <div className="flex items-center gap-2 pt-3 mt-2 border-t border-gray-100">
                      {hasReturnData && (
                        <button
                          onClick={() => handleOpenDetail(item)}
                          className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#005BAC] to-[#003B71] hover:from-[#006CC4] hover:to-[#004A8F] text-white text-xs font-bold shadow-sm shadow-blue-200 active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5"
                        >
                          <FiEye className="w-3.5 h-3.5" /> Detail
                        </button>
                      )}
                      {item.status === 'Ditolak' && !hasReturnData && (
                        <button
                          onClick={() => handleOpenDetail(item)}
                          className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#005BAC] to-[#003B71] hover:from-[#006CC4] hover:to-[#004A8F] text-white text-xs font-bold shadow-sm shadow-blue-200 active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5"
                        >
                          <FiEye className="w-3.5 h-3.5" /> Detail
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={totalItems} itemsPerPage={itemsPerPage} />
      </div>

      {/* Detail Modal */}
      <Modal isOpen={showDetail} onClose={() => { setShowDetail(false); setDetailItem(null); }} title="Detail Pengembalian" size="md">
        {detailItem && (() => {
          const fotoPengembalianUrl = detailItem.foto_pengembalian ? getBarangFotoUrl(detailItem.foto_pengembalian) : null;
          const barangFotoUrl = detailItem.barang_foto ? getBarangFotoUrl(detailItem.barang_foto) : null;

          return (
            <div className="space-y-5">
              {/* Header Info */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <p className="text-lg font-bold text-[#005BAC]">{detailItem.nomor_peminjaman}</p>
                  <p className="text-sm text-gray-500">{formatDate(detailItem.tanggal_pinjam)}</p>
                </div>
                <Badge status={detailItem.status} />
              </div>

              {/* Barang Info */}
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

              {/* Peminjaman Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400">Tanggal Pinjam</p>
                  <p className="text-sm font-semibold text-gray-800">{formatDate(detailItem.tanggal_pinjam)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Rencana Kembali</p>
                  <p className="text-sm font-semibold text-gray-800">{formatDate(detailItem.tanggal_kembali_rencana)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Tgl Kembali Aktual</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {detailItem.tanggal_kembali_aktual ? formatDate(detailItem.tanggal_kembali_aktual) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Keperluan</p>
                  <p className="text-sm text-gray-800">{detailItem.keperluan || '-'}</p>
                </div>
              </div>

              {/* Pengembalian Info - Show when return data exists */}
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

                  {/* Kondisi & Catatan */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {detailItem.kondisi_pengembalian && (
                      <div>
                        <p className="text-xs text-gray-400">Kondisi Barang</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                          detailItem.kondisi_pengembalian === 'Baik' ? 'bg-emerald-50 text-emerald-700' :
                          detailItem.kondisi_pengembalian === 'Rusak Ringan' ? 'bg-amber-50 text-amber-700' :
                          'bg-red-50 text-red-700'
                        }`}>
                          {detailItem.kondisi_pengembalian}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-400">Dikembalikan</p>
                      <p className="text-sm font-semibold text-gray-800">{formatDate(detailItem.tanggal_kembali_aktual)}</p>
                    </div>
                  </div>

                  {detailItem.catatan_pengembalian && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-400 mb-1">Catatan Pengembalian</p>
                      <div className="p-3 bg-gray-50 rounded-xl text-sm text-gray-700">{detailItem.catatan_pengembalian}</div>
                    </div>
                  )}

                  {/* Foto Pengembalian */}
                  {fotoPengembalianUrl && (
                    <div>
                      <p className="text-xs text-gray-400 mb-2">Foto Kondisi Saat Dikembalikan</p>
                      <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                        <img
                          src={fotoPengembalianUrl}
                          alt="Foto pengembalian"
                          className="w-full aspect-video object-contain bg-gray-100"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Ditolak Info */}
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
    </div>
  );
};

export default Riwayat;