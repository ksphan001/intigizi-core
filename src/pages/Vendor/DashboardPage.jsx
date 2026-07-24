import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import apiClient from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { DollarSign, CheckCircle, Clock, Loader2, Eye } from "lucide-react";

const StatCard = ({ icon, title, value, loading }) => (
  <div className="bg-white p-6 rounded-xl shadow-md flex items-center space-x-4">
    <div className="bg-blue-50 p-3 rounded-full">{icon}</div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      {loading ? (
        <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mt-1"></div>
      ) : (
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      )}
    </div>
  </div>
);

function VendorDashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const formatCurrency = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value || 0);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/vendor_dashboard_summary.php");
      setSummary(response.data);
    } catch (err) {
      setError("Gagal memuat ringkasan dasbor.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Dasbor Vendor</h1>
        <p className="text-gray-500">
          Selamat datang, {user?.username}! Berikut ringkasan aktivitas
          penjualan Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={<DollarSign size={24} className="text-intigizi-green" />}
          title="Total Pendapatan"
          value={formatCurrency(summary?.total_revenue)}
          loading={loading}
        />
        <StatCard
          icon={<CheckCircle size={24} className="text-intigizi-green" />}
          title="Pesanan Selesai"
          value={summary?.completed_orders}
          loading={loading}
        />
        <StatCard
          icon={<Clock size={24} className="text-intigizi-orange" />}
          title="Pesanan Menunggu"
          value={summary?.pending_orders}
          loading={loading}
        />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="font-semibold text-gray-700 mb-4">
          Pesanan Masuk Terbaru
        </h3>
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Kode PO</th>
                  <th className="px-6 py-3">Dapur Pemesan</th>
                  <th className="px-6 py-3 text-right">Nilai Pesanan</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {summary?.recent_orders?.length > 0 ? (
                  summary.recent_orders.map((order) => (
                    <tr
                      key={order.id}
                      className="bg-white border-b hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {order.po_code}
                      </td>
                      <td className="px-6 py-4">{order.kitchen_name}</td>
                      <td className="px-6 py-4 text-right font-semibold">
                        {formatCurrency(order.total_amount)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${order.vendor_status === "Dikonfirmasi" ? "bg-green-100 text-green-800" : order.vendor_status === "Ditolak" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}
                        >
                          {order.vendor_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Link
                          to={`/app/purchase-orders/${order.id}`}
                          className="p-1 text-gray-600 hover:text-intigizi-green"
                          title="Lihat Detail"
                        >
                          <Eye size={16} />
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-gray-500">
                      Tidak ada pesanan terbaru.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="mt-4 text-right">
              <Link
                to="/app/vendor/orders"
                className="text-sm font-semibold text-intigizi-green hover:underline"
              >
                Lihat Semua Pesanan →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VendorDashboardPage;
