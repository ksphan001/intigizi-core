import React, { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Download, Printer, Calendar, Loader2 } from "lucide-react";
import { API_BASE_URL } from "@/config";

function PrintableReportsPage() {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState("lpa");
  const [filters, setFilters] = useState({
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    end_date: new Date().toISOString().split("T")[0],
  });

  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleDownload = async () => {
    setLoading(true);

    // Mendapatkan token dari localStorage
    const token = localStorage.getItem("authToken");
    if (!token) {
      alert("Sesi Anda telah berakhir. Silakan login kembali.");
      setLoading(false);
      return;
    }

    const reportUrl = `${API_BASE_URL}/financials/download_report_${reportType}.php`;
    const params = new URLSearchParams({
      start_date: filters.start_date,
      end_date: filters.end_date,
    }).toString();

    try {
      const response = await fetch(`${reportUrl}?${params}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Gagal mengunduh laporan: ${response.statusText}`);
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("content-disposition");
      let filename = `laporan_${reportType}.pdf`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch.length === 2) filename = filenameMatch[1];
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading report:", error);
      alert(
        "Terjadi kesalahan saat mencoba mengunduh laporan. Pastikan Anda terhubung ke internet.",
      );
    } finally {
      setLoading(false);
    }
  };

  const reportOptions = [
    { key: "lpa", name: "Laporan Penggunaan Anggaran (LPA)" },
    { key: "sptj", name: "Surat Pernyataan Tanggung Jawab (SPTJ)" },
    { key: "bapsd", name: "Berita Acara Pengalihan Sisa Dana (BAPSD)" },
    { key: "dafnom", name: "Daftar Nominatif Honorarium" },
  ];

  return (
    <div className="container mx-auto p-4">
      <PageHeader title="Laporan Cetak (PDF)" />
      <p className="mb-6 text-gray-600">
        Halaman ini digunakan untuk mengunduh laporan keuangan resmi berformat
        PDF sesuai standar pelaporan Tim IntiGizi.
      </p>

      <div className="bg-white p-6 rounded-xl shadow-md max-w-2xl mx-auto">
        <div className="space-y-4">
          {/* Pemilihan Laporan */}
          <div>
            <label
              htmlFor="reportType"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Pilih Jenis Laporan
            </label>
            <select
              id="reportType"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="input-style w-full"
            >
              {reportOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>

          {/* Pemilihan Periode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="start_date"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Tanggal Mulai Periode
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
                Tanggal Selesai Periode
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
          </div>

          {/* Info */}
          <div className="p-4 bg-blue-50 border-l-4 border-intigizi-green rounded-r-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <Printer className="h-5 w-5 text-intigizi-green" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-intigizi-green-dark">
                  Pastikan periode yang Anda pilih sudah benar. Sistem akan
                  mengambil semua data transaksi keuangan dalam rentang tanggal
                  tersebut untuk digabungkan ke dalam laporan.
                </p>
              </div>
            </div>
          </div>

          {/* Tombol Aksi */}
          <button
            onClick={handleDownload}
            className="w-full btn-primary flex items-center justify-center"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Download className="h-5 w-5 mr-2" />
            )}
            {loading
              ? "Memproses Laporan..."
              : `Unduh ${reportOptions.find((opt) => opt.key === reportType)?.name || ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PrintableReportsPage;
