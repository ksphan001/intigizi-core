import React, { useState, useEffect, useCallback, useMemo } from "react";
import apiClient from "@/services/api";
import PageHeader from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import {
  Loader2,
  Calendar,
  Download,
  CookingPot,
  TrendingUp,
  Hash,
} from "lucide-react";

const ITEMS_PER_PAGE = 10;

// Komponen Kartu Statistik
const StatCard = ({ icon, title, value, loading }) => (
  <div className="bg-white p-5 rounded-xl shadow-md flex items-start space-x-4">
    <div className="bg-green-50 p-3 rounded-full">{icon}</div>
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

function ProductionHistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const today = new Date();
  const thirtyDaysAgo = new Date(new Date().setDate(today.getDate() - 30));

  const [filters, setFilters] = useState({
    start_date: thirtyDaysAgo.toISOString().split("T")[0],
    end_date: today.toISOString().split("T")[0],
  });

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.get("/production_history_get.php", {
        params: filters,
      });
      setHistory(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError("Gagal memuat riwayat produksi.");
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const paginatedHistory = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return history.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, history]);

  const totalPages = Math.ceil(history.length / ITEMS_PER_PAGE);

  const summaryStats = useMemo(() => {
    if (history.length === 0) {
      return { totalPortions: 0, totalDays: 0, avgPortions: 0 };
    }
    const totalPortions = history.reduce(
      (sum, item) => sum + parseInt(item.target_recipients, 10),
      0,
    );
    const totalDays = new Set(history.map((item) => item.production_date)).size;
    const avgPortions = totalDays > 0 ? totalPortions / totalDays : 0;
    return {
      totalPortions: totalPortions.toLocaleString("id-ID"),
      totalDays: totalDays.toLocaleString("id-ID"),
      avgPortions: avgPortions.toLocaleString("id-ID", {
        maximumFractionDigits: 0,
      }),
    };
  }, [history]);

  const formatDate = (dateString) =>
    new Date(dateString + "T00:00:00Z").toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <div className="space-y-6">
      <PageHeader title="Riwayat Produksi" />

      {/* Filter Section */}
      <div className="bg-white p-4 rounded-xl shadow-md">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label
              htmlFor="start_date"
              className="block text-xs font-medium text-gray-600"
            >
              Dari Tanggal
            </label>
            <input
              type="date"
              name="start_date"
              id="start_date"
              value={filters.start_date}
              onChange={handleFilterChange}
              className="input-style"
            />
          </div>
          <div>
            <label
              htmlFor="end_date"
              className="block text-xs font-medium text-gray-600"
            >
              Sampai Tanggal
            </label>
            <input
              type="date"
              name="end_date"
              id="end_date"
              value={filters.end_date}
              onChange={handleFilterChange}
              className="input-style"
            />
          </div>
          <button
            onClick={fetchHistory}
            disabled={loading}
            className="btn-primary flex items-center"
          >
            {loading ? <Loader2 className="animate-spin mr-2" /> : null}{" "}
            Tampilkan
          </button>
          <button
            disabled
            className="btn-secondary flex items-center ml-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={16} className="mr-2" /> Unduh Laporan
          </button>
        </div>
      </div>

      {error && (
        <p className="text-red-500 text-center mb-4 p-4 bg-red-50 rounded-lg">
          {error}
        </p>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={<CookingPot size={24} className="text-intigizi-green" />}
          title="Total Porsi Diproduksi"
          value={summaryStats.totalPortions}
          loading={loading}
        />
        <StatCard
          icon={<Calendar size={24} className="text-intigizi-green" />}
          title="Total Hari Produksi"
          value={summaryStats.totalDays}
          loading={loading}
        />
        <StatCard
          icon={<TrendingUp size={24} className="text-intigizi-green" />}
          title="Rata-rata Porsi / Hari"
          value={summaryStats.avgPortions}
          loading={loading}
        />
      </div>

      {/* Detailed Table */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Rincian Produksi Tercatat
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">Tanggal Produksi</th>
                <th className="px-6 py-3">Proposal</th>
                <th className="px-6 py-3">Menu yang Dimasak</th>
                <th className="px-6 py-3 text-right">Jumlah Porsi</th>
                <th className="px-6 py-3">Dicatat Oleh</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-8">
                    <Loader2 className="animate-spin inline-block" />
                  </td>
                </tr>
              ) : paginatedHistory.length > 0 ? (
                paginatedHistory.map((item) => (
                  <tr
                    key={item.id}
                    className="bg-white border-b hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 font-semibold">
                      {formatDate(item.production_date)}
                    </td>
                    <td className="px-6 py-4">{item.proposal_code}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {item.menu_name || (
                        <span className="italic text-gray-400">
                          Data menu tidak tersedia
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-intigizi-green-dark">
                      {parseInt(item.target_recipients).toLocaleString("id-ID")}
                    </td>
                    <td className="px-6 py-4">{item.created_by_name}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-500">
                    Tidak ada riwayat produksi untuk rentang tanggal ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {history.length > 0 && (
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

export default ProductionHistoryPage;
