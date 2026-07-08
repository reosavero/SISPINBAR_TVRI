// ============================================
// NUMBER INPUT COMPONENT - Sistem Peminjaman Barang TVRI
// ============================================
// Reusable number input with increment/decrement buttons.
// Mobile-friendly with 44px minimum touch targets.
// Supports min/max validation and direct typing.
// ============================================

import { FiMinus, FiPlus } from 'react-icons/fi';

const NumberInput = ({
  label,
  value,
  onChange,
  min = 1,
  max = 999,
  required = false,
  hint,
  className = '',
  disabled = false,
}) => {
  const numValue = typeof value === 'string' ? parseInt(value, 10) : value;
  const isMinDisabled = disabled || numValue <= min;
  const isMaxDisabled = disabled || numValue >= max;

  const handleDecrement = () => {
    if (numValue > min) {
      onChange(numValue - 1);
    }
  };

  const handleIncrement = () => {
    if (numValue < max) {
      onChange(numValue + 1);
    }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    if (val === '') {
      onChange('');
      return;
    }
    if (!/^\d+$/.test(val)) return;

    const num = parseInt(val, 10);
    if (num >= min && num <= max) {
      onChange(num);
    } else if (num < min) {
      onChange(min);
    } else if (num > max) {
      onChange(max);
    }
  };

  const handleBlur = (e) => {
    const val = e.target.value;
    if (val === '' || val === '0') {
      onChange(min);
    } else {
      const num = parseInt(val, 10);
      if (isNaN(num) || num < min) {
        onChange(min);
      } else if (num > max) {
        onChange(max);
      } else {
        onChange(num);
      }
    }
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
          {hint && (
            <span className="text-xs font-normal text-emerald-600 ml-1">{hint}</span>
          )}
        </label>
      )}
      <div className="inline-flex items-stretch">
        {/* Decrement Button */}
        <button
          type="button"
          onClick={handleDecrement}
          disabled={isMinDisabled}
          className={`
            flex-shrink-0 flex items-center justify-center
            w-12 h-12 sm:w-11 sm:h-11
            rounded-l-xl
            border-2 border-r-0 border-gray-300
            bg-white text-gray-700
            transition-all duration-150 touch-manipulation
            ${isMinDisabled
              ? '!border-gray-200 !bg-gray-50 !text-gray-300 cursor-not-allowed'
              : 'hover:bg-[#005BAC] hover:border-[#005BAC] hover:text-white active:bg-[#003B71] active:border-[#003B71] active:text-white'
            }
          `}
          aria-label="Kurangi jumlah"
        >
          <FiMinus className="w-4 h-4" />
        </button>

        {/* Number Input */}
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          className="
            w-14 sm:w-16 h-12 sm:h-11
            text-center font-semibold tabular-nums text-gray-800
            border-2 border-gray-300 border-x-0
            bg-white outline-none
            focus:border-[#005BAC] focus:z-10
            text-base sm:text-sm
          "
          required={required}
        />

        {/* Increment Button */}
        <button
          type="button"
          onClick={handleIncrement}
          disabled={isMaxDisabled}
          className={`
            flex-shrink-0 flex items-center justify-center
            w-12 h-12 sm:w-11 sm:h-11
            rounded-r-xl
            border-2 border-l-0 border-gray-300
            bg-white text-gray-700
            transition-all duration-150 touch-manipulation
            ${isMaxDisabled
              ? '!border-gray-200 !bg-gray-50 !text-gray-300 cursor-not-allowed'
              : 'hover:bg-[#005BAC] hover:border-[#005BAC] hover:text-white active:bg-[#003B71] active:border-[#003B71] active:text-white'
            }
          `}
          aria-label="Tambah jumlah"
        >
          <FiPlus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default NumberInput;