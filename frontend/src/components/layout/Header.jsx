// ============================================
// HEADER COMPONENT - Sistem Peminjaman Barang TVRI
// Admin: Notifikasi peminjaman/pengembalian dari pegawai
// Pegawai: Semua notifikasi (read + unread), tetap tampil setelah dibaca
// ============================================

import { FiMenu, FiBell, FiX, FiArrowRight, FiClock, FiCheck, FiChevronDown, FiChevronUp, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { MdAssignment, MdAssignmentTurnedIn, MdCheck, MdWarning, MdPerson } from 'react-icons/md';
import { APP_NAME, ROLE_LABELS, ROLE_COLORS } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { formatRelativeTime, formatDatePukul } from '../../utils/format';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

// Konfigurasi ikon & warna per tipe notifikasi
const notifTypeConfig = {
  peminjaman: {
    icon: MdAssignment,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    label: 'peminjaman',
  },
  pengembalian: {
    icon: MdAssignmentTurnedIn,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    label: 'pengembalian',
  },
  persetujuan: {
    icon: MdCheck,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
    label: 'persetujuan',
  },
  penolakan: {
    icon: FiAlertCircle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    dot: 'bg-red-500',
    label: 'penolakan',
  },
  success: {
    icon: MdCheck,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    label: 'berhasil',
  },
  danger: {
    icon: MdWarning,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    dot: 'bg-red-500',
    label: 'peringatan',
  },
  info: {
    icon: FiBell,
    color: 'text-gray-600',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    dot: 'bg-gray-400',
    label: 'info',
  },
};

// Pegawai-specific config for better labels
const pegawaiNotifLabel = {
  persetujuan: { title: 'Disetujui', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: FiCheckCircle, iconColor: 'text-emerald-600' },
  penolakan: { title: 'Ditolak', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: FiAlertCircle, iconColor: 'text-red-600' },
  peminjaman: { title: 'Peminjaman', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: MdAssignment, iconColor: 'text-amber-600' },
  pengembalian: { title: 'Pengembalian', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', icon: MdAssignmentTurnedIn, iconColor: 'text-blue-600' },
  success: { title: 'Berhasil', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: FiCheckCircle, iconColor: 'text-emerald-600' },
  danger: { title: 'Peringatan', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: MdWarning, iconColor: 'text-red-600' },
  info: { title: 'Info', color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200', icon: FiBell, iconColor: 'text-gray-600' },
};

const Header = ({ onMenuToggle }) => {
  const { isAdmin, isSuperAdmin, isPegawai, roleName, user } = useAuth();

  // Role color scheme
  const roleColor = ROLE_COLORS[user?.role] || ROLE_COLORS.pegawai;
  const roleLabel = ROLE_LABELS[user?.role] || roleName;
  const navigate = useNavigate();

  const notifState = useNotifications();
  const {
    // Admin
    notifications,
    unreadCount,
    showDropdown,
    setShowDropdown,
    dropdownRef,
    loading,
    expandedGroups,
    markAsRead,
    markAllAsRead,
    markMultipleAsRead,
    markGroupAsRead,
    toggleGroup,
    refresh,
    // Pegawai
    pegawaiNotifs,
    pegawaiUnreadCount,
    pegawaiNotifLoading,
    markPegawaiNotifRead,
    markAllPegawaiNotifRead,
    fetchPegawaiNotifications,
  } = notifState;

  const location = useLocation();

  // Admin & Super Admin: show notif bell on all pages
  const showAdminNotif = !!isAdmin;

  // Handle admin bell click
  const handleBellClick = () => {
    if (!showDropdown) refresh();
    setShowDropdown(!showDropdown);
  };

  // Admin notification click — navigate immediately, mark as read in background
  const handleAdminNotifClick = (notif) => {
    const routeMap = {
      peminjaman: '/peminjaman',
      pengembalian: '/pengembalian',
      perpanjangan: '/pengembalian',
    };
    setShowDropdown(false);
    navigate(routeMap[notif.module] || '/dashboard');
    markAsRead(notif.id);
  };

  const handleGroupItemClick = (item, groupType) => {
    const routeMap = {
      peminjaman: '/peminjaman',
      pengembalian: '/pengembalian',
      perpanjangan: '/pengembalian',
    };
    setShowDropdown(false);
    navigate(routeMap[groupType] || '/dashboard');
    markAsRead(item.id);
  };

  // Navigate from grouped notification — navigate immediately, mark all as read in background
  const handleGroupNavigate = (group) => {
    const routeMap = {
      peminjaman: '/peminjaman',
      pengembalian: '/pengembalian',
      perpanjangan: '/pengembalian',
    };
    setShowDropdown(false);
    navigate(routeMap[group.group_type || group.type] || '/dashboard');
    if (group.items) {
      const ids = group.items.map(item => item.id);
      markMultipleAsRead(ids);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    toast.success('Semua notifikasi ditandai dibaca');
  };

  const handleMarkGroupRead = async (e, group) => {
    e.stopPropagation();
    await markGroupAsRead(group);
  };

  // Pegawai: mark all read — notifikasi tetap tampil
  const handlePegawaiMarkAllRead = async () => {
    await markAllPegawaiNotifRead();
    toast.success('Semua notifikasi ditandai dibaca');
  };

  // Pegawai notification click — navigate immediately, mark as read in background
  const handlePegawaiNotifClick = (notif) => {
    const routeMap = {
      peminjaman: '/peminjaman',
      pengembalian: '/pengembalian',
      perpanjangan: '/pengembalian',
      persetujuan: '/peminjaman',
      penolakan: '/riwayat',
    };
    setShowDropdown(false);
    navigate(routeMap[notif.module] || routeMap[notif.type] || '/riwayat');
    markPegawaiNotifRead(notif.id);
  };

  // Pegawai bell click
  const handlePegawaiBellClick = () => {
    if (!showDropdown) {
      fetchPegawaiNotifications();
    }
    setShowDropdown(!showDropdown);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100">
      <div className="flex items-center justify-between px-3 sm:px-4 lg:px-6 h-14 sm:h-16">
        {/* Left - Burger Menu (Mobile/Tablet) */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 -ml-1 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
          aria-label="Toggle menu"
        >
          <FiMenu className="w-5 h-5 text-gray-600" />
        </button>

        {/* Center - App Name + Role Badge */}
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-bold text-[#003B71] truncate">
            {APP_NAME}
          </h1>
          <span className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${roleColor.bg} ${roleColor.text} border ${roleColor.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${roleColor.dot}`}></span>
            {roleLabel}
          </span>
        </div>

        {/* Right - Notification Bell */}
        <div className="relative" ref={dropdownRef}>
          {/* Admin Notif Bell (visible on all pages) */}
          {showAdminNotif && (
            <button
              onClick={handleBellClick}
              className="relative w-10 h-10 sm:w-9 sm:h-9 rounded-xl bg-white hover:bg-gray-50 flex items-center justify-center transition-all duration-200 border border-gray-100 shadow-sm hover:shadow"
            >
              <FiBell className="w-5 h-5 text-gray-500 hover:text-[#005BAC] transition-colors" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 shadow-sm animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          )}

          {/* Pegawai Notif Bell (always visible) */}
          {!isAdmin && (
            <button
              onClick={handlePegawaiBellClick}
              className="relative w-10 h-10 sm:w-9 sm:h-9 rounded-xl bg-white hover:bg-gray-50 flex items-center justify-center transition-all duration-200 border border-gray-100 shadow-sm hover:shadow"
            >
              <FiBell className="w-5 h-5 text-gray-500 hover:text-[#005BAC] transition-colors" />
              {pegawaiUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 shadow-sm animate-pulse">
                  {pegawaiUnreadCount > 99 ? '99+' : pegawaiUnreadCount}
                </span>
              )}
            </button>
          )}

          {/* ========== ADMIN NOTIFICATION DROPDOWN ========== */}
          {showAdminNotif && showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-[calc(100vw-32px)] sm:w-[400px] max-h-[85vh] sm:max-h-[540px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-[#005BAC] to-[#003B71] flex-shrink-0">
                <div>
                  <h3 className="text-sm font-bold text-white">Notifikasi</h3>
                  <p className="text-[11px] text-white/70">
                    {unreadCount > 0
                      ? `${unreadCount} aktivitas pegawai belum dibaca`
                      : 'Tidak ada notifikasi baru'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {notifications.length > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-white/90 hover:text-white font-medium bg-white/15 px-3 py-1 rounded-lg hover:bg-white/25 transition-colors"
                    >
                      Tandai semua dibaca
                    </button>
                  )}
                  <button
                    onClick={() => setShowDropdown(false)}
                    className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Notification List */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#005BAC]"></div>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-12 text-center">
                    <FiBell className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">Tidak ada notifikasi</p>
                    <p className="text-xs text-gray-300 mt-1">Notifikasi baru akan muncul di sini</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {notifications.map((item) => {
                      if (item.is_group) {
                        return (
                          <GroupedNotifItem
                            key={item.id}
                            group={item}
                            isExpanded={expandedGroups.has(item.id)}
                            onToggle={() => toggleGroup(item.id)}
                            onItemClick={handleGroupItemClick}
                            onNavigate={handleGroupNavigate}
                            onMarkGroupRead={handleMarkGroupRead}
                          />
                        );
                      } else {
                        return (
                          <SingleNotifItem
                            key={item.id}
                            notif={item}
                            onClick={handleAdminNotifClick}
                          />
                        );
                      }
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
                <button
                  onClick={() => { navigate('/riwayat'); setShowDropdown(false); }}
                  className="flex items-center justify-center gap-1 w-full text-xs text-[#005BAC] hover:underline font-semibold"
                >
                  Lihat semua riwayat
                  <FiArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* ========== PEGAWAI NOTIFICATION DROPDOWN ========== */}
          {!isAdmin && showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-[calc(100vw-32px)] sm:w-[400px] max-h-[85vh] sm:max-h-[540px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-emerald-500 to-emerald-600 flex-shrink-0">
                <div>
                  <h3 className="text-sm font-bold text-white">Notifikasi</h3>
                  <p className="text-[11px] text-white/70">
                    {pegawaiUnreadCount > 0
                      ? `${pegawaiUnreadCount} notifikasi baru`
                      : 'Tidak ada notifikasi baru'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {pegawaiUnreadCount > 0 && (
                    <button
                      onClick={handlePegawaiMarkAllRead}
                      className="text-[11px] text-white/90 hover:text-white font-medium bg-white/15 px-3 py-1 rounded-lg hover:bg-white/25 transition-colors"
                    >
                      Tandai semua dibaca
                    </button>
                  )}
                  <button
                    onClick={() => setShowDropdown(false)}
                    className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Notification List */}
              <div className="flex-1 overflow-y-auto">
                {pegawaiNotifLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                  </div>
                ) : pegawaiNotifs.length === 0 ? (
                  <div className="py-12 text-center">
                    <FiCheckCircle className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">Tidak ada notifikasi baru</p>
                    <p className="text-xs text-gray-300 mt-1">Notifikasi akan muncul ketika peminjaman Anda disetujui atau ditolak</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {pegawaiNotifs.map((notif) => {
                      const config = pegawaiNotifLabel[notif.type] || pegawaiNotifLabel.info;
                      const IconComp = config.icon;

                      return (
                        <div
                          key={notif.id}
                          onClick={() => handlePegawaiNotifClick(notif)}
                          className="flex items-start gap-3 px-4 py-3 hover:bg-emerald-50/50 cursor-pointer transition-colors bg-emerald-50/30"
                        >
                          {/* Icon */}
                          <div className="relative flex-shrink-0 mt-0.5">
                            <div className={`w-10 h-10 rounded-xl ${config.bg} border ${config.border} flex items-center justify-center`}>
                              <IconComp className={`w-[18px] h-[18px] ${config.iconColor}`} />
                            </div>
                            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></span>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${config.bg} ${config.color}`}>
                                {config.title}
                              </span>
                              <span className="text-[10px] font-medium text-emerald-600">Baru</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-800 leading-snug">
                              {notif.title || notif.message}
                            </p>
                            {notif.message && notif.title && notif.message !== notif.title && (
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                            )}
                            <div className="flex items-center gap-1 mt-1">
                              <FiClock className="w-3 h-3 text-gray-300" />
                              <span className="text-[11px] text-gray-400">
                                {formatRelativeTime(notif.created_at)}
                              </span>
                              <span className="text-[11px] text-gray-300 mx-0.5">•</span>
                              <span className="text-[11px] text-gray-400">
                                {formatDatePukul(notif.created_at)}
                              </span>
                            </div>
                          </div>

                          {/* Arrow */}
                          <FiArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-3" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
                <button
                  onClick={() => { navigate('/riwayat'); setShowDropdown(false); }}
                  className="flex items-center justify-center gap-1 w-full text-xs text-emerald-600 hover:underline font-semibold"
                >
                  Lihat riwayat peminjaman
                  <FiArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

// ============================================
// Single Notification Item (1 pegawai, 1 aksi)
// ============================================
const SingleNotifItem = ({ notif, onClick }) => {
  const config = notifTypeConfig[notif.type] || notifTypeConfig.info;
  const IconComp = config.icon;
  const pegawaiName = notif.pegawai_name || '';
  const actionText = notif.action_text || notif.message || '';

  return (
    <div
      onClick={() => onClick(notif)}
      className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors group"
    >
      {/* Icon */}
      <div className="relative flex-shrink-0 mt-0.5">
        <div className={`w-10 h-10 rounded-xl ${config.bg} border ${config.border} flex items-center justify-center transition-transform group-hover:scale-105`}>
          <IconComp className={`w-[18px] h-[18px] ${config.color}`} />
        </div>
        <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 ${config.dot} rounded-full border-2 border-white`}></span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {pegawaiName && (
          <div className="flex items-center gap-1.5 mb-0.5">
            <MdPerson className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="text-[13px] font-semibold text-gray-800 truncate">
              {pegawaiName}
            </span>
          </div>
        )}
        <p className="text-xs text-gray-600 leading-relaxed">
          {actionText}
        </p>
        <div className="flex items-center gap-1 mt-1">
          <FiClock className="w-3 h-3 text-gray-300" />
          <span className="text-[11px] text-gray-400">
            {formatRelativeTime(notif.created_at)}
          </span>
        </div>
      </div>

      {/* Arrow */}
      <FiArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#005BAC] transition-colors flex-shrink-0 mt-3" />
    </div>
  );
};

// ============================================
// Grouped Notification Item (1 pegawai, banyak aksi)
// Main click → navigate to page
// Bottom-right button → toggle dropdown showing item list
// ============================================
const GroupedNotifItem = ({ group, isExpanded, onToggle, onItemClick, onNavigate, onMarkGroupRead }) => {
  const config = notifTypeConfig[group.group_type] || notifTypeConfig.info;
  const IconComp = config.icon;

  return (
    <div className="border-b border-gray-50">
      {/* Main notification area — clickable to navigate */}
      <div
        onClick={() => onNavigate(group)}
        className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors group"
      >
        {/* Icon with count badge */}
        <div className="relative flex-shrink-0 mt-0.5">
          <div className={`w-10 h-10 rounded-xl ${config.bg} border ${config.border} flex items-center justify-center transition-transform group-hover:scale-105`}>
            <IconComp className={`w-[18px] h-[18px] ${config.color}`} />
          </div>
          <span className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-[#005BAC] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5`}>
            {group.group_count}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <MdPerson className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="text-[13px] font-semibold text-gray-800 truncate">
              {group.pegawai_name}
            </span>
          </div>
          <p className="text-xs text-gray-600">
            {group.group_title}
          </p>
          <div className="flex items-center gap-1 mt-1">
            <FiClock className="w-3 h-3 text-gray-300" />
            <span className="text-[11px] text-gray-400">
              {formatRelativeTime(group.latest_time)}
            </span>
          </div>
        </div>

        {/* Navigate arrow */}
        <FiArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#005BAC] transition-colors flex-shrink-0 mt-3" />
      </div>

      {/* Bottom bar: mark read + toggle detail dropdown */}
      <div className="flex items-center justify-between px-4 pb-2 pt-0">
        <button
          onClick={(e) => onMarkGroupRead(e, group)}
          className="text-[11px] text-gray-400 hover:text-[#005BAC] font-medium flex items-center gap-1 transition-colors"
          title="Tandai semua dibaca"
        >
          <FiCheck className="w-3 h-3" />
          Tandai dibaca
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className={`text-[11px] font-medium flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
            isExpanded
              ? 'bg-[#005BAC]/10 text-[#005BAC]'
              : 'text-gray-500 hover:text-[#005BAC] hover:bg-blue-50'
          }`}
        >
          {isExpanded ? <FiChevronUp className="w-3 h-3" /> : <FiChevronDown className="w-3 h-3" />}
          {isExpanded ? 'Tutup detail' : `Lihat ${group.group_count} barang`}
        </button>
      </div>

      {/* Expanded Items — dropdown list of barang */}
      {isExpanded && (
        <div className="bg-gray-50/50 border-t border-gray-100">
          {group.items.map((item) => (
            <div
              key={item.id}
              onClick={() => onItemClick(item, group.group_type)}
              className="flex items-center gap-2.5 px-4 py-2 pl-[52px] hover:bg-white cursor-pointer transition-colors border-t border-gray-100/60"
            >
              <div className={`w-1.5 h-1.5 rounded-full ${config.dot} flex-shrink-0`}></div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-700 truncate">
                  {item.barang_name || item.message}
                </p>
                <span className="text-[10px] text-gray-400">
                  {formatRelativeTime(item.created_at)}
                </span>
              </div>
              <FiArrowRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Header;