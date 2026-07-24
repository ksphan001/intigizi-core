import React, { useState, useEffect, useMemo } from "react";
import apiClient from "@/services/api";
import { useNotification } from "@/context/NotificationContext";
import PageHeader from "@/components/PageHeader";
import { BarChart3, Loader2, Calendar, Search, ArrowRight } from "lucide-react";
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
import Modal from "@/components/Modal";

function PurchaseReportPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailData, setDetailData] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState("");
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
      const response = await apiClient.get("/reports_get_purchase_orders.php", {
        params: filters,
      });
      setData(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      showNotification("Gagal mengambil data laporan pembelian", "error");
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

  const handleViewDetails = async (supplierName) => {
    setSelectedSupplier(supplierName);
    setLoadingDetail(true);
    setDetailModalOpen(true);
    try {
      const params = { ...filters, supplier_name: supplierName };
      const response = await apiClient.get(
        "/reports_get_purchase_details_by_supplier.php",
        { params },
      );
      setDetailData(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      showNotification("Gagal mengambil detail pembelian", "error");
      setDetailData([]);
    } finally {
      setLoadingDetail(false);
    }
  };

  const chartData = useMemo(() => {
    return data.map((item) => ({
      name: item.supplier_name,
      total_purchase_value: parseFloat(item.total_purchase_value),
      po_count: parseInt(item.po_count, 10),
    }));
  }, [data]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);

  return (
    <div className="container mx-auto p-4 selection:bg-intigizi-green-light selection:text-intigizi-green-dark">
      <PageHeader title="Laporan Pembelian" />
      <p className="mb-6 text-gray-600">
        Analisis total pembelian bahan baku yang dikelompokkan berdasarkan
        pemasok (supplier internal dan vendor eksternal).
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
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-l-4 border-intigizi-green pl-3">
              Grafik Total Pembelian per Pemasok
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ left: 100 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#f0f0f0"
                />
                <XAxis
                  type="number"
                  tickFormatter={formatCurrency}
                  tick={{ fontSize: 10, fill: "#6B7280" }}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={150}
                  tick={{ fontSize: 12, fill: "#4B5563" }}
                />
                <Tooltip
                  formatter={(value, name) => [
                    name === "total_purchase_value"
                      ? formatCurrency(value)
                      : `${value} PO`,
                    name === "total_purchase_value"
                      ? "Total Nilai (Rp)"
                      : "Jumlah PO",
                  ]}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="total_purchase_value"
                  fill="#269636"
                  name="Total Nilai (Rp)"
                  radius={[0, 4, 4, 0]}
                />
                <Bar
                  dataKey="po_count"
                  fill="#F28D35"
                  name="Jumlah PO"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Table Section */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-l-4 border-intigizi-orange pl-3">
              Rincian Data Pembelian
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                    >
                      Pemasok
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider"
                    >
                      Jumlah PO
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider"
                    >
                      Total Nilai (Rp)
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider"
                    >
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {data.map((item) => (
                    <tr
                      key={item.supplier_name}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.supplier_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        {item.po_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right font-medium">
                        {formatCurrency(item.total_purchase_value)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <button
                          onClick={() => handleViewDetails(item.supplier_name)}
                          className="text-intigizi-green hover:text-intigizi-green-dark hover:underline text-xs flex items-center justify-center w-full"
                        >
                          Lihat Rincian{" "}
                          <ArrowRight size={14} className="ml-1" />
                        </button>
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

      {/* Detail Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={`Rincian PO untuk ${selectedSupplier}`}
      >
        {loadingDetail ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-intigizi-green" />
          </div>
        ) : (
          <div className="overflow-x-auto max-h-96">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 bg-opacity-100 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                    Tanggal
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                    Kode PO
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                    Proposal
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">
                    Nilai (Rp)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {detailData.map((detail) => (
                  <tr
                    key={detail.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(detail.created_at).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-intigizi-green-dark">
                      {detail.po_code}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {detail.proposal_code}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 text-right font-medium">
                      {formatCurrency(detail.total_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default PurchaseReportPage;
