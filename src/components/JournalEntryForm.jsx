import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { Loader2, Upload } from 'lucide-react';
import { useNotification } from '../context/NotificationContext.jsx';
import Modal from './Modal';

function JournalEntryForm({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    transaction_date: new Date().toISOString().slice(0, 10),
    description: '',
    debit_account_id: '',
    credit_account_id: '',
    amount: '',
  });
  const [proofFile, setProofFile] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  useEffect(() => {
    if (isOpen) {
      const fetchAccounts = async () => {
        try {
          const response = await apiClient.get('/financials/accounts_get.php');
          setAccounts(response.data);
        } catch (error) {
          showNotification('Gagal memuat daftar akun keuangan.', 'error');
        }
      };
      fetchAccounts();
    }
  }, [isOpen, showNotification]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
      if (e.target.files && e.target.files[0]) {
          setProofFile(e.target.files[0]);
      }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.debit_account_id === formData.credit_account_id) {
        showNotification('Akun Debet dan Kredit tidak boleh sama.', 'error');
        return;
    }
    setLoading(true);

    const submitData = new FormData();
    submitData.append('transaction_date', formData.transaction_date);
    submitData.append('description', formData.description);
    submitData.append('debit_account_id', formData.debit_account_id);
    submitData.append('credit_account_id', formData.credit_account_id);
    submitData.append('amount', formData.amount);
    
    if (proofFile) {
        submitData.append('proof_file', proofFile);
    }

    try {
      await apiClient.post('/financials/journal_manual_entry.php', submitData, {
          headers: {
              'Content-Type': 'multipart/form-data',
          },
      });
      showNotification('Entri jurnal berhasil disimpan.', 'success');
      onSave(); // Callback to refresh data on parent
      handleClose();
    } catch (error) {
           console.error("Error submitting journal:", error);
      showNotification(error.response?.data?.message || 'Gagal menyimpan entri jurnal.', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleClose = () => {
    setFormData({
        transaction_date: new Date().toISOString().slice(0, 10),
        description: '',
        debit_account_id: '',
        credit_account_id: '',
        amount: '',
    });
    setProofFile(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Tambah Entri Jurnal Manual">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Tanggal Transaksi</label>
          <input
            type="date"
            name="transaction_date"
            value={formData.transaction_date}
            onChange={handleChange}
            className="input-style"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Deskripsi</label>
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="input-style"
            placeholder="Contoh: Saldo Awal Kas di Bank"
            required
          />
        </div>
         <div>
          <label className="block text-sm font-medium text-gray-700">Jumlah (Rp)</label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            className="input-style"
            placeholder="Masukkan jumlah transaksi"
            required
            min="0"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
            <label className="block text-sm font-medium text-gray-700 min-h-[40px] flex items-end pb-1">Akun Debet (Uang Masuk Ke)</label>
            <select
                name="debit_account_id"
                value={formData.debit_account_id}
                onChange={handleChange}
                className="input-style"
                required
            >
                <option value="">Pilih Akun Debet...</option>
                {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                    [{acc.account_code}] {acc.name}
                </option>
                ))}
            </select>
            </div>
            <div>
            <label className="block text-sm font-medium text-gray-700 min-h-[40px] flex items-end pb-1">Akun Kredit (Uang Keluar Dari)</label>
            <select
                name="credit_account_id"
                value={formData.credit_account_id}
                onChange={handleChange}
                className="input-style"
                required
            >
                <option value="">Pilih Akun Kredit...</option>
                {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                    [{acc.account_code}] {acc.name}
                </option>
                ))}
            </select>
            </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bukti Pembayaran (Opsional)</label>
            <div className="flex items-center space-x-2">
                <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-50 flex items-center shadow-sm">
                    <Upload size={16} className="mr-2" />
                    <span>{proofFile ? 'Ganti File' : 'Upload File'}</span>
                    <input
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                    />
                </label>
                {proofFile && (
                    <span className="text-sm text-gray-600 truncate max-w-xs">{proofFile.name}</span>
                )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Format: JPG, PNG, WEBP, PDF. Maks 5MB.</p>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            className="btn-secondary"
            disabled={loading}
          >
            Batal
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Simpan Transaksi'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default JournalEntryForm;

