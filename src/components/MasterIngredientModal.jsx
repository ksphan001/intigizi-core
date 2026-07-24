import React, { useState, useEffect, useMemo } from "react";
import apiClient from "@/services/api";
import Modal from "./Modal";
import {
  Loader2,
  Search,
  Library,
  Check,
  CheckSquare,
  Square,
} from "lucide-react";
import { useNotification } from "@/context/NotificationContext";

// Komponen baru: Modal Pustaka Bahan Makanan dengan fitur "Pilih Semua"
function MasterIngredientModal({ isOpen, onClose, onImport }) {
  const [masterIngredients, setMasterIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { showNotification } = useNotification();

  useEffect(() => {
    if (isOpen) {
      const fetchMasterIngredients = async () => {
        try {
          setLoading(true);
          const response = await apiClient.get("/master_ingredients_get.php");
          setMasterIngredients(response.data);
        } catch (error) {
          showNotification("Gagal memuat pustaka bahan.", "error");
        } finally {
          setLoading(false);
        }
      };
      fetchMasterIngredients();
    }
  }, [isOpen, showNotification]);

  const handleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const filteredIngredients = useMemo(() => {
    if (!searchQuery) return masterIngredients;
    return masterIngredients.filter((ing) =>
      ing.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [masterIngredients, searchQuery]);

  const groupedIngredients = useMemo(() => {
    return filteredIngredients.reduce((acc, item) => {
      const group = item.group || "Lainnya";
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(item);
      return acc;
    }, {});
  }, [filteredIngredients]);

  // --- FUNGSI BARU UNTUK MEMILIH SEMUA PER KATEGORI ---
  const toggleSelectGroup = (groupItems) => {
    const groupIds = groupItems.map((item) => item.id);
    const allSelected = groupIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      // Jika semua sudah terpilih, batalkan pilihan
      setSelectedIds((prev) => prev.filter((id) => !groupIds.includes(id)));
    } else {
      // Jika ada yang belum terpilih, pilih semua
      setSelectedIds((prev) => [...new Set([...prev, ...groupIds])]);
    }
  };

  // --- FUNGSI BARU UNTUK MEMILIH SEMUA YANG TAMPIL ---
  const handleSelectAllVisible = () => {
    const visibleIds = filteredIngredients.map((item) => item.id);
    setSelectedIds(visibleIds);
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  const handleImportClick = async () => {
    if (selectedIds.length === 0) {
      showNotification(
        "Pilih setidaknya satu bahan untuk ditambahkan.",
        "warning",
      );
      return;
    }
    setActionLoading(true);
    await onImport(selectedIds);
    setActionLoading(false);
    setSelectedIds([]);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tambah Bahan dari Pustaka"
      size="2xl"
    >
      <div className="flex flex-col h-[70vh]">
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Cari bahan makanan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-style w-full pl-10"
          />
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
        </div>

        <div className="flex-grow overflow-y-auto pr-2 -mr-2">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            Object.entries(groupedIngredients).map(([group, items]) => (
              <div key={group} className="mb-4">
                <div className="flex justify-between items-center mb-2 sticky top-0 bg-white py-1">
                  <h3 className="font-semibold text-gray-700">{group}</h3>
                  {/* Tombol Pilih Semua per Kategori */}
                  <button
                    onClick={() => toggleSelectGroup(items)}
                    className="text-xs font-medium text-intigizi-green hover:underline"
                  >
                    Pilih Semua
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(item.id)}
                      className={`p-2 border rounded-lg cursor-pointer flex items-center justify-between transition-all ${selectedIds.includes(item.id) ? "bg-green-100 border-intigizi-green" : "hover:bg-gray-50"}`}
                    >
                      <span className="text-sm">{item.name}</span>
                      {selectedIds.includes(item.id) && (
                        <Check size={16} className="text-intigizi-green" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex-shrink-0 pt-4 mt-4 border-t flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-600">
              {selectedIds.length} bahan dipilih
            </span>
            {/* Tombol Pilih & Kosongkan Semua */}
            <button
              onClick={handleSelectAllVisible}
              className="text-xs font-semibold text-intigizi-green hover:underline"
            >
              Pilih Semua
            </button>
            <button
              onClick={handleDeselectAll}
              className="text-xs font-semibold text-red-600 hover:underline"
            >
              Kosongkan Pilihan
            </button>
          </div>
          <div className="flex space-x-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Batal
            </button>
            <button
              onClick={handleImportClick}
              disabled={actionLoading || selectedIds.length === 0}
              className="btn-primary"
            >
              {actionLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                `Tambahkan ${selectedIds.length > 0 ? selectedIds.length : ""} Bahan`
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default MasterIngredientModal;
