// File: src/pages/DashboardPage.jsx
// Penjelasan: Dashboard utama dengan layout baru.
// UPDATE: Peta disusun vertikal (full width container) dengan daftar detail di samping.
// Kartu samping dipindahkan ke grid utama untuk keseimbangan layout.

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import apiClient from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Utensils,
  Package,
  Truck,
  ClipboardList,
  PackagePlus,
  FileText,
  CalendarDays,
  AlertTriangle,
  Wallet,
  MapPin,
  Loader2,
  User,
  ArrowRight,
} from "lucide-react";
import DistributionMap from "@/components/DistributionMap.jsx";
import TrackingMap from "@/components/TrackingMap.jsx";

const StatCard = ({ icon, title, value, loading }) => (
  <div className="bg-white p-5 rounded-xl shadow-md flex items-center space-x-4 transition-all hover:shadow-lg hover:-translate-y-1 border border-gray-100">
    <div className="bg-blue-50 p-3 rounded-full">{icon}</div>
    <div>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      {loading ? (
        <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mt-1"></div>
      ) : (
        <p className="text-2xl font-bold text-gray-800">
          {value?.toLocaleString("id-ID") ?? "0"}
        </p>
      )}
    </div>
  </div>
);

function DashboardPage() {
  const { user, selectedSppgId } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // --- STATE LIVE TRACKING MULTI-KURIR ---
  const [trackingData, setTrackingData] = useState(null);
  const [couriers, setCouriers] = useState([]);

  useEffect(() => {
    if (user) {
      const roleId = Number(user.role_id);
      if (roleId === 8) navigate("/app/admin/dashboard");
      else if (roleId === 5)
        navigate(
          user.org_type === "Vendor"
            ? "/app/vendor/dashboard"
            : "/app/supplier/dashboard",
        );
      else if (roleId === 9) navigate("/app/investor/dashboard");
      else if (roleId === 10) navigate("/app/funding/dashboard");
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const params = {};
        if (selectedSppgId) {
          params.sppg_id = selectedSppgId;
        }
        const summaryRes = await apiClient.get("/dashboard_summary.php", { params });
        setSummary(summaryRes.data);
      } catch (err) {
        setError("Gagal memuat data dashboard.");
      } finally {
        setLoading(false);
      }
    };

    const fetchTracking = async () => {
      if (!user?.organization_id) return;
      const today = new Date().toISOString().split("T")[0];
      try {
        const res = await apiClient.get("/public_get_distribution_track.php", {
          params: { org_id: user.organization_id, date: today },
        });
        setTrackingData(res.data);
      } catch (e) {
        console.log("Belum ada data tracking hari ini.");
      }
    };

    const fetchCouriers = async () => {
      if (!user?.organization_id) return;
      try {
        const res = await apiClient.get(
          `/public_get_courier_location.php?org_id=${user.organization_id}`,
        );
        if (res.data.found && Array.isArray(res.data.couriers)) {
          setCouriers(res.data.couriers);
        } else {
          setCouriers([]);
        }
      } catch (e) {
        console.error(e);
      }
    };

    if (user && ![5, 8, 9, 10].includes(Number(user.role_id))) {
      fetchData();
      fetchTracking();
      fetchCouriers();
      const interval = setInterval(fetchCouriers, 10000);
      return () => clearInterval(interval);
    } else if (user) {
      setLoading(false);
    }
  }, [user, selectedSppgId]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  const proposalData = useMemo(
    () =>
      summary && summary.proposal_summary
        ? [
            {
              name: "Disetujui",
              value: summary.proposal_summary.Disetujui || 0,
            },
            { name: "Diajukan", value: summary.proposal_summary.Diajukan || 0 },
            { name: "Draft", value: summary.proposal_summary.Draft || 0 },
            { name: "Ditolak", value: summary.proposal_summary.Ditolak || 0 },
          ]
        : [],
    [summary],
  );
  const distributionData = useMemo(
    () =>
      summary?.daily_distribution?.map((item) => ({
        date: new Date(item.date).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
        }),
        Dikirim: parseInt(item.sent, 10),
        Diterima: parseInt(item.received, 10) || 0,
      })) || [],
    [summary],
  );
  const budgetPercentage = useMemo(
    () =>
      !summary || !summary.total_estimated_budget
        ? 0
        : (summary.total_realized_spending / summary.total_estimated_budget) *
          100,
    [summary],
  );
  const nutritionStatusData = useMemo(
    () =>
      summary && summary.nutritional_status_summary
        ? [
            {
              name: "Sangat Kurus",
              value: summary.nutritional_status_summary["Sangat Kurus"] || 0,
            },
            {
              name: "Kurus",
              value: summary.nutritional_status_summary["Kurus"] || 0,
            },
            {
              name: "Normal",
              value: summary.nutritional_status_summary["Normal"] || 0,
            },
            {
              name: "Kelebihan BB",
              value: summary.nutritional_status_summary["Kelebihan Berat Badan"] || 0,
            },
            {
              name: "Obesitas",
              value: summary.nutritional_status_summary["Obesitas"] || 0,
            },
          ].filter(item => item.value > 0)
        : [],
    [summary],
  );
  const GIZINOW_COLORS = ["#8CC344", "#F28D35", "#269636", "#EF4444"]; // IntiGizi Colors
  const NUTRITION_COLORS = ["#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6"];

  if (loading || !user || [5, 8, 9, 10].includes(Number(user.role_id)))
    return (
      <div className="text-center p-8">
        <Loader2 className="animate-spin text-intigizi-green" />
      </div>
    );
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          Selamat Datang di Dasbor IntiGizi!
        </h1>
        <p className="text-gray-500">
          Berikut adalah ringkasan operasional dapur Anda, {user?.username}.
        </p>
      </div>

      {/* --- BARIS 1: KPI Cards --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Utensils size={24} className="text-intigizi-green-dark" />}
          title="Total Menu"
          value={summary?.total_menus}
          loading={loading}
        />
        <StatCard
          icon={<Package size={24} className="text-intigizi-green-dark" />}
          title="Total Bahan Baku"
          value={summary?.total_ingredients}
          loading={loading}
        />
        <StatCard
          icon={<Truck size={24} className="text-intigizi-green-dark" />}
          title="Total Supplier"
          value={summary?.total_suppliers}
          loading={loading}
        />
        <StatCard
          icon={
            <ClipboardList size={24} className="text-intigizi-green-dark" />
          }
          title="Proposal Disetujui"
          value={summary?.proposal_summary?.Disetujui}
          loading={loading}
        />
      </div>

      {/* --- BARIS 2: Grafik & Anggaran --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grafik Distribusi (Lebar 2/3) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-gray-700">
              Kinerja Distribusi (7 Hari Terakhir)
            </h3>
            <Link
              to="/app/distribution-reports"
              className="text-xs text-intigizi-green hover:underline font-medium flex items-center"
            >
              Detail <ArrowRight size={12} className="ml-1" />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={distributionData}
              margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorDiterima" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8CC344" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8CC344" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorDikirim" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A0AEC0" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#A0AEC0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#E2E8F0"
              />
              <XAxis
                dataKey="date"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
                formatter={(value) => `${value.toLocaleString("id-ID")} porsi`}
              />
              <Area
                type="monotone"
                dataKey="Dikirim"
                stroke="#A0AEC0"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorDikirim)"
              />
              <Area
                type="monotone"
                dataKey="Diterima"
                stroke="#8CC344"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorDiterima)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Ringkasan Anggaran & Proposal (Lebar 1/3) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <h3 className="font-semibold text-gray-700 mb-4 flex items-center">
              <Wallet size={20} className="mr-2 text-intigizi-green-dark" />{" "}
              Ringkasan Anggaran
            </h3>
            <div className="flex justify-between items-end mb-2">
              <span className="text-2xl font-bold text-intigizi-green-dark">
                {formatCurrency(summary?.total_realized_spending)}
              </span>
            </div>
            <div className="text-xs text-gray-500 mb-3">
              dari total anggaran{" "}
              {formatCurrency(summary?.total_estimated_budget)}
            </div>

            <div className="w-full bg-gray-100 rounded-full h-3 mb-2">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${budgetPercentage > 90 ? "bg-red-500" : "bg-intigizi-orange"}`}
                style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center text-xs font-medium">
              <span className="text-gray-600">
                {budgetPercentage.toFixed(1)}% Terpakai
              </span>
              <span className="text-green-600">
                Sisa:{" "}
                {formatCurrency(
                  (summary?.total_estimated_budget || 0) -
                    (summary?.total_realized_spending || 0),
                )}
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col justify-center">
            <h3 className="font-semibold text-gray-700 mb-2">
              Status Proposal
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={proposalData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={5}
                  >
                    {proposalData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={GIZINOW_COLORS[index % GIZINOW_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconSize={10}
                    wrapperStyle={{ fontSize: "11px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col justify-center">
            <h3 className="font-semibold text-gray-700 mb-1">
              Status Gizi Penerima
            </h3>
            <p className="text-[10px] text-gray-400 mb-2">Berdasarkan klasifikasi BMI anak terdaftar</p>
            <div className="h-48">
              {nutritionStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={nutritionStatusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={5}
                    >
                      {nutritionStatusData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={NUTRITION_COLORS[index % NUTRITION_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconSize={10}
                      wrapperStyle={{ fontSize: "10px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-xs text-gray-400 italic">
                  Belum ada data status gizi
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- BARIS 3: LIVE TRACKING (FULL WIDTH) --- */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800 flex items-center">
              <Truck size={20} className="mr-2 text-intigizi-orange" /> Live
              Tracking Pengantaran
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Pantau posisi kurir secara real-time untuk pengiriman hari ini.
            </p>
          </div>

          {couriers.length > 0 ? (
            <div className="flex items-center text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-full animate-pulse border border-green-200 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
              {couriers.length} KURIR AKTIF
            </div>
          ) : (
            <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
              Tidak ada kurir aktif saat ini
            </span>
          )}
        </div>

        <div className="flex flex-col lg:flex-row h-[500px]">
          {/* Peta Besar (Kiri) */}
          <div className="flex-grow h-full relative border-r border-gray-200">
            {trackingData ? (
              <TrackingMap
                mainKitchen={trackingData.main_kitchen}
                distributions={trackingData.distributions}
                couriers={couriers}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full bg-gray-50 text-gray-400 text-sm p-4 text-center">
                <CalendarDays size={48} className="mb-4 opacity-20" />
                <p>Belum ada jadwal pengiriman hari ini.</p>
              </div>
            )}
          </div>

          {/* Daftar Kurir (Kanan) */}
          <div className="w-full lg:w-80 bg-white flex flex-col border-l border-gray-100">
            <div className="p-4 bg-gray-50 border-b border-gray-100">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Armada Aktif
              </h4>
            </div>
            <div className="flex-grow overflow-y-auto p-4 space-y-3">
              {couriers.length > 0 ? (
                couriers.map((c) => (
                  <div
                    key={c.user_id}
                    className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm flex items-start hover:border-intigizi-green transition-colors"
                  >
                    <div className="bg-green-50 p-2 rounded-full mr-3">
                      <Truck size={16} className="text-intigizi-green" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">
                        {c.name}
                      </p>
                      <div className="mt-1 flex items-center text-xs text-green-600 font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></div>
                        Sedang Berjalan
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">
                        Update: {new Date(c.last_updated).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 px-4">
                  <Truck size={32} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-sm text-gray-400 italic">
                    Belum ada kurir yang memulai perjalanan.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- BARIS 4: PETA TITIK DISTRIBUSI (FULL WIDTH) --- */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 flex items-center">
            <MapPin size={20} className="mr-2 text-intigizi-green-dark" /> Peta
            Sebaran Titik Distribusi
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Lokasi sekolah, pesantren, dan titik layanan lainnya.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row h-[500px]">
          {/* Peta Besar (Kiri) */}
          <div className="flex-grow h-full relative border-r border-gray-200">
            <DistributionMap points={summary?.distribution_points || []} />
          </div>

          {/* Daftar Lokasi (Kanan) */}
          <div className="w-full lg:w-80 bg-white flex flex-col border-l border-gray-100">
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Daftar Lokasi
              </h4>
              <span className="text-xs font-semibold bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                {summary?.distribution_points?.length || 0}
              </span>
            </div>
            <div className="flex-grow overflow-y-auto p-2">
              {summary?.distribution_points &&
              summary.distribution_points.length > 0 ? (
                summary.distribution_points.map((point) => (
                  <div
                    key={point.id}
                    className="p-3 hover:bg-blue-50 rounded-lg border border-transparent hover:border-blue-100 transition-all group cursor-default mb-1"
                  >
                    <div className="flex items-start">
                      <MapPin
                        size={16}
                        className="text-gray-400 mt-0.5 mr-2 group-hover:text-intigizi-green transition-colors"
                      />
                      <div>
                        <p className="text-sm font-semibold text-gray-800 group-hover:text-intigizi-green transition-colors">
                          {point.name}
                        </p>
                        {selectedSppgId === "all" && point.organization_name && (
                          <span className="inline-block mt-0.5 text-[10px] font-semibold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                            SPPG: {point.organization_name}
                          </span>
                        )}
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                          {point.address}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 italic text-center py-10">
                  Belum ada titik distribusi.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- BARIS 5: Info Operasional & Aksi Cepat --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informasi Operasional */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
            <CalendarDays size={20} className="mr-2 text-intigizi-green" />{" "}
            Jadwal Produksi Mendatang
          </h3>
          <div className="space-y-3">
            {summary?.production_schedule?.slice(0, 4).map((item, index) => (
              <div
                key={`${item.serving_date}-${index}`}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100"
              >
                <div>
                  <p className="font-semibold text-gray-800 text-sm">
                    {item.menu_name}
                  </p>
                  {selectedSppgId === "all" && item.organization_name && (
                    <span className="inline-block text-[10px] bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded mt-0.5 font-medium">
                      {item.organization_name}
                    </span>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(item.serving_date).toLocaleDateString("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </p>
                </div>
                <span className="bg-green-100 text-intigizi-green-dark text-xs font-bold px-2 py-1 rounded">
                  {item.target_recipients.toLocaleString("id-ID")} Porsi
                </span>
              </div>
            ))}
            {summary?.production_schedule?.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4 italic">
                Tidak ada jadwal produksi dalam waktu dekat.
              </p>
            )}
          </div>

          {summary?.low_stock_items?.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h4 className="text-sm font-bold text-red-600 mb-3 flex items-center">
                <AlertTriangle size={16} className="mr-2" /> Perhatian: Stok
                Menipis
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {summary.low_stock_items.map((item) => (
                  <div
                    key={item.ingredient_id}
                    className="flex justify-between items-center p-2 bg-red-50 rounded border border-red-100"
                  >
                    <div>
                      <p className="text-xs font-medium text-red-800">
                        {item.ingredient_name}
                      </p>
                      {selectedSppgId === "all" && item.organization_name && (
                        <p className="text-[9px] text-gray-500 font-semibold mt-0.5">
                          {item.organization_name}
                        </p>
                      )}
                    </div>
                    <p className="text-xs font-bold text-red-600">
                      {parseFloat(item.current_quantity).toLocaleString(
                        "id-ID",
                      )}{" "}
                      <span className="font-normal">{item.unit_symbol}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Aksi Cepat */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Aksi Cepat</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/app/proposals"
              className="flex flex-col items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors border border-blue-100 group"
            >
              <ClipboardList
                size={28}
                className="text-blue-500 mb-2 group-hover:scale-110 transition-transform"
              />
              <span className="text-sm font-semibold text-gray-700">
                Buat Proposal
              </span>
            </Link>
            <Link
              to="/app/stock"
              className="flex flex-col items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors border border-green-100 group"
            >
              <PackagePlus
                size={28}
                className="text-green-600 mb-2 group-hover:scale-110 transition-transform"
              />
              <span className="text-sm font-semibold text-gray-700">
                Cek Stok
              </span>
            </Link>
            <Link
              to="/app/distribution-reports"
              className="flex flex-col items-center justify-center p-4 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors border border-orange-100 group"
            >
              <FileText
                size={28}
                className="text-orange-500 mb-2 group-hover:scale-110 transition-transform"
              />
              <span className="text-sm font-semibold text-gray-700">
                Lapor Distribusi
              </span>
            </Link>
            <Link
              to="/app/users"
              className="flex flex-col items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors border border-purple-100 group"
            >
              <User
                size={28}
                className="text-purple-600 mb-2 group-hover:scale-110 transition-transform"
              />
              <span className="text-sm font-semibold text-gray-700">
                Kelola Tim
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
export default DashboardPage;
