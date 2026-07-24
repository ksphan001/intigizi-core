import React, { useState, useEffect } from 'react';
import apiClient from '@/services/api';

// Formulir untuk memilih dan menetapkan supplier ke sebuah PO.

function POAssignSupplierForm({ onSave, onCancel, loading }) {
  const [supplierId, setSupplierId] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    // Mengambil daftar semua supplier dan vendor untuk dropdown
    const fetchSuppliers = async () => {
      try {
        // PERBAIKAN: Menggunakan endpoint yang benar untuk mengambil supplier DAN vendor
        const response = await apiClient.get('/procurement_get_suppliers.php');
        setSuppliers(response.data);
        // Set supplier pertama sebagai default jika ada
        if (response.data.length > 0) {
          setSupplierId(response.data[0].id);
        }
      } catch (err) {
        console.error("Gagal mengambil data supplier", err);
        setError("Gagal memuat daftar supplier.");
      }
    };
    fetchSuppliers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supplierId) {
      setError('Silakan pilih supplier.');
      return;
    }
    setError('');
    try {
      await onSave({ supplier_id: parseInt(supplierId) });
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan data.');
    }
  };
  
  if (suppliers.length === 0 && !error) {
      return <p className="text-center text-gray-500">Tidak ada data supplier atau vendor. Silakan tambah data terlebih dahulu.</p>
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6">
        <label htmlFor="supplier_id" className="block text-sm font-medium text-gray-700">Pilih Supplier / Vendor</label>
        <select
          id="supplier_id"
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
          className="input-style bg-white"
          required
        >
          {/* PERBAIKAN: Menampilkan 'name' dan 'type' dari data gabungan */}
          {suppliers.map(s => (
            <option key={s.id} value={s.id}>{s.name} ({s.type})</option>
          ))}
        </select>
      </div>
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      <div className="flex justify-end space-x-3">
        <button type="button" onClick={onCancel} className="btn-secondary">Batal</button>
        <button type="submit" disabled={loading || !supplierId} className="btn-primary">
          {loading ? 'Menyimpan...' : 'Terapkan Supplier'}
        </button>
      </div>
    </form>
  );
}

export default POAssignSupplierForm;