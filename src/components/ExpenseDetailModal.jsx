import React, { useState } from 'react';
import Modal from './Modal.jsx';
import { API_BASE_URL } from '@/config';
import { Calendar, Tag, FileText, DollarSign, User, File, X } from 'lucide-react';

// Komponen baru khusus untuk menampilkan pratinjau file (gambar/PDF)
const FileViewerModal = ({ src, onClose }) => {
    // Cek apakah file adalah PDF berdasarkan ekstensinya
    const isPdf = src.toLowerCase().endsWith('.pdf');

    return (
        // Latar belakang gelap, z-index lebih tinggi (z-60) agar muncul di atas modal detail (z-50)
        <div className="fixed inset-0 bg-black bg-opacity-70 z-[60] flex justify-center items-center p-4" onClick={onClose}>
            <div className="relative bg-white p-2 rounded-lg max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute -top-4 -right-4 bg-white text-gray-700 rounded-full p-1 shadow-lg hover:bg-gray-200 transition-colors">
                    <X size={28} />
                </button>
                {isPdf ? (
                    // Jika PDF, gunakan iframe untuk menampilkannya
                    <iframe src={src} className="w-[80vw] h-[80vh] rounded-md" title="Bukti Pembayaran"></iframe>
                ) : (
                    // Jika gambar, tampilkan dengan tag img
                    <img src={src} alt="Bukti Pembayaran" className="max-w-full max-h-[85vh] object-contain" />
                )}
            </div>
        </div>
    );
};


// Komponen Modal Detail Biaya yang telah diperbarui
function ExpenseDetailModal({ expense, isOpen, onClose }) {
  // State baru untuk mengontrol visibilitas modal pratinjau file
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  if (!isOpen || !expense) {
    return null;
  }

  const formatCurrency = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value);
  const formatDate = (date) => new Date(date + 'T00:00:00Z').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  const DetailItem = ({ icon, label, value }) => (
    <div>
      <p className="text-sm text-gray-500 flex items-center">{icon} {label}</p>
      <p className="font-semibold text-gray-800 break-words">{value || '-'}</p>
    </div>
  );

  // Buat URL lengkap ke file bukti
  const receiptUrl = `${API_BASE_URL.replace('/app', '')}${expense.receipt_path}`;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Detail Biaya Operasional">
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <DetailItem icon={<FileText size={14} className="mr-2" />} label="Deskripsi" value={expense.description} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailItem icon={<DollarSign size={14} className="mr-2" />} label="Jumlah" value={formatCurrency(expense.amount)} />
            <DetailItem icon={<Tag size={14} className="mr-2" />} label="Kategori" value={expense.category_name} />
            <DetailItem icon={<Calendar size={14} className="mr-2" />} label="Tanggal Biaya" value={formatDate(expense.expense_date)} />
            <DetailItem icon={<User size={14} className="mr-2" />} label="Dicatat Oleh" value={expense.created_by_name} />
          </div>
          
          {expense.receipt_path && (
              <div className="pt-4 border-t">
                   <h4 className="text-sm font-medium text-gray-700 mb-2">Bukti Pembayaran</h4>
                   {/* Tombol ini sekarang akan membuka modal pratinjau, bukan tab baru */}
                   <button 
                      type="button"
                      onClick={() => setIsViewerOpen(true)}
                      className="btn-secondary inline-flex items-center"
                   >
                      <File size={16} className="mr-2"/> Lihat Bukti
                   </button>
              </div>
          )}

        </div>
        <div className="flex justify-end pt-6 mt-4 border-t">
          <button type="button" onClick={onClose} className="btn-secondary">
            Tutup
          </button>
        </div>
      </Modal>

      {/* Render modal pratinjau file secara kondisional */}
      {isViewerOpen && (
        <FileViewerModal 
          src={receiptUrl}
          onClose={() => setIsViewerOpen(false)}
        />
      )}
    </>
  );
}

export default ExpenseDetailModal;

