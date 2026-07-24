import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

// Komponen dropdown/select yang bisa dicari (Combobox) - Diperbarui dengan prop 'disabled'

function SearchableSelect({ options, value, onChange, placeholder = "Cari...", disabled = false }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null); 

  const selectedOption = useMemo(() => {
    // --- PERBAIKAN DI SINI ---
    // Tambahkan pengecekan untuk memastikan 'value' tidak null atau undefined sebelum memanggil toString()
    if (value === null || value === undefined) {
      return null;
    }
    return options.find(option => option.value.toString() === value.toString());
  }, [options, value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);
  
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    if (!query) return options;
    return options.filter(option => 
      option.label.toLowerCase().includes(query.toLowerCase())
    );
  }, [options, query]);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <input
          type="text"
          className="input-style bg-white w-full pr-8 disabled:bg-gray-100 disabled:cursor-not-allowed"
          value={isOpen ? query : selectedOption?.label || ''}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => !disabled && setIsOpen(true)} // Hanya buka jika tidak disabled
          placeholder={placeholder}
          disabled={disabled}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-500"
          onClick={() => !disabled && setIsOpen(!isOpen)} // Hanya bisa diklik jika tidak disabled
          disabled={disabled}
        >
          <ChevronDown size={20} />
        </button>
      </div>

      {isOpen && !disabled && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map(option => (
              <li
                key={option.value}
                className="px-4 py-2 text-sm text-gray-800 hover:bg-gray-100 cursor-pointer"
                onMouseDown={() => handleSelect(option.value)}
              >
                {option.label}
              </li>
            ))
          ) : (
            <li className="px-4 py-2 text-sm text-gray-500">Tidak ditemukan</li>
          )}
        </ul>
      )}
    </div>
  );
}

export default SearchableSelect;
