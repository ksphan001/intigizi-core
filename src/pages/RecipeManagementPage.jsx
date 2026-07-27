import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import apiClient from "../services/api";
import PageHeader from "../components/PageHeader.jsx";
import Modal from "../components/Modal.jsx";
import ConfirmationModal from "../components/ConfirmationModal.jsx";
import RecipeIngredientForm from "../components/RecipeIngredientForm.jsx";
import {
  Edit,
  Trash2,
  ArrowLeft,
  DollarSign,
  Flame,
  Beef,
  Wheat,
  Droplets,
  Loader2,
  Users,
  Leaf,
  Calculator,
  Sparkles,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { useNotification } from "../context/NotificationContext.jsx";

// PENJELASAN: Diperbarui untuk menampilkan data 'fiber' (serat) dan batas maksimal HPP.
const CategoryDetailCard = ({ categoryData, formatCurrency }) => {
  const { category_name, nutrition, hpp, max_hpp } = categoryData;
  const isOverBudget = max_hpp && parseFloat(hpp || 0) > parseFloat(max_hpp);

  const NutritionItem = ({ icon, value, unit }) => (
    <div className="flex items-center space-x-1 text-sm text-gray-700">
      {icon}
      <span>
        {parseFloat(value || 0).toFixed(1)}
        {unit}
      </span>
    </div>
  );

  return (
    <div className={`bg-white p-4 rounded-xl shadow-md border flex flex-col transform hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden ${isOverBudget ? 'border-red-300 ring-2 ring-red-500/10' : ''}`}>
      {isOverBudget && (
        <div className="absolute top-0 right-0 bg-red-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-bl shadow-sm flex items-center z-10">
          <AlertTriangle size={10} className="mr-1" /> Over Budget
        </div>
      )}
      
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-bold text-lg text-intigizi-green-dark">
            {category_name}
          </h4>
          {max_hpp && (
            <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
              Batas Maks: {formatCurrency(max_hpp)}
            </p>
          )}
        </div>
        <div className="text-right flex-shrink-0 ml-2">
          <p className="text-xs text-gray-500">Estimasi HPP</p>
          <p className={`font-bold text-xl ${isOverBudget ? 'text-red-650' : 'text-intigizi-orange'}`}>
            {formatCurrency(hpp)}
          </p>
        </div>
      </div>
      {/* Grid diperbarui menjadi 3 kolom untuk mengakomodasi Serat */}
      <div className="mt-auto pt-3 border-t grid grid-cols-3 gap-x-2 gap-y-2">
        <NutritionItem
          icon={<Flame size={16} className="text-red-500" />}
          value={nutrition.total_calories}
          unit="kcal"
        />
        <NutritionItem
          icon={<Beef size={16} className="text-blue-500" />}
          value={nutrition.total_protein}
          unit="g"
        />
        <NutritionItem
          icon={<Leaf size={16} className="text-green-500" />}
          value={nutrition.total_fiber}
          unit="g"
        />
        <NutritionItem
          icon={<Wheat size={16} className="text-yellow-500" />}
          value={nutrition.total_carbs}
          unit="g"
        />
        <NutritionItem
          icon={<Droplets size={16} className="text-orange-500" />}
          value={nutrition.total_fat}
          unit="g"
        />
      </div>
    </div>
  );
};

const HPPOptimizer = ({ recipe, categoryDetails, formatCurrency }) => {
  const [selectedCatId, setSelectedCatId] = useState("");
  const [targetHpp, setTargetHpp] = useState(8000);
  const [simulationFactor, setSimulationFactor] = useState(1);
  const [isOptimized, setIsOptimized] = useState(false);

  // Standar gizi acuan program (Min & Max)
  const NUTRITION_STANDARDS = {
    1: { name: "Ibu Hamil", minCal: 750, maxCal: 850, minProt: 25, maxProt: 32 },
    2: { name: "Ibu Menyusui", minCal: 750, maxCal: 850, minProt: 25, maxProt: 32 },
    3: { name: "Balita", minCal: 300, maxCal: 400, minProt: 8, maxProt: 12 },
    4: { name: "KB & TK", minCal: 350, maxCal: 450, minProt: 10, maxProt: 15 },
    5: { name: "SD 1 - 3", minCal: 450, maxCal: 550, minProt: 12, maxProt: 18 },
    6: { name: "SD 4 - 6", minCal: 500, maxCal: 600, minProt: 15, maxProt: 20 },
    7: { name: "SMP", minCal: 600, maxCal: 700, minProt: 20, maxProt: 25 },
    8: { name: "SMA/SMK", minCal: 700, maxCal: 800, minProt: 25, maxProt: 30 }
  };

  // Set default category jika belum dipilih
  useEffect(() => {
    if (categoryDetails && categoryDetails.length > 0 && !selectedCatId) {
      setSelectedCatId(categoryDetails[0].category_id.toString());
    }
  }, [categoryDetails, selectedCatId]);

  const activeCategory = categoryDetails.find(c => c.category_id.toString() === selectedCatId);
  const standard = NUTRITION_STANDARDS[selectedCatId];

  // Hitung data simulasi saat ini
  const currentHpp = activeCategory ? parseFloat(activeCategory.hpp || 0) : 0;
  const simulatedHpp = currentHpp * simulationFactor;

  const currentCalories = activeCategory ? parseFloat(activeCategory.nutrition.total_calories || 0) : 0;
  const simulatedCalories = currentCalories * simulationFactor;

  const currentProtein = activeCategory ? parseFloat(activeCategory.nutrition.total_protein || 0) : 0;
  const simulatedProtein = currentProtein * simulationFactor;

  // Fitur Auto-Fit untuk mencocokkan target HPP (ambil batas aman 98% target)
  const handleAutoFit = () => {
    if (currentHpp > 0 && targetHpp > 0) {
      const factor = (targetHpp * 0.98) / currentHpp;
      setSimulationFactor(factor);
      setIsOptimized(true);
    }
  };

  const handleReset = () => {
    setSimulationFactor(1);
    setIsOptimized(false);
  };

  // Cek Status Keamanan Gizi
  const isCaloriesSafe = standard ? (simulatedCalories >= standard.minCal && simulatedCalories <= standard.maxCal) : true;
  const isProteinSafe = standard ? (simulatedProtein >= standard.minProt && simulatedProtein <= standard.maxProt) : true;

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border mb-6">
      <div className="flex items-center justify-between border-b pb-4 mb-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center">
          <Calculator className="mr-3 text-intigizi-green" />
          Kalkulator Simulasi & Optimasi HPP Target
        </h3>
        <span className="text-xs text-gray-500 font-medium">Bantu Dapur Pas Anggaran & Gizi</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Kolom Input Parameter */}
        <div className="space-y-4 border-r pr-0 md:pr-6 border-gray-150">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Kategori Sasaran</label>
            <select
              value={selectedCatId}
              onChange={(e) => { setSelectedCatId(e.target.value); handleReset(); }}
              className="input-style bg-white w-full text-xs font-semibold"
            >
              {categoryDetails.map((c) => (
                <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Target HPP Maksimal (Rp)</label>
            <input
              type="number"
              value={targetHpp}
              onChange={(e) => setTargetHpp(Math.max(0, parseInt(e.target.value) || 0))}
              className="input-style w-full text-xs font-semibold"
              placeholder="Contoh: 8000"
            />
          </div>

          <div className="flex space-x-2 pt-2">
            <button
              onClick={handleAutoFit}
              disabled={currentHpp === 0}
              className="btn-primary flex-1 text-xs py-2 px-3 flex items-center justify-center font-bold"
            >
              <Sparkles size={14} className="mr-1.5" /> Auto-Fit
            </button>
            <button
              onClick={handleReset}
              className="btn-secondary text-xs py-2 px-3 flex items-center justify-center font-bold"
            >
              <RefreshCw size={14} className="mr-1.5" /> Reset
            </button>
          </div>
        </div>

        {/* Kolom Status HPP & Indikator Gizi */}
        <div className="space-y-4 border-r pr-0 md:pr-6 border-gray-150">
          <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Hasil Simulasi HPP & Gizi</span>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-xl border">
              <span className="text-[10px] font-bold text-gray-400 block uppercase">HPP Hasil Simulasi</span>
              <span className={`text-lg font-black block mt-0.5 ${simulatedHpp > targetHpp ? 'text-red-600' : 'text-intigizi-green-dark'}`}>
                {formatCurrency(simulatedHpp)}
              </span>
              <span className="text-[10px] text-gray-500 font-semibold block mt-0.5">
                Target: {formatCurrency(targetHpp)}
              </span>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border">
              <span className="text-[10px] font-bold text-gray-400 block uppercase">Pemanfaatan Budget</span>
              <span className="text-lg font-black block text-gray-800 mt-0.5">
                {((simulatedHpp / (targetHpp || 1)) * 100).toFixed(1)}%
              </span>
              <span className="text-[10px] text-gray-500 font-semibold block mt-0.5">
                Sisa: {formatCurrency(Math.max(0, targetHpp - simulatedHpp))}
              </span>
            </div>
          </div>

          {/* Indikator Peringatan Gizi */}
          {standard && (
            <div className="space-y-2 pt-1">
              {/* Kalori */}
              <div className="flex items-center justify-between text-xs p-2 rounded-lg border bg-white">
                <div className="flex items-center">
                  <Flame size={14} className="text-red-500 mr-2" />
                  <span className="font-semibold text-gray-700">Energi (Kalori): {simulatedCalories.toFixed(1)} kcal</span>
                </div>
                {isCaloriesSafe ? (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 font-bold rounded text-[9px] uppercase">Aman</span>
                ) : (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 font-bold rounded text-[9px] uppercase flex items-center">
                    <AlertTriangle size={10} className="mr-1" /> Tidak Ideal
                  </span>
                )}
              </div>

              {/* Protein */}
              <div className="flex items-center justify-between text-xs p-2 rounded-lg border bg-white">
                <div className="flex items-center">
                  <Beef size={14} className="text-blue-500 mr-2" />
                  <span className="font-semibold text-gray-700">Protein: {simulatedProtein.toFixed(1)} g</span>
                </div>
                {isProteinSafe ? (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 font-bold rounded text-[9px] uppercase">Aman</span>
                ) : (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 font-bold rounded text-[9px] uppercase flex items-center">
                    <AlertTriangle size={10} className="mr-1" /> Tidak Ideal
                  </span>
                )}
              </div>

              {/* Peringatan Teks Gizi */}
              {(!isCaloriesSafe || !isProteinSafe) && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-800 leading-relaxed">
                  ⚠️ <b>Rekomendasi Gizi:</b> Porsi simulasi ini membuat nilai nutrisi menyimpang dari standar gizi sehat ({standard.name}: Kalori {standard.minCal}-{standard.maxCal} kcal, Protein {standard.minProt}-{standard.maxProt}g). Harap sesuaikan kembali.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Kolom Rekomendasi Gramasi Bahan Baru */}
        <div className="space-y-3">
          <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Rekomendasi Gramasi Bahan (1 Porsi)</span>
          <div className="max-h-48 overflow-y-auto space-y-2 pr-1 text-xs">
            {recipe.map((ing) => {
              let originalPortion = 0;
              try {
                const portions = JSON.parse(ing.quantity_per_portion);
                originalPortion = parseFloat(portions[selectedCatId] || 0);
              } catch(e) {
                originalPortion = 0;
              }

              if (originalPortion === 0) return null; // Abaikan jika porsi bahan 0

              const simulatedPortion = originalPortion * simulationFactor;

              return (
                <div key={ing.id} className="flex justify-between items-center p-2 rounded-lg border bg-gray-50/50">
                  <span className="font-medium text-gray-700 truncate mr-2">{ing.ingredient_name}</span>
                  <div className="text-right flex-shrink-0">
                    <span className="text-gray-400 line-through mr-2">{originalPortion.toLocaleString('id-ID')} {ing.base_unit_symbol}</span>
                    <span className="font-bold text-intigizi-green-dark bg-green-50 px-1.5 py-0.5 rounded border border-green-100">
                      {simulatedPortion.toFixed(1)} {ing.base_unit_symbol}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

function RecipeManagementPage() {
  const { menuId } = useParams();
  const [menu, setMenu] = useState(null);
  const [recipe, setRecipe] = useState([]);
  const [categoryDetails, setCategoryDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingNutrition, setLoadingNutrition] = useState(true);
  const [error, setError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItemId, setDeletingItemId] = useState(null);
  const { showNotification } = useNotification();

  const fetchRecipeDetails = useCallback(async () => {
    // --- PERBAIKAN: Pastikan menuId valid sebelum fetch ---
    if (!menuId || menuId === "undefined") {
      setError("ID Menu tidak valid.");
      setLoading(false);
      setLoadingNutrition(false);
      return;
    }

    try {
      setLoading(true);
      setLoadingNutrition(true);

      const [menuResponse, recipeResponse, nutritionResponse] =
        await Promise.all([
          apiClient.get(`/menus_get.php?id=${menuId}`),
          apiClient.get(`/menu_ingredients_get.php?menu_id=${menuId}`),
          apiClient.get(`/menu_nutrition_get.php?menu_id=${menuId}`),
        ]);

      if (menuResponse.data && menuResponse.data.length > 0) {
        setMenu(menuResponse.data[0]);
      } else {
        // Jika menu tidak ditemukan (mungkin ID tidak valid), lempar error
        throw new Error("Menu tidak ditemukan.");
      }

      setRecipe(Array.isArray(recipeResponse.data) ? recipeResponse.data : []);
      setCategoryDetails(
        Array.isArray(nutritionResponse.data) ? nutritionResponse.data : [],
      );
    } catch (err) {
      setError("Gagal memuat data resep atau gizi.");
      showNotification(
        err.response?.data?.message || "Gagal memuat data resep atau gizi.",
        "error",
      );
    } finally {
      setLoading(false);
      setLoadingNutrition(false);
    }
  }, [menuId, showNotification]);

  useEffect(() => {
    fetchRecipeDetails();
  }, [fetchRecipeDetails]);

  const processedRecipe = useMemo(() => {
    return recipe.map((item) => {
      try {
        const portions = JSON.parse(item.quantity_per_portion);
        // Tampilkan porsi representatif (ambil porsi non-nol pertama)
        const firstPortionValue =
          Object.values(portions).find((v) => v > 0) || 0;

        // --- PERBAIKAN: Kalkulasi HPP dipindahkan ke backend ---
        // Kita hanya perlu mengambil data HPP yang sudah dihitung dari `categoryDetails`
        // Ini adalah logika frontend, jadi kita biarkan estimasi HPP per bahan
        let hpp = 0;
        if (item.conversion_factor > 0) {
          // Ini adalah HPP estimasi per 100g, BUKAN HPP per porsi
          hpp =
            (parseFloat(item.latest_price) /
              parseFloat(item.conversion_factor)) *
            100;
        }

        return {
          ...item,
          display_quantity: firstPortionValue,
          hpp_per_ingredient_100g: hpp,
        };
      } catch (e) {
        console.warn("Gagal parse JSON porsi:", item.quantity_per_portion);
        return { ...item, display_quantity: 0, hpp_per_ingredient_100g: 0 };
      }
    });
  }, [recipe]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);

  const openAddModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };
  const openEditModal = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };
  const openDeleteConfirm = (id) => {
    setDeletingItemId(id);
    setIsConfirmModalOpen(true);
  };

  const handleSave = async (data) => {
    try {
      const endpoint = data.id
        ? "/menu_ingredients_update.php"
        : "/menu_ingredients_add.php";
      const response = await apiClient.post(endpoint, data);
      showNotification(response.data.message, "success");
      setIsModalOpen(false);
      fetchRecipeDetails(); // Panggil fetchDetails tanpa argumen
    } catch (err) {
      showNotification(
        err.response?.data?.message || "Gagal menyimpan data resep.",
        "error",
      );
      throw err;
    }
  };

  const handleDelete = async () => {
    try {
      const response = await apiClient.post("/menu_ingredients_remove.php", {
        id: deletingItemId,
      });
      showNotification(response.data.message, "success");
      fetchRecipeDetails(); // Panggil fetchDetails tanpa argumen
    } catch (err) {
      showNotification(
        err.response?.data?.message || "Gagal menghapus bahan.",
        "error",
      );
    } finally {
      setIsConfirmModalOpen(false);
      setDeletingItemId(null);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin" /> Memuat resep...
      </div>
    );
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div>
      <Link
        to="/app/menus"
        className="flex items-center text-gray-500 hover:text-gray-800 mb-4"
      >
        <ArrowLeft size={20} className="mr-2" />
        Kembali ke Daftar Menu
      </Link>
      <PageHeader
        title={`Resep untuk: ${menu?.menu_name}`}
        buttonText="Tambah Bahan"
        onButtonClick={openAddModal}
      />

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Daftar Bahan
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Nama Bahan
                </th>
                <th scope="col" className="px-6 py-3">
                  Jml. (gr/ml) - Representatif
                </th>
                <th scope="col" className="px-6 py-3">
                  Estimasi HPP (per 100gr)
                </th>
                <th scope="col" className="px-6 py-3 text-right">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {processedRecipe.length > 0 ? (
                processedRecipe.map((item) => (
                  <tr
                    key={item.id}
                    className="bg-white border-b hover:bg-gray-50"
                  >
                    <th
                      scope="row"
                      className="px-6 py-4 font-medium text-gray-900"
                    >
                      {item.ingredient_name}
                    </th>
                    <td className="px-6 py-4">
                      {parseFloat(item.display_quantity).toLocaleString(
                        "id-ID",
                      )}{" "}
                      {item.base_unit_symbol}
                    </td>
                    <td className="px-6 py-4">
                      {formatCurrency(item.hpp_per_ingredient_100g)}
                    </td>
                    <td className="px-6 py-4 flex justify-end space-x-2">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => openDeleteConfirm(item.id)}
                        className="p-1 text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-4">
                    Resep ini masih kosong.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <HPPOptimizer
        recipe={processedRecipe}
        categoryDetails={categoryDetails}
        formatCurrency={formatCurrency}
      />

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <Users size={20} className="mr-3 text-intigizi-green" />
          Rincian Gizi & HPP per Kategori
        </h3>
        {loadingNutrition ? (
          <div className="flex justify-center items-center p-4">
            <Loader2 className="animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {categoryDetails.map((catData) => (
              <CategoryDetailCard
                key={catData.category_id}
                categoryData={catData}
                formatCurrency={formatCurrency}
              />
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? "Edit Bahan Resep" : "Tambah Bahan ke Resep"}
      >
        <RecipeIngredientForm
          onSave={handleSave}
          onCancel={() => setIsModalOpen(false)}
          menuId={parseInt(menuId)}
          recipeItem={editingItem}
        />
      </Modal>

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleDelete}
        title="Konfirmasi Hapus"
        message="Apakah Anda yakin ingin menghapus bahan ini dari resep?"
      />
    </div>
  );
}

export default RecipeManagementPage;
