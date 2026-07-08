// ============================================
// SIDEBAR COMPONENT - Sistem Peminjaman Barang TVRI
// Updated: Super Admin Role System (3 roles)
// Mobile-Responsive Drawer Sidebar
// ============================================

import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  MdDashboard,
  MdCategory,
  MdPeople,
  MdAssignment,
  MdAssignmentTurnedIn,
  MdHistory,
  MdLogout,
  MdClose,
  MdAdminPanelSettings,
  MdInventory2,
  MdTrackChanges,
  MdSettings,
  MdAutorenew,
  MdLocationOn,
} from 'react-icons/md';
import { APP_NAME, APP_FULL_NAME, APP_ORGANIZATION, SIDEBAR_MENU_SUPER_ADMIN, SIDEBAR_MENU_ADMIN, SIDEBAR_MENU_PEGAWAI, ROLE_LABELS, ROLE_COLORS } from '../../utils/constants';
import logoTvri from '../../assets/logo-tvri.svg';
import { useAuth } from '../../context/AuthContext';
import { getInitials, getAvatarUrl } from '../../utils/format';

const iconMap = {
  MdDashboard: MdDashboard,
  MdCategory: MdCategory,
  MdPeople: MdPeople,
  MdAssignment: MdAssignment,
  MdAssignmentTurnedIn: MdAssignmentTurnedIn,
  MdHistory: MdHistory,
  MdAdminPanelSettings: MdAdminPanelSettings,
  MdInventory2: MdInventory2,
  MdTrackChanges: MdTrackChanges,
  MdSettings: MdSettings,
  MdAutorenew: MdAutorenew,
  MdLocationOn: MdLocationOn,
};

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout, isSuperAdmin, isAdmin, isPegawai, roleName } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [imgError, setImgError] = useState(false);

  // Pilih menu berdasarkan role
  const getSidebarMenu = () => {
    if (isSuperAdmin) return SIDEBAR_MENU_SUPER_ADMIN;
    if (isAdmin) return SIDEBAR_MENU_ADMIN;
    return SIDEBAR_MENU_PEGAWAI;
  };
  const sidebarMenu = getSidebarMenu();

  // Get role color scheme
  const roleColor = ROLE_COLORS[user?.role] || ROLE_COLORS.pegawai;
  const roleLabel = ROLE_LABELS[user?.role] || roleName;

  // Compute avatar URL directly from user context
  const avatarSrc = user?.avatar ? getAvatarUrl(user.avatar) : null;

  // Reset imgError when avatar changes
  useEffect(() => {
    setImgError(false);
  }, [user?.avatar]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    onClose?.();
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleLogout = () => {
    onClose?.();
    logout();
    navigate('/login', { replace: true });
  };

  const handleImgError = () => {
    setImgError(true);
  };

  const handleNavClick = () => {
    onClose?.();
  };

  const handleProfileClick = () => {
    navigate('/profil');
    onClose?.();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-[280px] sm:w-[270px] bg-white border-r border-gray-100
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          flex flex-col
          shadow-xl lg:shadow-none
        `}
      >
        {/* Logo */}
        <div className="p-4 sm:p-5 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={logoTvri}
                alt="Logo TVRI"
                className="w-10 h-10 rounded-xl object-contain"
              />
              <div>
                <h1 className="text-sm font-bold text-[#003B71]">{APP_NAME}</h1>
                <p className="text-[10px] text-gray-400">{APP_FULL_NAME}</p>
              </div>
            </div>
            {/* Close button - mobile only */}
            <button
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors touch-manipulation"
              aria-label="Tutup menu"
            >
              <MdClose className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 sm:px-4 py-4 overflow-y-auto scrollbar-hide">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-3">Menu Utama</p>
          <ul className="space-y-1">
            {sidebarMenu.map((item) => {
              const Icon = iconMap[item.icon];
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-3 sm:py-2.5 rounded-xl text-sm font-medium transition-all duration-200 touch-manipulation
                      ${isActive
                        ? 'bg-[#E8F1FA] text-[#005BAC]'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 active:bg-gray-100'
                      }`
                    }
                  >
                    {Icon && <Icon className="w-5 h-5" />}
                    {item.label}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-gray-100">
          {/* Profil Button */}
          <button
            onClick={handleProfileClick}
            className="flex items-center gap-2.5 w-full p-2 sm:p-2 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 touch-manipulation"
          >
            <div className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-[#005BAC] to-[#003B71]">
              {avatarSrc && !imgError ? (
                <img
                  key={user?.avatar}
                  src={avatarSrc}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={handleImgError}
                />
              ) : (
                <span className="text-white text-xs font-bold">{getInitials(user?.nama || 'User')}</span>
              )}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold text-gray-800 truncate">{user?.nama || 'User'}</p>
              {/* Role Badge */}
              <span className={`inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${roleColor.bg} ${roleColor.text} border ${roleColor.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${roleColor.dot}`}></span>
                {roleLabel}
              </span>
            </div>
          </button>

          {/* Keluar Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-3 sm:py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 active:bg-red-100 transition-all duration-200 w-full mt-1 touch-manipulation"
          >
            <MdLogout className="w-5 h-5" />
            Keluar
          </button>

          <div className="mt-3 px-3">
            <p className="text-[10px] text-gray-300">{APP_ORGANIZATION}</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;