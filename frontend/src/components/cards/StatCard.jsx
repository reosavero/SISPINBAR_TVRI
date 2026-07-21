

import { motion } from 'framer-motion';

const StatCard = ({ title, value, icon: Icon, color = 'primary', trend, trendLabel, onClick }) => {
  const colorMap = {
    primary: { bg: 'bg-[#E8F1FA]', icon: 'text-[#005BAC]', border: 'border-[#005BAC]/10' },
    success: { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-emerald-500/10' },
    warning: { bg: 'bg-amber-50', icon: 'text-amber-600', border: 'border-amber-500/10' },
    danger: { bg: 'bg-red-50', icon: 'text-red-600', border: 'border-red-500/10' },
    info: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-500/10' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-500/10' },
  };

  const c = colorMap[color] || colorMap.primary;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`stat-card border ${c.border}${onClick ? ' cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-gray-500 mb-0.5 sm:mb-1 truncate">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-800">{value}</p>
          {trend && (
            <p className={`text-xs font-medium mt-1 sm:mt-2 ${trend > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% {trendLabel || 'dari bulan lalu'}
            </p>
          )}
        </div>
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${c.bg} flex items-center justify-center flex-shrink-0 ml-2`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>
    </motion.div>
  );
};

export default StatCard;