import React, { useState, useEffect, useMemo } from "react";
import apiClient from "@/services/api";
import { useNotification } from "@/context/NotificationContext";
import PageHeader from "@/components/PageHeader";
import { Package, DollarSign, Loader2, Calendar, Search } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function IngredientUsageReportPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    end_date: new Date().toISOString().split("T")[0],
  });
  const { showNotification } = useNotification();

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(
        "/reports_get_ingredient_usage.php",
        {
          params: filters,
        },
      );
      setData(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      showNotification("Gagal mengambil data laporan pemakaian", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleApplyFilter = () => {
    fetchData();
  };

  const chartData = useMemo(() => {
    return data
      .map((item) => ({
        name: item.ingredient_name,
        total_quantity_used: parseFloat(item.total_quantity_used),
        estimated_cost: parseFloat(item.estimated_cost),
      }))
      .sort((a, b) => b.estimated_cost - a.estimated_cost) // Urutkan berdasarkan biaya
      .slice(0, 15); // Ambil top 15
  }, [data]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  const formatNumber = (value) =>
    new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  return (
    <div className="container mx-auto p-4 selection:bg-intigizi-green-light selection:text-intigizi-green-dark">
      <PageHeader title="Laporan Pemakaian Bahan" />
      <p className="mb-6 text-gray-600">
        Analisis jumlah dan estimasi biaya bahan baku yang digunakan untuk
        produksi dalam periode tertentu (berdasarkan satuan pembelian).
      </p>

      {/* Filter Section */}
      <div className="mb-6 p-4 bg-white rounded-xl shadow-md border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="start_date"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Tanggal Mulai
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="date"
                id="start_date"
                name="start_date"
                value={filters.start_date}
                onChange={handleFilterChange}
                className="input-style pl-10"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="end_date"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Tanggal Selesai
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="date"
                id="end_date"
                name="end_date"
                value={filters.end_date}
                onChange={handleFilterChange}
                className="input-style pl-10"
              />
            </div>
          </div>
          <div className="self-end">
            <button
              onClick={handleApplyFilter}
              className="btn-primary w-full flex items-center justify-center bg-gradient-to-r from-intigizi-green to-intigizi-green-dark hover:from-intigizi-green-dark hover:to-intigizi-green transition-all"
              disabled={loading}
            >
              <Search size={18} className="mr-2" />
              Terapkan Filter
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-intigizi-green" />
        </div>
      ) : (
        <>
          {/* Chart Section */}
          <div className="bg-white p-6 rounded-xl shadow-md mb-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-l-4 border-intigizi-green pl-3">
              Grafik Top 15 Pemakaian Bahan (Berdasarkan Biaya)
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 20, left: -10, bottom: 50 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f0f0f0"
                />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  interval={0}
                  tick={{ fontSize: 10, fill: "#6B7280" }}
                  axisLine={{ stroke: "#E5E7EB" }}
                />
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  stroke="#269636"
                  tickFormatter={formatNumber}
                  tick={{ fontSize: 12, fill: "#269636" }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#F28D35"
                  tickFormatter={formatCurrency}
                  tick={{ fontSize: 12, fill: "#F28D35" }}
                />
                <Tooltip
                  formatter={(value, name) => [
                    name === "estimated_cost"
                      ? formatCurrency(value)
                      : formatNumber(value),
                    name === "estimated_cost"
                      ? "Estimasi Biaya"
                      : "Total Kuantitas",
                  ]}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="total_quantity_used"
                  name="Total Kuantitas"
                  fill="#269636"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  yAxisId="right"
                  dataKey="estimated_cost"
                  name="Estimasi Biaya"
                  fill="#F28D35"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Table Section */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-l-4 border-intigizi-orange pl-3">
              Rincian Pemakaian Bahan
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                    >
                      Bahan Baku
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider"
                    >
                      Satuan
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider"
                    >
                      Total Kuantitas Terpakai
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider"
                    >
                      Estimasi Biaya (Rp)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {data.map((item) => (
                    <tr
                      key={item.ingredient_name}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.ingredient_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        {item.unit_symbol}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        {formatNumber(item.total_quantity_used)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-intigizi-green-dark">
                        {formatCurrency(item.estimated_cost)}
                      </td>
                    </tr>
                  ))}
                  {data.length === 0 && (
                    <tr>
                      <td
                        colSpan="4"
                        className="px-6 py-8 text-center text-sm text-gray-500 italic"
                      >
                        Tidak ada data untuk periode ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default IngredientUsageReportPage;
