import React, { useState, useEffect, useMemo } from "react";
import apiClient from "@/services/api";
import { Plus, Trash2, RefreshCw } from "lucide-react";
import SearchableSelect from "./SearchableSelect.jsx";

// Form multi-langkah untuk membuat PO Manual (Inverted Workflow: Pilih Bahan Dahulu)

function ManualPOForm({ onSave, onCancel, loading }) {
  const [supplierId, setSupplierId] = useState("");
  const [items, setItems] = useState([]);

  const [allSuppliers, setAllSuppliers] = useState([]);
  const [allIngredients, setAllIngredients] = useState([]);
  const [priceComparison, setPriceComparison] = useState({});
  const [supplierCatalog, setSupplierCatalog] = useState([]);

  const [error, setError] = useState("");
  const [applyPPN, setApplyPPN] = useState(false);
  const [applyPPh, setApplyPPh] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [suppliersRes, ingredientsRes, comparisonRes] = await Promise.all([
          apiClient.get("/procurement_get_suppliers.php"),
          apiClient.get("/ingredients_get.php"),
          apiClient.get("/procurement_compare_prices.php"),
        ]);
        setAllSuppliers(suppliersRes.data);
        setAllIngredients(ingredientsRes.data);
        setPriceComparison(comparisonRes.data || {});

        // Start with one empty item row
        if (ingredientsRes.data.length > 0) {
          setItems([
            {
              ingredient_id: "",
              quantity: "",
              price_per_unit: "",
            },
          ]);
        }
      } catch (err) {
        setError("Gagal memuat data supplier atau bahan baku.");
      }
    };
    fetchData();
  }, []);

  // Fetch catalog of the locked supplier to ensure we have the full catalog and tier prices
  useEffect(() => {
    if (!supplierId) {
      setSupplierCatalog([]);
      return;
    }
    const fetchCatalog = async () => {
      try {
        const res = await apiClient.get(`/supplier_ingredients_manage.php?action=get&supplier_id=${supplierId}`);
        setSupplierCatalog(res.data.filter(item => item.is_supplied === 1));
      } catch (err) {
        console.error("Gagal memuat katalog supplier", err);
      }
    };
    fetchCatalog();
  }, [supplierId]);

  const handleIngredientChange = (index, value) => {
    const newItems = [...items];
    newItems[index]["ingredient_id"] = value;
    newItems[index]["price_per_unit"] = ""; // Reset price until supplier is selected/known

    // If supplier is already locked, automatically resolve the price
    if (supplierId) {
      const suppliersForItem = priceComparison[value] || [];
      const match = suppliersForItem.find(s => s.supplier_id.toString() === supplierId.toString());
      if (match) {
        newItems[index]["price_per_unit"] = match.price;
      } else {
        // Fallback to latest price if supplier doesn't sell this specific item
        const selectedIngredient = allIngredients.find(ing => ing.id.toString() === value.toString());
        newItems[index]["price_per_unit"] = selectedIngredient ? parseFloat(selectedIngredient.latest_price) || 0 : 0;
      }
    }
    setItems(newItems);
  };

  const handleSupplierSelect = (selectedSupId) => {
    setSupplierId(selectedSupId);
    
    // Update prices for all currently added items based on the selected supplier
    const newItems = items.map(item => {
      if (!item.ingredient_id) return item;
      const suppliersForItem = priceComparison[item.ingredient_id] || [];
      const match = suppliersForItem.find(s => s.supplier_id.toString() === selectedSupId.toString());
      return {
        ...item,
        price_per_unit: match ? match.price : (item.price_per_unit || 0)
      };
    });
    setItems(newItems);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        ingredient_id: "",
        quantity: "",
        price_per_unit: "",
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    // If no items left, unlock supplier
    if (newItems.length === 0) {
      setSupplierId("");
    }
  };

  const handleResetSupplier = () => {
    setSupplierId("");
    // Reset all prices
    const resetItems = items.map(item => ({
      ...item,
      price_per_unit: ""
    }));
    setItems(resetItems);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!supplierId) {
      setError("Anda wajib menentukan supplier pemasok untuk membuat PO.");
      return;
    }

    // Validate that all items have an ingredient selected and a valid quantity/price
    for (let i = 0; i < items.length; i++) {
      if (!items[i].ingredient_id) {
        setError(`Item ke-${i + 1} belum memilih bahan baku.`);
        return;
      }
      if (!items[i].quantity || parseFloat(items[i].quantity) <= 0) {
        setError(`Jumlah untuk item ke-${i + 1} harus lebih dari 0.`);
        return;
      }
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

  // Filter ingredients option list
  const ingredientOptions = useMemo(() => {
    // If supplier is already locked, only list ingredients provided by that supplier
    if (supplierId && supplierCatalog.length > 0) {
      return allIngredients
        .filter(ing => supplierCatalog.some(c => c.ingredient_id === ing.id))
        .map(ing => {
          const catalogItem = supplierCatalog.find(c => c.ingredient_id === ing.id);
          return {
            value: ing.id,
            label: `${ing.name} (Penyedia: ${formatCurrency(catalogItem.base_price)})`,
          };
        });
    }
    // Otherwise list all ingredients globally
    return allIngredients.map(ing => ({
      value: ing.id,
      label: ing.name,
    }));
  }, [allIngredients, supplierCatalog, supplierId]);

  return (
    <form onSubmit={handleSubmit}>
      {/* Header Info Status Supplier */}
      <div className="mb-6 p-4 rounded-xl border flex justify-between items-center bg-gray-50 border-gray-200">
        <div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Status Supplier PO</span>
          {supplierId ? (
            <p className="text-sm font-bold text-green-700">
              Terkunci ke: <span className="underline">{allSuppliers.find(s => s.id.toString() === supplierId.toString())?.name || 'Supplier'}</span>
            </p>
          ) : (
            <p className="text-xs text-amber-600 font-semibold italic">Silakan pilih bahan dan tentukan supplier pada item pertama untuk memulai.</p>
          )}
        </div>
        {supplierId && (
          <button
            type="button"
            onClick={handleResetSupplier}
            className="flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-800 transition-colors bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl cursor-pointer"
          >
            <RefreshCw size={12} /> Reset Supplier
          </button>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Daftar Bahan Baku PO
        </label>
        
        <div className="space-y-3 mt-1">
          {items.map((item, index) => {
            const currentIngredient = allIngredients.find(
              (ing) => ing.id.toString() === item.ingredient_id.toString()
            );
            const unitSymbol = currentIngredient ? currentIngredient.unit_symbol : "";
            
            // Suppliers who sell this specific ingredient
            const availableSuppliers = item.ingredient_id ? (priceComparison[item.ingredient_id] || []) : [];

            return (
              <div key={index} className="bg-white border border-gray-150 p-4 rounded-2xl space-y-3 shadow-sm relative">
                {/* Delete button inside card */}
                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  className="absolute top-3 right-3 text-gray-400 hover:text-red-600 cursor-pointer"
                >
                  <Trash2 size={16} />
                </button>

                <div className="grid grid-cols-12 gap-3 items-end">
                  {/* Select Ingredient */}
                  <div className="col-span-12 sm:col-span-5">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Pilih Bahan Baku</label>
                    <SearchableSelect
                      options={ingredientOptions}
                      value={item.ingredient_id}
                      onChange={(value) => handleIngredientChange(index, value)}
                    />
                  </div>

                  {/* Select Supplier (only shown when ingredient is selected AND global supplier is not yet locked) */}
                  {item.ingredient_id && !supplierId ? (
                    <div className="col-span-12 sm:col-span-7">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 text-purple-600">Pilih Supplier Pemasok Bahan Ini</label>
                      <select
                        onChange={(e) => handleSupplierSelect(e.target.value)}
                        defaultValue=""
                        className="input-style bg-white border-purple-200 focus:ring-purple-500"
                        required
                      >
                        <option value="" disabled>-- Pilih Supplier Pemasok --</option>
                        {availableSuppliers.map((s) => (
                          <option key={s.supplier_id} value={s.supplier_id}>
                            {s.supplier_name} - {formatCurrency(s.price)}
                          </option>
                        ))}
                        {availableSuppliers.length === 0 && (
                          <option value="" disabled>Belum ada supplier yang menyediakan bahan ini</option>
                        )}
                      </select>
                    </div>
                  ) : (
                    // Quantity and Price inputs when supplier is locked or no ingredient is selected yet
                    <>
                      <div className="col-span-6 sm:col-span-3 relative">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Jumlah</label>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                          className="input-style pr-10"
                          required
                          disabled={!item.ingredient_id}
                        />
                        <span className="absolute right-3 bottom-2 text-xs text-gray-400 font-semibold">
                          {unitSymbol}
                        </span>
                      </div>

                      <div className="col-span-6 sm:col-span-4">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Harga Satuan</label>
                        <input
                          type="number"
                          placeholder="Harga Satuan"
                          value={item.price_per_unit}
                          onChange={(e) => handleItemChange(index, "price_per_unit", e.target.value)}
                          className="input-style bg-gray-50 text-gray-700 font-semibold"
                          required
                          disabled={true} // Locked to supplier catalog price
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleAddItem}
          disabled={!supplierId}
          className="text-xs text-green-700 font-bold hover:underline mt-3 flex items-center gap-1 disabled:text-gray-400 disabled:no-underline"
        >
          <Plus size={14} /> Tambah Item Baru
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
