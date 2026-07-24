import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import apiClient from "../services/api";
import { useNotification } from "../context/NotificationContext.jsx";
import {
  ArrowLeft,
  PlusCircle,
  ShoppingCart,
  Loader2,
  Info,
  Check,
  Trash2,
  List,
} from "lucide-react";
import Modal from "../components/Modal.jsx";
import ConfirmationModal from "../components/ConfirmationModal.jsx";

// --- PENJELASAN PERBAIKAN ---
// 1. Tombol "Buat PO Baru" sekarang dinonaktifkan jika semua kebutuhan sudah terpenuhi.
// 2. Tombol "Lihat Daftar PO" muncul jika ada PO yang sudah dibuat untuk proposal ini.
// 3. Latar belakang baris tabel "Ringkasan Kebutuhan" diubah menjadi selang-seling (zebra-striping)
//    untuk meningkatkan keterbacaan, sesuai dengan praktik desain yang baik.

function ProcurementPage() {
  const { proposalId } = useParams();
  const { showNotification } = useNotification();
  const navigate = useNavigate(); // Gunakan hook useNavigate
  const [procurementDetails, setProcurementDetails] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [poItems, setPoItems] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchProcurementDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [detailsRes, suppliersRes] = await Promise.all([
        apiClient.get(`/procurement_get_details.php?proposal_id=${proposalId}`),
        apiClient.get("/procurement_get_suppliers.php"),
      ]);
      setProcurementDetails(detailsRes.data);
      setSuppliers(suppliersRes.data);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Gagal memuat data pengadaan.";
      setError(errorMessage);
      showNotification(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  }, [proposalId, showNotification]);

  useEffect(() => {
    fetchProcurementDetails();
  }, [fetchProcurementDetails]);

  const handleOpenPOCreationModal = () => {
    const itemsToOrder = procurementDetails.procurement_items
      .filter((item) => item.remaining > 0)
      .map((item) => ({
        ingredient_id: item.ingredient_id,
        name: item.ingredient_name,
        quantity: item.remaining.toFixed(2),
        price: item.latest_price || 0,
        unit_symbol: item.unit_symbol,
      }));

    if (itemsToOrder.length === 0) {
      showNotification(
        "Semua kebutuhan bahan baku untuk proposal ini sudah dipesan.",
        "info",
      );
      return;
    }

    if (suppliers.length > 0) {
      setSelectedSupplier(suppliers[0].id);
    }
    setPoItems(itemsToOrder);
    setIsModalOpen(true);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...poItems];
    newItems[index][field] = value;
    setPoItems(newItems);
  };

  const handleRemoveItem = (index) => {
    setPoItems(poItems.filter((_, i) => i !== index));
  };

  const handleSubmitPO = async () => {
    if (!selectedSupplier) {
      showNotification("Silakan pilih pemasok terlebih dahulu.", "warning");
      return;
    }

    const itemsWithQuantity = poItems.filter(
      (item) => parseFloat(item.quantity) > 0,
    );
    if (itemsWithQuantity.length === 0) {
      showNotification(
        "Tidak ada item yang akan dipesan. Pastikan kuantitas lebih dari 0.",
        "warning",
      );
      return;
    }

    setActionLoading(true);
    try {
      await apiClient.post("/procurement_create_po.php", {
        proposal_id: proposalId,
        supplier_id: selectedSupplier,
        items: itemsWithQuantity,
      });
      showNotification("Purchase Order berhasil dibuat.", "success");
      setIsModalOpen(false);
      setIsConfirmOpen(false);
      fetchProcurementDetails(); // Refresh data
    } catch (err) {
      showNotification(
        err.response?.data?.message || "Gagal membuat PO.",
        "error",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const formatNumber = (num) =>
    new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num || 0);
  const formatCurrency = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(value || 0);
  const totalPOAmount = poItems.reduce(
    (sum, item) =>
      sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0),
    0,
  );

  // --- LOGIKA BARU: Cek apakah semua kebutuhan sudah terpenuhi ---
  const allNeedsMet = useMemo(() => {
    if (!procurementDetails || !procurementDetails.procurement_items)
      return false;
    // Jika tidak ada item sama sekali, anggap kebutuhan terpenuhi
    if (procurementDetails.procurement_items.length === 0) return true;
    return procurementDetails.procurement_items.every(
      (item) => item.remaining <= 0,
    );
  }, [procurementDetails]);

  const hasExistingPOs = useMemo(() => {
    return procurementDetails?.purchase_orders?.length > 0;
  }, [procurementDetails]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-intigizi-green" />
      </div>
    );
  if (error && !procurementDetails)
    return <div className="text-center text-red-500 p-4">{error}</div>;

  return (
    <div className="space-y-6">
      <Link
        to={`/app/proposals/${proposalId}`}
        className="flex items-center text-gray-500 hover:text-intigizi-green transition-colors"
      >
        <ArrowLeft size={20} className="mr-2" />
        Kembali ke Detail Proposal
      </Link>

      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Pengadaan Bahan Baku
          </h1>
          <p className="text-gray-500 mt-1">
            Proposal:{" "}
            <span className="font-semibold text-intigizi-green-dark">
              {procurementDetails?.proposal?.proposal_code}
            </span>
          </p>
        </div>
        {/* --- TOMBOL AKSI KONDISIONAL --- */}
        <div className="flex space-x-3">
          {hasExistingPOs && (
            <button
              onClick={() => navigate("/app/purchase-orders")}
              className="btn-secondary flex items-center hover:text-intigizi-green-dark"
            >
              <List size={18} className="mr-2" /> Lihat Daftar PO
            </button>
          )}
          <button
            onClick={handleOpenPOCreationModal}
            className="btn-primary flex items-center shadow-lg shadow-intigizi-green/30"
            disabled={allNeedsMet}
          >
            {allNeedsMet ? (
              <>
                <Check size={18} className="mr-2" /> Kebutuhan Terpenuhi
              </>
            ) : (
              <>
                <PlusCircle size={18} className="mr-2" /> Buat PO Baru
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <h2 className="text-xl font-bold mb-4 flex items-center text-gray-800 border-l-4 border-intigizi-orange pl-3">
          Ringkasan Kebutuhan Bahan Baku
        </h2>
        <div className="overflow-x-auto rounded-lg border border-gray-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Bahan Baku
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Total Dibutuhkan
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Sudah Dipesan
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Sisa Kebutuhan
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {procurementDetails?.procurement_items?.map((item, index) => (
                // --- PERBAIKAN: Latar Belakang Selang-seling ---
                <tr
                  key={item.ingredient_id}
                  className={
                    item.remaining <= 0
                      ? "bg-green-50"
                      : index % 2 === 0
                        ? "bg-white"
                        : "bg-gray-50"
                  }
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.ingredient_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                    {formatNumber(item.total_needed)} {item.unit_symbol}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                    {formatNumber(item.total_ordered)} {item.unit_symbol}
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${item.remaining > 0 ? "text-intigizi-orange-dark" : "text-intigizi-green-dark"}`}
                  >
                    {formatNumber(item.remaining)} {item.unit_symbol}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Buat Purchase Order Baru"
        size="4xl"
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="supplier"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Pilih Pemasok
            </label>
            <select
              id="supplier"
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="input-style bg-white w-full"
            >
              <option value="">-- Pilih Pemasok --</option>
              {suppliers.map((sup) => (
                <option key={sup.id} value={sup.id}>
                  {sup.name} ({sup.type})
                </option>
              ))}
            </select>
          </div>

          <div className="border rounded-lg border-gray-200">
            <div className="max-h-80 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">
                      Bahan
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-bold text-gray-700 uppercase">
                      Kuantitas
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-bold text-gray-700 uppercase">
                      Harga/Unit
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-bold text-gray-700 uppercase">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {poItems.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm font-medium text-gray-800">
                        {item.name}
                      </td>
                      <td className="px-4 py-2">
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "quantity",
                                e.target.value,
                              )
                            }
                            className="input-style pr-12 w-32 ml-auto text-right"
                          />
                          <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 text-sm font-medium">
                            {item.unit_symbol}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            value={item.price}
                            onChange={(e) =>
                              handleItemChange(index, "price", e.target.value)
                            }
                            className="input-style pl-8 w-36 ml-auto text-right"
                          />
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-sm font-medium">
                            Rp
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-500 hover:text-red-700 p-2 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end items-center font-bold">
            {/* PERUBAHAN: Warna teks diubah */}
            Total PO:{" "}
            <span className="ml-2 text-2xl text-intigizi-orange">
              {formatCurrency(totalPOAmount)}
            </span>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn-secondary"
            >
              Batal
            </button>
            <button
              onClick={() => setIsConfirmOpen(true)}
              className="btn-primary flex items-center shadow-lg shadow-intigizi-green/30"
            >
              <ShoppingCart size={16} className="mr-2" /> Ajukan PO
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleSubmitPO}
        title="Konfirmasi Pembuatan PO"
        message="Apakah Anda yakin ingin membuat Purchase Order dengan daftar bahan dan harga yang telah ditentukan?"
        loading={actionLoading}
        confirmText="Ya, Buat PO"
        // PERUBAHAN: Warna tombol konfirmasi diubah
        confirmColor="btn-primary"
        icon={<Check size={16} className="mr-2" />}
      />
    </div>
  );
}

export default ProcurementPage;
