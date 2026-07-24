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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">Bahan Baku</label>
        <SearchableSelect
          options={ingredientOptions}
          value={ingredientId}
          onChange={(value) => setIngredientId(value)}
          placeholder="Cari bahan baku..."
          disabled={!!recipeItem}
        />
      </div>
      
      <div>
        {/* --- PERUBAHAN LABEL --- */}
        <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah per Porsi (Berat Bersih / BDD)</label>
        <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
          {categories.map(cat => (
            <div key={cat.id} className="grid grid-cols-3 gap-3 items-center">
              <label htmlFor={`quantity-${cat.id}`} className="col-span-1 text-sm text-gray-600">
                {cat.name}
              </label>
              <div className="col-span-2">
                <input
                  type="number"
                  step="0.01"
                  id={`quantity-${cat.id}`}
                  value={quantities[cat.id] || ''}
                  onChange={(e) => handleQuantityChange(cat.id, e.target.value)}
                  className="input-style"
                  placeholder="Jumlah (gr/ml)"
                />
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">Masukkan berat bersih (matang/bisa dimakan) yang dibutuhkan per porsi.</p>
      </div>

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