import React, { useState, useEffect, useCallback, useMemo } from "react";
import Modal from "./Modal.jsx";
import apiClient from "../services/api";
import { useNotification } from "@/context/NotificationContext";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Fingerprint,
  Activity,
  TrendingUp,
  UserCheck,
  Calendar,
  Plus,
  Loader2,
  LineChart,
  BarChart2,
} from "lucide-react";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Komponen untuk tab Info Detail
const InfoDetailTab = ({ beneficiary }) => {
  const DetailItem = ({ icon, label, value }) => (
    <div>
      <p className="text-sm text-gray-500 flex items-center">
        {icon} {label}
      </p>
      <p className="font-semibold text-gray-800 break-words">{value || "-"}</p>
    </div>
  );

  const getBmiStatus = (bmi) => {
    if (!bmi) return { text: "-", color: "text-gray-500" };
    if (bmi < 18.5)
      return { text: "Berat Badan Kurang", color: "text-yellow-600" };
    if (bmi < 24.9)
      return { text: "Berat Badan Normal", color: "text-green-600" };
    if (bmi < 29.9)
      return { text: "Berat Badan Berlebih", color: "text-yellow-600" };
    return { text: "Obesitas", color: "text-red-600" };
  };

  const bmiStatus = getBmiStatus(beneficiary.current_bmi);

  return (
    <div className="space-y-4">
      <div className="p-4 bg-gray-50 rounded-lg">
        <DetailItem
          icon={<User size={14} className="mr-2" />}
          label="Nama Lengkap"
          value={beneficiary.full_name}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DetailItem
          icon={<Fingerprint size={14} className="mr-2" />}
          label="NIK / NISN"
          value={beneficiary.nik_nisn}
        />
        <DetailItem
          icon={<UserCheck size={14} className="mr-2" />}
          label="Kategori"
          value={beneficiary.category_name}
        />
        <DetailItem
          icon={<Phone size={14} className="mr-2" />}
          label="Nomor Telepon"
          value={beneficiary.phone_number}
        />
        <DetailItem
          icon={<Mail size={14} className="mr-2" />}
          label="Email"
          value={beneficiary.email}
        />
      </div>
      <DetailItem
        icon={<MapPin size={14} className="mr-2" />}
        label="Alamat Lengkap"
        value={beneficiary.address}
      />
      <div className="pt-4 border-t">
        <h4 className="text-base font-semibold text-gray-800 mb-2">
          Data Antropometri Terakhir
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DetailItem
            icon={<TrendingUp size={14} className="mr-2" />}
            label="Berat Badan"
            value={
              beneficiary.current_weight_kg
                ? `${beneficiary.current_weight_kg} kg`
                : "-"
            }
          />
          <DetailItem
            icon={<TrendingUp size={14} className="mr-2" />}
            label="Tinggi Badan"
            value={
              beneficiary.current_height_cm
                ? `${beneficiary.current_height_cm} cm`
                : "-"
            }
          />
          <div>
            <p className="text-sm text-gray-500 flex items-center">
              <Activity size={14} className="mr-2" /> Indeks Massa Tubuh (BMI)
            </p>
            <p className={`font-bold text-lg ${bmiStatus.color}`}>
              {beneficiary.current_bmi
                ? `${parseFloat(beneficiary.current_bmi).toFixed(1)} (${bmiStatus.text})`
                : "-"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Komponen untuk tab Riwayat BMI
const BmiHistoryTab = ({ beneficiary, onMeasurementAdded }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const { showNotification } = useNotification();

  const [formData, setFormData] = useState({
    measurement_date: new Date().toISOString().split("T")[0],
    weight_kg: "",
    height_cm: "",
  });

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(
        `/beneficiaries_get_bmi_history.php?beneficiary_id=${beneficiary.id}`,
      );
      setHistory(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      showNotification("Gagal memuat riwayat BMI.", "error");
    } finally {
      setLoading(false);
    }
  }, [beneficiary.id, showNotification]);

  useEffect(() => {
    fetchHistory();
    // Set tinggi badan default jika sudah ada
    setFormData((prev) => ({
      ...prev,
      height_cm: beneficiary.current_height_cm || "",
    }));
  }, [beneficiary, fetchHistory]);

  const handleAddMeasurement = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const response = await apiClient.post(
        "/beneficiaries_add_bmi_measurement.php",
        {
          beneficiary_id: beneficiary.id,
          ...formData,
        },
      );
      showNotification(response.data.message, "success");
      setIsFormVisible(false);
      setFormData({
        measurement_date: new Date().toISOString().split("T")[0],
        weight_kg: "",
        height_cm: formData.height_cm, // Tetap gunakan tinggi badan terakhir
      });
      await fetchHistory();
      onMeasurementAdded(); // Panggil callback untuk refresh data di modal utama
    } catch (err) {
      showNotification(
        err.response?.data?.message || "Gagal menyimpan data.",
        "error",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const chartData = useMemo(() => {
    return [...history].reverse().map((item) => ({
      date: new Date(item.measurement_date).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
      }),
      BMI: parseFloat(item.bmi).toFixed(1),
      Berat: parseFloat(item.weight_kg),
    }));
  }, [history]);

  return (
    <div className="space-y-4">
      <button
        onClick={() => setIsFormVisible(!isFormVisible)}
        className="btn-primary text-sm px-3 py-1.5 flex items-center"
      >
        <Plus size={16} className="mr-2" />{" "}
        {isFormVisible ? "Tutup Form" : "Tambah Pengukuran Baru"}
      </button>

      {isFormVisible && (
        <form
          onSubmit={handleAddMeasurement}
          className="p-4 bg-gray-50 rounded-lg border space-y-3"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700">
                Tanggal Pengukuran
              </label>
              <input
                type="date"
                value={formData.measurement_date}
                onChange={(e) =>
                  setFormData({ ...formData, measurement_date: e.target.value })
                }
                className="input-style"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">
                Berat Badan (kg)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.weight_kg}
                onChange={(e) =>
                  setFormData({ ...formData, weight_kg: e.target.value })
                }
                className="input-style"
                placeholder="Contoh: 45.5"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">
                Tinggi Badan (cm)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.height_cm}
                onChange={(e) =>
                  setFormData({ ...formData, height_cm: e.target.value })
                }
                className="input-style"
                placeholder="Contoh: 150.5"
                required
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="btn-primary"
              disabled={actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Simpan Data"
              )}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <>
          {history.length > 3 && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold mb-2">Grafik Riwayat BMI</h4>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart
                    data={chartData}
                    margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 10 }}
                      domain={["dataMin - 1", "dataMax + 1"]}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="BMI"
                      stroke="#1A335A"
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="Berat"
                      stroke="#C4A873"
                      activeDot={{ r: 6 }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          <div className="mt-4 max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50">
                <tr>
                  <th className="p-2 text-left">Tanggal</th>
                  <th className="p-2 text-right">Berat</th>
                  <th className="p-2 text-right">Tinggi</th>
                  <th className="p-2 text-right">BMI</th>
                  <th className="p-2 text-left">Dicatat Oleh</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-2">
                      {new Date(item.measurement_date).toLocaleDateString(
                        "id-ID",
                      )}
                    </td>
                    <td className="p-2 text-right">{item.weight_kg} kg</td>
                    <td className="p-2 text-right">{item.height_cm} cm</td>
                    <td className="p-2 text-right font-bold">
                      {parseFloat(item.bmi).toFixed(1)}
                    </td>
                    <td className="p-2">{item.recorded_by_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

// Komponen Modal Utama
function BeneficiaryDetailModal({
  beneficiary,
  isOpen,
  onClose,
  onDataUpdate,
}) {
  const [activeTab, setActiveTab] = useState("info");

  if (!isOpen || !beneficiary) {
    return null;
  }

  const handleMeasurementAdded = () => {
    // Panggil onDataUpdate untuk memberitahu BeneficiariesPage
    // agar me-refresh data utamanya (termasuk BMI terbaru di tabel)
    onDataUpdate();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={beneficiary.full_name}
      size="2xl"
    >
      <div className="flex border-b mb-4">
        <button
          className={`px-4 py-2 text-sm font-medium ${activeTab === "info" ? "border-b-2 border-intigizi-green text-intigizi-green" : "text-gray-500 hover:text-gray-700"}`}
          onClick={() => setActiveTab("info")}
        >
          <User size={16} className="inline-block mr-2" /> Info Detail
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${activeTab === "bmi" ? "border-b-2 border-intigizi-green text-intigizi-green" : "text-gray-500 hover:text-gray-700"}`}
          onClick={() => setActiveTab("bmi")}
        >
          <Activity size={16} className="inline-block mr-2" /> Riwayat BMI
        </button>
      </div>

      <div className="min-h-[300px]">
        {activeTab === "info" && <InfoDetailTab beneficiary={beneficiary} />}
        {activeTab === "bmi" && (
          <BmiHistoryTab
            beneficiary={beneficiary}
            onMeasurementAdded={handleMeasurementAdded}
          />
        )}
      </div>

      <div className="flex justify-end pt-6 mt-4 border-t">
        <button type="button" onClick={onClose} className="btn-secondary">
          Tutup
        </button>
      </div>
    </Modal>
  );
}

export default BeneficiaryDetailModal;
