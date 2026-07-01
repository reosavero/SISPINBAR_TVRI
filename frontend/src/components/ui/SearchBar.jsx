// ============================================
// SEARCH BAR COMPONENT
// ============================================

import { FiSearch, FiX } from 'react-icons/fi';

const SearchBar = ({ value, onChange, placeholder = 'Cari...', onClear }) => {
  return (
    <div className="relative">
      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="input-field pl-10 pr-10"
      />
      {value && (
        <button
          onClick={onClear || (() => onChange({ target: { value: '' } }))}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <FiX className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;