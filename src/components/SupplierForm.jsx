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
    coverage_area_desc: '',
    latitude: '',
    longitude: ''
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
        coverage_area_desc: supplier.coverage_area_desc || '',
        latitude: supplier.latitude || '',
        longitude: supplier.longitude || ''
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="supplier_name" className="block text-sm font-semibold text-gray-700 mb-1">Nama Supplier</label>
        <input type="text" name="supplier_name" id="supplier_name" value={formData.supplier_name} onChange={handleChange} className="input-style w-full" required />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="user_id" className="block text-sm font-semibold text-gray-700 mb-1">Akun User Terhubung</label>
          <select name="user_id" id="user_id" value={formData.user_id} onChange={handleChange} className="input-style w-full bg-white" required>
            {supplier && <option value={supplier.user_id}>{supplier.username}</option>}
            {users.map(user => (
              <option key={user.id} value={user.id}>{user.full_name} ({user.username})</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="contact_person" className="block text-sm font-semibold text-gray-700 mb-1">Kontak Person</label>
          <input type="text" name="contact_person" id="contact_person" value={formData.contact_person} onChange={handleChange} className="input-style w-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        <div className="md:col-span-1">
          <label htmlFor="coverage_radius_km" className="block text-sm font-semibold text-gray-700 mb-1 truncate" title="Radius Cakupan (km)">Radius Cakupan (km)</label>
          <input type="number" name="coverage_radius_km" id="coverage_radius_km" value={formData.coverage_radius_km} onChange={handleChange} className="input-style w-full" required min="1" />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="coverage_area_desc" className="block text-sm font-semibold text-gray-700 mb-1 truncate" title="Wilayah Cakupan">Wilayah Cakupan</label>
          <input type="text" name="coverage_area_desc" id="coverage_area_desc" value={formData.coverage_area_desc} onChange={handleChange} className="input-style w-full" placeholder="Cth: Kec. Sukadamai, Cihampelas" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="latitude" className="block text-sm font-semibold text-gray-700 mb-1">Latitude (Koordinat)</label>
          <input type="text" name="latitude" id="latitude" value={formData.latitude} onChange={handleChange} className="input-style w-full" placeholder="Cth: -6.175392" />
        </div>
        <div>
          <label htmlFor="longitude" className="block text-sm font-semibold text-gray-700 mb-1">Longitude (Koordinat)</label>
          <input type="text" name="longitude" id="longitude" value={formData.longitude} onChange={handleChange} className="input-style w-full" placeholder="Cth: 106.827153" />
        </div>
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-1">Alamat Lengkap</label>
        <textarea name="address" id="address" value={formData.address} onChange={handleChange} rows="2" className="input-style w-full"></textarea>
      </div>

      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      
      <div className="flex justify-end space-x-3 pt-3 border-t">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition-colors">Batal</button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>
    </form>
  );
}

export default SupplierForm;
