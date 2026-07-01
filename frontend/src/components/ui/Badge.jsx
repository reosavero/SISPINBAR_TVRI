// ============================================
// BADGE COMPONENT
// ============================================

import { getStatusColor } from '../../utils/format';

const Badge = ({ status, className = '' }) => {
  const colorClass = getStatusColor(status);
  return (
    <span className={`badge ${colorClass} ${className}`}>
      {status}
    </span>
  );
};

export default Badge;