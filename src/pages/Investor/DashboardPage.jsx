import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import apiClient from "@/services/api";
import PageHeader from "@/components/PageHeader";
import {
  Loader2,
  Briefcase,
  PiggyBank,
  BarChart,
  ArrowRight,
  Activity,
  Building,
  CheckCircle,
  XCircle,
  Clock,
  Upload,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import InvestmentUploadModal from "@/components/InvestmentUploadModal"; // Impor modal baru
import { useNotification } from "@/context/NotificationContext"; // Impor notifikasi

const StatCard = ({ icon, title, value }) => (
  <div className="bg-white p-6 rounded-xl shadow-md flex items-center space-x-4">
    <div className="bg-green-100 p-3 rounded-full text-intigizi-green">
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

function InvestorDashboardPage() {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { showNotification } = useNotification(); // Gunakan notifikasi

  // State untuk modal upload
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedInvestmentId, setSelectedInvestmentId] = useState(null);

  const fetchPortfolio = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/investor_get_portfolio.php");
      setPortfolio(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError("Gagal memuat data portofolio.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);

  const totalInvestment = useMemo(() => {
    // Hitung hanya investasi yang sudah dibayar
    return portfolio
      .filter((item) => item.status === "paid")
      .reduce((sum, item) => sum + parseFloat(item.total_investment), 0);
  }, [portfolio]);

  const projectCount = useMemo(() => {
    // Hitung hanya investasi yang sudah dibayar
    return portfolio.filter((item) => item.status === "paid").length;
  }, [portfolio]);

  const getStatusCampaign = (status) => {
    const styles = {
      active: "bg-blue-100 text-blue-800",
      funded: "bg-green-100 text-green-800",
      completed: "bg-gray-100 text-gray-800",
    };
    const icon =
      status === "active" ? <Clock size={14} /> : <CheckCircle size={14} />;
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.completed}`}
      >
        {icon}
        <span className="ml-1.5">{status}</span>
      </span>
    );
  };

  // Fungsi untuk status investasi (pembayaran)
  const getStatusInvestment = (item) => {
    if (item.status === "paid") {
      return (
        <span className="inline-flex items-center text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-800">
          <CheckCircle size={14} className="mr-1.5" />
          Telah Dibayar
        </span>
      );
    }
    if (item.status === "cancelled") {
      return (
        <span className="inline-flex items-center text-xs font-semibold px-2 py-1 rounded-full bg-red-100 text-red-800">
          <XCircle size={14} className="mr-1.5" />
          Dibatalkan
        </span>
      );
    }
    if (item.status === "pending") {
      if (item.payment_proof_path) {
        return (
          <span className="inline-flex items-center text-xs font-semibold px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
            <Clock size={14} className="mr-1.5" />
            Menunggu Verifikasi
          </span>
        );
      } else {
        return (
          <button
            onClick={() => {
              setSelectedInvestmentId(item.id);
              setIsUploadModalOpen(true);
            }}
            className="btn-primary btn-sm bg-intigizi-orange hover:bg-opacity-90"
          >
            <Upload size={14} className="mr-1.5" /> Unggah Bukti Bayar
          </button>
        );
      }
    }
    return null;
  };

  return (
    <div>
      <PageHeader title={`Selamat Datang, ${user?.username || "Investor"}!`} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatCard
          icon={<Briefcase size={24} />}
          title="Total Investasi (Aktif)"
          value={formatCurrency(totalInvestment)}
        />
        <StatCard
          icon={<PiggyBank size={24} />}
          title="Proyek Didanai"
          value={`${projectCount} Proyek`}
        />
        <StatCard
          icon={<BarChart size={24} />}
          title="Estimasi Profit"
          value="Segera"
        />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Portofolio Investasi Saya
        </h2>
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="animate-spin" />
          </div>
        ) : error ? (
          <div className="text-red-500 p-4">{error}</div>
        ) : portfolio.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <PiggyBank size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold">
              Anda belum memiliki investasi.
            </h3>
            <p className="mb-6">
              Mulai danai proyek dapur pertama Anda untuk melihatnya di sini.
            </p>
            <Link to="/funding" className="btn-primary">
              Lihat Proyek Pendanaan
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Nama Proyek</th>
                  <th className="px-6 py-3">Tanggal Investasi</th>
                  <th className="px-6 py-3">Jumlah Investasi</th>
                  <th className="px-6 py-3">Status Pembayaran</th>
                  <th className="px-6 py-3">Status Proyek</th>
                  <th className="px-6 py-3 text-right">Aktivitas</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.map((item) => (
                  <tr
                    key={item.id}
                    className="bg-white border-b hover:bg-gray-50"
                  >
                    <th className="px-6 py-4 font-medium text-gray-900">
                      {item.campaign_title}
                    </th>
                    <td className="px-6 py-4">
                      {new Date(item.created_at).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-6 py-4 font-semibold">
                      {formatCurrency(item.total_investment)} ({item.lot_count}{" "}
                      lot)
                    </td>
                    <td className="px-6 py-4">{getStatusInvestment(item)}</td>
                    <td className="px-6 py-4">
                      {getStatusCampaign(item.campaign_status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {item.kitchen_org_id && item.status === "paid" ? (
                        <Link
                          to={`/app/investor/kitchen/${item.kitchen_org_id}`}
                          className="flex items-center justify-end text-sm font-medium text-intigizi-green hover:underline"
                        >
                          Lihat Aktivitas{" "}
                          <ArrowRight size={16} className="ml-1" />
                        </Link>
                      ) : (
                        <span className="text-xs text-gray-400">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <InvestmentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        investmentId={selectedInvestmentId}
        onUploadSuccess={() => {
          fetchPortfolio(); // Refresh data setelah berhasil upload
          showNotification("Bukti bayar berhasil diunggah!", "success");
        }}
      />
    </div>
  );
}

export default InvestorDashboardPage;
