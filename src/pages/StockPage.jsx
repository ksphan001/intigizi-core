import React, { useState, useEffect, useCallback, useMemo } from "react";
import apiClient from "@/services/api";
import PageHeader from "@/components/PageHeader.jsx";
import Pagination from "@/components/Pagination.jsx";
import Modal from "@/components/Modal.jsx";
import { Search, Info, AlertTriangle, Loader2, ShoppingCart } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";

const ITEMS_PER_PAGE = 10;

// PENJELASAN:
// Halaman ini sekarang bersifat "read-only" atau hanya untuk melihat.
// Tombol "Tambah Stok dari PO" dan modal terkait telah dihapus
// untuk memastikan semua penambahan stok tercatat secara finansial
// melalui alur penyelesaian Purchase Order.

function StockPage() {
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Tab state: 'stock' or 'history'
  const [activeTab, setActiveTab] = useState("stock");
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // --- STATE PREDIKSI STOK KRITIS ---
  const [predictiveData, setPredictiveData] = useState(null);
  const [predictiveLoading, setPredictiveLoading] = useState(false);

  // States for damaged stock report modal
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [reportData, setReportData] = useState({
    quantity: "",
    reason: "Busuk / Kadaluarsa",
    notes: "",
  });

  const fetchHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const response = await apiClient.get("/stock_damaged_history.php");
      setHistoryData(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      showNotification("Gagal memuat riwayat kerusakan stok.", "error");
    } finally {
      setHistoryLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory();
    }
  }, [activeTab, fetchHistory]);

  const fetchPredictive = useCallback(async () => {
    try {
      setPredictiveLoading(true);
      const response = await apiClient.get("/stock_predictive_alert.php");
      setPredictiveData(response.data);
    } catch (err) {
      console.error("Gagal memuat data prediksi stok.", err);
    } finally {
      setPredictiveLoading(false);
    }
  }, []);

  const triggerAutoReorder = () => {
    if (!predictiveData || !predictiveData.deficits || predictiveData.deficits.length === 0) return;
    setIsConfirmModalOpen(true);
  };

  const handleAutoReorder = async () => {
    setIsConfirmModalOpen(false);
    setActionLoading(true);
    try {
      const response = await apiClient.post("/procurement_create_po_for_deficits.php", {
        proposal_id: predictiveData.proposal?.id,
        items: predictiveData.deficits
      });
      showNotification(response.data.message || "Pemesanan PO otomatis berhasil dibuat.", "success");
      fetchStock();
      fetchPredictive();
    } catch (err) {
      showNotification(err.response?.data?.message || "Gagal memproses pemesanan otomatis.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const fetchStock = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/stock_get.php");
      setStock(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      showNotification("Gagal memuat data stok.", "error");
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchStock();
    fetchPredictive();
  }, [fetchStock, fetchPredictive]);

  const handleOpenReportModal = () => {
    setSelectedItem(null);
    setReportData({
      quantity: "",
      reason: "Busuk / Kadaluarsa",
      notes: "",
    });
    setIsReportModalOpen(true);
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    
    const qtyInput = parseFloat(reportData.quantity);
    const maxQty = parseFloat(selectedItem.current_quantity) / parseFloat(selectedItem.conversion_factor || 1);
    
    if (isNaN(qtyInput) || qtyInput <= 0) {
      showNotification("Jumlah penyusutan harus lebih besar dari 0.", "error");
      return;
    }
    
    if (qtyInput > maxQty) {
      showNotification(`Jumlah penyusutan tidak boleh melebihi stok saat ini (${maxQty.toLocaleString("id-ID")} ${selectedItem.unit_symbol}).`, "error");
      return;
    }

    setActionLoading(true);
    try {
      const response = await apiClient.post("/stock_report_damaged.php", {
        ingredient_id: selectedItem.ingredient_id,
        quantity: qtyInput,
        reason: reportData.reason,
        notes: reportData.notes,
      });
      showNotification(response.data.message || "Laporan berhasil disimpan.", "success");
      setIsReportModalOpen(false);
      fetchStock();
    } catch (err) {
      showNotification(err.response?.data?.message || "Gagal melaporkan bahan rusak.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredStock = useMemo(() => {
    if (!searchQuery) {
      return stock;
    }
    return stock.filter((item) =>
      item.ingredient_name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [stock, searchQuery]);

  const filteredHistory = useMemo(() => {
    if (!searchQuery) {
      return historyData;
    }
    return historyData.filter((item) =>
      item.ingredient_name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [historyData, searchQuery]);

  const totalPages = Math.ceil(
    (activeTab === "stock" ? filteredStock.length : filteredHistory.length) / ITEMS_PER_PAGE
  );

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return activeTab === "stock"
      ? filteredStock.slice(startIndex, startIndex + ITEMS_PER_PAGE)
      : filteredHistory.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [activeTab, currentPage, filteredStock, filteredHistory]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div>
      {/* Tombol "Tambah Stok" telah dihapus dari PageHeader */}
      <PageHeader title="Stok Gudang & Penyusutan" />

      <div className="mb-6 bg-blue-50 border-l-4 border-intigizi-green text-blue-800 p-4 rounded-r-lg">
        <div className="flex">
          <div className="py-1">
            <Info className="h-5 w-5 text-intigizi-green mr-3" />
          </div>
          <div>
            <p className="font-bold">Informasi</p>
            <p className="text-sm">
              Halaman ini menampilkan jumlah stok saat ini serta riwayat penyusutan/kerusakan bahan baku. 
              Penambahan stok dari pembelian dilakukan secara otomatis melalui alur Purchase Order.
            </p>
          </div>
        </div>
      </div>

      {/* TABS & ACTION BUTTON */}
      <div className="flex justify-between items-center border-b border-gray-200 mb-6 bg-white p-2 rounded-xl shadow-sm flex-wrap gap-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("stock")}
            className={`py-2 px-5 text-sm font-semibold rounded-lg transition-all ${
              activeTab === "stock"
                ? "bg-intigizi-green text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            Stok Saat Ini
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`py-2 px-5 text-sm font-semibold rounded-lg transition-all ${
              activeTab === "history"
                ? "bg-intigizi-green text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            Riwayat Bahan Rusak / Susut
          </button>
        </div>

        {[2, 7].includes(Number(user?.role_id)) && (
          <button
            type="button"
            onClick={handleOpenReportModal}
            className="py-2 px-4 text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors flex items-center gap-1.5"
          >
            <AlertTriangle size={14} />
            <span>Laporkan Bahan Rusak</span>
          </button>
        )}
      </div>

      {/* Peringatan Stok Kritis Terdeteksi */}
      {predictiveData?.deficits && predictiveData.deficits.length > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 p-5 rounded-2xl shadow-sm animate-fade-in flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-start">
            <div className="bg-amber-100 p-2 rounded-xl mr-4 text-amber-700 mt-1 md:mt-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h4 className="font-bold text-amber-800 text-sm">Peringatan Defisit Stok Bahan Baku!</h4>
              <p className="text-xs text-amber-700 mt-1">
                Terdeteksi <span className="font-bold text-amber-900">{predictiveData.deficits.length} bahan gizi</span> yang kurang untuk menopang rencana menu terjadwal pada proposal <span className="font-bold text-amber-900">{predictiveData.proposal?.proposal_code}</span>.
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {predictiveData.deficits.slice(0, 4).map(d => (
                  <span key={d.ingredient_id} className="text-[10px] font-bold bg-amber-100 text-amber-850 px-2 py-0.5 rounded-lg border border-amber-200">
                    {d.ingredient_name}: -{d.deficit_qty} {d.unit_symbol}
                  </span>
                ))}
                {predictiveData.deficits.length > 4 && (
                  <span className="text-[10px] font-bold text-amber-700 align-middle pt-0.5">
                    +{predictiveData.deficits.length - 4} lainnya
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={triggerAutoReorder}
            disabled={actionLoading}
            className="w-full md:w-auto py-2.5 px-4 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {actionLoading ? (
              <Loader2 className="animate-spin h-3.5 w-3.5" />
            ) : (
              <ShoppingCart size={14} />
            )}
            <span>Belanja Bahan yang Kurang</span>
          </button>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-4 relative">
          <input
            type="text"
            placeholder={activeTab === "stock" ? "Cari nama bahan baku..." : "Cari riwayat bahan..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-style w-full pl-10"
          />
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
        </div>

        {loading || (activeTab === "history" && historyLoading) ? (
          <p>Memuat data...</p>
        ) : activeTab === "stock" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3">
                    Nama Bahan
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Jumlah Stok Saat Ini
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Terakhir Diperbarui
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.length > 0 ? (
                  paginatedItems.map((item) => (
                    <tr
                      key={item.ingredient_id}
                      className="bg-white border-b hover:bg-gray-50"
                    >
                      <th
                        scope="row"
                        className="px-6 py-4 font-medium text-gray-900"
                      >
                        {item.ingredient_name}
                      </th>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-lg">
                          {parseFloat(item.current_quantity).toLocaleString(
                            "id-ID",
                          )}
                        </span>
                        <span className="ml-1 text-gray-500">
                          {item.unit_symbol}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {item.last_updated
                          ? new Date(item.last_updated).toLocaleString("id-ID")
                          : "Belum ada transaksi"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="text-center py-4">
                      {searchQuery
                        ? "Bahan tidak ditemukan di dalam stok."
                        : "Tidak ada data stok."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3">
                    Tanggal Laporan
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Nama Bahan
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Kuantitas Rusak
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Keterangan
                  </th>
                  <th scope="col" className="px-6 py-3 text-right">
                    Taksiran Kerugian (IDR)
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.length > 0 ? (
                  paginatedItems.map((item) => (
                    <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-6 py-4">
                        {new Date(item.date).toLocaleString("id-ID")}
                      </td>
                      <th scope="row" className="px-6 py-4 font-medium text-gray-900">
                        {item.ingredient_name}
                      </th>
                      <td className="px-6 py-4 font-semibold text-red-600">
                        -{parseFloat(item.quantity).toLocaleString("id-ID")} {item.unit_symbol}
                      </td>
                      <td className="px-6 py-4 text-xs max-w-xs truncate" title={item.reason_and_notes}>
                        {item.reason_and_notes}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">
                        {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(item.loss_value)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-4">
                      {searchQuery
                        ? "Tidak ada riwayat kerusakan bahan yang cocok."
                        : "Belum ada riwayat laporan bahan rusak."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Laporkan Bahan Rusak / Penyusutan"
        size="md"
      >
        <form onSubmit={handleReportSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
              Pilih Bahan Baku
            </label>
            <select
              value={selectedItem?.ingredient_id || ""}
              onChange={(e) => {
                const ingId = Number(e.target.value);
                const found = stock.find((item) => Number(item.ingredient_id) === ingId);
                setSelectedItem(found || null);
              }}
              className="input-style w-full"
              required
            >
              <option value="" disabled>-- Pilih Bahan Baku --</option>
              {stock.map((item) => (
                <option key={item.ingredient_id} value={item.ingredient_id}>
                  {item.ingredient_name}
                </option>
              ))}
            </select>
          </div>

          {selectedItem && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                    Stok Saat Ini
                  </label>
                  <input
                    type="text"
                    value={`${(parseFloat(selectedItem.current_quantity) / parseFloat(selectedItem.conversion_factor || 1)).toLocaleString("id-ID")} ${selectedItem.unit_symbol}`}
                    disabled
                    className="input-style w-full bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                    Jumlah Rusak/Susut
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={reportData.quantity}
                      onChange={(e) => setReportData((prev) => ({ ...prev, quantity: e.target.value }))}
                      placeholder="0.00"
                      required
                      className="input-style w-full pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold">
                      {selectedItem.unit_symbol}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                  Alasan / Kategori Kerusakan
                </label>
                <select
                  value={reportData.reason}
                  onChange={(e) => setReportData((prev) => ({ ...prev, reason: e.target.value }))}
                  className="input-style w-full"
                  required
                >
                  <option value="Busuk / Kadaluarsa">Busuk / Kadaluarsa</option>
                  <option value="Tumpah / Rusak Fisik">Tumpah / Rusak Fisik</option>
                  <option value="Hilang / Selisih Opname">Hilang / Selisih Opname</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                  Catatan Tambahan
                </label>
                <textarea
                  value={reportData.notes}
                  onChange={(e) => setReportData((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Tuliskan keterangan detail di sini..."
                  className="input-style w-full h-20 py-2"
                />
              </div>
            </>
          )}

          <div className="pt-4 border-t flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsReportModalOpen(false)}
              className="px-4 py-2 bg-gray-150 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={actionLoading || !selectedItem}
              className="btn-primary bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={16} /> Menyimpan...
                </>
              ) : (
                "Laporkan Rusak"
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Konfirmasi Pemesanan Otomatis yang Cantik */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Konfirmasi Pemesanan Otomatis"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-800">
            <AlertTriangle size={24} className="text-amber-600 shrink-0" />
            <p className="text-xs leading-relaxed font-semibold">
              Apakah Anda yakin ingin memesan secara otomatis seluruh bahan baku yang kurang ke supplier termurah?
            </p>
          </div>
          <p className="text-[11px] text-gray-550 leading-relaxed pl-1">
            Sistem akan secara otomatis menyortir bahan baku yang kurang, mencari supplier termurah yang terdaftar di database, dan membuat draf Purchase Order secara terpisah (Split PO).
          </p>
          <div className="pt-4 border-t flex justify-end space-x-2">
            <button
              onClick={() => setIsConfirmModalOpen(false)}
              className="px-4 py-2 bg-gray-150 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleAutoReorder}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
            >
              Ya, Pesan Otomatis
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default StockPage;
