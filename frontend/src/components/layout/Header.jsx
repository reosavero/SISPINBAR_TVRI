// ============================================
// HEADER COMPONENT - Sistem Peminjaman Barang TVRI
// Mobile: Burger menu only | Desktop: App title
// ============================================

import { FiMenu } from 'react-icons/fi';
import { APP_NAME } from '../../utils/constants';

const Header = ({ onMenuToggle }) => {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100">
      <div className="flex items-center justify-between px-3 sm:px-4 lg:px-6 h-14 sm:h-16">
        {/* Left - Burger Menu - Mobile/Tablet only */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 -ml-1 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
          aria-label="Toggle menu"
        >
          <FiMenu className="w-5 h-5 text-gray-600" />
        </button>

        {/* Center - App Name */}
        <h1 className="text-sm font-bold text-[#003B71] truncate">
          {APP_NAME}
        </h1>

        {/* Right - Spacer to keep title centered */}
        <div className="w-9" />
      </div>
    </header>
  );
};

export default Header;