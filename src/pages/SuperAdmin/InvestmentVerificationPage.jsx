import React, { useState, useEffect, useCallback } from "react";
import apiClient from "@/services/api";
import PageHeader from "@/components/PageHeader.jsx";
import { Loader2, Check, X, FileText } from "lucide-react";
import ConfirmationModal from "@/components/ConfirmationModal.jsx";
import { useNotification } from "@/context/NotificationContext.jsx";
import { API_BASE_URL } from "@/config"; // Impor API_BASE_URL

// HALAMAN BARU: Verifikasi Investasi (Super Admin)

function InvestmentVerificationPage() {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState(null);
  const [actionType, setActionType] = useState(""); // 'approve' or 'reject'

  const { showNotification } = useNotification();

  const fetchPendingInvestments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(
        "/superadmin_get_pending_investments.php",
      );
      setInvestments(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError("Gagal memuat daftar verifikasi.");
      showNotification("Gagal memuat daftar verifikasi.", "error");
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchPendingInvestments();
  }, [fetchPendingInvestments]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  const formatDate = (dateString) =>
    new Date(dateString).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  const openConfirm = (investment, type) => {
    setSelectedInvestment(investment);
    setActionType(type);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedInvestment || !actionType) return;

    setActionLoading(true);
    try {
      const response = await apiClient.post(
        "/superadmin_verify_investment.php",
        {
          investment_id: selectedInvestment.id,
          action: actionType,
        },
      );
      showNotification(response.data.message, "success");
      fetchPendingInvestments(); // Muat ulang data
    } catch (err) {
      showNotification(
        err.response?.data?.message || "Gagal memproses aksi.",
        "error",
      );
    } finally {
      setActionLoading(false);
      setIsConfirmModalOpen(false);
      setSelectedInvestment(null);
    }
  };

  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div>
      <PageHeader title="Verifikasi Pembayaran Investasi" />
      <div className="bg-white p-6 rounded-xl shadow-md">
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3">
                    Tanggal
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Investor
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Proyek
                  </th>
                  <th scope="col" className="px-6 py-3 text-right">
                    Total Investasi (Rp)
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Bukti Bayar
                  </th>
                  <th scope="col" className="px-6 py-3 text-center">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {investments.length > 0 ? (
                  investments.map((item) => (
                    <tr
                      key={item.id}
                      className="bg-white border-b hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        {formatDate(item.investment_date)}
                      </td>
                      <th
                        scope="row"
                        className="px-6 py-4 font-medium text-gray-900"
                      >
                        {item.investor_name}
                      </th>
                      <td className="px-6 py-4">{item.campaign_title}</td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900">
                        {formatCurrency(item.total_investment)}
                      </td>
                      <td className="px-6 py-4">
                        {item.payment_proof_path ? (
                          <a
                            href={`${API_BASE_URL.replace("/app", "")}${item.payment_proof_path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm text-intigizi-green font-medium hover:underline"
                          >
                            <FileText size={16} className="mr-1.5" /> Lihat
                            Bukti
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400 italic">
                            Belum diunggah
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => openConfirm(item, "reject")}
                            className="btn-secondary btn-sm bg-red-100 text-red-600 hover:bg-red-200"
                            title="Tolak"
                          >
                            <X size={16} />
                          </button>
                          <button
                            onClick={() => openConfirm(item, "approve")}
                            className="btn-secondary btn-sm bg-green-100 text-green-600 hover:bg-green-200"
                            title="Setujui"
                            disabled={!item.payment_proof_path}
                          >
                            <Check size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-500">
                      Tidak ada investasi yang menunggu verifikasi.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmAction}
        title={`Konfirmasi Aksi: ${actionType === "approve" ? "Setujui" : "Tolak"} Investasi`}
        message={`Anda yakin ingin ${actionType === "approve" ? "menyetujui" : "menolak"} pembayaran investasi sebesar ${formatCurrency(selectedInvestment?.total_investment)} dari ${selectedInvestment?.investor_name}?`}
        loading={actionLoading}
        confirmText={actionType === "approve" ? "Ya, Setujui" : "Ya, Tolak"}
        confirmColor={actionType === "approve" ? "btn-primary" : "btn-danger"}
      />
    </div>
  );
}

export default InvestmentVerificationPage;
