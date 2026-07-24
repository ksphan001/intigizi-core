import React, { useState } from 'react';
import { useNotification } from '@/context/NotificationContext';
import apiClient from '@/services/api';
// Hapus API_BASE_URL karena kita akan menggunakan apiClient
import { Loader2, Upload, Download, FileCheck, AlertTriangle } from 'lucide-react';

function BeneficiaryUploadModal({ isOpen, onClose, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false); // State baru untuk loading unduh
  const [uploadErrors, setUploadErrors] = useState([]);
  const { showNotification } = useNotification();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setUploadErrors([]);
  };

  // --- FUNGSI UNDUH YANG DIPERBARUI ---
  const handleDownloadTemplate = async () => {
    setDownloadLoading(true);
    try {
      // 1. Minta file ke apiClient, yang akan menyertakan Token
      const response = await apiClient.get('/beneficiaries_download_template.php', {
        responseType: 'blob', // Minta data sebagai file biner
      });

      // 2. Buat URL sementara di browser untuk file biner tersebut
      const url = window.URL.createObjectURL(new Blob([response.data]));
      
      // 3. Ambil nama file dari header (jika ada)
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'template_penerima_manfaat.xlsx'; // Nama default
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch.length === 2) {
          filename = filenameMatch[1];
        }
      }

      // 4. Buat link virtual, atur atributnya, dan klik
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename); // Ini akan memicu unduhan, bukan navigasi
      document.body.appendChild(link);
      link.click();

      // 5. Bersihkan
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Gagal mengunduh template:", error);
      showNotification('Gagal mengunduh template. Silakan coba lagi.', 'error');
    } finally {
      setDownloadLoading(false);
    }
  };
  // --- AKHIR FUNGSI YANG DIPERBARUI ---

  const handleUpload = async () => {
    if (!file) {
      showNotification('Silakan pilih file untuk diunggah.', 'warning');
      return;
    }
    
    setLoading(true);
    setUploadErrors([]);
    const formData = new FormData();
    formData.append('beneficiary_file', file);

    try {
      const response = await apiClient.post('/beneficiaries_import.php', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      showNotification(response.data.message, 'success');
      onUploadSuccess(); // Memberi tahu parent (BeneficiariesPage) untuk refresh data
      handleClose();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Gagal mengunggah file.';
      const errorsList = err.response?.data?.errors || [];
      showNotification(errorMsg, 'error');
      setUploadErrors(errorsList);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setLoading(false);
    setUploadErrors([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Impor Data Penerima</h3>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-800">&times;</button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg border">
            <h4 className="font-semibold text-gray-700">Langkah 1: Unduh Template</h4>
            <p className="text-sm text-gray-600 my-2">
              Unduh template Excel untuk memastikan data Anda sesuai format. Template ini sudah berisi daftar Titik Distribusi dan Kategori yang valid untuk Anda pilih.
            </p>
            <button onClick={handleDownloadTemplate} className="btn-secondary text-sm" disabled={downloadLoading}>
              {downloadLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : <Download size={16} className="mr-2" />}
              {downloadLoading ? 'Memproses...' : 'Unduh Template'}
            </button>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg border">
            <h4 className="font-semibold text-gray-700">Langkah 2: Unggah File</h4>
            <p className="text-sm text-gray-600 my-2">
              Pilih file Excel (.xlsx) yang sudah Anda isi sesuai template.
            </p>
            <input 
              type="file" 
              onChange={handleFileChange} 
              className="input-style" 
              accept=".xlsx, .xls"
            />
            {file && <p className="text-sm text-green-600 mt-2 flex items-center"><FileCheck size={16} className="mr-2"/>{file.name}</p>}
          </div>

          {uploadErrors.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg max-h-32 overflow-y-auto">
              <p className="text-sm font-bold text-red-700 flex items-center"><AlertTriangle size={16} className="mr-2"/>Ditemukan error:</p>
              <ul className="list-disc pl-5 mt-1 text-sm text-red-600">
                {uploadErrors.map((err, idx) => <li key={idx}>{err}</li>)}
              </ul>
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-3 p-4 border-t bg-gray-50 rounded-b-lg">
          <button onClick={handleClose} disabled={loading} className="btn-secondary">Batal</button>
          <button onClick={handleUpload} disabled={!file || loading} className="btn-primary">
            {loading ? <Loader2 className="animate-spin" /> : <Upload size={16} className="mr-2" />}
            Proses Upload
          </button>
        </div>
      </div>
    </div>
  );
}

export default BeneficiaryUploadModal;