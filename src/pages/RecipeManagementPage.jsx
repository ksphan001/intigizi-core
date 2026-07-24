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
} from "lucide-react"; // Impor ikon Leaf
import { useNotification } from "../context/NotificationContext.jsx";

// PENJELASAN: Diperbarui untuk menampilkan data 'fiber' (serat).
const CategoryDetailCard = ({ categoryData, formatCurrency }) => {
  const { category_name, nutrition, hpp } = categoryData;

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
    <div className="bg-white p-4 rounded-xl shadow-md border flex flex-col transform hover:-translate-y-1 transition-transform duration-300">
      <div className="flex justify-between items-start mb-3">
        <h4 className="font-bold text-lg text-intigizi-green-dark">
          {category_name}
        </h4>
        <div className="text-right flex-shrink-0 ml-2">
          <p className="text-xs text-gray-500">Estimasi HPP</p>
          <p className="font-bold text-xl text-intigizi-orange">
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
