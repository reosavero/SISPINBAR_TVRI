// ============================================
// PAGINATION COMPONENT
// Mobile-Responsive Enterprise Pagination
// ============================================

import { FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from 'react-icons/fi';

const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage = 10 }) => {
  if (totalPages <= 1) return null;

  const getPages = () => {
    const pages = [];
    const delta = window.innerWidth < 640 ? 1 : 2; // Fewer pages shown on mobile
    const start = Math.max(1, currentPage - delta);
    const end = Math.min(totalPages, currentPage + delta);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-100">
      <div className="text-xs sm:text-sm text-gray-500 order-2 sm:order-1">
        {startItem} - {endItem} dari {totalItems} data
      </div>
      <div className="flex items-center gap-1 order-1 sm:order-2">
        {/* First page - hidden on very small screens */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="hidden sm:flex p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors touch-manipulation"
          title="Halaman pertama"
        >
          <FiChevronsLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors touch-manipulation"
          title="Halaman sebelumnya"
        >
          <FiChevronLeft className="w-4 h-4" />
        </button>
        {getPages().map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`
              w-9 h-9 sm:w-8 sm:h-8 rounded-lg text-sm font-medium transition-colors touch-manipulation
              ${page === currentPage
                ? 'bg-[#005BAC] text-white'
                : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'
              }
            `}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors touch-manipulation"
          title="Halaman berikutnya"
        >
          <FiChevronRight className="w-4 h-4" />
        </button>
        {/* Last page - hidden on very small screens */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="hidden sm:flex p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors touch-manipulation"
          title="Halaman terakhir"
        >
          <FiChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;