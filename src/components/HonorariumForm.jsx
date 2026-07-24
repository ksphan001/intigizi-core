import React, { useState, useEffect, useMemo } from "react";
import apiClient from "@/services/api";
import { Plus, Trash2, Loader2, DollarSign } from "lucide-react";
import SearchableSelect from "./SearchableSelect";

function HonorariumForm({ onSave, onCancel, loading }) {
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [sourceAccountId, setSourceAccountId] = useState("");
  const [payments, setPayments] = useState([]);

  const [allVolunteers, setAllVolunteers] = useState([]);
  const [cashAccounts, setCashAccounts] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [volunteersRes, accountsRes] = await Promise.all([
          apiClient.get("/volunteers_manage.php"),
          apiClient.get("/financials/accounts_get.php"),
        ]);

        const activeVolunteers = (volunteersRes.data || []).filter(
          (v) => v.is_active == 1,
        );
        setAllVolunteers(activeVolunteers);

        const filteredAccounts = (accountsRes.data || []).filter((acc) =>
          ["Kas Tunai", "Kas di Bank"].includes(acc.name),
        );
        setCashAccounts(filteredAccounts);

        if (filteredAccounts.length > 0) {
          setSourceAccountId(filteredAccounts[0].id);
        }

        if (activeVolunteers.length > 0) {
          setPayments([
            {
              volunteer_id: activeVolunteers[0].id,
              honorarium_amount: "",
              health_fund_amount: "",
              tax_amount: "",
              total_amount: 0,
            },
          ]);
        }
      } catch (err) {
        setError("Gagal memuat data awal.");
      }
    };
    fetchData();
  }, []);

  const handlePaymentChange = (index, field, value) => {
    const newPayments = [...payments];
    newPayments[index][field] = value;

    const honorarium = parseFloat(newPayments[index].honorarium_amount || 0);
    const health = parseFloat(newPayments[index].health_fund_amount || 0);
    const tax = parseFloat(newPayments[index].tax_amount || 0);
    newPayments[index].total_amount = honorarium + health - tax;

    setPayments(newPayments);
  };

  const addPaymentRow = () => {
    if (allVolunteers.length > 0) {
      setPayments([
        ...payments,
        {
          volunteer_id: allVolunteers[0].id,
          honorarium_amount: "",
          health_fund_amount: "",
          tax_amount: "",
          total_amount: 0,
        },
      ]);
    }
  };

  const removePaymentRow = (index) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      payment_date: paymentDate,
      source_account_id: sourceAccountId,
      payments: payments.map((p) => ({
        ...p,
        full_name: allVolunteers.find(
          (v) => v.id.toString() === p.volunteer_id.toString(),
        )?.full_name,
      })),
    });
  };

  const volunteerOptions = useMemo(
    () => allVolunteers.map((v) => ({ value: v.id, label: v.full_name })),
    [allVolunteers],
  );
  const totalPaymentAmount = useMemo(
    () => payments.reduce((sum, p) => sum + p.total_amount, 0),
    [payments],
  );
  const formatCurrency = (val) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(val || 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Tanggal Pembayaran
          </label>
          <input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="input-style"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Sumber Dana
          </label>
          <select
            value={sourceAccountId}
            onChange={(e) => setSourceAccountId(e.target.value)}
            className="input-style bg-white"
            required
          >
            {cashAccounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rincian Pembayaran
        </label>
        {/* --- PERBAIKAN 1: `max-h-72 overflow-y-auto` dihapus dari div ini --- */}
        {/* Ini memungkinkan dropdown untuk tampil penuh di dalam modal. */}
        <div className="space-y-3 pr-2">
          {payments.map((payment, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-3 rounded-lg border"
            >
              {/* --- PERBAIKAN 2: Menambahkan class `relative` di sini --- */}
              {/* Ini memberikan konteks posisi untuk dropdown agar tidak tertimpa elemen lain. */}
              <div className="col-span-12 md:col-span-3 relative">
                <SearchableSelect
                  options={volunteerOptions}
                  value={payment.volunteer_id}
                  onChange={(val) =>
                    handlePaymentChange(index, "volunteer_id", val)
                  }
                />
              </div>
              <div className="col-span-6 md:col-span-2">
                <input
                  type="number"
                  placeholder="Honor"
                  value={payment.honorarium_amount}
                  onChange={(e) =>
                    handlePaymentChange(
                      index,
                      "honorarium_amount",
                      e.target.value,
                    )
                  }
                  className="input-style"
                />
              </div>
              <div className="col-span-6 md:col-span-2">
                <input
                  type="number"
                  placeholder="Dana Sehat"
                  value={payment.health_fund_amount}
                  onChange={(e) =>
                    handlePaymentChange(
                      index,
                      "health_fund_amount",
                      e.target.value,
                    )
                  }
                  className="input-style"
                />
              </div>
              <div className="col-span-6 md:col-span-2">
                <input
                  type="number"
                  placeholder="Pajak"
                  value={payment.tax_amount}
                  onChange={(e) =>
                    handlePaymentChange(index, "tax_amount", e.target.value)
                  }
                  className="input-style"
                />
              </div>
              <div className="col-span-5 md:col-span-2 text-right font-semibold">
                {formatCurrency(payment.total_amount)}
              </div>
              <div className="col-span-1">
                <button
                  type="button"
                  onClick={() => removePaymentRow(index)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addPaymentRow}
          className="text-sm text-intigizi-green hover:underline mt-2 flex items-center"
        >
          <Plus size={16} className="mr-1" /> Tambah Penerima
        </button>
      </div>

      <div className="mt-6 pt-4 border-t flex justify-end items-center font-semibold">
        Total Pembayaran:{" "}
        <span className="ml-2 text-xl text-intigizi-orange">
          {formatCurrency(totalPaymentAmount)}
        </span>
      </div>

      {error && (
        <p className="text-red-500 text-sm mt-4 text-center">{error}</p>
      )}

      <div className="flex justify-end space-x-3 mt-6">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Batal
        </button>
        <button
          type="submit"
          disabled={loading || payments.length === 0}
          className="btn-primary"
        >
          {loading ? <Loader2 className="animate-spin" /> : "Catat Pembayaran"}
        </button>
      </div>
    </form>
  );
}

export default HonorariumForm;
