import React, { useState } from 'react';

// Formulir sederhana untuk mengubah status Purchase Order.

function POStatusForm({ currentStatus, onSave, onCancel, loading }) {
  const [newStatus, setNewStatus] = useState(currentStatus);
  const [error, setError] = useState('');

  // Daftar status yang valid yang bisa diubah oleh pengguna
  const validStatuses = ['Diverifikasi', 'Dibayar', 'Selesai'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await onSave({ status: newStatus });
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan status.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6">
        <label htmlFor="status" className="block text-sm font-medium text-gray-700">Ubah Status Menjadi</label>
        <select
          id="status"
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value)}
          className="input-style bg-white"
          required
        >
          {/* Menampilkan status saat ini jika tidak termasuk dalam daftar valid */}
          {!validStatuses.includes(currentStatus) && <option value={currentStatus}>{currentStatus}</option>}
          {validStatuses.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      <div className="flex justify-end space-x-3">
        <button type="button" onClick={onCancel} className="btn-secondary">Batal</button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Menyimpan...' : 'Simpan Status'}
        </button>
      </div>
    </form>
  );
}

export default POStatusForm;