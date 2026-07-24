import React, { useState, useEffect, useMemo } from "react";
import apiClient from "@/services/api";
import { useNotification } from "@/context/NotificationContext";
import PageHeader from "@/components/PageHeader";
import {
  Truck,
  Loader2,
  Calendar,
  Search,
  LineChart as LineChartIcon,
  BarChart3,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";

function DistributionPerformancePage() {
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
      const response = await apiClient.get("/reports_get_distribution.php", {
        params: filters,
      });
      setData(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      showNotification("Gagal mengambil data laporan distribusi", "error");
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
    return data.map((item) => ({
      name: item.distribution_point_name,
      total_sent: parseInt(item.total_sent, 10) || 0,
      total_received: parseInt(item.total_received, 10) || 0,
      success_rate: parseFloat(item.success_rate).toFixed(1) || 0,
    }));
  }, [data]);

  const totals = useMemo(() => {
    return data.reduce(
      (acc, item) => {
        acc.total_sent += parseInt(item.total_sent, 10) || 0;
        acc.total_received += parseInt(item.total_received, 10) || 0;
        acc.total_failed += parseInt(item.total_failed, 10) || 0;
        acc.total_partial += parseInt(item.total_partial, 10) || 0;
        acc.total_beneficiaries += parseInt(item.beneficiary_count, 10) || 0;
        return acc;
      },
      {
        total_sent: 0,
        total_received: 0,
        total_failed: 0,
        total_partial: 0,
        total_beneficiaries: 0,
      },
    );
  }, [data]);

  const overallSuccessRate =
    totals.total_sent > 0
      ? (totals.total_received / totals.total_sent) * 100
      : 0;

  const StatCard = ({ title, value, icon, colorClass }) => (
    <div
      className={`bg-white p-4 rounded-xl shadow-md flex items-center ${colorClass} border border-transparent hover:border-intigizi-green-light transition-colors`}
    >
      <div className="flex-shrink-0 mr-3 p-3 rounded-full bg-gray-50">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-4 selection:bg-intigizi-green-light selection:text-intigizi-green-dark">
      <PageHeader title="Laporan Kinerja Distribusi" />
      <p className="mb-6 text-gray-600">
        Analisis pengiriman, penerimaan, dan tingkat keberhasilan distribusi per
        titik lokasi.
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
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Total Terkirim"
              value={totals.total_sent.toLocaleString("id-ID")}
              icon={<Truck size={24} className="text-intigizi-green-dark" />}
            />
            <StatCard
              title="Total Diterima"
              value={totals.total_received.toLocaleString("id-ID")}
              icon={<TrendingUp size={24} className="text-intigizi-green" />}
            />
            <StatCard
              title="Total Gagal Kirim"
              value={totals.total_failed.toLocaleString("id-ID")}
              icon={<TrendingDown size={24} className="text-red-500" />}
            />
            <StatCard
              title="Tingkat Keberhasilan"
              value={`${overallSuccessRate.toFixed(1)}%`}
              icon={
                <LineChartIcon size={24} className="text-intigizi-orange" />
              }
            />
          </div>

          {/* Chart Section */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-l-4 border-intigizi-green pl-3">
              Grafik Per Titik Distribusi
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart
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
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                  axisLine={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                  domain={[0, 100]}
                  unit="%"
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value, name) => [
                    name === "success_rate" ? `${value}%` : value,
                    name === "success_rate" ? "Keberhasilan" : name,
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
                  dataKey="total_sent"
                  name="Terkirim"
                  fill="#205A4E"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  yAxisId="left"
                  dataKey="total_received"
                  name="Diterima"
                  fill="#8CC344"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="success_rate"
                  name="Keberhasilan"
                  stroke="#F28D35"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#F28D35", strokeWidth: 0 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Table Section */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-l-4 border-intigizi-orange pl-3">
              Rincian Data Distribusi
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                    >
                      Titik Distribusi
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider"
                    >
                      Total Penerima
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider"
                    >
                      Terkirim
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider"
                    >
                      Diterima
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider"
                    >
                      Gagal
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider"
                    >
                      Sebagian
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider"
                    >
                      Tingkat Berhasil
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {data.map((item) => (
                    <tr
                      key={item.distribution_point_name}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.distribution_point_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        {parseInt(item.beneficiary_count || 0).toLocaleString(
                          "id-ID",
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        {parseInt(item.total_sent || 0).toLocaleString("id-ID")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        {parseInt(item.total_received || 0).toLocaleString(
                          "id-ID",
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        {parseInt(item.total_failed || 0).toLocaleString(
                          "id-ID",
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        {parseInt(item.total_partial || 0).toLocaleString(
                          "id-ID",
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold">
                        <span
                          className={`${parseFloat(item.success_rate) >= 90 ? "text-green-600" : parseFloat(item.success_rate) >= 70 ? "text-yellow-600" : "text-red-600"}`}
                        >
                          {parseFloat(item.success_rate || 0).toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default DistributionPerformancePage;
