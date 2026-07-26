import React, { useState, useEffect, useMemo } from "react";
import apiClient from "@/services/api";
import { Plus, Trash2, ShoppingCart, Info, AlertCircle } from "lucide-react";
import SearchableSelect from "./SearchableSelect.jsx";

// Form multi-langkah pintar untuk membuat PO Manual (Shopping Cart-Style dengan Auto-Split)

function ManualPOForm({ onSave, onCancel, loading }) {
  const [items, setItems] = useState([]);
  const [allIngredients, setAllIngredients] = useState([]);
  const [priceComparison, setPriceComparison] = useState({});

  const [error, setError] = useState("");
  const [applyPPN, setApplyPPN] = useState(false);
  const [applyPPh, setApplyPPh] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ingredientsRes, comparisonRes] = await Promise.all([
          apiClient.get("/ingredients_get.php"),
          apiClient.get("/procurement_compare_prices.php"),
        ]);
        setAllIngredients(ingredientsRes.data);
        setPriceComparison(comparisonRes.data || {});

        // Start with one empty item row
        setItems([
          {
            ingredient_id: "",
            supplier_id: "",
            suggested_supplier_name: "",
            quantity: "",
            price_per_unit: "",
          },
        ]);
      } catch (err) {
        setError("Gagal memuat data bahan baku atau perbandingan harga.");
      }
    };
    fetchData();
  }, []);

  const handleIngredientChange = (index, value) => {
    const newItems = [...items];
    newItems[index]["ingredient_id"] = value;
    // Reset supplier and price for this row since ingredient changed
    newItems[index]["supplier_id"] = "";
    newItems[index]["suggested_supplier_name"] = "";
    newItems[index]["price_per_unit"] = "";
    setItems(newItems);
  };

  const handleRowSupplierSelect = (index, selectedSupId) => {
    const newItems = [...items];
    const ingId = newItems[index]["ingredient_id"];
    const suppliersForIng = priceComparison[ingId] || [];
    const match = suppliersForIng.find(s => s.supplier_id.toString() === selectedSupId.toString());

    newItems[index]["supplier_id"] = selectedSupId;
    newItems[index]["suggested_supplier_name"] = match ? match.supplier_name : "Supplier";
    newItems[index]["price_per_unit"] = match ? match.price : 0;
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
        supplier_id: "",
        suggested_supplier_name: "",
        quantity: "",
        price_per_unit: "",
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Group items by supplier for the preview cards
  const splitPOPreview = useMemo(() => {
    const groups = {};
    items.forEach(item => {
      if (!item.supplier_id || !item.ingredient_id) return;
      const supId = item.supplier_id;
      if (!groups[supId]) {
        groups[supId] = {
          supplier_name: item.suggested_supplier_name,
          items: []
        };
      }
      groups[supId].items.push(item);
    });
    return groups;
  }, [items]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (items.length === 0) {
      setError("Daftar item belanja masih kosong.");
      return;
    }

    for (let i = 0; i < items.length; i++) {
      if (!items[i].ingredient_id) {
        setError(`Baris ke-${i + 1} belum memilih bahan baku.`);
        return;
      }
      if (!items[i].supplier_id) {
        setError(`Baris ke-${i + 1} belum menentukan supplier.`);
        return;
      }
      if (!items[i].quantity || parseFloat(items[i].quantity) <= 0) {
        setError(`Baris ke-${i + 1} harus memiliki jumlah kuantitas lebih dari 0.`);
        return;
      }
    }

    try {
      await onSave({
        items,
        apply_ppn: applyPPN,
        apply_pph: applyPPh,
      });
    } catch (err) {
      setError(err.response?.data?.message || "Gagal membuat Purchase Orders.");
    }
  };

  const ingredientOptions = useMemo(() => {
    return allIngredients.map(ing => ({
      value: ing.id,
      label: ing.name,
    }));
  }, [allIngredients]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title & Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-800 flex items-start gap-2.5">
        <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold mb-0.5">Keranjang Belanja PO Manual (Pintar)</p>
          <p className="text-blue-700">Masukkan semua bahan yang ingin Anda beli. Jika bahan dipesan dari supplier yang berbeda, sistem akan secara otomatis memecah (split) belanjaan ini menjadi beberapa Purchase Order terpisah saat dikirim.</p>
        </div>
      </div>

      {/* Cart Items Table/Grid */}
      <div className="space-y-3">
        <label className="block text-sm font-bold text-gray-700">Daftar Bahan & Supplier Pemasok</label>
        
        <div className="space-y-2">
          {items.map((item, index) => {
            const currentIngredient = allIngredients.find(
              (ing) => ing.id.toString() === item.ingredient_id.toString()
            );
            const unitSymbol = currentIngredient ? currentIngredient.unit_symbol : "";
            const availableSuppliers = item.ingredient_id ? (priceComparison[item.ingredient_id] || []) : [];

            return (
              <div key={index} className="bg-white border border-gray-150 p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-4 items-end">
                {/* 1. Select Ingredient */}
                <div className="w-full md:w-3/12">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Pilih Bahan Baku</label>
                  <SearchableSelect
                    options={ingredientOptions}
                    value={item.ingredient_id}
                    onChange={(val) => handleIngredientChange(index, val)}
                  />
                </div>

                {/* 2. Select Supplier */}
                <div className="w-full md:w-4/12">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Pilih Supplier Pemasok</label>
                  <select
                    value={item.supplier_id}
                    onChange={(e) => handleRowSupplierSelect(index, e.target.value)}
                    className="input-style bg-white h-[38px] mt-0 text-xs py-1"
                    disabled={!item.ingredient_id}
                    required
                  >
                    <option value="" disabled>-- Pilih Supplier --</option>
                    {availableSuppliers.map((s) => (
                      <option key={s.supplier_id} value={s.supplier_id}>
                        {s.supplier_name} - {formatCurrency(s.price)}
                      </option>
                    ))}
                    {item.ingredient_id && availableSuppliers.length === 0 && (
                      <option value="" disabled>Belum terhubung ke supplier apa pun</option>
                    )}
                  </select>
                </div>

                {/* 3. Quantity */}
                <div className="w-[45%] md:w-2/12 relative">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Jumlah</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                    className="input-style h-[38px] mt-0 text-xs pr-10"
                    disabled={!item.supplier_id}
                    required
                  />
                  {unitSymbol && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-450 font-bold mt-1">
                      {unitSymbol}
                    </span>
                  )}
                </div>

                {/* 4. Subtotal Preview */}
                <div className="w-[40%] md:w-2/12 text-right">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Subtotal</label>
                  <div className="h-[38px] flex items-center justify-end font-bold text-gray-800 text-xs">
                    {formatCurrency((parseFloat(item.quantity) || 0) * (parseFloat(item.price_per_unit) || 0))}
                  </div>
                </div>

                {/* 5. Delete Action (Clean inline column, only shown if multiple items exist) */}
                <div className="w-full md:w-1/12 flex justify-end md:justify-center">
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="h-[38px] w-full md:w-auto px-3 flex items-center justify-center rounded-xl text-gray-450 hover:text-red-600 hover:bg-red-50 cursor-pointer transition-all border border-transparent hover:border-red-100"
                      title="Hapus Item"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleAddItem}
          className="text-xs text-green-700 font-bold hover:underline mt-2 flex items-center gap-1 cursor-pointer"
        >
          <Plus size={14} /> Tambah Bahan Lain
        </button>
      </div>

      {/* Pratinjau Pemecahan PO (Split PO Preview) */}
      {Object.keys(splitPOPreview).length > 0 && (
        <div className="border border-dashed border-gray-250 p-4 rounded-xl space-y-3 bg-gray-50/50">
          <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700">
            <ShoppingCart size={14} />
            <span>Pratinjau Pembagian PO ({Object.keys(splitPOPreview).length} Supplier)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.keys(splitPOPreview).map(supId => {
              const group = splitPOPreview[supId];
              const groupTotal = group.items.reduce((sum, it) => sum + (parseFloat(it.quantity) || 0) * (parseFloat(it.price_per_unit) || 0), 0);
              return (
                <div key={supId} className="bg-white border rounded-xl p-3 shadow-xs space-y-1.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">KIRIM PO KE SUPPLIER:</span>
                  <p className="text-xs font-bold text-gray-800 truncate">{group.supplier_name}</p>
                  <div className="text-[10px] text-gray-500 space-y-0.5 border-t pt-1">
                    {group.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{allIngredients.find(ing => ing.id.toString() === it.ingredient_id.toString())?.name}</span>
                        <span className="font-semibold">{it.quantity} {allIngredients.find(ing => ing.id.toString() === it.ingredient_id.toString())?.unit_symbol}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-[11px] font-bold text-gray-800 border-t pt-1.5 mt-1">
                    <span>Estimasi Total:</span>
                    <span>{formatCurrency(groupTotal)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Opsi Pajak */}
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Perpajakan (Juknis BGN)</h4>
        <div className="flex gap-6">
          <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={applyPPN}
              onChange={(e) => setApplyPPN(e.target.checked)}
              className="rounded text-intigizi-green focus:ring-intigizi-green"
            />
            <span className="text-xs">Terapkan PPN (11% per PO)</span>
          </label>

          <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={applyPPh}
              onChange={(e) => setApplyPPh(e.target.checked)}
              className="rounded text-intigizi-green focus:ring-intigizi-green"
            />
            <span className="text-xs">Terapkan PPh 22 (1.5% per PO)</span>
          </label>
        </div>
      </div>

      {/* Resume Pembayaran */}
      <div className="mt-6 pt-4 border-t space-y-1.5 text-right font-medium">
        <div className="text-xs text-gray-500">
          DPP (Nilai Bersih Bahan): <span className="ml-2 font-semibold text-gray-700">{formatCurrency(totalAmount)}</span>
        </div>
        {applyPPN && (
          <div className="text-xs text-gray-500">
            PPN (11%): <span className="ml-2 font-semibold text-blue-600">+{formatCurrency(Math.round(totalAmount * 0.11))}</span>
          </div>
        )}
        {applyPPh && (
          <div className="text-xs text-gray-500">
            PPh 22 (1.5%): <span className="ml-2 font-semibold text-red-600">-{formatCurrency(Math.round(totalAmount * 0.015))}</span>
          </div>
        )}
        <div className="text-lg font-bold text-gray-800 pt-1 border-t border-gray-150 inline-block">
          Total Akumulasi Bayar:{" "}
          <span className="ml-2 text-xl text-intigizi-orange">
            {formatCurrency(totalAmount + (applyPPN ? Math.round(totalAmount * 0.11) : 0) - (applyPPh ? Math.round(totalAmount * 0.015) : 0))}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0" />
          <span>{error}</span>
        </div>
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
