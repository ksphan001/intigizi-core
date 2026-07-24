import React, { useState, useEffect } from 'react';
import apiClient from '@/services/api';

// Formulir untuk menambah stok dari Purchase Order.

function AddStockForm({ onSave, onCancel, loading }) {
  const [poId, setPoId] = useState('');
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    // Mengambil daftar PO yang siap ditambahkan ke stok
    const fetchPOs = async () => {
      try {
        const response = await apiClient.get('/purchase_orders_get_for_stock.php');
        setPurchaseOrders(response.data);
        if (response.data.length > 0) {
          setPoId(response.data[0].id);
        }
      } catch (err) {
        console.error("Gagal mengambil data PO", err);
        setError("Gagal memuat daftar PO.");
      }
    };
    fetchPOs();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!poId) {
      setError('Silakan pilih Purchase Order.');
      return;
    }
    setError('');
    try {
      await onSave({ po_id: parseInt(poId) });
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menambah stok.');
    }
  };

  if (purchaseOrders.length === 0 && !error) {
    return <p className="text-center text-gray-500">Tidak ada Purchase Order yang siap untuk ditambahkan ke stok saat ini.</p>
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6">
        <label htmlFor="po_id" className="block text-sm font-medium text-gray-700">Pilih Purchase Order</label>
        <select
          id="po_id"
          value={poId}
          onChange={(e) => setPoId(e.target.value)}
          className="input-style bg-white"
          required
        >
          {purchaseOrders.map(po => (
            <option key={po.id} value={po.id}>{po.po_code}</option>
          ))}
        </select>
      </div>
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      <div className="flex justify-end space-x-3">
        <button type="button" onClick={onCancel} className="btn-secondary">Batal</button>
        <button type="submit" disabled={loading || !poId} className="btn-primary">
          {loading ? 'Menyimpan...' : 'Tambah ke Stok'}
        </button>
      </div>
    </form>
  );
}

export default AddStockForm;
