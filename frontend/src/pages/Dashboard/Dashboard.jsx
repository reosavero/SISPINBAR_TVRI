// ============================================
// DASHBOARD PAGE - Sistem Peminjaman Barang TVRI
// ============================================

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MdInventory2,
  MdPeople,
  MdAssignment,
  MdAssignmentTurnedIn,
  MdBuild,
  MdToday,
  MdAccessTime,
} from 'react-icons/md';
import {
  FiTrendingUp,
  FiActivity,
  FiClock,
  FiChevronDown,
} from 'react-icons/fi';
import StatCard from '../../components/cards/StatCard';
import Badge from '../../components/ui/Badge';
import { formatDateTime } from '../../utils/format';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const Dashboard = () => {
  const { isAdmin, isSuperAdmin, isPegawai } = useAuth();
  const navigate = useNavigate();

  // Dashboard admin/super_admin menampilkan statistik keseluruhan
  const showAdminDashboard = isAdmin; // admin atau super_admin

  const [stats, setStats] = useState(null);
  const [monthlyLoans, setMonthlyLoans] = useState([]);
  const [barangStatus, setBarangStatus] = useState([]);
  const [activities, setActivities] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(false);

  // AbortController ref untuk membatalkan request saat unmount/logout
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);

  // Helper: aman update state hanya jika component masih mounted
  const safeSetState = useCallback((setter) => (value) => {
    if (isMountedRef.current) setter(value);
  }, []);

  // Cleanup pada unmount
  useEffect(() => {
    isMountedRef.current = true;
    abortControllerRef.current = new AbortController();

    return () => {
      isMountedRef.current = false;
      // Batalkan semua request yang sedang berjalan
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    fetchDashboardData();
    fetchActivities();
  }, []);

  useEffect(() => {
    if (availableYears.length > 0) {
      fetchMonthlyLoans(selectedYear);
    }
  }, [selectedYear]);

  const fetchDashboardData = async () => {
    // Cek token sebelum fetch — jangan fetch jika sudah logout
    if (!sessionStorage.getItem('token')) return;
    try {
      const signal = abortControllerRef.current?.signal;
      const [statsRes, statusRes, yearsRes, monthlyRes] = await Promise.all([
        api.get('/dashboard/stats', { signal }),
        api.get('/dashboard/barang-status', { signal }),
        api.get('/dashboard/available-years', { signal }),
        api.get('/dashboard/monthly-loans', { signal }),
      ]);

      if (!isMountedRef.current) return;

      setStats(statsRes.data.data);
      setBarangStatus(statusRes.data.data);
      setMonthlyLoans(monthlyRes.data.data);

      const years = yearsRes.data.data;
      if (years && years.length > 0) {
        setAvailableYears(years);
        setSelectedYear(years[0]);
      }
    } catch (err) {
      // Aborted request saat unmount — biarkan, jangan log error
      if (err.code === 'ERR_CANCELED' || err.code === 'ECONNABORTED' || err.name === 'CanceledError') return;
      if (!isMountedRef.current) return;
      console.error('Dashboard fetch error:', err);
    }
    if (isMountedRef.current) setLoading(false);
  };

  const fetchMonthlyLoans = async (year) => {
    if (!sessionStorage.getItem('token')) return;
    try {
      const signal = abortControllerRef.current?.signal;
      const res = await api.get(`/dashboard/monthly-loans?year=${year}`, { signal });
      if (!isMountedRef.current) return;
      setMonthlyLoans(res.data.data);
    } catch (err) {
      if (err.code === 'ERR_CANCELED' || err.code === 'ECONNABORTED' || err.name === 'CanceledError') return;
      // keep existing data
    }
  };

  const fetchActivities = useCallback(async () => {
    if (!sessionStorage.getItem('token')) return;
    setActivityLoading(true);
    try {
      const signal = abortControllerRef.current?.signal;
      const res = await api.get('/dashboard/recent-activity?page=1&limit=5', { signal });
      if (!isMountedRef.current) return;
      setActivities(res.data.data?.data || []);
    } catch (err) {
      if (err.code === 'ERR_CANCELED' || err.code === 'ECONNABORTED' || err.name === 'CanceledError') return;
      if (!isMountedRef.current) return;
      console.error('Activity fetch error:', err);
      setActivities([]);
    }
    if (isMountedRef.current) setActivityLoading(false);
  }, []);

  const activityIcons = {
    peminjaman: { icon: MdAssignment, color: 'text-amber-600', bg: 'bg-amber-100' },
    pengembalian: { icon: MdAssignmentTurnedIn, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    persetujuan: { icon: MdToday, color: 'text-blue-600', bg: 'bg-blue-100' },
    penolakan: { icon: MdBuild, color: 'text-red-600', bg: 'bg-red-100' },
  };

  const totalLoans = monthlyLoans.reduce((s, m) => s + m.total, 0);
  const avgLoans = monthlyLoans.length > 0 ? Math.round(totalLoans / 12) : 0;

  const chartData = useMemo(() => {
    if (!monthlyLoans || monthlyLoans.length === 0) return null;

    const chartPadding = { top: 20, right: 20, bottom: 40, left: 45 };
    const chartWidth = 700;
    const chartHeight = 280;
    const innerWidth = chartWidth - chartPadding.left - chartPadding.right;
    const innerHeight = chartHeight - chartPadding.top - chartPadding.bottom;

    const maxVal = Math.max(...monthlyLoans.map(m => m.total), 1);
    const niceMax = Math.ceil(maxVal / 5) * 5 || 5;
    const yTickCount = 5;
    const yTickStep = niceMax / yTickCount;

    const points = monthlyLoans.map((item, idx) => ({
      x: chartPadding.left + (monthlyLoans.length > 1 ? (idx / (monthlyLoans.length - 1)) * innerWidth : innerWidth / 2),
      y: chartPadding.top + innerHeight - (item.total / niceMax) * innerHeight,
      total: item.total,
      bulan: item.bulan,
    }));

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${chartPadding.top + innerHeight} L ${points[0].x} ${chartPadding.top + innerHeight} Z`
      : '';

    return {
      chartWidth, chartHeight, chartPadding,
      innerWidth, innerHeight,
      niceMax, yTickCount, yTickStep,
      points, linePath, areaPath,
    };
  }, [monthlyLoans]);


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#005BAC] mx-auto mb-4"></div>
          <p className="text-gray-500">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Selamat datang di Sistem Peminjaman Barang TVRI Jawa Timur</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <StatCard title="Total Barang" value={stats?.totalBarang || 0} icon={MdInventory2} color="primary" onClick={() => navigate('/barang')} />
        <StatCard title="Barang Tersedia" value={stats?.barangTersedia || 0} icon={MdInventory2} color="success" onClick={() => navigate('/barang?status=Tersedia')} />
        <StatCard title="Barang Dipinjam" value={stats?.barangDipinjam || 0} icon={MdAssignment} color="warning" onClick={() => navigate('/barang?status=Dipinjam')} />
        <StatCard title="Barang Rusak" value={stats?.barangRusak || 0} icon={MdBuild} color="danger" onClick={() => navigate('/barang?status=Rusak')} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <StatCard title="Dalam Perbaikan" value={stats?.barangPerbaikan || 0} icon={MdBuild} color="info" onClick={() => navigate('/barang?status=Dalam Perbaikan')} />
        <StatCard title="Total Pegawai" value={stats?.totalPegawai || 0} icon={MdPeople} color="primary" onClick={() => navigate(isSuperAdmin ? '/manajemen-user?tab=pegawai' : '/pegawai')} />
        <StatCard title="Peminjaman Hari Ini" value={stats?.peminjamanHariIni || 0} icon={MdToday} color="warning" onClick={() => navigate('/peminjaman')} />
        <StatCard title="Pengembalian Hari Ini" value={stats?.pengembalianHariIni || 0} icon={MdAssignmentTurnedIn} color="success" onClick={() => navigate('/pengembalian')} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
        {/* Line Chart - Monthly Loans */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white rounded-2xl p-4 sm:p-6 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Peminjaman per Bulan</h3>
              <p className="text-sm text-gray-500">Total {totalLoans} peminjaman · Rata-rata {avgLoans}/bulan</p>
            </div>
            <div className="flex items-center gap-3">
              {availableYears.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setShowYearDropdown(!showYearDropdown)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[#005BAC]/10 text-[#005BAC] rounded-lg text-sm font-semibold hover:bg-[#005BAC]/20 transition-colors"
                  >
                    <span>{selectedYear}</span>
                    <FiChevronDown className={`w-4 h-4 transition-transform ${showYearDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showYearDropdown && (
                    <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20 min-w-[100px]">
                      {availableYears.map(year => (
                        <button
                          key={year}
                          onClick={() => {
                            setSelectedYear(year);
                            setShowYearDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                            year === selectedYear ? 'text-[#005BAC] font-semibold bg-[#005BAC]/5' : 'text-gray-700'
                          }`}
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg text-sm font-medium">
                <FiTrendingUp className="w-4 h-4" />
                <span>{totalLoans > 0 ? totalLoans : 0}</span>
              </div>
            </div>
          </div>

          {chartData ? (
            <div className="w-full overflow-x-auto">
              <svg viewBox={`0 0 ${chartData.chartWidth} ${chartData.chartHeight}`} className="w-full" style={{ minWidth: '500px' }}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#005BAC" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#005BAC" stopOpacity="0.02" />
                  </linearGradient>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#005BAC" />
                    <stop offset="100%" stopColor="#4DA3E0" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {Array.from({ length: chartData.yTickCount + 1 }, (_, i) => {
                  const val = i * chartData.yTickStep;
                  const y = chartData.chartPadding.top + chartData.innerHeight - (val / chartData.niceMax) * chartData.innerHeight;
                  return (
                    <g key={`grid-${i}`}>
                      <line
                        x1={chartData.chartPadding.left}
                        y1={y}
                        x2={chartData.chartWidth - chartData.chartPadding.right}
                        y2={y}
                        stroke="#E5E7EB"
                        strokeDasharray={i === 0 ? "0" : "4 4"}
                        strokeWidth="1"
                      />
                      <text
                        x={chartData.chartPadding.left - 8}
                        y={y + 4}
                        textAnchor="end"
                        fill="#9CA3AF"
                        fontSize="10"
                      >
                        {Math.round(val)}
                      </text>
                    </g>
                  );
                })}

                <path d={chartData.areaPath} fill="url(#areaGradient)" />
                <path d={chartData.linePath} fill="none" stroke="url(#lineGradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                {chartData.points.map((point, idx) => (
                  <g key={`point-${idx}`}>
                    <circle cx={point.x} cy={point.y} r="15" fill="transparent" onMouseEnter={() => setHoveredPoint(idx)} onMouseLeave={() => setHoveredPoint(null)} style={{ cursor: 'pointer' }} />
                    <circle cx={point.x} cy={point.y} r={hoveredPoint === idx ? 5 : 3.5} fill="#005BAC" stroke="#fff" strokeWidth="2" style={{ transition: 'r 0.15s ease' }} />
                    {hoveredPoint === idx && (
                      <>
                        <circle cx={point.x} cy={point.y} r="10" fill="#005BAC" opacity="0.15" />
                        <rect x={point.x - 32} y={point.y - 38} width="64" height="24" rx="6" fill="#005BAC" opacity="0.95" />
                        <text x={point.x} y={point.y - 22} textAnchor="middle" fill="#fff" fontSize="11" fontWeight="600">{point.total}</text>
                      </>
                    )}
                    <text x={point.x} y={chartData.chartHeight - 8} textAnchor="middle" fill="#6B7280" fontSize="10">{point.bulan}</text>
                  </g>
                ))}
              </svg>
            </div>
          ) : (
            <div className="flex items-center justify-center h-56 text-gray-400">
              <p className="text-sm">Belum ada data peminjaman</p>
            </div>
          )}
        </motion.div>

        {/* Pie Chart - Barang Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm"
        >
          <h3 className="text-lg font-bold text-gray-800 mb-2">Status Barang</h3>
          <p className="text-sm text-gray-500 mb-6">Distribusi kondisi barang</p>

          <div className="flex justify-center mb-6">
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                {barangStatus.map((item, idx) => {
                  const colors = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6'];
                  const total = barangStatus.reduce((s, i) => s + i.total, 0);
                  const prevOffsets = barangStatus.slice(0, idx).reduce((s, i) => s + (i.total / total) * 100, 0);
                  const dashArray = `${(item.total / total) * 100} ${100 - (item.total / total) * 100}`;
                  return (
                    <circle key={idx} cx="18" cy="18" r="15.9" fill="none" stroke={colors[idx]} strokeWidth="3.8" strokeDasharray={dashArray} strokeDashoffset={-prevOffsets} />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-800">{barangStatus.reduce((s, i) => s + i.total, 0)}</p>
                  <p className="text-[10px] text-gray-500">Total</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {barangStatus.map((item, idx) => {
              const colors = ['bg-emerald-500', 'bg-amber-500', 'bg-red-500', 'bg-blue-500'];
              const total = barangStatus.reduce((s, i) => s + i.total, 0);
              return (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${colors[idx]}`} />
                    <span className="text-sm text-gray-600">{item.status}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-800">{item.total} ({Math.round((item.total / total) * 100)}%)</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Activity Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl shadow-sm"
      >
        <div className="flex items-center justify-between p-4 sm:p-6 sm:pb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Aktivitas Terkini</h3>
            <p className="text-sm text-gray-500">Riwayat aktivitas peminjaman & pengembalian terbaru</p>
          </div>
          <FiActivity className="w-5 h-5 text-[#005BAC]" />
        </div>

        <div className="px-4 sm:px-6">
          {activityLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#005BAC]"></div>
              <span className="ml-3 text-gray-500">Memuat aktivitas...</span>
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <MdAccessTime className="w-12 h-12 mb-2" />
              <p className="text-sm">Belum ada aktivitas</p>
            </div>
          ) : (
            <div className="space-y-1">
              {activities.map((activity) => {
                const config = activityIcons[activity.tipe] || activityIcons.peminjaman;
                const IconComp = config.icon;
                return (
                  <div key={activity.id} className="flex items-start gap-3 p-3 sm:p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors">
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                      <IconComp className={`w-4 h-4 sm:w-5 sm:h-5 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <p className="text-[13px] sm:text-sm font-semibold text-gray-800 leading-snug">{activity.aksi}</p>
                        {activity.status && <Badge status={activity.status} />}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{activity.deskripsi}</p>
                      <div className="flex items-center gap-1 text-[11px] sm:text-xs text-gray-400 mt-1.5">
                        <FiClock className="w-3 h-3" />
                        <span>{formatDateTime(activity.waktu)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>


      </motion.div>
    </div>
  );
};

export default Dashboard;