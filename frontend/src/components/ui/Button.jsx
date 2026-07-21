

import { motion } from 'framer-motion';

const variants = {
  primary: 'bg-gradient-to-r from-[#005BAC] to-[#003B71] text-white hover:from-[#006CC4] hover:to-[#004A8F] shadow-sm hover:shadow-md',
  secondary: 'bg-white text-[#005BAC] border-2 border-[#005BAC] hover:bg-[#E8F1FA]',
  danger: 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-sm hover:shadow-md',
  success: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-sm hover:shadow-md',
  ghost: 'bg-transparent text-[#4B5563] hover:bg-gray-100',
  outline: 'bg-transparent border-2 border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  loading = false,
  icon: Icon,
  className = '',
  type = 'button',
  ...props
}) => {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 font-semibold rounded-xl
        transition-all duration-200 ease-out cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : Icon ? (
        <Icon className="w-4 h-4" />
      ) : null}
      {children}
    </motion.button>
  );
};

export default Button;