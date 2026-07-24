import React from 'react';
import { X } from 'lucide-react';

// Komponen Modal yang diperbarui
// PENJELASAN:
// 1. z-index dinaikkan menjadi 50 agar selalu tampil di atas header.
// 2. Menambahkan prop `size` untuk mengatur lebar modal, membuatnya lebih fleksibel.
// 3. Lebar default diatur ke 'md' (medium), tapi bisa diubah menjadi '4xl' (sangat lebar) untuk form.

function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl', // Ukuran baru untuk form yang lebar
  };

  return (
    // Latar belakang gelap
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      {/* Kontainer Modal */}
      <div className={`bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} flex flex-col max-h-[90vh]`}>
        {/* Header Modal (Fixed) */}
        <div className="flex-shrink-0 flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X size={24} />
          </button>
        </div>
        
        {/* Area Konten (Scrollable) */}
        <div className="overflow-y-auto">
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Modal;