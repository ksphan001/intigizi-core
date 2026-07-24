import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import MapPicker from './MapPicker.jsx'; // Menggunakan Google Maps Picker
import apiClient from '../services/api.js';
import { useNotification } from '../context/NotificationContext.jsx';

// Posisi default (Jakarta) jika tidak ada data
const DEFAULT_POSITION = { lat: -6.2088, lng: 106.8456 };

function DistributionPointForm({ point, categories = [], onSave, onCancel }) {
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    address: '',
    pic_name: '',
    pic_phone: '',
    latitude: DEFAULT_POSITION.lat,
    longitude: DEFAULT_POSITION.lng,
    category_counts: []
  });

  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  // Inisialisasi form data saat 'point' atau 'categories' berubah
  useEffect(() => {
    if (point) {
      // Jika mengedit 'point' yang sudah ada
      const countsMap = new Map(
        point.category_counts.map(c => [String(c.category_id), c.count])
      );

      setFormData({
        id: point.id,
        name: point.name || '',
        address: point.address || '',
        pic_name: point.pic_name || '',
        pic_phone: point.pic_phone || '',
        latitude: (point.latitude !== null && point.latitude !== undefined) ? parseFloat(point.latitude) : DEFAULT_POSITION.lat,
        longitude: (point.longitude !== null && point.longitude !== undefined) ? parseFloat(point.longitude) : DEFAULT_POSITION.lng,
        category_counts: categories.map(cat => ({
          category_id: cat.id,
          name: cat.name,
          count: countsMap.get(String(cat.id)) || 0
        }))
      });
    } else {
      // Jika membuat 'point' baru
      setFormData({
        id: null,
        name: '',
        address: '',
        pic_name: '',
        pic_phone: '',
        latitude: DEFAULT_POSITION.lat,
        longitude: DEFAULT_POSITION.lng,
        category_counts: categories.map(cat => ({
          category_id: cat.id,
          name: cat.name,
          count: 0
        }))
      });
    }
  }, [point, categories]);

  // Handler untuk input text biasa
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handler untuk input jumlah kategori
  const handleCountChange = (category_id, count) => {
    const newCounts = formData.category_counts.map(item =>
      item.category_id === category_id ? { ...item, count: parseInt(count, 10) || 0 } : item
    );
    setFormData(prev => ({ ...prev, category_counts: newCounts }));
  };

  // Handler saat lokasi di peta berubah
  const handleLocationChange = useCallback((location) => {
    setFormData(prev => ({
      ...prev,
      latitude: location.lat,
      longitude: location.lng,
      address: location.address || prev.address // Update alamat jika ada
    }));
  }, []);
  
  // Memoize posisi awal peta
  const mapInitialPosition = useMemo(() => ({
    lat: formData.latitude,
    lng: formData.longitude
  }), [formData.latitude, formData.longitude]);

  // Handler saat submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const dataToSubmit = {
      ...formData,
      // Pastikan lat/lng adalah angka
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      // Kirim hanya data count yang relevan
      category_counts: formData.category_counts.map(({ category_id, count }) => ({ category_id, count }))
    };

    try {
      // --- PERBAIKAN DI SINI ---
      // Panggil onSave dengan data yang sudah disiapkan (dataToSubmit)
      await onSave(dataToSubmit); // Panggil callback sukses dengan data
    } catch (err) {
      // Error sudah ditangani di parent (handleSavePoint), 
      // tapi kita tetap perlu menampilkan notifikasi jika error tidak ditangani di sana
      showNotification(err.response?.data?.message || 'Gagal menyimpan data', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nama Titik Distribusi</label>
        <input
          type="text"
          name="name"
          id="name"
          value={formData.name}
          onChange={handleChange}
          className="input-style"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tandai Lokasi di Peta</label>
        <div className="mt-1 h-64 rounded-lg overflow-hidden border">
          <MapPicker 
            onLocationChange={handleLocationChange} 
            initialPosition={mapInitialPosition}
            activeTab={true} // Selalu aktif karena form ini ada di modal
          />
        </div>
      </div>
      
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">Alamat Lengkap</label>
        <textarea
          name="address"
          id="address"
          rows="2"
          value={formData.address}
          onChange={handleChange}
          className="input-style"
          placeholder="Akan terisi otomatis dari peta, atau isi manual"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="pic_name" className="block text-sm font-medium text-gray-700">Nama PIC</label>
          <input
            type="text"
            name="pic_name"
            id="pic_name"
            value={formData.pic_name}
            onChange={handleChange}
            className="input-style"
          />
        </div>
        <div>
          <label htmlFor="pic_phone" className="block text-sm font-medium text-gray-700">No. Telepon PIC</label>
          <input
            type="tel"
            name="pic_phone"
            id="pic_phone"
            value={formData.pic_phone}
            onChange={handleChange}
            className="input-style"
          />
        </div>
      </div>
      
      <div>
          <h4 className="text-md font-medium text-gray-800 mb-2">Jumlah Penerima Manfaat</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {formData.category_counts.map(item => (
                  <div key={item.category_id}>
                      <label htmlFor={`count-${item.category_id}`} className="block text-sm font-medium text-gray-700">{item.name}</label>
                      <input
                          type="number"
                          id={`count-${item.category_id}`}
                          name={`count-${item.category_id}`}
                          value={item.count}
                          onChange={(e) => handleCountChange(item.category_id, e.target.value)}
                          className="input-style"
                          min="0"
                      />
                  </div>
              ))}
          </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
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
          {loading ? <Loader2 className="animate-spin" /> : (formData.id ? 'Simpan Perubahan' : 'Simpan')}
        </button>
      </div>
    </form>
  );
}

export default DistributionPointForm;