// ============================================
// MODAL COMPONENT
// Mobile-Responsive: Bottom Sheet on Mobile, Centered on Desktop
// ============================================

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
}) => {
  const sizeClasses = {
    sm: 'sm:max-w-md',
    md: 'sm:max-w-lg',
    lg: 'sm:max-w-2xl',
    xl: 'sm:max-w-4xl',
    full: 'sm:max-w-6xl',
  };

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

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Content - Bottom Sheet on Mobile, Centered on Desktop */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`
              relative bg-white w-full
              rounded-t-2xl sm:rounded-2xl shadow-2xl
              ${sizeClasses[size]}
              max-h-[95vh] sm:max-h-[90vh] overflow-hidden
              flex flex-col
            `}
          >
            {/* Drag indicator for mobile */}
            <div className="sm:hidden flex justify-center pt-2 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 flex-shrink-0">
                <h2 className="text-base sm:text-lg font-bold text-gray-800 line-clamp-1 pr-2">{title}</h2>
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="p-2 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors text-gray-400 hover:text-gray-600 ml-2 touch-manipulation flex-shrink-0"
                    aria-label="Tutup"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}

            {/* Body - Scrollable */}
            <div className="px-4 sm:px-6 py-4 overflow-y-auto flex-1 overscroll-contain">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;