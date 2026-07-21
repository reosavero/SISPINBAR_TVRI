

import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertTriangle } from 'react-icons/fi';
import Button from './Button';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi',
  message = 'Apakah Anda yakin?',
  confirmLabel = 'Ya, Lanjutkan',
  cancelLabel = 'Batal',
  type = 'danger',
  loading = false,
}) => {
  const typeConfig = {
    danger: { icon: 'text-red-600 bg-red-100', button: 'danger' },
    warning: { icon: 'text-amber-600 bg-amber-100', button: 'primary' },
    info: { icon: 'text-blue-600 bg-blue-100', button: 'primary' },
  };

  const config = typeConfig[type] || typeConfig.danger;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center sm:justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 1 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 1 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 sm:p-6 w-full sm:max-w-sm"
          >
            {
}
            <div className="sm:hidden flex justify-center mb-3">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            <div className="flex flex-col items-center text-center">
              <div className={`w-14 h-14 rounded-full ${config.icon} flex items-center justify-center mb-4`}>
                <FiAlertTriangle className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 mb-6">{message}</p>
              <div className="flex gap-3 w-full">
                <Button variant="outline" onClick={onClose} className="flex-1 min-h-[44px]" disabled={loading}>
                  {cancelLabel}
                </Button>
                <Button variant={config.button} onClick={onConfirm} className="flex-1 min-h-[44px]" loading={loading}>
                  {confirmLabel}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDialog;