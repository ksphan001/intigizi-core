import React from 'react';
import { X } from 'lucide-react';
import { API_BASE_URL } from '@/config';

// Komponen Modal Reusable untuk Menampilkan File (Gambar/PDF)
function FileViewerModal({ isOpen, onClose, filePath, title }) {
  if (!isOpen || !filePath) return null;

  const fullUrl = `${API_BASE_URL.replace('/app', '')}${filePath}`;
  const isPdf = filePath.toLowerCase().endsWith('.pdf');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex-shrink-0 flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X size={24} />
          </button>
        </div>
        
        <div className="overflow-auto p-4">
          {isPdf ? (
            <iframe src={fullUrl} className="w-full h-[75vh]" title={title}></iframe>
          ) : (
            <img src={fullUrl} alt={title} className="max-w-full max-h-full mx-auto" />
          )}
        </div>
      </div>
    </div>
  );
}

export default FileViewerModal;
