// ============================================
// DASHBOARD PAGE - Sistem Peminjaman Barang TVRI
// ============================================

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  MdInventory2,
  MdPeople,
  MdAssignment,
  MdAssignmentTurnedIn,
  MdBuild,
  MdToday,
  MdAccessTime,
  MdCheck,
} from 'react-icons/md';
import {
  FiTrendingUp,
  FiActivity,
  FiClock,
  FiChevronDown,
  FiBell,
  FiX,
  FiSettings,
} from 'react-icons/fi';
import StatCard from '../../components/cards/StatCard';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import { formatDateTime } from '../../utils/format';
import api from '../../services/api';
import toast from 'react-hot-toast';

const notifTypeConfig = {
  peminjaman: { icon: MdAssignment, color: 'text-amber-600', bg: 'bg-amber-100' },
  pengembalian: { icon: MdAssignmentTurnedIn, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  persetujuan: { icon: MdCheck, color: 'text-blue-600', bg: 'bg-blue-100' },
  penolakan: { icon: FiX, color: 'text-red-600', bg: 'bg-red-100' },
  barang: { icon: FiSettings, color: 'text-purple-600', bg: 'bg-purple-100' },
  peringatan: { icon: FiX, color: 'text-orange-600', bg: 'bg-orange-100' },
  info: { icon: FiBell, color: 'text-gray-600', bg: 'bg-gray-100' },
};

const Dashboard = () => {
  const navigate = useNavigate();
  const notifRef = useRef(null);

  const [stats, setStats] = useState(null);
  const [monthlyLoans, setMonthlyLoans] = useState([]);
  const [barangStatus, setBarangStatus] = useState([]);
  const [activities, setActivities] = useState([]);
  const [activityPagination, setActivityPagination] = useState({ page: 1, totalPages: 1, totalItems: 0, limit: 5 });
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(false);

  // Notification state
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [activityPagination.page]);

  useEffect(() => {
    if (availableYears.length > 0) {
      fetchMonthlyLoans(selectedYear);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotif(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, statusRes, yearsRes, monthlyRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/barang-status'),
        api.get('/dashboard/available-years'),
        api.get('/dashboard/monthly-loans'),
      ]);

      setStats(statsRes.data.data);
      setBarangStatus(statusRes.data.data);
      setMonthlyLoans(monthlyRes.data.data);

      const years = yearsRes.data.data;
      if (years && years.length > 0) {
        setAvailableYears(years);
        setSelectedYear(years[0]);
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    }
    setLoading(false);
  };

  const fetchMonthlyLoans = async (year) => {
    try {
      const res = await api.get(`/dashboard/monthly-loans?year=${year}`);
      setMonthlyLoans(res.data.data);
    } catch (err) {
      // keep existing data
    }
  };

  const fetchActivities = useCallback(async () => {
    setActivityLoading(true);
    try {
      const res = await api.get(`/dashboard/recent-activity?page=${activityPagination.page}&limit=${activityPagination.limit}`);
      const result = res.data.data;
      setActivities(result.data || []);
      if (result.pagination) {
        setActivityPagination(prev => ({
          ...prev,
          page: result.pagination.page,
          totalPages: result.pagination.totalPages,
          totalItems: result.pagination.totalItems,
        }));
      }
    } catch (err) {
      console.error('Activity fetch error:', err);
      setActivities([]);
    }
    setActivityLoading(false);
  }, [activityPagination.page, activityPagination.limit]);

  const fetchNotifications = async () => {
    try {
      // Fetch pending peminjaman grouped by pegawai
      const pendingRes = await api.get('/dashboard/pending-notifications');
      const pendingData = pendingRes.data.data || [];

      // Fetch recent activity for other types
      const activityRes = await api.get('/dashboard/recent-activity', { params: { page: 1, limit: 5 } });
      const activityData = activityRes.data.data || [];

      const notifs = [];

      // Add pending notifications (grouped by pegawai)
      pendingData.forEach((item, idx) => {
        const jumlah = Number(item.jumlah);
        notifs.push({
          id: `pending-${item.pegawai_id}`,
          title: jumlah > 1
            ? `${item.pegawai_nama} mengajukan ${jumlah} peminjaman`
            : `${item.pegawai_nama} mengajukan peminjaman`,
          message: jumlah > 1
            ? item.items
            : item.items,
          time: item.waktu_terakhir,
          read: false,
          type: 'persetujuan',
        });
      });

      // Add recent activity (skip Menunggu Persetujuan since it's in pending)
      const activities = Array.isArray(activityData) ? activityData : [];
      activities.forEach((item, idx) => {
        if (item.status === 'Menunggu Persetujuan') return; // Already shown in pending
        notifs.push({
          id: item.id || `activity-${idx}`,
          title: item.aksi || 'Aktivitas baru',
          message: item.deskripsi || '',
          time: item.waktu || new Date().toISOString(),
          read: true,
          type: item.tipe || 'info',
        });
      });

      setNotifications(notifs);
    } catch {
      setNotifications([]);
    }
  };

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    toast.success('Semua notifikasi telah ditandai dibaca');
  };

  const handleNotifClick = (notif) => {
    setNotifications(notifications.map(n => n.id === notif.id ? { ...n, read: true } : n));
    const routeMap = {
      peminjaman: '/peminjaman',
      pengembalian: '/pengembalian',
      persetujuan: '/peminjaman',
      penolakan: '/peminjaman',
      barang: '/kategori',
      peringatan: '/peminjaman',
    };
    navigate(routeMap[notif.type] || '/dashboard');
    setShowNotif(false);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const activityIcons = {
    peminjaman: { icon: MdAssignment, color: 'text-amber-600', bg: 'bg-amber-100' },
    pengembalian: { icon: MdAssignmentTurnedIn, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    persetujuan: { icon: MdToday, color: 'text-blue-600', bg: 'bg-blue-100' },
    penolakan: { icon: MdBuild, color: 'text-red-600', bg: 'bg-red-100' },
  };

  const totalLoans = monthlyLoans.reduce((s, m) => s + m.total, 0);
  const avgLoans = monthlyLoans.length > 0 ? Math.round(totalLoans / 12) : 0;

  // Memoized chart data - only compute when monthlyLoans changes
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

  const handleActivityPageChange = (newPage) => {
    setActivityPagination(prev => ({ ...prev, page: newPage }));
  };

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
    <div className="page-container relative">
      {/* Header with Notification Bell */}
      <div className="flex items-start justify-between mb-4 sm:mb-6 gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Selamat datang di Sistem Peminjaman Barang TVRI Jawa Timur</p>
        </div>

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="relative w-11 h-11 rounded-xl bg-white shadow-sm hover:shadow-md border border-gray-100 flex items-center justify-center transition-all duration-200"
          >
            <FiBell className="w-5 h-5 text-gray-500 hover:text-[#005BAC]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotif && (
            <div className="absolute right-0 top-full mt-2 w-[calc(100vw-32px)] sm:w-[380px] max-h-[80vh] sm:max-h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gradient-to-r from-[#005BAC] to-[#003B71]">
                <div>
                  <h3 className="text-sm font-bold text-white">Notifikasi</h3>
                  <p className="text-[11px] text-white/70">{unreadCount > 0 ? `${unreadCount} belum dibaca` : 'Semua sudah dibaca'}</p>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-white/90 hover:text-white font-medium bg-white/15 px-3 py-1 rounded-lg hover:bg-white/25 transition-colors"
                  >
                    Tandai dibaca
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div className="max-h-[360px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center">
                    <FiBell className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">Tidak ada notifikasi</p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const config = notifTypeConfig[notif.type] || notifTypeConfig.info;
                    const IconComp = config.icon;
                    return (
                      <div
                        key={notif.id}
                        onClick={() => handleNotifClick(notif)}
                        className={`flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 ${!notif.read ? 'bg-blue-50/40' : ''}`}
                      >
                        <div className={`w-9 h-9 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          <IconComp className={`w-4 h-4 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm ${!notif.read ? 'font-semibold text-gray-800' : 'font-medium text-gray-600'} truncate`}>
                              {notif.title}
                            </p>
                            {!notif.read && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{formatDateTime(notif.time)}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
                <button
                  onClick={() => { navigate('/riwayat'); setShowNotif(false); }}
                  className="text-xs text-[#005BAC] hover:underline font-semibold"
                >
                  Lihat semua riwayat →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <StatCard title="Total Barang" value={stats?.totalBarang || 0} icon={MdInventory2} color="primary" />
        <StatCard title="Barang Tersedia" value={stats?.barangTersedia || 0} icon={MdInventory2} color="success" />
        <StatCard title="Barang Dipinjam" value={stats?.barangDipinjam || 0} icon={MdAssignment} color="warning" />
        <StatCard title="Barang Rusak" value={stats?.barangRusak || 0} icon={MdBuild} color="danger" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <StatCard title="Dalam Perbaikan" value={stats?.barangPerbaikan || 0} icon={MdBuild} color="info" />
        <StatCard title="Total Pegawai" value={stats?.totalPegawai || 0} icon={MdPeople} color="primary" />
        <StatCard title="Peminjaman Hari Ini" value={stats?.peminjamanHariIni || 0} icon={MdToday} color="warning" />
        <StatCard title="Pengembalian Hari Ini" value={stats?.pengembalianHariIni || 0} icon={MdAssignmentTurnedIn} color="success" />
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
              {/* Year Selector */}
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

          {/* SVG Line Chart */}
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

                {/* Y-axis grid lines & labels */}
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

                {/* Area fill under the line */}
                <path
                  d={chartData.areaPath}
                  fill="url(#areaGradient)"
                />

                {/* Line */}
                <path
                  d={chartData.linePath}
                  fill="none"
                  stroke="url(#lineGradient)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data points & hover areas */}
                {chartData.points.map((point, idx) => (
                  <g key={`point-${idx}`}>
                    {/* Invisible larger hit area for hover */}
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="15"
                      fill="transparent"
                      onMouseEnter={() => setHoveredPoint(idx)}
                      onMouseLeave={() => setHoveredPoint(null)}
                      style={{ cursor: 'pointer' }}
                    />
                    {/* Dot */}
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={hoveredPoint === idx ? 5 : 3.5}
                      fill="#005BAC"
                      stroke="#fff"
                      strokeWidth="2"
                      style={{ transition: 'r 0.15s ease' }}
                    />
                    {/* Glow on hover */}
                    {hoveredPoint === idx && (
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="10"
                        fill="#005BAC"
                        opacity="0.15"
                      />
                    )}
                    {/* Tooltip on hover */}
                    {hoveredPoint === idx && (
                      <g>
                        <rect
                          x={point.x - 32}
                          y={point.y - 38}
                          width="64"
                          height="24"
                          rx="6"
                          fill="#005BAC"
                          opacity="0.95"
                        />
                        <text
                          x={point.x}
                          y={point.y - 22}
                          textAnchor="middle"
                          fill="#fff"
                          fontSize="11"
                          fontWeight="600"
                        >
                          {point.total}
                        </text>
                      </g>
                    )}
                    {/* X-axis labels */}
                    <text
                      x={point.x}
                      y={chartData.chartHeight - 8}
                      textAnchor="middle"
                      fill="#6B7280"
                      fontSize="10"
                    >
                      {point.bulan}
                    </text>
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

          {/* Simple Donut */}
          <div className="flex justify-center mb-6">
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                {barangStatus.map((item, idx) => {
                  const colors = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6'];
                  const total = barangStatus.reduce((s, i) => s + i.total, 0);
                  const prevOffsets = barangStatus.slice(0, idx).reduce((s, i) => s + (i.total / total) * 100, 0);
                  const dashArray = `${(item.total / total) * 100} ${100 - (item.total / total) * 100}`;
                  return (
                    <circle
                      key={idx}
                      cx="18" cy="18" r="15.9"
                      fill="none"
                      stroke={colors[idx]}
                      strokeWidth="3.8"
                      strokeDasharray={dashArray}
                      strokeDashoffset={-prevOffsets}
                    />
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

          {/* Legend */}
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

        {/* Activity List */}
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
                    {/* Icon */}
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                      <IconComp className={`w-4 h-4 sm:w-5 sm:h-5 ${config.color}`} />
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <p className="text-[13px] sm:text-sm font-semibold text-gray-800 leading-snug">{activity.aksi}</p>
                        {activity.status && (
                          <Badge status={activity.status} />
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{activity.deskripsi}</p>
                      {/* Waktu di bawah deskripsi (mobile-first) */}
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

        {/* Pagination */}
        {activityPagination.totalPages > 1 && (
          <div className="mt-2">
            <Pagination
              currentPage={activityPagination.page}
              totalPages={activityPagination.totalPages}
              onPageChange={handleActivityPageChange}
              totalItems={activityPagination.totalItems}
              itemsPerPage={activityPagination.limit}
            />
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Dashboard;