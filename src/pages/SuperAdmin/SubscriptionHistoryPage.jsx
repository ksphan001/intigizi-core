import React, { useState, useEffect, useMemo } from "react";
import apiClient from "@/services/api";
import PageHeader from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import { Loader2, Wallet, Package, Calendar, UserCheck } from "lucide-react";

const ITEMS_PER_PAGE = 10;

const StatCard = ({ icon, title, value, loading }) => (
  <div className="bg-white p-6 rounded-xl shadow-md flex items-start space-x-4 overflow-hidden">
    <div className="bg-green-50 p-3 rounded-full flex-shrink-0">{icon}</div>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
      {loading ? (
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mt-1"></div>
      ) : (
        <p className="text-2xl font-bold text-gray-800 break-words">{value}</p>
      )}
    </div>
  </div>
);

function SubscriptionHistoryPage() {
  const [historyData, setHistoryData] = useState({
    total_revenue: 0,
    transactions: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(
          "/superadmin_get_subscription_history.php",
        );
        setHistoryData(response.data);
      } catch (err) {
        setError("Gagal memuat riwayat pembelian langganan.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return historyData.transactions.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE,
    );
  }, [currentPage, historyData.transactions]);

  const totalPages = Math.ceil(
    historyData.transactions.length / ITEMS_PER_PAGE,
  );

  const formatCurrency = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value || 0);
  const formatDate = (dateString) =>
    new Date(dateString).toLocaleString("id-ID", {
      dateStyle: "long",
      timeStyle: "short",
    });
  const formatExpiryDate = (dateString) =>
    new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <div className="space-y-6">
      <PageHeader title="Riwayat Pembelian Langganan" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={<Wallet size={24} className="text-intigizi-green-dark" />}
          title="Total Pendapatan"
          value={formatCurrency(historyData.total_revenue)}
          loading={loading}
        />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Semua Transaksi
        </h3>
        {loading ? (
          <div className="text-center p-8">
            <Loader2 className="animate-spin" />
          </div>
        ) : error ? (
          <div className="text-red-500 p-4">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Nama Dapur</th>
                  <th className="px-6 py-3">Paket</th>
                  <th className="px-6 py-3">Jumlah Bayar</th>
                  <th className="px-6 py-3">Tanggal Verifikasi</th>
                  <th className="px-6 py-3">Aktif Hingga</th>
                  <th className="px-6 py-3">Diverifikasi Oleh</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.length > 0 ? (
                  paginatedTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="bg-white border-b hover:bg-gray-50"
                    >
                      <th
                        scope="row"
                        className="px-6 py-4 font-medium text-gray-900"
                      >
                        {tx.organization_name}
                      </th>
                      <td className="px-6 py-4">
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                          {tx.package_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="px-6 py-4">{formatDate(tx.paid_at)}</td>
                      <td className="px-6 py-4 font-medium text-green-600">
                        {formatExpiryDate(tx.subscription_until)}
                      </td>
                      <td className="px-6 py-4">
                        {tx.verified_by_name || "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-500">
                      Belum ada riwayat pembelian langganan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {historyData.transactions.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
}

export default SubscriptionHistoryPage;
