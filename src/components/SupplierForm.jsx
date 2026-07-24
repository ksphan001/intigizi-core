import React, { useState, useEffect } from 'react';
import apiClient from '@/services/api';

// Formulir untuk menambah atau mengedit data supplier.

function SupplierForm({ supplier, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    supplier_name: '',
    user_id: '',
    address: '',
    contact_person: '',
    coverage_radius_km: 15,
    coverage_area_desc: ''
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await apiClient.get('/users_get_for_dropdown.php');
        setUsers(response.data);
        if (!supplier && response.data.length > 0) {
          setFormData(prev => ({ ...prev, user_id: response.data[0].id }));
        }
      } catch (err) {
        console.error("Gagal mengambil data user", err);
      }
    };
    fetchUsers();

    if (supplier) {
      setFormData({
        supplier_name: supplier.supplier_name || '',
        user_id: supplier.user_id || '',
        address: supplier.address || '',
        contact_person: supplier.contact_person || '',
        coverage_radius_km: supplier.coverage_radius_km || 15,
        coverage_area_desc: supplier.coverage_area_desc || ''
      });
    }
  }, [supplier]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onSave({ ...formData, id: supplier?.id });
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label htmlFor="supplier_name" className="block text-sm font-medium text-gray-700">Nama Supplier</label>
        <input type="text" name="supplier_name" id="supplier_name" value={formData.supplier_name} onChange={handleChange} className="input-style" required />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="mb-4">
          <label htmlFor="user_id" className="block text-sm font-medium text-gray-700">Akun User Terhubung</label>
          <select name="user_id" id="user_id" value={formData.user_id} onChange={handleChange} className="input-style bg-white" required>
            {supplier && <option value={supplier.user_id}>{supplier.username}</option>}
            {users.map(user => (
              <option key={user.id} value={user.id}>{user.full_name} ({user.username})</option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label htmlFor="contact_person" className="block text-sm font-medium text-gray-700">Kontak Person</label>
          <input type="text" name="contact_person" id="contact_person" value={formData.contact_person} onChange={handleChange} className="input-style" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="mb-4 md:col-span-1">
          <label htmlFor="coverage_radius_km" className="block text-sm font-medium text-gray-700">Radius Cakupan (km)</label>
          <input type="number" name="coverage_radius_km" id="coverage_radius_km" value={formData.coverage_radius_km} onChange={handleChange} className="input-style" required min="1" />
        </div>
        <div className="mb-4 md:col-span-2">
          <label htmlFor="coverage_area_desc" className="block text-sm font-medium text-gray-700">Deskripsi Wilayah Cakupan</label>
          <input type="text" name="coverage_area_desc" id="coverage_area_desc" value={formData.coverage_area_desc} onChange={handleChange} className="input-style" placeholder="Cth: Kec. Sukadamai, Cihampelas" />
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">Alamat Lengkap</label>
        <textarea name="address" id="address" value={formData.address} onChange={handleChange} rows="2" className="input-style"></textarea>
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      <div className="flex justify-end space-x-3">
        <button type="button" onClick={onCancel} className="btn-secondary">Batal</button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>
    </form>
  );
}

export default SupplierForm;
