import React, { useState, useEffect, useCallback } from "react";
import apiClient from "../../services/api";
import { API_BASE_URL, ASSET_BASE_URL } from "../../config";
import { useNotification } from "../../context/NotificationContext.jsx";
import { Loader2 } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import JournalEntryForm from "../../components/JournalEntryForm.jsx";
import Modal from "../../components/Modal.jsx";

function JournalPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();
  const [filters, setFilters] = useState({
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .slice(0, 10),
    end_date: new Date().toISOString().slice(0, 10),
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProof, setSelectedProof] = useState(null);
  const [imageError, setImageError] = useState(false);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/financials/journal_get.php", {
        params: filters,
      });
      setTransactions(response.data);
    } catch (error) {
      showNotification("Gagal memuat data jurnal umum.", "error");
    } finally {
      setLoading(false);
    }
  }, [filters, showNotification]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleFormSave = () => {
    fetchTransactions(); // Muat ulang data setelah menyimpan entri baru
  };

  return (
    <>
      {/* --- PERBAIKAN UTAMA DI SINI --- */}
      {/* Menggunakan PageHeader sesuai dengan properti yang Anda definisikan */}
      <PageHeader
        title="Jurnal Umum"
        buttonText="Tambah Jurnal Manual"
        onButtonClick={() => setIsFormOpen(true)}
      />

      <div className="mb-4 bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="date"
            name="start_date"
            value={filters.start_date}
            onChange={handleFilterChange}
            className="input-style"
          />
          <input
            type="date"
            name="end_date"
            value={filters.end_date}
            onChange={handleFilterChange}
            className="input-style"
          />
          <button onClick={fetchTransactions} className="btn-secondary">
            Filter
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-intigizi-green" size={32} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deskripsi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akun Debet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akun Kredit
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jumlah (Rp)
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bukti
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.length > 0 ? (
                  transactions.map((t) => (
                    <tr key={t.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(t.transaction_date).toLocaleDateString(
                          "id-ID",
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">
                        {t.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {t.debit_account_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {t.credit_account_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 text-right font-semibold">
                        {new Intl.NumberFormat("id-ID").format(t.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        {t.proof_file ? (
                          <button
                            onClick={() => setSelectedProof(t.proof_file)}
                            className="text-blue-600 hover:text-blue-800 underline text-xs focus:outline-none"
                          >
                            Lihat
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-gray-500">
                      Tidak ada data transaksi pada periode ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <JournalEntryForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleFormSave}
      />

      {/* Modal Preview Bukti */}
      {selectedProof && (
        <Modal
          isOpen={!!selectedProof}
          onClose={() => {
            setSelectedProof(null);
            setImageError(false); // Reset error state on close
          }}
          title="Bukti Pembayaran"
          size="2xl"
        >
          <div className="flex flex-col items-center justify-center p-4">
            {selectedProof.endsWith(".pdf") ? (
              <div className="text-center">
                <p className="mb-4">
                  File adalah PDF. Klik tombol di bawah untuk mengunduh/melihat
                  di tab baru.
                </p>
                <a
                  href={`${ASSET_BASE_URL}${selectedProof}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                >
                  Buka PDF
                </a>
              </div>
            ) : imageError ? (
              <div className="flex flex-col items-center justify-center p-10 bg-gray-50 rounded-lg w-full">
                <p className="text-gray-500 mb-2">Gagal memuat gambar bukti.</p>
                <p className="text-xs text-gray-400">
                  Pastikan file ada di server.
                </p>
                <a
                  href={`${ASSET_BASE_URL}${selectedProof}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 text-blue-600 hover:underline text-sm"
                >
                  Coba buka langsung
                </a>
              </div>
            ) : (
              <img
                src={`${ASSET_BASE_URL}${selectedProof}`}
                alt="Bukti Pembayaran"
                className="max-w-full h-auto rounded shadow-sm"
                onError={() => setImageError(true)}
              />
            )}
          </div>
        </Modal>
      )}
    </>
  );
}

export default JournalPage;
