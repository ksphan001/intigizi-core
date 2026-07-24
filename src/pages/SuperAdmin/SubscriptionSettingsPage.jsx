import React, { useState, useEffect, useCallback } from "react";
import apiClient from "@/services/api";
import PageHeader from "@/components/PageHeader";
import { useNotification } from "@/context/NotificationContext";
import {
  Loader2,
  Plus,
  Trash2,
  Save,
  Settings,
  Calendar,
  CreditCard,
  Package,
} from "lucide-react";

// Komponen Halaman Pengaturan Langganan untuk Super Admin
function SubscriptionSettingsPage() {
  const [settings, setSettings] = useState({
    free_trial_days: 14,
    packages: [],
    bank_accounts: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showNotification } = useNotification();

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(
        "/superadmin_manage_subscriptions.php",
      );
      setSettings({
        free_trial_days: response.data.free_trial_days || 14,
        packages: response.data.subscription_packages || [],
        bank_accounts: response.data.bank_accounts || [],
      });
    } catch (error) {
      showNotification("Gagal memuat pengaturan langganan.", "error");
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleFieldChange = (section, index, field, value) => {
    const newSettings = { ...settings };
    newSettings[section][index][field] = value;
    setSettings(newSettings);
  };

  const handleAddItem = (section) => {
    const newSettings = { ...settings };
    if (section === "packages") {
      newSettings.packages.push({ name: "", price: "", duration_days: "" });
    } else {
      newSettings.bank_accounts.push({
        bank_name: "",
        account_number: "",
        account_name: "",
      });
    }
    setSettings(newSettings);
  };

  const handleRemoveItem = (section, index) => {
    const newSettings = { ...settings };
    newSettings[section].splice(index, 1);
    setSettings(newSettings);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const payload = {
        free_trial_days: settings.free_trial_days,
        packages: settings.packages,
        bank_accounts: settings.bank_accounts,
      };
      const response = await apiClient.post(
        "/superadmin_manage_subscriptions.php",
        payload,
      );
      showNotification(response.data.message, "success");
    } catch (error) {
      showNotification("Gagal menyimpan pengaturan.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <PageHeader title="Pengaturan Langganan" />
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin mr-2" />
          ) : (
            <Save size={16} className="mr-2" />
          )}
          Simpan Pengaturan
        </button>
      </div>

      <div className="space-y-8">
        {/* Bagian Free Trial */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Calendar size={20} className="mr-3 text-intigizi-green" />
            Masa Percobaan Gratis (Free Trial)
          </h2>
          <div>
            <label
              htmlFor="free_trial_days"
              className="block text-sm font-medium text-gray-700"
            >
              Durasi Free Trial (hari)
            </label>
            <input
              type="number"
              id="free_trial_days"
              value={settings.free_trial_days}
              onChange={(e) =>
                setSettings({ ...settings, free_trial_days: e.target.value })
              }
              className="input-style max-w-xs"
            />
            <p className="text-xs text-gray-500 mt-1">
              Organisasi baru akan mendapatkan masa trial selama durasi ini
              sebelum harus berlangganan.
            </p>
          </div>
        </div>

        {/* Bagian Paket Langganan */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Package size={20} className="mr-3 text-intigizi-green" />
            Paket Berlangganan
          </h2>
          <div className="space-y-4">
            {settings.packages.map((pkg, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-8 gap-3 items-end p-3 border rounded-md bg-gray-50"
              >
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-gray-700">
                    Nama Paket
                  </label>
                  <input
                    type="text"
                    value={pkg.name}
                    onChange={(e) =>
                      handleFieldChange(
                        "packages",
                        index,
                        "name",
                        e.target.value,
                      )
                    }
                    className="input-style"
                    placeholder="Contoh: Bulanan"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700">
                    Harga (Rp)
                  </label>
                  <input
                    type="number"
                    value={pkg.price}
                    onChange={(e) =>
                      handleFieldChange(
                        "packages",
                        index,
                        "price",
                        e.target.value,
                      )
                    }
                    className="input-style"
                    placeholder="150000"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700">
                    Durasi (hari)
                  </label>
                  <input
                    type="number"
                    value={pkg.duration_days}
                    onChange={(e) =>
                      handleFieldChange(
                        "packages",
                        index,
                        "duration_days",
                        e.target.value,
                      )
                    }
                    className="input-style"
                    placeholder="30"
                  />
                </div>
                <div className="md:col-span-1">
                  <button
                    onClick={() => handleRemoveItem("packages", index)}
                    className="btn-secondary bg-red-100 text-red-600 hover:bg-red-200 w-full"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => handleAddItem("packages")}
            className="btn-secondary mt-4"
          >
            <Plus size={16} className="mr-2" />
            Tambah Paket
          </button>
        </div>

        {/* Bagian Rekening Bank */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <CreditCard size={20} className="mr-3 text-intigizi-green" />
            Rekening Bank Tujuan
          </h2>
          <div className="space-y-4">
            {settings.bank_accounts.map((acc, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end p-3 border rounded-md bg-gray-50"
              >
                <div className="">
                  <label className="block text-xs font-medium text-gray-700">
                    Nama Bank
                  </label>
                  <input
                    type="text"
                    value={acc.bank_name}
                    onChange={(e) =>
                      handleFieldChange(
                        "bank_accounts",
                        index,
                        "bank_name",
                        e.target.value,
                      )
                    }
                    className="input-style"
                    placeholder="Contoh: BCA"
                  />
                </div>
                <div className="">
                  <label className="block text-xs font-medium text-gray-700">
                    No. Rekening
                  </label>
                  <input
                    type="text"
                    value={acc.account_number}
                    onChange={(e) =>
                      handleFieldChange(
                        "bank_accounts",
                        index,
                        "account_number",
                        e.target.value,
                      )
                    }
                    className="input-style"
                    placeholder="1234567890"
                  />
                </div>
                <div className="">
                  <label className="block text-xs font-medium text-gray-700">
                    Atas Nama
                  </label>
                  <input
                    type="text"
                    value={acc.account_name}
                    onChange={(e) =>
                      handleFieldChange(
                        "bank_accounts",
                        index,
                        "account_name",
                        e.target.value,
                      )
                    }
                    className="input-style"
                    placeholder="PT. ..."
                  />
                </div>
                <div className="">
                  <button
                    onClick={() => handleRemoveItem("bank_accounts", index)}
                    className="btn-secondary bg-red-100 text-red-600 hover:bg-red-200 w-full"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => handleAddItem("bank_accounts")}
            className="btn-secondary mt-4"
          >
            <Plus size={16} className="mr-2" />
            Tambah Rekening
          </button>
        </div>
      </div>
    </div>
  );
}

export default SubscriptionSettingsPage;
