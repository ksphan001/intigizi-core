import React, { useState, useEffect, useCallback, useMemo } from "react";
import apiClient from "@/services/api";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import ConfirmationModal from "@/components/ConfirmationModal";
import ExpenseForm from "@/components/ExpenseForm";
import ExpenseDetailModal from "@/components/ExpenseDetailModal";
import Pagination from "@/components/Pagination";
import {
  Loader2,
  Download,
  DollarSign,
  List,
  Edit,
  Trash2,
  Eye,
  Wallet,
} from "lucide-react";
import { useNotification } from "@/context/NotificationContext";

const ITEMS_PER_PAGE = 10;

const StatCard = ({ icon, title, value, loading }) => (
  <div className="bg-white p-5 rounded-xl shadow-md flex items-start space-x-4">
    <div className="bg-blue-50 p-3 rounded-full">{icon}</div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      {loading ? (
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mt-1"></div>
      ) : (
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      )}
    </div>
  </div>
);

function OperationalExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [accounts, setAccounts] = useState([]); // State untuk menyimpan daftar akun
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [deletingExpense, setDeletingExpense] = useState(null);
  const [viewingExpense, setViewingExpense] = useState(null);

  const today = new Date();
  const thirtyDaysAgo = new Date(new Date().setDate(today.getDate() - 30));
  const [filters, setFilters] = useState({
    start_date: thirtyDaysAgo.toISOString().split("T")[0],
    end_date: today.toISOString().split("T")[0],
    category_id: "",
  });

  const { showNotification } = useNotification();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // Ambil data akun bersamaan dengan data biaya
      const [expensesRes, categoriesRes, accountsRes] = await Promise.all([
        apiClient.get("/financials_manage_expenses.php", { params: filters }),
        apiClient.get("/financials_get_categories.php"),
        apiClient.get("/financials/accounts_get.php"),
      ]);
      setExpenses(Array.isArray(expensesRes.data) ? expensesRes.data : []);
      setCategories(
        Array.isArray(categoriesRes.data) ? categoriesRes.data : [],
      );
      setAccounts(Array.isArray(accountsRes.data) ? accountsRes.data : []); // Simpan data akun
    } catch (err) {
      setError("Gagal memuat data biaya operasional.");
      showNotification("Gagal memuat data biaya operasional.", "error");
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [filters, showNotification]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = (e) =>
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const openAddModal = () => {
    setEditingExpense(null);
    setIsModalOpen(true);
  };
  const openEditModal = (expense) => {
    setEditingExpense(expense);
    setIsModalOpen(true);
  };
  const openDeleteConfirm = (expense) => {
    setDeletingExpense(expense);
    setIsConfirmModalOpen(true);
  };
  const openDetailModal = (expense) => {
    // Saat membuka detail, cari nama akun yang sesuai dan tambahkan ke objek
    const sourceAccount = accounts.find(
      (acc) => acc.id.toString() === expense.source_account_id.toString(),
    );
    setViewingExpense({ ...expense, source_account_name: sourceAccount?.name });
    setIsDetailModalOpen(true);
  };

  const handleSave = async (formData) => {
    try {
      const response = await apiClient.post(
        "/financials_manage_expenses.php",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      showNotification(response.data.message, "success");
      setIsModalOpen(false);
      await fetchData();
    } catch (err) {
      showNotification(
        err.response?.data?.message || "Gagal menyimpan data.",
        "error",
      );
    }
  };

  const handleDelete = async () => {
    if (!deletingExpense) return;
    try {
      const response = await apiClient.delete(
        `/financials_manage_expenses.php?id=${deletingExpense.id}`,
      );
      showNotification(response.data.message, "success");
      setIsConfirmModalOpen(false);
      await fetchData();
    } catch (err) {
      showNotification(
        err.response?.data?.message || "Gagal menghapus data.",
        "error",
      );
    } finally {
      setDeletingExpense(null);
    }
  };

  const paginatedExpenses = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return expenses.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, expenses]);
  const totalPages = Math.ceil(expenses.length / ITEMS_PER_PAGE);

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

  const totalExpenses = useMemo(
    () => expenses.reduce((sum, item) => sum + parseFloat(item.amount), 0),
    [expenses],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Biaya Operasional"
        buttonText="Tambah Biaya"
        onButtonClick={openAddModal}
      />

      <div className="bg-white p-4 rounded-xl shadow-md">
        <div className="flex flex-wrap items-end gap-4">
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
          <div>
            <label className="text-xs">Kategori</label>
            <select
              name="category_id"
              value={filters.category_id}
              onChange={handleFilterChange}
              className="input-style bg-white"
            >
              <option value="">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={fetchData}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          icon={<DollarSign size={24} className="text-gizinow-green" />}
          title="Total Biaya"
          value={formatCurrency(totalExpenses)}
          loading={loading}
        />
        <StatCard
          icon={<List size={24} className="text-gizinow-green" />}
          title="Total Transaksi"
          value={expenses.length.toLocaleString("id-ID")}
          loading={loading}
        />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="font-semibold text-lg text-gray-800 mb-4">
          Rincian Biaya
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">Tanggal</th>
                <th className="px-6 py-3">Deskripsi</th>
                <th className="px-6 py-3">Kategori</th>
                <th className="px-6 py-3">Sumber Dana</th> {/* Kolom baru */}
                <th className="px-6 py-3 text-right">Jumlah</th>
                <th className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-8">
                    <Loader2 className="animate-spin inline-block" />
                  </td>
                </tr>
              ) : paginatedExpenses.length > 0 ? (
                paginatedExpenses.map((item) => {
                  // Cari nama akun berdasarkan ID saat me-render tabel
                  const sourceAccount = accounts.find(
                    (acc) =>
                      acc.id.toString() === item.source_account_id.toString(),
                  );
                  return (
                    <tr
                      key={item.id}
                      className="bg-white border-b hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        {formatDate(item.expense_date)}
                      </td>
                      <th className="px-6 py-4 font-medium text-gray-900">
                        {item.description}
                      </th>
                      <td className="px-6 py-4">
                        <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                          {item.category_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {sourceAccount ? (
                          sourceAccount.name
                        ) : (
                          <span className="italic text-gray-400">N/A</span>
                        )}
                      </td>{" "}
                      {/* Tampilkan nama akun */}
                      <td className="px-6 py-4 text-right font-semibold">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="px-6 py-4 flex justify-end space-x-2">
                        <button
                          onClick={() => openDetailModal(item)}
                          className="p-1 text-gray-600 hover:text-gray-800"
                          title="Lihat Detail"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => openDeleteConfirm(item)}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">
                    Tidak ada data biaya untuk periode ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {expenses.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingExpense ? "Edit Biaya" : "Tambah Biaya Baru"}
        size="lg"
      >
        <ExpenseForm
          expense={editingExpense}
          categories={categories}
          accounts={accounts}
          onSave={handleSave}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <ExpenseDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        expense={viewingExpense}
      />

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleDelete}
        title="Konfirmasi Hapus"
        message={`Anda yakin ingin menghapus biaya "${deletingExpense?.description}"?`}
      />
    </div>
  );
}

export default OperationalExpensesPage;
