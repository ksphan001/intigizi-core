import React, { useState, useEffect, useCallback, useMemo } from "react";
import apiClient from "@/services/api";
import PageHeader from "@/components/PageHeader";
import {
  Loader2,
  Calendar,
  Building,
  CookingPot,
  Truck,
  Wallet,
  Users,
  UserCheck,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Pie,
  Cell,
} from "recharts";

// Komponen Kartu Statistik yang disempurnakan
const StatCard = ({ icon, title, value, loading }) => (
  <div className="bg-white p-6 rounded-xl shadow-md flex items-center space-x-4 transition-all hover:shadow-lg hover:-translate-y-1 border border-transparent hover:border-intigizi-green-light">
    <div className="bg-green-50 p-4 rounded-full text-intigizi-green-dark">
      {icon}
    </div>
    <div>
      <p className="text-sm font-bold text-gray-500">{title}</p>
      {loading ? (
        <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mt-1"></div>
      ) : (
        <p className="text-3xl font-bold text-gray-800">{value}</p>
      )}
    </div>
  </div>
);

// --- KOMPONEN GRAFIK KUSTOM (HANYA UNTUK YANG STABIL) ---

const CustomBarChart = ({ data, title }) => {
  const maxValue = useMemo(
    () => (data.length > 0 ? Math.max(...data.map((item) => item.count)) : 1),
    [data],
  );
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center border-l-4 border-intigizi-orange pl-3">
        <Building size={20} className="mr-3 text-intigizi-orange" /> {title}
      </h3>
      {data.length > 0 ? (
        data.map((item) => (
          <div key={item.province_name} className="flex items-center group">
            <div className="w-1/3 sm:w-1/4 text-sm font-medium text-gray-600 text-right pr-4 truncate">
              {item.province_name}
            </div>
            <div className="w-2/3 sm:w-3/4 flex items-center">
              <div className="w-full bg-gray-100 rounded-full h-8 relative">
                <div
                  className="bg-intigizi-green-dark h-8 rounded-full flex items-center justify-between px-3 transition-all duration-500 ease-out group-hover:bg-intigizi-green"
                  style={{ width: `${(item.count / maxValue) * 100}%` }}
                >
                  <span className="text-white text-xs font-bold">
                    {item.count} Mitra
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))
      ) : (
        <p className="text-center text-gray-500 py-8">
          Tidak ada data sebaran mitra.
        </p>
      )}
    </div>
  );
};

const CustomPieChart = ({ data, colors, title }) => {
  const total = useMemo(
    () => data.reduce((sum, item) => sum + item.count, 0),
    [data],
  );
  return (
    <div className="h-full flex flex-col">
      <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center border-l-4 border-intigizi-green pl-3">
        <PieChartIcon size={20} className="mr-3 text-intigizi-green" /> {title}
      </h3>
      <div className="flex-grow space-y-3">
        {data.map((item, index) => {
          const percentage = total > 0 ? (item.count / total) * 100 : 0;
          return (
            <div key={item.status}>
              <div className="flex justify-between text-sm font-medium mb-1">
                <span className="text-gray-700 capitalize">{item.status}</span>
                <span className="text-gray-500">
                  {item.count} Mitra ({percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="h-2.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: colors[index % colors.length],
                  }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- KOMPONEN UTAMA HALAMAN ---

function SuperAdminAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });
  const [activePreset, setActivePreset] = useState("today");
  const [selectedKitchen, setSelectedKitchen] = useState("");

  const setDatePreset = (preset) => {
    setActivePreset(preset);
    const end = new Date();
    let start = new Date();
    if (preset === "7days") start.setDate(end.getDate() - 6);
    else if (preset === "30days") start.setDate(end.getDate() - 29);
    setDateRange({
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    });
  };

  const handleDateChange = (e) => {
    setActivePreset("custom");
    setDateRange((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        start_date: dateRange.start,
        end_date: dateRange.end,
        org_id: selectedKitchen,
      };
      const response = await apiClient.get("/superadmin_get_analytics.php", {
        params,
      });
      setData(response.data);
    } catch (err) {
      setError("Gagal memuat data analitik.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [dateRange, selectedKitchen]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatNumber = (num) => parseInt(num || 0).toLocaleString("id-ID");
  const formatCurrency = (num) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num || 0);

  const chartDataDaily = useMemo(
    () =>
      data?.daily_chart?.map((item) => ({
        ...item,
        date: new Date(item.date).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
        }),
        Produksi: parseInt(item.total_production, 10),
        Distribusi: parseInt(item.total_distribution, 10),
      })) || [],
    [data],
  );

  const subscriptionChartData = useMemo(
    () => data?.subscription_summary || [],
    [data],
  );
  const provinceChartData = useMemo(
    () => [...(data?.province_summary || [])].sort((a, b) => b.count - a.count),
    [data],
  );

  const COLORS = ["#8CC344", "#F28D35", "#269636", "#EF4444"]; // IntiGizi Colors

  return (
    <div className="space-y-6 container mx-auto p-4 selection:bg-intigizi-green-light selection:text-intigizi-green-dark">
      <PageHeader title="Analitik Platform" />

      <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setDatePreset("today")}
              className={`text-sm px-3 py-1.5 rounded-md font-medium transition-colors ${activePreset === "today" ? "bg-intigizi-green text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => setDatePreset("7days")}
              className={`text-sm px-3 py-1.5 rounded-md font-medium transition-colors ${activePreset === "7days" ? "bg-intigizi-green text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              7 Hari
            </button>
            <button
              onClick={() => setDatePreset("30days")}
              className={`text-sm px-3 py-1.5 rounded-md font-medium transition-colors ${activePreset === "30days" ? "bg-intigizi-green text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              30 Hari
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">
                Dari
              </label>
              <input
                type="date"
                name="start"
                value={dateRange.start}
                onChange={handleDateChange}
                className="input-style py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">
                Sampai
              </label>
              <input
                type="date"
                name="end"
                value={dateRange.end}
                onChange={handleDateChange}
                className="input-style py-1.5 text-sm"
              />
            </div>
          </div>
          <div className="flex-grow min-w-[200px]">
            <label className="block text-xs font-bold text-gray-600 mb-1">
              Filter Dapur
            </label>
            <select
              value={selectedKitchen}
              onChange={(e) => setSelectedKitchen(e.target.value)}
              className="input-style bg-white w-full py-1.5 text-sm"
            >
              <option value="">Semua Dapur Mitra</option>
              {data?.kitchen_list?.map((kitchen) => (
                <option key={kitchen.id} value={kitchen.id}>
                  {kitchen.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-red-500 text-center p-4 bg-red-50 rounded-lg border border-red-100">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <StatCard
          icon={<Building size={24} />}
          title="Total Mitra Aktif"
          value={formatNumber(data?.kpi.active_kitchens)}
          loading={loading}
        />
        <StatCard
          icon={<Users size={24} />}
          title="Total Vendor Aktif"
          value={formatNumber(data?.kpi.total_vendors)}
          loading={loading}
        />
        <StatCard
          icon={<UserCheck size={24} />}
          title="Persetujuan Tertunda"
          value={formatNumber(data?.kpi.pending_registrations)}
          loading={loading}
        />
        <StatCard
          icon={<Wallet size={24} />}
          title="Total Pendapatan"
          value={formatCurrency(data?.kpi.total_revenue)}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center border-l-4 border-intigizi-green pl-3">
            <BarChartIcon size={20} className="mr-3 text-intigizi-green" />{" "}
            Aktivitas Harian
          </h3>
          {loading ? (
            <div className="h-80 flex justify-center items-center">
              <Loader2 className="animate-spin text-intigizi-green" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={chartDataDaily}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f0f0f0"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                  axisLine={{ stroke: "#E5E7EB" }}
                />
                <YAxis
                  tickFormatter={(val) =>
                    new Intl.NumberFormat("id-ID", {
                      notation: "compact",
                    }).format(val)
                  }
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(val) => `${formatNumber(val)} porsi`}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Produksi"
                  stroke="#269636"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#269636" }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="Distribusi"
                  stroke="#F28D35"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#F28D35" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          {loading ? (
            <div className="h-80 flex justify-center items-center">
              <Loader2 className="animate-spin text-intigizi-green" />
            </div>
          ) : (
            <CustomPieChart
              data={subscriptionChartData}
              colors={COLORS}
              title="Status Langganan Mitra"
            />
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        {loading ? (
          <div className="h-96 flex justify-center items-center">
            <Loader2 className="animate-spin text-intigizi-green" />
          </div>
        ) : (
          <CustomBarChart
            data={provinceChartData}
            title="Sebaran Mitra per Provinsi"
          />
        )}
      </div>
    </div>
  );
}

export default SuperAdminAnalyticsPage;
