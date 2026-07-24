import React, { useState, useEffect } from "react";
import { useNotification } from "@/context/NotificationContext";
import { Loader2 } from "lucide-react";

function ExpenseForm({ expense, categories, accounts, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    expense_date: new Date().toISOString().split("T")[0],
    category_id: "",
    source_account_id: "", // Akun sumber dana
  });
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  useEffect(() => {
    if (expense) {
      setFormData({
        description: expense.description || "",
        amount: expense.amount || "",
        expense_date:
          expense.expense_date || new Date().toISOString().split("T")[0],
        category_id: expense.category_id || "",
        source_account_id: expense.source_account_id || "",
      });
    } else {
      // Set default untuk form baru
      setFormData((prev) => ({
        ...prev,
        category_id: categories.length > 0 ? categories[0].id : "",
        source_account_id: accounts.length > 0 ? accounts[0].id : "",
      }));
    }
  }, [expense, categories, accounts]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setReceipt(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = new FormData();
    if (expense?.id) {
      payload.append("id", expense.id);
    }
    Object.keys(formData).forEach((key) => payload.append(key, formData[key]));
    if (receipt) {
      payload.append("receipt", receipt);
    }

    await onSave(payload);
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Tanggal Biaya
        </label>
        <input
          type="date"
          name="expense_date"
          value={formData.expense_date}
          onChange={handleChange}
          className="input-style"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Deskripsi
        </label>
        <input
          type="text"
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="input-style"
          placeholder="Contoh: Pembayaran Listrik Bulan Oktober"
          required
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Sumber Dana
          </label>
          <select
            name="source_account_id"
            value={formData.source_account_id}
            onChange={handleChange}
            className="input-style bg-white"
            required
          >
            {accounts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Kategori
          </label>
          <select
            name="category_id"
            value={formData.category_id}
            onChange={handleChange}
            className="input-style bg-white"
            required
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Jumlah (Rp)
        </label>
        <input
          type="number"
          step="0.01"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          className="input-style"
          placeholder="500000"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Bukti/Struk (Opsional)
        </label>
        <input
          type="file"
          name="receipt"
          onChange={handleFileChange}
          className="input-style"
          accept="image/*,.pdf"
        />
        {expense?.receipt_path && !receipt && (
          <a
            href={`https://intigizi.taskora.id${expense.receipt_path}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-intigizi-green hover:underline mt-1"
          >
            Lihat bukti yang sudah ada
          </a>
        )}
      </div>
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Batal
        </button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="animate-spin" /> : "Simpan Biaya"}
        </button>
      </div>
    </form>
  );
}

export default ExpenseForm;
