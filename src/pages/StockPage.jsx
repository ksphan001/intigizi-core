import React, { useState, useEffect, useCallback, useMemo } from "react";
import apiClient from "@/services/api";
import PageHeader from "@/components/PageHeader.jsx";
import Pagination from "@/components/Pagination.jsx";
import { Search, Info } from "lucide-react";

const ITEMS_PER_PAGE = 10;

// PENJELASAN:
// Halaman ini sekarang bersifat "read-only" atau hanya untuk melihat.
// Tombol "Tambah Stok dari PO" dan modal terkait telah dihapus
// untuk memastikan semua penambahan stok tercatat secara finansial
// melalui alur penyelesaian Purchase Order.

function StockPage() {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchStock = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/stock_get.php");
      setStock(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError("Gagal memuat data stok.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  const filteredStock = useMemo(() => {
    if (!searchQuery) {
      return stock;
    }
    return stock.filter((item) =>
      item.ingredient_name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [stock, searchQuery]);

  const totalPages = Math.ceil(filteredStock.length / ITEMS_PER_PAGE);
  const paginatedStock = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStock.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, filteredStock]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div>
      {/* Tombol "Tambah Stok" telah dihapus dari PageHeader */}
      <PageHeader title="Stok Gudang" />

      <div className="mb-6 bg-blue-50 border-l-4 border-intigizi-green text-blue-800 p-4 rounded-r-lg">
        <div className="flex">
          <div className="py-1">
            <Info className="h-5 w-5 text-intigizi-green mr-3" />
          </div>
          <div>
            <p className="font-bold">Informasi</p>
            <p className="text-sm">
              Halaman ini menampilkan jumlah stok saat ini. Penambahan stok dari
              pembelian sekarang dilakukan secara otomatis saat Anda
              menyelesaikan sebuah Purchase Order.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-4 relative">
          <input
            type="text"
            placeholder="Cari nama bahan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-style w-full pl-10"
          />
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
        </div>

        {loading ? (
          <p>Memuat data...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3">
                    Nama Bahan
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Jumlah Stok Saat Ini
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Terakhir Diperbarui
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedStock.length > 0 ? (
                  paginatedStock.map((item) => (
                    <tr
                      key={item.ingredient_id}
                      className="bg-white border-b hover:bg-gray-50"
                    >
                      <th
                        scope="row"
                        className="px-6 py-4 font-medium text-gray-900"
                      >
                        {item.ingredient_name}
                      </th>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-lg">
                          {parseFloat(item.current_quantity).toLocaleString(
                            "id-ID",
                          )}
                        </span>
                        <span className="ml-1 text-gray-500">
                          {item.unit_symbol}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {item.last_updated
                          ? new Date(item.last_updated).toLocaleString("id-ID")
                          : "Belum ada transaksi"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="text-center py-4">
                      {searchQuery
                        ? "Bahan tidak ditemukan di dalam stok."
                        : "Tidak ada data stok."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}

export default StockPage;
