import React, { useState, useEffect } from "react";
import apiClient from "@/services/api";
import { Plus, Trash2 } from "lucide-react";
import SearchableSelect from "./SearchableSelect.jsx";

// Form multi-langkah untuk membuat PO Manual (Layout Diperbaiki)

function ManualPOForm({ onSave, onCancel, loading }) {
  const [supplierId, setSupplierId] = useState("");
  const [items, setItems] = useState([]);

  const [allSuppliers, setAllSuppliers] = useState([]);
  const [allIngredients, setAllIngredients] = useState([]);

  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // PERBAIKAN: Menggunakan endpoint yang benar untuk mengambil supplier DAN vendor
        const [suppliersRes, ingredientsRes] = await Promise.all([
          apiClient.get("/procurement_get_suppliers.php"),
          apiClient.get("/ingredients_get.php"),
        ]);
        setAllSuppliers(suppliersRes.data);
        setAllIngredients(ingredientsRes.data);

        if (suppliersRes.data.length > 0)
          setSupplierId(suppliersRes.data[0].id);

        if (ingredientsRes.data.length > 0) {
          const firstIngredient = ingredientsRes.data[0];
          setItems([
            {
              ingredient_id: firstIngredient.id,
              quantity: "",
              price_per_unit: parseFloat(firstIngredient.latest_price) || "",
            },
          ]);
        }
      } catch (err) {
        setError("Gagal memuat data supplier atau bahan baku.");
      }
    };
    fetchData();
  }, []);

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;

    if (field === "ingredient_id") {
      const selectedIngredient = allIngredients.find(
        (ing) => ing.id.toString() === value.toString(),
      );
      if (selectedIngredient) {
        newItems[index]["price_per_unit"] =
          parseFloat(selectedIngredient.latest_price) || "";
      }
    }

    setItems(newItems);
  };

  const handleAddItem = () => {
    if (allIngredients.length === 0) return;
    const firstIngredient = allIngredients[0];
    setItems([
      ...items,
      {
        ingredient_id: firstIngredient.id,
        quantity: "",
        price_per_unit: parseFloat(firstIngredient.latest_price) || "",
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await onSave({ supplier_id: supplierId, items });
    } catch (err) {
      setError(err.response?.data?.message || "Gagal menyimpan PO.");
    }
  };

  const totalAmount = items.reduce((sum, item) => {
    return (
      sum +
      (parseFloat(item.quantity) || 0) * (parseFloat(item.price_per_unit) || 0)
    );
  }, 0);

  const formatCurrency = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const ingredientOptions = allIngredients.map((ing) => ({
    value: ing.id,
    label: ing.name,
  }));

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label
          htmlFor="supplier_id"
          className="block text-sm font-medium text-gray-700"
        >
          Pilih Supplier
        </label>
        {/* PERBAIKAN: Menampilkan 'name' dan 'type' dari data gabungan */}
        <select
          id="supplier_id"
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
          className="input-style bg-white"
          required
        >
          {allSuppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.type})
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          Item Pembelian
        </label>
        <div className="space-y-2 mt-1">
          {items.map((item, index) => {
            const currentIngredient = allIngredients.find(
              (ing) => ing.id.toString() === item.ingredient_id.toString(),
            );
            const unitSymbol = currentIngredient
              ? currentIngredient.unit_symbol
              : "";

            return (
              <div key={index} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5">
                  <SearchableSelect
                    options={ingredientOptions}
                    value={item.ingredient_id}
                    onChange={(value) =>
                      handleItemChange(index, "ingredient_id", value)
                    }
                  />
                </div>
                <div className="relative col-span-3">
                  <input
                    type="number"
                    placeholder="Jumlah"
                    value={item.quantity}
                    onChange={(e) =>
                      handleItemChange(index, "quantity", e.target.value)
                    }
                    className="input-style"
                    required
                  />
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 text-sm">
                    {unitSymbol}
                  </span>
                </div>
                <input
                  type="number"
                  placeholder="Harga Satuan"
                  value={item.price_per_unit}
                  onChange={(e) =>
                    handleItemChange(index, "price_per_unit", e.target.value)
                  }
                  className="input-style col-span-3"
                  required
                />
                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  className="text-red-500 hover:text-red-700 col-span-1 justify-self-center"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
        {/* PERUBAHAN: Warna teks diubah */}
        <button
          type="button"
          onClick={handleAddItem}
          className="text-sm text-intigizi-green hover:underline mt-2 flex items-center"
        >
          <Plus size={16} className="mr-1" /> Tambah Item
        </button>
      </div>

      <div className="mt-6 pt-4 border-t flex justify-end items-center font-semibold">
        {/* PERUBAHAN: Warna teks diubah */}
        Total:{" "}
        <span className="ml-2 text-xl text-intigizi-orange">
          {formatCurrency(totalAmount)}
        </span>
      </div>

      {error && (
        <p className="text-red-500 text-sm mt-4 text-center">{error}</p>
      )}

      <div className="flex justify-end space-x-3 mt-6">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Batal
        </button>
        <button
          type="submit"
          disabled={loading || items.length === 0}
          className="btn-primary"
        >
          {loading ? "Menyimpan..." : "Buat PO"}
        </button>
      </div>
    </form>
  );
}

export default ManualPOForm;
