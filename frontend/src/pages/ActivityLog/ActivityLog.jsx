

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiActivity, FiClock, FiUser, FiChevronLeft, FiChevronRight, FiInfo } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime } from '../../utils/format';
import DropdownSelect from '../../components/ui/DropdownSelect';
import toast from 'react-hot-toast';
import api from '../../services/api';

const ActivityLog = () => {
  const { isSuperAdmin } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterModule, setFilterModule] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [retentionInfo, setRetentionInfo] = useState(null);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchLogs();
    fetchRetentionInfo();
  }, [currentPage, search, filterAction, filterModule]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = { page: currentPage, limit: itemsPerPage };
      if (search) params.search = search;
      if (filterAction) params.action = filterAction;
      if (filterModule) params.module = filterModule;

      const res = await api.get('/audit', { params });
      setLogs(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotalItems(res.data.pagination?.totalItems || 0);
    } catch (err) {
      toast.error('Gagal memuat log aktivitas');
      setLogs([]);
    }
    setLoading(false);
  };

  const fetchRetentionInfo = async () => {
    try {
      const res = await api.get('/audit/retention-info');
      if (res.data.success) {
        setRetentionInfo(res.data.data);
      }
    } catch (err) {
      
    }
  };

  const actionLabels = {
    LOGIN: 'Login',
    LOGOUT: 'Logout',
    CREATE: 'Buat',
    READ: 'Baca',
    UPDATE: 'Ubah',
    DELETE: 'Hapus',
    APPROVE: 'Setujui',
    REJECT: 'Tolak',
    EXPORT: 'Ekspor',
    CHANGE_PASSWORD: 'Ubah Password',
    CONFIRM_RETURN: 'Konfirmasi Pengembalian',
    CREATE_ADMIN: 'Buat Admin',
    DELETE_USER: 'Hapus User',
    ACTIVATE_USER: 'Aktifkan User',
    DEACTIVATE_USER: 'Nonaktifkan User',
    RESET_PASSWORD: 'Reset Password',
    UPDATE_USER: 'Ubah User',
    UPDATE_SETTINGS: 'Ubah Pengaturan',
    APPROVE_REGISTRATION: 'Setujui Registrasi',
    REJECT_REGISTRATION: 'Tolak Registrasi',
    REGISTER: 'Registrasi',
    CLEANUP_AUDIT_LOG: 'Bersihkan Log',
  };

  const actionColors = {
    LOGIN: 'bg-blue-100 text-blue-700 border-blue-200',
    LOGOUT: 'bg-gray-100 text-gray-700 border-gray-200',
    CREATE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    UPDATE: 'bg-amber-100 text-amber-700 border-amber-200',
    DELETE: 'bg-red-100 text-red-700 border-red-200',
    APPROVE: 'bg-green-100 text-green-700 border-green-200',
    REJECT: 'bg-red-100 text-red-700 border-red-200',
    EXPORT: 'bg-purple-100 text-purple-700 border-purple-200',
    CHANGE_PASSWORD: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    CONFIRM_RETURN: 'bg-teal-100 text-teal-700 border-teal-200',
    CREATE_ADMIN: 'bg-blue-100 text-blue-700 border-blue-200',
    DELETE_USER: 'bg-red-100 text-red-700 border-red-200',
    ACTIVATE_USER: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    DEACTIVATE_USER: 'bg-gray-100 text-gray-700 border-gray-200',
    RESET_PASSWORD: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    UPDATE_USER: 'bg-amber-100 text-amber-700 border-amber-200',
    UPDATE_SETTINGS: 'bg-violet-100 text-violet-700 border-violet-200',
    APPROVE_REGISTRATION: 'bg-green-100 text-green-700 border-green-200',
    REJECT_REGISTRATION: 'bg-red-100 text-red-700 border-red-200',
    REGISTER: 'bg-blue-100 text-blue-700 border-blue-200',
    CLEANUP_AUDIT_LOG: 'bg-orange-100 text-orange-700 border-orange-200',
  };

  const moduleLabels = {
    auth: 'Autentikasi',
    barang: 'Barang',
    kategori: 'Kategori',
    pegawai: 'Pegawai',
    peminjaman: 'Peminjaman',
    pengembalian: 'Pengembalian',
    users: 'User',
    settings: 'Pengaturan',
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  return (
    <div className="page-container">
      {
}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <h1 className="page-title">Activity Log</h1>
          <p className="page-subtitle">Riwayat aktivitas pengguna dalam sistem</p>
        </div>
      </div>

      {
}
      {isSuperAdmin && retentionInfo && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-3 sm:p-4 mb-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <FiInfo className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span className="text-sm text-blue-800 font-medium">
                Retensi: <strong>{retentionInfo.retentionDays} hari</strong> — Log yang lebih tua akan otomatis dihapus setiap malam.
              </span>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-blue-700">
              <span>Total log: <strong>{retentionInfo.totalLogs}</strong></span>
              {retentionInfo.oldestLog && (
                <>
                  <span>•</span>
                  <span>Terlama: <strong>{formatDate(retentionInfo.oldestLog)}</strong></span>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {
}
      <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm mb-3 sm:mb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Cari aktivitas..."
              className="input-field pl-10"
            />
          </div>
          <div className="flex gap-2">
            <DropdownSelect
              value={filterAction}
              onChange={(e) => { setFilterAction(e.target.value); setCurrentPage(1); }}
              options={Object.entries(actionLabels).map(([key, label]) => ({ value: key, label }))}
              placeholder="Semua Aksi"
              className="w-full sm:w-auto"
            />
            <DropdownSelect
              value={filterModule}
              onChange={(e) => { setFilterModule(e.target.value); setCurrentPage(1); }}
              options={Object.entries(moduleLabels).map(([key, label]) => ({ value: key, label }))}
              placeholder="Semua Modul"
              className="w-full sm:w-auto"
            />
          </div>
        </div>
      </div>

      {
}
      <div className="bg-white rounded-2xl shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#005BAC]"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <FiActivity className="w-12 h-12 mb-2" />
            <p className="text-sm">Belum ada log aktivitas</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {logs.map((log, idx) => {
              const actionColor = actionColors[log.action] || 'bg-gray-100 text-gray-700 border-gray-200';
              const actionLabel = actionLabels[log.action] || log.action;
              const moduleLabel = moduleLabels[log.module] || log.module;
              const details = log.details ? (() => {
                try { return JSON.parse(log.details); } catch { return null; }
              })() : null;

              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  className="flex items-start gap-3 p-4 sm:p-4 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#005BAC]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FiActivity className="w-4 h-4 text-[#005BAC]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-semibold text-gray-800">{log.username || 'System'}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${actionColor}`}>
                        {actionLabel}
                      </span>
                      <span className="text-[11px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                        {moduleLabel}
                      </span>
                    </div>
                    {details && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {Object.entries(details).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <FiClock className="w-3 h-3 text-gray-300" />
                      <span className="text-[11px] text-gray-400">{formatDateTime(log.created_at)}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {
}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} dari {totalItems} log
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FiChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600">{currentPage} / {totalPages}</span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FiChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLog;