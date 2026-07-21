

import { motion } from 'framer-motion';

const Loading = ({ text = 'Memuat data...', fullPage = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <motion.div
          className="w-12 h-12 border-4 border-[#E8F1FA] rounded-full"
          style={{ borderTopColor: '#005BAC' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
      <p className="text-sm text-gray-500 font-medium">{text}</p>
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      {content}
    </div>
  );
};

export default Loading;