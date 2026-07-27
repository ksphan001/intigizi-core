import React, { useState, useEffect } from 'react';
import apiClient from '../services/api.js';
import SearchableSelect from './SearchableSelect.jsx';

// Formulir Resep yang dirombak total
function RecipeIngredientForm({ onSave, onCancel, menuId, recipeItem }) {
  const [ingredientId, setIngredientId] = useState('');
  const [quantities, setQuantities] = useState({});
  const [allIngredients, setAllIngredients] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ingredientsRes, categoriesRes] = await Promise.all([
          apiClient.get('/ingredients_get.php'),
          apiClient.get('/beneficiary_categories_get.php')
        ]);
        setAllIngredients(ingredientsRes.data);
        setCategories(categoriesRes.data);
      } catch (err) {
        console.error("Gagal memuat data awal", err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (recipeItem) {
      setIngredientId(recipeItem.ingredient_id);
      // Cek jika quantity_per_portion adalah string JSON, parse dulu
      if (typeof recipeItem.quantity_per_portion === 'string') {
        try {
          setQuantities(JSON.parse(recipeItem.quantity_per_portion) || {});
        } catch (e) {
          console.error("Failed to parse quantities JSON:", e);
          setQuantities({});
        }
      } else {
        setQuantities(recipeItem.quantity_per_portion || {});
      }
    } else {
      setIngredientId('');
      setQuantities({});
    }
  }, [recipeItem]);

  const handleQuantityChange = (categoryId, value) => {
    setQuantities(prev => ({ ...prev, [categoryId]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = {
        id: recipeItem?.id,
        menu_id: menuId,
        ingredient_id: parseInt(ingredientId),
        quantity_per_portion: quantities // Kirim sebagai objek
      };
      await onSave(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan data.');
    } finally {
      setLoading(false);
    }
  };
  
  const ingredientOptions = allIngredients.map(ing => ({
    value: ing.id,
    label: ing.name
  }));

  const selectedIngredient = allIngredients.find(ing => ing.id.toString() === ingredientId.toString());

  // Fungsi cerdas mendeteksi tipe bahan: Bumbu vs Bahan Utama
  const isCondiment = (name) => {
    if (!name) return false;
    const condimentsKeywords = [
      'bawang', 'garam', 'gula', 'lada', 'merica', 'ketumbar', 'jahe', 'kunyit',
      'lengkuas', 'minyak', 'kecap', 'saus', 'penyedap', 'kaldu', 'kemiri', 
      'serai', 'daun salam', 'daun jeruk', 'cabe', 'cabai', 'terasi'
    ];
    return condimentsKeywords.some(keyword => name.toLowerCase().includes(keyword));
  };

  // Tentukan rekomendasi gramasi cerdas berdasarkan tipe bahan dan kategori gizi
  const getRecommendedGrammage = (catName, ingName) => {
    const nameLower = catName.toLowerCase();
    const condiment = isCondiment(ingName);

    if (condiment) {
      if (nameLower.includes('balita')) return 0.5;
      if (nameLower.includes('kb') || nameLower.includes('tk')) return 1.0;
      if (nameLower.includes('sd')) return 1.5;
      if (nameLower.includes('smp') || nameLower.includes('sma') || nameLower.includes('smk')) return 2.0;
      return 3.0; // Ibu hamil / menyusui
    } else {
      // Bahan Utama (Lauk, sayur, karbo)
      if (nameLower.includes('balita')) return 35;
      if (nameLower.includes('kb') || nameLower.includes('tk')) return 50;
      if (nameLower.includes('sd')) return 75;
      if (nameLower.includes('smp') || nameLower.includes('sma') || nameLower.includes('smk')) return 100;
      return 120; // Ibu hamil / menyusui
    }
  };

  // Hitung kontribusi HPP bahan secara real-time
  const calculateIngredientHpp = (qty, ing) => {
    const gram = parseFloat(qty) || 0;
    if (gram <= 0 || !ing || !ing.latest_price) return 0;

    // Default bdd_percentage ke 100% jika null/0
    const bdd = parseFloat(ing.bdd_percentage || 100) / 100;
    const grossWeight = gram / (bdd > 0 ? bdd : 1);
    
    // Asumsikan base unit adalah gram jika conversion_factor tidak diatur
    const pricePerGram = parseFloat(ing.latest_price) / 1000; // Asumsi harga per 1kg/1000g
    return grossWeight * pricePerGram;
  };

  const handleApplyRecommended = (catId, catName) => {
    if (selectedIngredient) {
      const rec = getRecommendedGrammage(catName, selectedIngredient.name);
      handleQuantityChange(catId, rec);
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Bahan Baku</label>
        <SearchableSelect
          options={ingredientOptions}
          value={ingredientId}
          onChange={(value) => { setIngredientId(value); setQuantities({}); }}
          placeholder="Cari bahan baku..."
          disabled={!!recipeItem}
        />
        {selectedIngredient && (
          <p className="text-xs text-gray-500 mt-1">
            Harga Acuan: <b>{formatCurrency(selectedIngredient.latest_price)}</b> / Kg (BDD: {selectedIngredient.bdd_percentage || 100}%) — 
            Kategori: <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-bold uppercase ml-1">
              {isCondiment(selectedIngredient.name) ? '🌶️ Bumbu / Condiment' : '🥩 Bahan Utama'}
            </span>
          </p>
        )}
      </div>
      
      {selectedIngredient && (
        <div className="bg-gray-50 p-4 rounded-xl border space-y-4">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Jumlah per Porsi & Estimasi Biaya</label>
          <div className="space-y-4 max-h-[20rem] overflow-y-auto pr-2">
            {categories.map(cat => {
              const qty = quantities[cat.id] || '';
              const recGram = getRecommendedGrammage(cat.name, selectedIngredient.name);
              const cost = calculateIngredientHpp(qty, selectedIngredient);

              return (
                <div key={cat.id} className="p-3 bg-white rounded-lg border flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
                  <div className="flex-1">
                    <span className="text-sm font-bold text-gray-700 block">{cat.name}</span>
                    <button
                      type="button"
                      onClick={() => handleApplyRecommended(cat.id, cat.name)}
                      className="text-[10px] font-bold text-intigizi-green hover:underline mt-0.5 block text-left"
                    >
                      💡 Rekomendasi: {recGram} g
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        id={`quantity-${cat.id}`}
                        value={qty}
                        onChange={(e) => handleQuantityChange(cat.id, e.target.value)}
                        className="input-style w-28 text-xs font-semibold"
                        placeholder="Gram (g)"
                      />
                      <span className="absolute right-2.5 top-2 text-[10px] text-gray-400 font-bold">g</span>
                    </div>

                    <div className="w-24 text-right">
                      <span className="text-[10px] text-gray-400 block uppercase font-bold">HPP Bahan</span>
                      <span className={`text-xs font-bold ${cost > 0 ? 'text-intigizi-orange' : 'text-gray-400'}`}>
                        {cost > 0 ? formatCurrency(cost) : 'Rp 0'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-gray-400 leading-relaxed italic">
            * Rekomendasi gramasi cerdas disesuaikan otomatis untuk kategori Bumbu (jumlah kecil) vs. Bahan Utama (jumlah besar) berdasarkan kelompok umur anak. HPP kontribusi dihitung berdasarkan berat kotor (menyertakan faktor penyusutan BDD).
          </p>
        </div>
      )}

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button type="button" onClick={onCancel} className="btn-secondary">Batal</button>
        <button type="submit" disabled={loading || !ingredientId} className="btn-primary">
          {loading ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>
    </form>
  );
}

export default RecipeIngredientForm;