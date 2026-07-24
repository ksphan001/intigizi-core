import React from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

// Komponen Modal Notifikasi Diperbaiki
// PENJELASAN: Menambahkan tipe 'info' ke dalam konfigurasi agar notifikasi informasi
// tidak jatuh ke default (error).

function NotificationModal({ isOpen, message, type, onClose }) {
  if (!isOpen) return null;

  const config = {
    success: { icon: <CheckCircle size={48} className="text-green-500" />, title: 'Berhasil' },
    error: { icon: <XCircle size={48} className="text-red-500" />, title: 'Terjadi Kesalahan' },
    warning: { icon: <AlertTriangle size={48} className="text-yellow-500" />, title: 'Peringatan' },
    info: { icon: <Info size={48} className="text-blue-500" />, title: 'Informasi' }, // Tipe baru ditambahkan
  };

  // Fallback ke 'error' jika tipe tidak dikenali, tapi sekarang 'info' sudah ada.
  const currentConfig = config[type] || config.error;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[100] flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm text-center p-6 relative animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">
          <X size={24} />
        </button>
        <div className="mx-auto mb-4">
          {currentConfig.icon}
        </div>
        <h2 className="text-xl font-bold text-gray-800">{currentConfig.title}</h2>
        <p className="text-gray-600 mt-2 mb-6 break-words">
          {message}
        </p>
        <button onClick={onClose} className="btn-primary w-full">
          Tutup
        </button>
      </div>
    </div>
  );
}

export default NotificationModal;