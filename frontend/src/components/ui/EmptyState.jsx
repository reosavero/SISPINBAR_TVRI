// ============================================
// EMPTY STATE COMPONENT
// ============================================

import { motion } from 'framer-motion';
import { FiInbox } from 'react-icons/fi';

const EmptyState = ({
  icon: Icon = FiInbox,
  title = 'Tidak Ada Data',
  description = 'Data yang Anda cari tidak ditemukan',
  actionLabel,
  onAction,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <div className="w-20 h-20 rounded-full bg-[#E8F1FA] flex items-center justify-center mb-4">
        <Icon className="w-10 h-10 text-[#005BAC]" />
      </div>
      <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 text-center max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="btn-primary"
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
};

export default EmptyState;