import React, { useState } from 'react';
import apiClient from '@/services/api';
import { useNotification } from '@/context/NotificationContext';
import { Loader2, Upload, FileCheck } from 'lucide-react';
import Modal from './Modal';

// Komponen Modal BARU untuk upload bukti bayar dari Dasbor Investor

function InvestmentUploadModal({ isOpen, onClose, investmentId, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const { showNotification } = useNotification();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleUploadProof = async () => {
    if (!file) {
      showNotification('Silakan pilih file bukti pembayaran.', 'warning');
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append('investment_id', investmentId);
    formData.append('payment_proof', file);
    
    try {
      const response = await apiClient.post('/investor_upload_payment_proof.php', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showNotification(response.data.message, 'success');
      onUploadSuccess(); // Panggil callback sukses
      handleClose(); // Tutup modal
    } catch (err) {
      showNotification(err.response?.data?.message || 'Gagal mengunggah bukti.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    setUploading(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Unggah Bukti Pembayaran">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">Unggah bukti transfer Anda agar dapat diverifikasi oleh Super Admin.</p>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">File Bukti Pembayaran</label>
          <input 
            type="file" 
            onChange={handleFileChange} 
            className="input-style" 
            accept="image/*,.pdf" 
            required
          />
          {preview && (
            <div className="mt-2 text-center">
              <img src={preview} alt="Preview" className="max-h-40 mx-auto rounded-md border" />
            </div>
          )}
          {file && <p className="text-sm text-green-600 mt-2 flex items-center"><FileCheck size={16} className="mr-2"/>{file.name}</p>}
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button type="button" className="btn-secondary" onClick={handleClose} disabled={uploading}>
            Batal
          </button>
          <button type="button" className="btn-primary" onClick={handleUploadProof} disabled={!file || uploading}>
            {uploading ? <Loader2 className="animate-spin" /> : <Upload size={16} className="mr-2" />}
            Unggah Bukti
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default InvestmentUploadModal;