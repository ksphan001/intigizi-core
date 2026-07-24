import React, { useState, useEffect, useCallback, useMemo } from "react";
import apiClient from "@/services/api";
import PageHeader from "@/components/PageHeader";
import {
  Loader2,
  Download,
  DollarSign,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useNotification } from "@/context/NotificationContext";

// Komponen Kartu Statistik untuk ringkasan
const StatCard = ({ icon, title, value, loading, valueClass = "" }) => (
  <div className="bg-white p-5 rounded-xl shadow-md flex items-start space-x-4 overflow-hidden">
    <div className="bg-blue-50 p-3 rounded-full flex-shrink-0">{icon}</div>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
      {loading ? (
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mt-1"></div>
      ) : (
        <p
          className={`text-2xl font-bold text-gray-800 break-words ${valueClass}`}
        >
          {value}
        </p>
      )}
    </div>
  </div>
);

function BkuReportPage() {
  const [reportData, setReportData] = useState({
    opening_balance: 0,
    transactions: [],
    total_debit: 0,
    total_credit: 0,
    closing_balance: 0,
  });
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { showNotification } = useNotification();

  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [filters, setFilters] = useState({
    start_date: firstDayOfMonth.toISOString().split("T")[0],
    end_date: today.toISOString().split("T")[0],
    account_id: "",
  });

  const fetchInitialData = useCallback(async () => {
    try {
      const accResponse = await apiClient.get("/financials/accounts_get.php");
      const cashAndBankAccounts = accResponse.data.filter((acc) =>
        ["Kas Tunai", "Kas di Bank"].includes(acc.name),
      );
      setAccounts(cashAndBankAccounts);
      if (cashAndBankAccounts.length > 0 && !filters.account_id) {
        setFilters((prev) => ({
          ...prev,
          account_id: cashAndBankAccounts[0].id,
        }));
      }
    } catch (err) {
      showNotification("Gagal memuat daftar akun.", "error");
    }
  }, [showNotification, filters.account_id]);

  const fetchReport = useCallback(async () => {
    if (!filters.account_id) return;
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.get("/financials/reports_get_bku.php", {
        params: filters,
      });
      setReportData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Gagal memuat laporan BKU.");
      setReportData({
        opening_balance: 0,
        transactions: [],
        total_debit: 0,
        total_credit: 0,
        closing_balance: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    if (filters.account_id) {
      fetchReport();
    }
  }, [fetchReport, filters.account_id]);

  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(value);
  const formatDate = (date) =>
    new Date(date + "T00:00:00Z").toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="space-y-6">
      <PageHeader title="Laporan Buku Kas Umum (BKU)" />

      <div className="bg-white p-4 rounded-xl shadow-md">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="text-xs">Akun Kas/Bank</label>
            <select
              name="account_id"
              value={filters.account_id}
              onChange={handleFilterChange}
              className="input-style bg-white"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs">Dari</label>
            <input
              type="date"
              name="start_date"
              value={filters.start_date}
              onChange={handleFilterChange}
              className="input-style"
            />
          </div>
          <div>
            <label className="text-xs">Sampai</label>
            <input
              type="date"
              name="end_date"
              value={filters.end_date}
              onChange={handleFilterChange}
              className="input-style"
            />
          </div>
          <button
            onClick={fetchReport}
            disabled={loading}
            className="btn-primary"
          >
            Tampilkan
          </button>
          <button
            disabled
            className="btn-secondary ml-auto disabled:opacity-50"
          >
            <Download size={16} className="mr-2" /> Unduh
          </button>
        </div>
      </div>

      {error && (
        <p className="text-red-500 p-4 bg-red-50 rounded-lg">{error}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<DollarSign size={24} className="text-intigizi-green" />}
          title="Saldo Awal"
          value={formatCurrency(reportData.opening_balance)}
          loading={loading}
        />
        <StatCard
          icon={<ArrowUp size={24} className="text-green-500" />}
          title="Total Pemasukan"
          value={formatCurrency(reportData.total_debit)}
          loading={loading}
        />
        <StatCard
          icon={<ArrowDown size={24} className="text-red-500" />}
          title="Total Pengeluaran"
          value={formatCurrency(reportData.total_credit)}
          loading={loading}
        />
        <StatCard
          icon={<DollarSign size={24} className="text-intigizi-green" />}
          title="Saldo Akhir"
          value={formatCurrency(reportData.closing_balance)}
          loading={loading}
        />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="font-semibold text-lg text-gray-800 mb-4">
          Rincian Transaksi
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">Tanggal</th>
                <th className="px-6 py-3">Uraian</th>
                <th className="px-6 py-3 text-right">Debet (Masuk)</th>
                <th className="px-6 py-3 text-right">Kredit (Keluar)</th>
                <th className="px-6 py-3 text-right">Saldo</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-gray-50 font-semibold">
                <td colSpan="4" className="px-6 py-3">
                  SALDO AWAL
                </td>
                <td className="px-6 py-3 text-right">
                  {formatCurrency(reportData.opening_balance)}
                </td>
              </tr>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-8">
                    <Loader2 className="animate-spin inline-block" />
                  </td>
                </tr>
              ) : reportData.transactions.length > 0 ? (
                reportData.transactions.map((item) => (
                  <tr
                    key={item.id}
                    className="bg-white border-b hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      {formatDate(item.transaction_date)}
                    </td>
                    <td className="px-6 py-4">{item.description}</td>
                    <td className="px-6 py-4 text-right text-green-600">
                      {item.debit > 0 ? formatCurrency(item.debit) : "-"}
                    </td>
                    <td className="px-6 py-4 text-right text-red-600">
                      {item.credit > 0 ? formatCurrency(item.credit) : "-"}
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      {formatCurrency(item.balance)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-500">
                    Tidak ada transaksi pada periode ini.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="font-bold text-gray-900 bg-gray-100">
              <tr>
                <td colSpan="2" className="px-6 py-3 text-right">
                  TOTAL PERIODE INI
                </td>
                <td className="px-6 py-3 text-right">
                  {formatCurrency(reportData.total_debit)}
                </td>
                <td className="px-6 py-3 text-right">
                  {formatCurrency(reportData.total_credit)}
                </td>
                <td className="px-6 py-3 text-right">
                  {formatCurrency(reportData.closing_balance)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

export default BkuReportPage;
