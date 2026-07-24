import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import apiClient from "@/services/api";
import { useNotification } from "@/context/NotificationContext";
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  FileText,
  Wallet,
  Circle,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

// Komponen Kartu KPI dengan branding IntiGizi
const KpiCard = ({ title, value, icon, format = "currency" }) => {
  const formattedValue =
    format === "currency"
      ? new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          minimumFractionDigits: 0,
        }).format(value)
      : value;

  return (
    <div className="bg-white p-4 rounded-xl shadow-md flex items-start justify-between border border-transparent hover:border-intigizi-green-light transition-colors">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{formattedValue}</p>
      </div>
      {/* PERUBAHAN: Warna ikon diubah ke palet IntiGizi */}
      <div className="bg-green-50 text-intigizi-green-dark p-2 rounded-full">
        {icon}
      </div>
    </div>
  );
};

// Halaman Laporan Keuangan yang disesuaikan dengan branding IntiGizi
function FinancialReportPage() {
  const [reportData, setReportData] = useState({
    summary: {
      total_estimated_budget: 0,
      total_realized_spending: 0,
      variance: 0,
    },
    spending_breakdown: { procurement: 0, operational: 0 },
    recent_pos: [],
    recent_expenses: [],
  });
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();
  const [dates, setDates] = useState({
    start: new Date(new Date().setDate(1)).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(
          `/financial_report_get.php?start_date=${dates.start}&end_date=${dates.end}`,
        );
        setReportData(response.data);
      } catch (error) {
        showNotification("Gagal memuat data laporan keuangan.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [dates, showNotification]);

  const handleDateChange = (e) => {
    setDates((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);

  // Data dan warna IntiGizi untuk PieChart
  const pieChartData = [
    {
      name: "Bahan Baku (PO)",
      value: reportData.spending_breakdown.procurement || 0,
    },
    {
      name: "Biaya Operasional",
      value: reportData.spending_breakdown.operational || 0,
    },
  ];
  // PERUBAHAN: Warna diganti ke palet IntiGizi
  const COLORS = ["#8CC344", "#F28D35"]; // intigizi-green, intigizi-orange
  const totalSpending = reportData.summary.total_realized_spending;

  const CustomLegend = () => (
    <div className="w-full mt-4 space-y-2">
      {pieChartData.map((entry, index) => (
        <div
          key={`legend-${index}`}
          className="flex items-center justify-between text-sm"
        >
          <div className="flex items-center">
            <div
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
              className="w-3 h-3 rounded-full mr-2 shadow-sm"
            ></div>
            <span className="text-gray-600 font-medium">{entry.name}</span>
          </div>
          <div className="text-right">
            <span className="font-bold text-gray-800">
              {formatCurrency(entry.value)}
            </span>
            <span className="text-xs text-gray-500 ml-2">
              (
              {totalSpending > 0
                ? ((entry.value / totalSpending) * 100).toFixed(1)
                : 0}
              %)
            </span>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="selection:bg-intigizi-green-light selection:text-intigizi-green-dark">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Laporan Keuangan</h1>
        <div className="flex items-center space-x-2 bg-white p-2 rounded-lg shadow-sm border border-gray-200">
          <input
            type="date"
            name="start"
            value={dates.start}
            onChange={handleDateChange}
            className="input-style py-1 text-sm border-none focus:ring-0"
          />
          <span className="text-gray-400">-</span>
          <input
            type="date"
            name="end"
            value={dates.end}
            onChange={handleDateChange}
            className="input-style py-1 text-sm border-none focus:ring-0"
          />
        </div>
      </div>

      {loading ? (
        // PERUBAHAN: Warna loader
        <div className="flex justify-center items-center p-8">
          <Loader2 className="animate-spin text-intigizi-green" size={32} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <KpiCard
              title="Total Anggaran Proposal"
              value={reportData.summary.total_estimated_budget}
              icon={<FileText size={20} />}
            />
            <KpiCard
              title="Total Realisasi Belanja"
              value={reportData.summary.total_realized_spending}
              icon={<TrendingDown size={20} />}
            />
            <KpiCard
              title="Selisih (Varian)"
              value={reportData.summary.variance}
              icon={<TrendingUp size={20} />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col">
              <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center">
                <Wallet size={20} className="mr-2 text-intigizi-orange" />{" "}
                Komposisi Belanja
              </h2>
              <div className="flex-grow flex items-center justify-center">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <CustomLegend />
            </div>
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4 border-l-4 border-intigizi-green pl-3">
                  5 Purchase Order Terakhir
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 font-bold uppercase bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 rounded-l-lg">Kode PO</th>
                        <th className="px-4 py-3">Supplier</th>
                        <th className="px-4 py-3 text-right">Jumlah</th>
                        <th className="px-4 py-3 text-center rounded-r-lg">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.recent_pos.length > 0 ? (
                        reportData.recent_pos.map((po) => (
                          <tr
                            key={po.id}
                            className="border-b last:border-b-0 hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-4 py-3 font-medium text-intigizi-green-dark">
                              {po.po_code}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {po.supplier_name}
                            </td>
                            <td className="px-4 py-3 text-right font-bold">
                              {formatCurrency(po.total_amount)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {/* PERUBAHAN: Warna link */}
                              <Link
                                to={`/app/purchase-orders/${po.id}`}
                                className="text-gray-400 hover:text-intigizi-green transition-colors"
                              >
                                <ArrowRight
                                  size={18}
                                  className="inline-block"
                                />
                              </Link>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="4"
                            className="text-center py-8 text-gray-500 italic"
                          >
                            Tidak ada data PO pada periode ini.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4 border-l-4 border-intigizi-orange pl-3">
                  5 Biaya Operasional Terakhir
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 font-bold uppercase bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 rounded-l-lg">Deskripsi</th>
                        <th className="px-4 py-3">Kategori</th>
                        <th className="px-4 py-3 text-right rounded-r-lg">
                          Jumlah
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.recent_expenses.length > 0 ? (
                        reportData.recent_expenses.map((exp) => (
                          <tr
                            key={exp.id}
                            className="border-b last:border-b-0 hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-4 py-3 font-medium text-gray-800">
                              {exp.description}
                            </td>
                            <td className="px-4 py-3">
                              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                                {exp.category_name}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-intigizi-green-dark">
                              {formatCurrency(exp.amount)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="3"
                            className="text-center py-8 text-gray-500 italic"
                          >
                            Tidak ada biaya operasional pada periode ini.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default FinancialReportPage;
