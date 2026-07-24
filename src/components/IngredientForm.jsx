import React, { useState, useEffect } from 'react';
import apiClient from '../services/api.js';
import SearchableSelect from './SearchableSelect.jsx';
import { HelpCircle } from 'lucide-react';

// Formulir Bahan Baku yang Diperbarui (Versi Final dengan Penjelasan)
function IngredientForm({ ingredient, onSave, onCancel, loading }) {
  const [formData, setFormData] = useState({
    name: '',
    unit_id: '',
    latest_price: '',
    calories: '',
    protein: '',
    carbohydrates: '',
    fat: '',
    fiber: '', // Baru
    bdd_percentage: '', // Baru
    qc_parameters: '' // Baru
  });
  
  const [units, setUnits] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get('/units_get.php')
      .then(response => setUnits(response.data))
      .catch(err => setError("Gagal memuat data satuan."));
  }, []);

  useEffect(() => {
    if (ingredient) {
      setFormData({
        name: ingredient.name || '',
        unit_id: ingredient.unit_id || '',
        latest_price: ingredient.latest_price || '',
        calories: ingredient.calories || '',
        protein: ingredient.protein || '',
        carbohydrates: ingredient.carbohydrates || '',
        fat: ingredient.fat || '',
        fiber: ingredient.fiber || '',
        qc_parameters: ingredient.qc_parameters || '',
        // --- PERBAIKAN: Konversi dari 0.70 menjadi 70 ---
        bdd_percentage: ingredient.bdd_percentage ? (parseFloat(ingredient.bdd_percentage) * 100) : '100',
      });
    }
  }, [ingredient]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // --- PERBAIKAN: Konversi dari 70 kembali ke 0.70 ---
    const bddValue = parseFloat(formData.bdd_percentage) / 100;
    
    onSave({ 
      ...formData, 
      id: ingredient?.id,
      bdd_percentage: isNaN(bddValue) ? 1.00 : bddValue // Kirim sebagai desimal
    });
  };

  const unitOptions = units.map(u => ({
    value: u.id,
    label: `${u.name} (${u.symbol})`
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <p className="text-red-500 text-sm">{error}</p>}
      
      {/* --- Bagian 1: Informasi Dasar & Pembelian --- */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">1. Informasi Dasar & Pembelian</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nama Bahan Baku</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} className="input-style" required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Satuan Beli</label>
              <SearchableSelect
                options={unitOptions}
                value={formData.unit_id}
                onChange={(value) => setFormData(prev => ({ ...prev, unit_id: value }))}
                placeholder="Pilih satuan (kg, liter, dll)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Harga Terakhir (per Satuan Beli)</label>
              <input type="number" step="0.01" name="latest_price" value={formData.latest_price} onChange={handleChange} className="input-style" placeholder="Contoh: 50000" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Parameter Kendali Mutu / QC (BGN Compliance)</label>
            <textarea
              name="qc_parameters"
              value={formData.qc_parameters}
              onChange={handleChange}
              placeholder="Contoh: Suhu daging sapi segar < 4°C, sayuran hijau segar tidak layu, kemasan kedap udara."
              className="input-style w-full h-20 py-2"
            />
          </div>
        </div>
      </div>
      
      {/* --- Bagian 2: Informasi Gizi & Konversi --- */}
      <div className="bg-white p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">2. Informasi Gizi & Konversi</h3>
        
        {/* Kotak Penjelasan BDD */}
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg mb-4 text-sm space-y-2">
            <p className="flex items-center font-bold"><HelpCircle size={18} className="mr-2"/> Cara Kerja BDD (Berat Dapat Dimakan)</p>
            <p>
              Formulir ini memisahkan perhitungan <strong>HPP (Biaya)</strong> dan <strong>Gizi (Publik)</strong>.
            </p>
            <ul className="list-disc pl-5">
              <li><strong>HPP (Biaya)</strong> dihitung berdasarkan <strong>Berat Kotor</strong> (yang Anda beli).</li>
              <li><strong>Gizi (Kalori, Protein)</strong> dihitung berdasarkan <strong>Berat Bersih</strong> (yang dimakan).</li>
            </ul>
            <p>
              <strong>Contoh (Telur):</strong> Anda input BDD <strong>90%</strong>. Saat Ahli Gizi memasukkan <strong>90gr</strong> (bersih) di resep, sistem akan otomatis menghitung HPP untuk <strong>100gr</strong> (kotor: 90 / 0.90) dan menghitung Gizi untuk <strong>90gr</strong> (bersih).
            </p>
        </div>

        <p className="text-sm text-gray-600 mb-3">
          Masukkan nilai gizi per <strong>100 gram Berat Bersih</strong> (Bagian yang Dapat Dimakan / BDD).
        </p>

        {/* --- Tata Letak Input Gizi yang Rapi (3x2) --- */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Kalori (kcal)</label>
            <input type="number" step="0.01" name="calories" value={formData.calories} onChange={handleChange} className="input-style" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Protein (gr)</label>
            <input type="number" step="0.01" name="protein" value={formData.protein} onChange={handleChange} className="input-style" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Karbohidrat (gr)</label>
            <input type="number" step="0.01" name="carbohydrates" value={formData.carbohydrates} onChange={handleChange} className="input-style" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Lemak (gr)</label>
            <input type="number" step="0.01" name="fat" value={formData.fat} onChange={handleChange} className="input-style" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Serat (gr)</label>
            <input type="number" step="0.01" name="fiber" value={formData.fiber} onChange={handleChange} className="input-style" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">BDD (%)</label>
            <input 
              type="number" 
              step="0.01" 
              name="bdd_percentage" 
              value={formData.bdd_percentage} 
              onChange={handleChange} 
              className="input-style" 
              placeholder="Cth: 70 (untuk 70%)"
              required 
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t">
        <button type="button" onClick={onCancel} className="btn-secondary">Batal</button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>
    </form>
  );
}

export default IngredientForm;