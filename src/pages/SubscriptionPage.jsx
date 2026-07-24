import React, { useState, useEffect, useCallback } from "react";
import apiClient from "@/services/api";
import PageHeader from "@/components/PageHeader";
import { useNotification } from "@/context/NotificationContext";
import {
  Loader2,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Sparkles,
  CreditCard,
  Copy,
  XCircle,
} from "lucide-react";

// Komponen untuk Status Langganan
const StatusDisplay = ({ status, until }) => {
  const statusConfig = {
    trial: {
      text: "Masa Percobaan (Trial)",
      icon: <Sparkles className="text-purple-500" />,
      color: "bg-purple-100 text-purple-800",
    },
    active: {
      text: "Langganan Aktif",
      icon: <CheckCircle className="text-green-500" />,
      color: "bg-green-100 text-green-800",
    },
    expired: {
      text: "Langganan Berakhir",
      icon: <AlertTriangle className="text-red-500" />,
      color: "bg-red-100 text-red-800",
    },
    inactive: {
      text: "Tidak Aktif",
      icon: <XCircle className="text-gray-500" />,
      color: "bg-gray-100 text-gray-800",
    },
  };

  const currentStatus = statusConfig[status] || statusConfig.inactive;
  const expiryDate = until
    ? new Date(until).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md text-center">
      <div
        className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${currentStatus.color}`}
      >
        {currentStatus.icon}
        <span className="ml-2">{currentStatus.text}</span>
      </div>
      {expiryDate && (
        <p className="mt-4 text-gray-600">
          {status === "trial" ? "Berakhir pada " : "Aktif hingga "}
          <span className="font-bold text-gray-800">{expiryDate}</span>
        </p>
      )}
    </div>
  );
};

// Komponen untuk Pilihan Paket
const PackageSelection = ({ packages, onSelect, loading }) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <h2 className="text-xl font-bold mb-4">Pilih Paket Berlangganan</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {packages.map((pkg) => (
        <div key={pkg.name} className="border p-4 rounded-lg flex flex-col">
          <h3 className="text-lg font-bold text-intigizi-green">{pkg.name}</h3>
          <p className="text-2xl font-bold my-2">
            {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
            }).format(pkg.price)}
          </p>
          <p className="text-sm text-gray-500 flex-grow">
            Durasi aktif selama {pkg.duration_days} hari.
          </p>
          <button
            onClick={() => onSelect(pkg)}
            disabled={loading}
            className="btn-primary mt-4 w-full"
          >
            {loading ? "Memproses..." : "Pilih Paket Ini"}
          </button>
        </div>
      ))}
    </div>
  </div>
);

// Komponen untuk Instruksi Pembayaran
const PaymentInstructions = ({ invoice, bankAccounts }) => {
  const { showNotification } = useNotification();
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showNotification("Nomor rekening disalin!", "success");
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="text-center mb-6">
        <Clock size={32} className="mx-auto text-yellow-500 mb-2" />
        <h2 className="text-xl font-bold">Menunggu Pembayaran</h2>
        <p className="text-gray-600">
          Permintaan langganan Anda untuk paket{" "}
          <span className="font-bold">{invoice.package_name}</span> telah kami
          terima.
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-center">
        <p className="text-sm text-yellow-800">Total Pembayaran</p>
        <p className="text-3xl font-bold text-yellow-900">
          {new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
          }).format(invoice.amount)}
        </p>
      </div>

      <div className="mt-6">
        <h3 className="font-semibold mb-2 flex items-center">
          <CreditCard size={16} className="mr-2" />
          Silakan lakukan transfer ke salah satu rekening berikut:
        </h3>
        <div className="space-y-3">
          {bankAccounts.map((acc) => (
            <div
              key={acc.account_number}
              className="flex justify-between items-center p-3 bg-gray-50 rounded-md"
            >
              <div>
                <p className="font-bold">{acc.bank_name}</p>
                <p className="text-sm text-gray-600">
                  {acc.account_number} (a.n. {acc.account_name})
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(acc.account_number)}
                className="p-2 hover:bg-gray-200 rounded-full text-gray-500"
              >
                <Copy size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 text-center text-sm text-gray-500">
        <p>
          Setelah melakukan pembayaran, Super Admin akan memverifikasi dan
          mengaktifkan langganan Anda dalam 1x24 jam.
        </p>
      </div>
    </div>
  );
};

function SubscriptionPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const { showNotification } = useNotification();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/get_subscription_status.php");
      setData(response.data);
    } catch (err) {
      setError("Gagal memuat informasi langganan.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSelectPackage = async (pkg) => {
    setActionLoading(true);
    try {
      await apiClient.post("/create_subscription_invoice.php", {
        package_name: pkg.name,
        price: pkg.price,
        duration_days: pkg.duration_days,
      });
      showNotification(
        "Permintaan langganan berhasil dibuat. Silakan lakukan pembayaran.",
        "success",
      );
      await fetchData(); // Refresh data untuk menampilkan instruksi pembayaran
    } catch (err) {
      showNotification(
        err.response?.data?.message || "Gagal memilih paket.",
        "error",
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin" />
      </div>
    );
  if (error) return <div className="text-red-500 text-center p-4">{error}</div>;
  if (!data) return null;

  const { organization, packages, bank_accounts, pending_invoice } = data;
  const showPackageSelection = ["trial", "expired", "inactive"].includes(
    organization?.subscription_status,
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Status Berlangganan" />

      <StatusDisplay
        status={organization?.subscription_status}
        until={organization?.subscription_until}
      />

      {pending_invoice ? (
        <PaymentInstructions
          invoice={pending_invoice}
          bankAccounts={bank_accounts}
        />
      ) : (
        showPackageSelection && (
          <PackageSelection
            packages={packages}
            onSelect={handleSelectPackage}
            loading={actionLoading}
          />
        )
      )}
    </div>
  );
}

export default SubscriptionPage;
