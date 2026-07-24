import React, { useState, useEffect } from "react";
import apiClient from "@/services/api";
import { useNotification } from "@/context/NotificationContext";
import PageHeader from "@/components/PageHeader";
import { Receipt, Loader2, Calendar, Search } from "lucide-react";

function BpPajakPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ pungutan: 0, setoran: 0 });
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
        "/financials/reports_get_bp_pajak.php",
        {
          params: filters,
        },
      );
      const transactions = Array.isArray(response.data) ? response.data : [];
      setData(transactions);

      const pungutanTotal = transactions.reduce(
        (acc, item) =>
          item.type === "Pungutan" ? acc + parseFloat(item.amount) : acc,
        0,
      );
      const setoranTotal = transactions.reduce(
        (acc, item) =>
          item.type === "Setoran" ? acc + parseFloat(item.amount) : acc,
        0,
      );
      setTotals({ pungutan: pungutanTotal, setoran: setoranTotal });
    } catch (error) {
      showNotification("Gagal mengambil data laporan", "error");
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

  const formatCurrency = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="container mx-auto p-4">
      <PageHeader title="Buku Pembantu Pajak" />
      <p className="mb-6 text-gray-600">
        Laporan ini merinci semua transaksi pemungutan dan penyetoran pajak.
      </p>

      {/* Filter Section */}
      <div className="mb-6 p-4 bg-white rounded-xl shadow-md">
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
              className="btn-primary w-full flex items-center justify-center"
              disabled={loading}
            >
              <Search size={18} className="mr-2" />
              Terapkan Filter
            </button>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4 border-l-4 border-intigizi-green pl-3 flex items-center">
          <Receipt size={20} className="mr-2 text-intigizi-green" /> Rincian
          Pajak
        </h3>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-intigizi-green" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider"
                  >
                    Tanggal
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider"
                  >
                    Keterangan
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider"
                  >
                    Akun Debet
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider"
                  >
                    Akun Kredit
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider"
                  >
                    Jumlah (Rp)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((item) => (
                  <tr
                    key={item.id}
                    className={
                      item.type === "Pungutan"
                        ? "bg-yellow-50 hover:bg-yellow-100 transition-colors"
                        : "bg-green-50 hover:bg-green-100 transition-colors"
                    }
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(item.transaction_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.debit_account_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.credit_account_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right font-medium">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-4 text-center text-sm text-gray-500 italic"
                    >
                      Tidak ada data untuk periode ini.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-3 text-right text-sm font-bold text-gray-800 uppercase"
                  >
                    Total Pungutan
                  </td>
                  <td className="px-6 py-3 text-right text-sm font-bold text-yellow-700">
                    {formatCurrency(totals.pungutan)}
                  </td>
                </tr>
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-3 text-right text-sm font-bold text-gray-800 uppercase"
                  >
                    Total Setoran
                  </td>
                  <td className="px-6 py-3 text-right text-sm font-bold text-green-700">
                    {formatCurrency(totals.setoran)}
                  </td>
                </tr>
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-3 text-right text-sm font-bold text-gray-800 uppercase"
                  >
                    Saldo Pajak (Belum Disetor)
                  </td>
                  <td className="px-6 py-3 text-right text-sm font-bold text-gray-800 border-t border-gray-300">
                    {formatCurrency(totals.pungutan - totals.setoran)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default BpPajakPage;
