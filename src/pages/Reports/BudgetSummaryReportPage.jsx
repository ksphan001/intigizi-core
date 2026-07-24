import React, { useState, useEffect, useMemo } from "react";
import apiClient from "@/services/api";
import { useNotification } from "@/context/NotificationContext";
import PageHeader from "@/components/PageHeader";
import { PieChart, Loader2 } from "lucide-react";
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

function BudgetSummaryReportPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/reports_get_budget_summary.php");
      setData(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      showNotification("Gagal mengambil data laporan anggaran", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const chartData = useMemo(() => {
    return data.map((item) => ({
      name: item.proposal_code,
      total_estimated_budget: parseFloat(item.total_estimated_budget),
      total_realized_spending: parseFloat(item.total_realized_spending),
    }));
  }, [data]);

  const totals = useMemo(() => {
    return data.reduce(
      (acc, item) => {
        acc.total_estimated_budget += parseFloat(item.total_estimated_budget);
        acc.total_realized_spending += parseFloat(item.total_realized_spending);
        return acc;
      },
      { total_estimated_budget: 0, total_realized_spending: 0 },
    );
  }, [data]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);

  return (
    <div className="container mx-auto p-4 selection:bg-intigizi-green-light selection:text-intigizi-green-dark">
      <PageHeader title="Laporan Ringkasan Anggaran" />
      <p className="mb-6 text-gray-600">
        Perbandingan antara estimasi anggaran (berdasarkan HPP resep) dan
        realisasi belanja (berdasarkan PO) untuk setiap proposal yang disetujui.
      </p>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-intigizi-green" />
        </div>
      ) : (
        <>
          {/* Chart Section */}
          <div className="bg-white p-6 rounded-xl shadow-md mb-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-l-4 border-intigizi-green pl-3">
              Grafik Anggaran vs Realisasi per Proposal
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
                  tickFormatter={formatCurrency}
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="total_estimated_budget"
                  name="Estimasi Anggaran"
                  fill="#269636"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="total_realized_spending"
                  name="Realisasi Belanja"
                  fill="#F28D35"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Table Section */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-l-4 border-intigizi-orange pl-3">
              Rincian Data Anggaran
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                    >
                      Proposal
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider"
                    >
                      Estimasi Anggaran (Rp)
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider"
                    >
                      Realisasi Belanja (Rp)
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider"
                    >
                      Selisih (Rp)
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider"
                    >
                      Penggunaan (%)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {data.map((item) => {
                    const estimated = parseFloat(item.total_estimated_budget);
                    const realized = parseFloat(item.total_realized_spending);
                    const variance = estimated - realized;
                    const usage =
                      estimated > 0 ? (realized / estimated) * 100 : 0;
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.proposal_code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          {formatCurrency(estimated)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          {formatCurrency(realized)}
                        </td>
                        <td
                          className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${variance < 0 ? "text-red-600" : "text-green-600"}`}
                        >
                          {formatCurrency(variance)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${usage > 100 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}
                          >
                            {usage.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50 font-bold border-t-2 border-gray-200">
                  <tr>
                    <td className="px-6 py-4 text-left text-sm text-gray-800 uppercase">
                      Total
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-800">
                      {formatCurrency(totals.total_estimated_budget)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-800">
                      {formatCurrency(totals.total_realized_spending)}
                    </td>
                    <td
                      className={`px-6 py-4 text-right text-sm ${totals.total_estimated_budget - totals.total_realized_spending < 0 ? "text-red-600" : "text-green-600"}`}
                    >
                      {formatCurrency(
                        totals.total_estimated_budget -
                          totals.total_realized_spending,
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-800">
                      {totals.total_estimated_budget > 0
                        ? (
                            (totals.total_realized_spending /
                              totals.total_estimated_budget) *
                            100
                          ).toFixed(1)
                        : 0}
                      %
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default BudgetSummaryReportPage;
