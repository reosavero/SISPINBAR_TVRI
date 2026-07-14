import { useState, useRef, useEffect } from 'react';
import { FiChevronDown } from 'react-icons/fi';

const DropdownSelect = ({
  value,
  onChange,
  options = [],
  placeholder = 'Pilih...',
  className = '',
  disabled = false,
  name,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleSelect = (opt) => {
    onChange({ target: { name, value: opt.value } });
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`
          w-full flex items-center justify-between gap-2
          px-3.5 py-2.5 text-sm text-left
          bg-white border-[1.5px] rounded-xl
          transition-all duration-200 min-h-[44px]
          ${isOpen ? 'border-[#005BAC] shadow-[0_0_0_3px_rgba(0,91,172,0.1)]' : 'border-[#E5E7EB] hover:border-[#9CA3AF]'}
          ${disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'cursor-pointer text-gray-700'}
          ${!value ? 'text-gray-400' : ''}
        `}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <FiChevronDown
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          className="
            absolute z-50 mt-1.5 w-full
            bg-white border border-gray-200
            rounded-xl shadow-lg shadow-black/8
            py-1.5 overflow-hidden
            animate-dropdown-open
          "
        >
          <div className="max-h-60 overflow-y-auto">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className={`
                    w-full px-3.5 py-2.5 text-left text-sm transition-colors duration-150
                    ${isSelected
                      ? 'bg-[#005BAC]/8 text-[#005BAC] font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  {opt.label}
                </button>
              );
            })}
            {options.length === 0 && (
              <div className="px-3.5 py-2.5 text-sm text-gray-400 text-center">
                Tidak ada pilihan
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DropdownSelect;