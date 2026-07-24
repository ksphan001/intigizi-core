import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';

function BeneficiaryForm({ beneficiary, onSave, onCancel, loading }) {
  const [formData, setFormData] = useState({
    full_name: '',
    nik_nisn: '', // Diubah dari nik
    address: '',
    distribution_point_id: '',
    phone_number: '',
    email: '',
    category_id: '',
    current_weight_kg: '', // Baru
    current_height_cm: ''  // Baru
  });
  
  const [distributionPoints, setDistributionPoints] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [pointsRes, categoriesRes] = await Promise.all([
            apiClient.get('/distribution_points_get.php'),
            apiClient.get('/beneficiary_categories_get.php')
        ]);
        setDistributionPoints(pointsRes.data);
        setCategories(categoriesRes.data);
        
        if (!beneficiary && pointsRes.data.length > 0) {
            setFormData(prev => ({ ...prev, distribution_point_id: pointsRes.data[0]?.id || '' }));
        }
        if (!beneficiary && categoriesRes.data.length > 0) {
            setFormData(prev => ({ ...prev, category_id: categoriesRes.data[0]?.id || '' }));
        }

      } catch (err) {
        setError("Gagal memuat data dropdown.");
      }
    };
    fetchDropdownData();

    if (beneficiary) {
      setFormData({
        full_name: beneficiary.full_name || '',
        nik_nisn: beneficiary.nik_nisn || '', // Diubah dari nik
        address: beneficiary.address || '',
        distribution_point_id: beneficiary.distribution_point_id || '',
        phone_number: beneficiary.phone_number || '',
        email: beneficiary.email || '',
        category_id: beneficiary.category_id || '',
        current_weight_kg: beneficiary.current_weight_kg || '', // Baru
        current_height_cm: beneficiary.current_height_cm || ''  // Baru
      });
    }
  }, [beneficiary]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...formData, id: beneficiary?.id });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border-b pb-4">
        <h3 className="text-base font-semibold text-gray-800 mb-2">Informasi Pribadi</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Nama Lengkap (sesuai KTP)</label>
                <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} className="input-style" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">NIK / NISN (Opsional)</label>
                <input type="text" name="nik_nisn" value={formData.nik_nisn} onChange={handleChange} className="input-style" maxLength="30" title="Masukkan NIK atau NISN" />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="category_id" className="block text-sm font-medium text-gray-700">Kategori Penerima Manfaat</label>
              <select name="category_id" id="category_id" value={formData.category_id} onChange={handleChange} className="input-style bg-white" required>
                <option value="">Pilih Kategori...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
        </div>
      </div>

      <div className="border-b pb-4">
        <h3 className="text-base font-semibold text-gray-800 mb-2">Informasi Kontak & Lokasi</h3>
        <div>
            <label className="block text-sm font-medium text-gray-700">Alamat Lengkap</label>
            <textarea name="address" value={formData.address} onChange={handleChange} rows="2" className="input-style" required></textarea>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Nomor Telepon</label>
                <input type="tel" name="phone_number" value={formData.phone_number} onChange={handleChange} className="input-style" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Email (Opsional)</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="input-style" />
            </div>
        </div>
        <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">Titik Distribusi Terdekat</label>
            <select name="distribution_point_id" value={formData.distribution_point_id} onChange={handleChange} className="input-style bg-white" required>
                <option value="">Pilih Titik Distribusi...</option>
                {distributionPoints.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
        </div>
      </div>
      
       <div>
        <h3 className="text-base font-semibold text-gray-800 mb-2">Data Antropometri (Opsional)</h3>
        <p className="text-xs text-gray-500 mb-2">Jika diisi, data ini akan menjadi catatan riwayat pertama.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Berat Badan (kg)</label>
                <input type="number" step="0.01" name="current_weight_kg" value={formData.current_weight_kg} onChange={handleChange} className="input-style" placeholder="Contoh: 45.5" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Tinggi Badan (cm)</label>
                <input type="number" step="0.01" name="current_height_cm" value={formData.current_height_cm} onChange={handleChange} className="input-style" placeholder="Contoh: 150.5" />
            </div>
        </div>
      </div>
      
      {error && <p className="text-red-500 text-sm">{error}</p>}
      
      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary">Batal</button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>
    </form>
  );
}

export default BeneficiaryForm;