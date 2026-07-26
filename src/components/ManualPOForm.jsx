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
  const [supplierCatalog, setSupplierCatalog] = useState([]);

  const [error, setError] = useState("");

  const [applyPPN, setApplyPPN] = useState(false);
  const [applyPPh, setApplyPPh] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [suppliersRes, ingredientsRes] = await Promise.all([
          apiClient.get("/procurement_get_suppliers.php"),
          apiClient.get("/ingredients_get.php"),
        ]);
        setAllSuppliers(suppliersRes.data);
        setAllIngredients(ingredientsRes.data);

        setSupplierId(""); // Default ke Belanja Manual (Beli Mandiri)

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

  useEffect(() => {
    if (!supplierId) return;
    const fetchCatalog = async () => {
      try {
        const res = await apiClient.get(`/supplier_ingredients_manage.php?action=get&supplier_id=${supplierId}`);
        // Filter bahan yang memang disediakan supplier
        setSupplierCatalog(res.data.filter(item => item.is_supplied === 1));
      } catch (err) {
        console.error("Gagal memuat katalog supplier", err);
      }
    };
    fetchCatalog();
  }, [supplierId]);

  useEffect(() => {
    if (supplierCatalog.length > 0 && items.length > 0) {
      // Cek apakah item yang saat ini dipilih ada di katalog baru
      const newItems = items.map(item => {
        const isAvailable = supplierCatalog.some(c => c.ingredient_id.toString() === item.ingredient_id.toString());
        if (!isAvailable) {
          // Reset ke item pertama di katalog supplier terpilih
          const firstCatalog = supplierCatalog[0];
          return {
            ingredient_id: firstCatalog.ingredient_id,
            quantity: item.quantity,
            price_per_unit: parseFloat(firstCatalog.base_price) || 0
          };
        }
        return item;
      });
      setItems(newItems);
    }
  }, [supplierCatalog]);

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;

    if (field === "ingredient_id") {
      // Cari di katalog supplier dulu
      const catalogItem = supplierCatalog.find(
        (c) => c.ingredient_id.toString() === value.toString()
      );
      if (catalogItem) {
        newItems[index]["price_per_unit"] = parseFloat(catalogItem.base_price) || 0;
      } else {
        // Fallback ke latest_price umum
        const selectedIngredient = allIngredients.find(
          (ing) => ing.id.toString() === value.toString(),
        );
        if (selectedIngredient) {
          newItems[index]["price_per_unit"] =
            parseFloat(selectedIngredient.latest_price) || "";
        }
      }
    }

    setItems(newItems);
  };

  const handleAddItem = () => {
    if (allIngredients.length === 0) return;
    const firstIngredient = allIngredients[0];
    // Coba cari harga dari katalog supplier untuk item pertama
    const catalogItem = supplierCatalog.find(
      (c) => c.ingredient_id.toString() === firstIngredient.id.toString()
    );
    setItems([
      ...items,
      {
        ingredient_id: firstIngredient.id,
        quantity: "",
        price_per_unit: catalogItem ? parseFloat(catalogItem.base_price) : (parseFloat(firstIngredient.latest_price) || ""),
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
    if (!supplierId || supplierId === "") {
      setError("Anda wajib memilih supplier untuk membuat PO yang akuntabel.");
      return;
    }

    const tax_ppn = applyPPN ? Math.round(totalAmount * 0.11) : 0;
    const tax_pph = applyPPh ? Math.round(totalAmount * 0.015) : 0;
    const net_amount = totalAmount + tax_ppn - tax_pph;

    try {
      await onSave({ 
        supplier_id: supplierId, 
        items,
        tax_ppn,
        tax_pph,
        net_amount
      });
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

  const ingredientOptions = React.useMemo(() => {
    if (!supplierId || supplierCatalog.length === 0) {
      return allIngredients.map((ing) => ({
        value: ing.id,
        label: ing.name,
      }));
    }
    return allIngredients
      .filter((ing) => supplierCatalog.some((c) => c.ingredient_id === ing.id))
      .map((ing) => {
        const catalogItem = supplierCatalog.find((c) => c.ingredient_id === ing.id);
        return {
          value: ing.id,
          label: `${ing.name} - Rp ${catalogItem.base_price.toLocaleString('id-ID')}`,
        };
      });
  }, [allIngredients, supplierCatalog, supplierId]);

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
          <option value="" disabled>-- Pilih Supplier Pemasok --</option>
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

      {/* Opsi Pajak */}
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mt-4 space-y-3">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Perpajakan (Juknis BGN)</h4>
        <div className="flex gap-6">
          <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
            <input 
              type="checkbox" 
              checked={applyPPN} 
              onChange={(e) => setApplyPPN(e.target.checked)} 
              className="rounded text-intigizi-green focus:ring-intigizi-green"
            />
            <span>Terapkan PPN (11%)</span>
          </label>

          <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
            <input 
              type="checkbox" 
              checked={applyPPh} 
              onChange={(e) => setApplyPPh(e.target.checked)} 
              className="rounded text-intigizi-green focus:ring-intigizi-green"
            />
            <span>Terapkan PPh 22 (1.5%)</span>
          </label>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t space-y-1.5 text-right font-medium">
        <div className="text-sm text-gray-500">
          DPP (Nilai Bersih Bahan): <span className="ml-2 font-semibold text-gray-700">{formatCurrency(totalAmount)}</span>
        </div>
        {applyPPN && (
          <div className="text-sm text-gray-500">
            PPN (11%): <span className="ml-2 font-semibold text-blue-600">+{formatCurrency(Math.round(totalAmount * 0.11))}</span>
          </div>
        )}
        {applyPPh && (
          <div className="text-sm text-gray-500">
            PPh 22 (1.5%): <span className="ml-2 font-semibold text-red-600">-{formatCurrency(Math.round(totalAmount * 0.015))}</span>
          </div>
        )}
        <div className="text-lg font-bold text-gray-800 pt-1 border-t border-gray-150 inline-block">
          Total Bayar:{" "}
          <span className="ml-2 text-xl text-intigizi-orange">
            {formatCurrency(totalAmount + (applyPPN ? Math.round(totalAmount * 0.11) : 0) - (applyPPh ? Math.round(totalAmount * 0.015) : 0))}
          </span>
        </div>
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
