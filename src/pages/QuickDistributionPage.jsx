import React, { useState, useEffect, useRef } from "react";
import {
  Loader2,
  Calendar,
  MapPin,
  Upload,
  Plus,
  Trash2,
  Send,
  Save,
  CheckCircle,
  XCircle,
  Search,
  Info,
  AlertTriangle,
} from "lucide-react";
import apiClient from "../services/api";
// --- PERBAIKAN: Gunakan import dari config atau hardcode jika config belum mengekspornya ---
import { API_BASE_URL } from "../config";
import PageHeader from "../components/PageHeader";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useNotification } from "../context/NotificationContext";
import ConfirmationModal from "../components/ConfirmationModal";

function QuickDistributionPage() {
  const { showNotification } = useNotification();
  const [activeTab, setActiveTab] = useState("list"); // 'list' or 'create'
  const [loading, setLoading] = useState(false);
  const [distributions, setDistributions] = useState([]);
  const [distributionPoints, setDistributionPoints] = useState([]);

  // Confirmation Modal State
  const [confirmation, setConfirmation] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Konfirmasi",
    confirmColor: "",
    icon: null,
    onConfirm: () => {},
  });

  // Filter Stats
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(1))); // 1st of month
  const [endDate, setEndDate] = useState(new Date());

  // Form Stats
  const [formData, setFormData] = useState({
    distribution_date: new Date(),
    distribution_point_id: "",
    menu_name: "",
    portion_count: "",
    notes: "",
    nutrition_calories: "",
    nutrition_protein: "",
    nutrition_fat: "",
    nutrition_carbs: "",
  });

  const fileInputRef = useRef(null);

  // Fetch Lists
  useEffect(() => {
    fetchDistributionPoints();
  }, []);

  useEffect(() => {
    if (activeTab === "list") {
      fetchDistributions();
    }
  }, [activeTab, startDate, endDate]);

  const fetchDistributionPoints = async () => {
    try {
      const response = await apiClient.get("/distribution_points_get.php");
      setDistributionPoints(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchDistributions = async () => {
    setLoading(true);
    try {
      const startStr = startDate.toISOString().split("T")[0];
      const endStr = endDate.toISOString().split("T")[0];
      const response = await apiClient.get(
        `/quick_distribution_get.php?start_date=${startStr}&end_date=${endStr}`,
      );
      setDistributions(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      showNotification("Gagal memuat riwayat distribusi.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date) => {
    setFormData((prev) => ({ ...prev, distribution_date: date }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        distribution_date: formData.distribution_date
          .toISOString()
          .split("T")[0],
      };

      await apiClient.post("/quick_distribution_create.php", payload);
      showNotification("Publikasi distribusi berhasil dibuat!", "success");
      // Reset Form and Switch Tab
      setFormData({
        distribution_date: new Date(),
        distribution_point_id: "",
        menu_name: "",
        portion_count: "",
        notes: "",
        nutrition_calories: "",
        nutrition_protein: "",
        nutrition_fat: "",
        nutrition_carbs: "",
      });
      setActiveTab("list");
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Gagal menyimpan data.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  // --- LIVE TRACKING LOGIC ---
  const [trackingActive, setTrackingActive] = useState(false);
  const watchIdRef = useRef(null);

  useEffect(() => {
    return () => stopTracking(); // Cleanup on unmount
  }, []);

  const startTracking = () => {
    if (!navigator.geolocation) {
      showNotification("Geolocation tidak didukung browser ini.", "error");
      return;
    }

    setTrackingActive(true);
    showNotification(
      "Live Tracking Diaktifkan. Lokasi Anda dipantau.",
      "success",
    );

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        // Kirim update lokasi ke server
        try {
          await apiClient.post("/tracking_update.php", { latitude, longitude });
        } catch (error) {
          console.error("Failed to update location", error);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        showNotification("Gagal mengakses lokasi: " + error.message, "error");
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 },
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTrackingActive(false);
  };

  const initiateStatusUpdate = (id, newStatus) => {
    let title = "Ubah Status?";
    let message = `Apakah anda yakin ingin mengubah status menjadi ${newStatus}?`;
    let confirmColor = "bg-intigizi-green hover:bg-opacity-90";
    let icon = <CheckCircle size={16} className="mr-2" />;
    let confirmText = "Ya, Ubah Status";

    if (newStatus === "Dikirim") {
      title = "Mulai Pengantaran?";
      message =
        'Status akan berubah menjadi "Dikirim" dan lokasi Anda akan mulai dipantau (Live Tracking). Pastikan Anda sudah siap berangkat.';
      confirmText = "Ya, Mulai Jalan";
      icon = <Send size={16} className="mr-2" />;
      confirmColor = "bg-intigizi-orange hover:bg-intigizi-orange-dark";
    } else if (newStatus === "Diterima") {
      title = "Selesaikan Pengiriman?";
      message =
        "Pastikan pesanan sudah diterima dengan baik oleh penerima manfaat. Live Tracking akan dihentikan.";
      confirmText = "Ya, Selesaikan";
      icon = <CheckCircle size={16} className="mr-2" />;
      confirmColor = "bg-intigizi-green hover:bg-intigizi-green-dark";
    } else if (newStatus === "Dibatalkan") {
      title = "Batalkan Distribusi?";
      message =
        "PERINGATAN: Tindakan ini akan membatalkan jadwal distribusi ini. Data tidak dapat dikembalikan.";
      confirmText = "Ya, Batalkan";
      icon = <Trash2 size={16} className="mr-2" />;
      confirmColor = "bg-red-600 hover:bg-red-700";
    }

    setConfirmation({
      isOpen: true,
      title,
      message,
      confirmText,
      confirmColor,
      icon,
      onConfirm: () => performStatusUpdate(id, newStatus),
    });
  };

  const performStatusUpdate = async (id, newStatus) => {
    setConfirmation((prev) => ({ ...prev, isOpen: false })); // Close modal immediately
    try {
      await apiClient.post("/quick_distribution_update_status.php", {
        id,
        status: newStatus,
      });
      showNotification(
        `Status berhasil diperbarui menjadi ${newStatus}`,
        "success",
      );

      // LOGIKA TRACKING
      if (newStatus === "Dikirim") {
        startTracking();
      } else if (newStatus === "Diterima" || newStatus === "Dibatalkan") {
        stopTracking();
      }

      fetchDistributions();
    } catch (error) {
      showNotification("Gagal update status.", "error");
    }
  };

  const handlePhotoUpload = async (id, file) => {
    const data = new FormData();
    data.append("id", id);
    data.append("photo", file);
    data.append("caption", "Dokumentasi Distribusi Cepat");

    try {
      await apiClient.post("/quick_distribution_upload_photo.php", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      showNotification("Foto berhasil diunggah.", "success");
      fetchDistributions();
    } catch (error) {
      showNotification("Gagal upload foto.", "error");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Publikasi Distribusi Cepat"
        subtitle="Kelola dan publikasikan distribusi harian secara manual tanpa proses PO."
        icon={<Send className="text-intigizi-green" />}
        action={
          activeTab === "list" && (
            <button
              onClick={() => setActiveTab("create")}
              className="btn-primary"
            >
              <Plus size={16} className="mr-2" /> Buat Baru
            </button>
          )
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-lg px-4 pt-4">
        <button
          onClick={() => setActiveTab("list")}
          className={`pb-3 px-6 font-medium text-sm transition-colors border-b-2 ${activeTab === "list" ? "border-intigizi-green text-intigizi-green" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >
          Riwayat & Status
        </button>
        <button
          onClick={() => setActiveTab("create")}
          className={`pb-3 px-6 font-medium text-sm transition-colors border-b-2 ${activeTab === "create" ? "border-intigizi-green text-intigizi-green" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >
          Formulir Publikasi
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-b-lg shadow-sm p-6 min-h-[500px]">
        {activeTab === "create" ? (
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg flex items-start">
              <Info
                className="flex-shrink-0 text-blue-500 mr-3 mt-1"
                size={18}
              />
              <p className="text-sm text-blue-700">
                <strong>Catatan:</strong> Fitur ini hanya mencatat distribusi
                untuk keperluan pelacakan publik dan dokumentasi. Data ini{" "}
                <u>tidak mengurangi stok</u> bahan baku dan{" "}
                <u>tidak masuk ke laporan keuangan</u>.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Jadwal & Lokasi */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 border-b pb-2">
                  Informasi Dasar
                </h3>
                <div>
                  <label className="label-style">Tanggal Distribusi</label>
                  <div className="relative">
                    <DatePicker
                      selected={formData.distribution_date}
                      onChange={handleDateChange}
                      className="input-style w-full pl-10"
                      dateFormat="dd MMMM yyyy"
                    />
                    <Calendar
                      className="absolute left-3 top-3 text-gray-400"
                      size={16}
                    />
                  </div>
                </div>
                <div>
                  <label className="label-style">Titik Distribusi</label>
                  <select
                    name="distribution_point_id"
                    value={formData.distribution_point_id}
                    onChange={handleInputChange}
                    className="input-style bg-white"
                    required
                  >
                    <option value="">-- Pilih Titik Distribusi --</option>
                    {distributionPoints.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-style">Nama Menu</label>
                  <input
                    type="text"
                    name="menu_name"
                    value={formData.menu_name}
                    onChange={handleInputChange}
                    className="input-style"
                    placeholder="Contoh: Paket Nasi Ayam Bakar"
                    required
                  />
                </div>
                <div>
                  <label className="label-style">Jumlah Porsi</label>
                  <input
                    type="number"
                    name="portion_count"
                    value={formData.portion_count}
                    onChange={handleInputChange}
                    className="input-style"
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              {/* Gizi */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 border-b pb-2">
                  Informasi Gizi (Opsional per Porsi)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-style">Energi (kcal)</label>
                    <input
                      type="number"
                      name="nutrition_calories"
                      value={formData.nutrition_calories}
                      onChange={handleInputChange}
                      className="input-style"
                    />
                  </div>
                  <div>
                    <label className="label-style">Protein (g)</label>
                    <input
                      type="number"
                      name="nutrition_protein"
                      value={formData.nutrition_protein}
                      onChange={handleInputChange}
                      className="input-style"
                    />
                  </div>
                  <div>
                    <label className="label-style">Lemak (g)</label>
                    <input
                      type="number"
                      name="nutrition_fat"
                      value={formData.nutrition_fat}
                      onChange={handleInputChange}
                      className="input-style"
                    />
                  </div>
                  <div>
                    <label className="label-style">Karbohidrat (g)</label>
                    <input
                      type="number"
                      name="nutrition_carbs"
                      value={formData.nutrition_carbs}
                      onChange={handleInputChange}
                      className="input-style"
                    />
                  </div>
                </div>
                <div>
                  <label className="label-style">Catatan Tambahan</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="input-style h-24"
                    placeholder="Keterangan tambahan..."
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t">
              <button
                type="button"
                onClick={() => setActiveTab("list")}
                className="btn-secondary"
              >
                Batal
              </button>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? (
                  <Loader2 className="animate-spin mr-2" size={18} />
                ) : (
                  <Save className="mr-2" size={18} />
                )}{" "}
                Simpan & Jadwalkan
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            {/* Filter */}
            <div className="flex flex-col md:flex-row gap-4 items-end bg-gray-50 p-4 rounded-lg">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Dari Tanggal
                </label>
                <DatePicker
                  selected={startDate}
                  onChange={setStartDate}
                  className="input-style w-40 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Sampai Tanggal
                </label>
                <DatePicker
                  selected={endDate}
                  onChange={setEndDate}
                  className="input-style w-40 text-sm"
                />
              </div>
              <button
                onClick={fetchDistributions}
                className="btn-secondary h-10 mb-[1px]"
              >
                <Search size={16} />
              </button>
            </div>

            {/* List */}
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="animate-spin mx-auto text-intigizi-green" />{" "}
                Memuat data...
              </div>
            ) : distributions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                Belum ada data distribusi cepat pada periode ini.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600 text-sm uppercase">
                      <th className="p-3">Tanggal</th>
                      <th className="p-3">Titik Distribusi</th>
                      <th className="p-3">Menu</th>
                      <th className="p-3 text-center">Porsi</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3">Dokumentasi</th>
                      <th className="p-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {distributions.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="p-3">
                          {new Date(
                            item.distribution_date,
                          ).toLocaleDateString()}
                        </td>
                        <td className="p-3 font-medium">{item.point_name}</td>
                        <td className="p-3 text-gray-600">{item.menu_name}</td>
                        <td className="p-3 text-center font-bold">
                          {item.portion_count}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${
                              item.status === "Diterima"
                                ? "bg-green-100 text-green-700"
                                : item.status === "Dikirim"
                                  ? "bg-orange-100 text-orange-700"
                                  : item.status === "Dibatalkan"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {item.status}
                          </span>
                          {item.delivery_time && (
                            <div className="text-[10px] text-gray-400 mt-1">
                              {item.delivery_time.substring(11, 16)}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex -space-x-2 overflow-hidden">
                            {item.photos &&
                              item.photos.map((p) => (
                                <img
                                  key={p.id}
                                  className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                                  src={`${API_BASE_URL.replace("/app", "")}${p.image_path}`}
                                  alt="Dokumentasi"
                                />
                              ))}
                            <label className="cursor-pointer inline-flex items-center justify-center h-8 w-8 rounded-full ring-2 ring-white bg-gray-200 text-gray-500 hover:bg-gray-300">
                              <Upload size={14} />
                              <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                  if (e.target.files[0])
                                    handlePhotoUpload(
                                      item.id,
                                      e.target.files[0],
                                    );
                                }}
                              />
                            </label>
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-2">
                            {item.status === "Terjadwal" && (
                              <button
                                onClick={() =>
                                  initiateStatusUpdate(item.id, "Dikirim")
                                }
                                className="btn-primary py-1.5 px-3 text-xs flex items-center shadow-sm bg-orange-500 hover:bg-orange-600 border-none whitespace-nowrap"
                                title="Mulai pengantaran dan aktifkan status pengiriman"
                              >
                                <Send size={14} className="mr-1.5" /> Mulai
                                Jalan
                              </button>
                            )}
                            {item.status === "Dikirim" && (
                              <button
                                onClick={() =>
                                  initiateStatusUpdate(item.id, "Diterima")
                                }
                                className="btn-primary py-1.5 px-3 text-xs flex items-center shadow-sm bg-green-600 hover:bg-green-700 border-none whitespace-nowrap"
                                title="Tandai pesanan sudah diterima"
                              >
                                <CheckCircle size={14} className="mr-1.5" />{" "}
                                Selesai
                              </button>
                            )}
                            {item.status === "Terjadwal" && (
                              <button
                                onClick={() =>
                                  initiateStatusUpdate(item.id, "Dibatalkan")
                                }
                                title="Batalkan Distribusi"
                                className="py-1.5 px-3 text-xs flex items-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors border border-red-100 whitespace-nowrap"
                              >
                                <XCircle size={14} className="mr-1.5" />{" "}
                                Batalkan
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={confirmation.isOpen}
        onClose={() => setConfirmation((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmation.onConfirm}
        title={confirmation.title}
        message={confirmation.message}
        confirmText={confirmation.confirmText}
        confirmColor={confirmation.confirmColor}
        icon={confirmation.icon}
      />
    </div>
  );
}

export default QuickDistributionPage;
