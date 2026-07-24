import React, { useState, useEffect, useCallback } from "react";
// PERBAIKAN 1: Menambahkan 'useNavigate' yang hilang
import { useParams, Link, useNavigate } from "react-router-dom";
import apiClient from "@/services/api";
import { API_BASE_URL } from "@/config";
import PageHeader from "@/components/PageHeader";
import {
  Loader2,
  ArrowLeft,
  Check,
  X,
  Clock,
  FileText,
  User,
  Building,
  MapPin,
  Calendar,
  Users,
  Home,
  Banknote,
  Percent,
  Send,
  Upload,
  Edit3,
  ShieldCheck,
  CheckCircle,
} from "lucide-react";
import ConfirmationModal from "@/components/ConfirmationModal";
import { useNotification } from "@/context/NotificationContext";
import MapDisplayModal from "@/components/MapDisplayModal";
import { AlertCircle } from "lucide-react"; // Import ikon Building

// Halaman Detail Pengajuan yang dirombak menjadi "Editor Draf"

const InfoItem = ({ icon, label, value }) => (
  <div>
    <p className="text-sm text-gray-500 flex items-center">
      {icon} {label}
    </p>
    <p className="font-semibold text-gray-800 break-words">{value || "-"}</p>
  </div>
);
const InfoItemFull = ({ icon, label, value }) => (
  <div className="col-span-1 md:col-span-2">
    <p className="text-sm text-gray-500 flex items-center">
      {icon} {label}
    </p>
    <p className="font-semibold text-gray-800 break-words">{value || "-"}</p>
  </div>
);

function FundingApplicationDetailPage() {
  const { applicationId } = useParams();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  // State untuk form override
  const [formData, setFormData] = useState({
    title_override: "",
    description_override: "",
    target_amount: "",
    lot_price: "",
    profit_sharing_type: "per_porsi",
    profit_sharing_value: "",
    payout_frequency: "bulanan",
    management_type: "platform",
    platform_commission_rate: "5",
    cover_image: null,
  });
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionType, setActionType] = useState(""); // 'publish', 'reject', 'convert'

  const { showNotification } = useNotification();
  // PERBAIKAN 1: Mendefinisikan 'navigate'
  const navigate = useNavigate();

  const fetchApplication = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(
        `/superadmin_get_funding_application_detail.php?id=${applicationId}`,
      );
      const details = response.data.details;

      // --- PERBAIKAN: data 'campaign' sekarang dikirim dari backend ---
      const campaignData = response.data.campaign; // Ambil data kampanye yang sudah ada

      setApplication(response.data);

      // --- PERBAIKAN: Isi form override dari data 'campaign' jika ada, ---
      // --- jika tidak, baru gunakan data 'details' (pengajuan asli) ---
      setFormData({
        title_override: campaignData?.title || details.kitchen_name || "",
        description_override:
          campaignData?.description || details.public_description || "",
        target_amount:
          campaignData?.target_amount || details.target_amount || "",
        lot_price: campaignData?.lot_price || "",
        profit_sharing_type:
          campaignData?.terms_override?.profit_sharing_type ||
          details.profit_sharing_type ||
          "per_porsi",
        profit_sharing_value:
          campaignData?.terms_override?.profit_sharing_value ||
          details.profit_sharing_value ||
          "",
        payout_frequency:
          campaignData?.terms_override?.payout_frequency ||
          details.payout_frequency ||
          "bulanan",
        management_type:
          campaignData?.terms_override?.management_type ||
          details.management_type ||
          "platform",
        platform_commission_rate:
          campaignData?.terms_override?.platform_commission_rate ||
          details.platform_commission_rate ||
          "5",
        cover_image: null,
      });
      // --- AKHIR PERBAIKAN ---
    } catch (err) {
      setError("Gagal memuat detail pengajuan.");
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    fetchApplication();
  }, [fetchApplication]);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const openConfirm = (type) => {
    setActionType(type);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmAction = async () => {
    setActionLoading(true);

    // --- PERBAIKAN: Gunakan status dari data 'campaign' jika ada ---
    const isUpdating = !!application.campaign; // Cek apakah data kampanye ada
    const successMessage = isUpdating
      ? "Kampanye berhasil diperbarui."
      : "Kampanye berhasil diterbitkan.";
    // --- AKHIR PERBAIKAN ---

    try {
      if (actionType === "publish") {
        const data = new FormData();
        data.append("application_id", applicationId);
        Object.keys(formData).forEach((key) => {
          if (formData[key] !== null) {
            // Pastikan tidak mengirim nilai null
            data.append(key, formData[key]);
          }
        });

        const response = await apiClient.post(
          "/superadmin_publish_campaign.php",
          data,
          {
            headers: { "Content-Type": "multipart/form-data" },
          },
        );
        // Gunakan pesan sukses dinamis
        showNotification(response.data.message || successMessage, "success");
      } else if (actionType === "reject") {
        const response = await apiClient.post(
          "/superadmin_update_funding_application_status.php",
          {
            application_id: applicationId,
            new_status: "Ditolak",
            rejection_reason: rejectionReason,
          },
        );
        showNotification(response.data.message, "success");
      } else if (actionType === "convert") {
        const response = await apiClient.post(
          "/superadmin_convert_to_kitchen.php",
          {
            application_id: applicationId,
          },
        );
        showNotification(response.data.message, "success");
      }

      await fetchApplication();
    } catch (err) {
      showNotification(
        err.response?.data?.message || "Gagal melakukan aksi.",
        "error",
      );
    } finally {
      setActionLoading(false);
      setIsConfirmModalOpen(false);
      setRejectionReason("");
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  const formatCurrency = (value) =>
    value
      ? new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          minimumFractionDigits: 0,
        }).format(value)
      : "-";

  if (loading)
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin mr-2" /> Memuat detail...
      </div>
    );
  if (error) return <div className="text-red-500 p-4">{error}</div>;
  if (!application) return null;

  const { details, documents, campaign } = application; // Ambil 'campaign' dari state
  const point = {
    latitude: details.latitude,
    longitude: details.longitude,
    name: details.kitchen_name,
    address: details.kitchen_address,
  };

  // --- PERBAIKAN: Logika Teks Tombol ---
  // Cek apakah 'campaign' (data dari funding_campaigns) ada
  const isPublished = !!campaign;
  const publishButtonText = isPublished
    ? "Simpan Perubahan Kampanye"
    : "Terbitkan Kampanye";

  return (
    <div className="space-y-6">
      <Link
        to="/app/admin/funding-applications"
        className="flex items-center text-gray-500 hover:text-gray-800"
      >
        <ArrowLeft size={20} className="mr-2" />
        Kembali ke Daftar Pengajuan
      </Link>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {details.legal_entity_name}
            </h1>
            <p className="text-gray-500">
              {details.kitchen_name} (Pemohon: {details.organization_name})
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* --- Editor Draf (Form Baru) --- */}
          <form className="bg-white p-6 rounded-lg shadow-md space-y-4 border border-gray-100">
            {/* PERBAIKAN: Rebranding hipmi-blue -> intigizi-green */}
            <h2 className="text-xl font-bold mb-4 flex items-center text-gray-800">
              <Edit3 size={20} className="mr-3 text-intigizi-green" />
              Editor Draf Kampanye
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label-style">
                  Judul Kampanye (Otomatis/Override)
                </label>
                <input
                  type="text"
                  name="title_override"
                  value={formData.title_override}
                  onChange={handleChange}
                  className="input-style"
                />
              </div>
              <div>
                <label className="label-style">Gambar Cover</label>
                <input
                  type="file"
                  name="cover_image"
                  onChange={handleChange}
                  className="input-style"
                  accept="image/*"
                />
              </div>
            </div>
            <div>
              <label className="label-style">
                Deskripsi Publik (Otomatis/Override)
              </label>
              <textarea
                name="description_override"
                value={formData.description_override}
                onChange={handleChange}
                rows="4"
                className="input-style"
              ></textarea>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label-style">Target Pendanaan (Rp)</label>
                <input
                  type="number"
                  name="target_amount"
                  value={formData.target_amount}
                  onChange={handleChange}
                  className="input-style"
                  placeholder="Contoh: 100000000"
                  required
                />
              </div>
              <div>
                <label className="label-style">Harga per Lot (Rp)</label>
                <input
                  type="number"
                  name="lot_price"
                  value={formData.lot_price}
                  onChange={handleChange}
                  className="input-style"
                  placeholder="Contoh: 100000"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label-style">Skema Profit Sharing</label>
                <select
                  name="profit_sharing_type"
                  value={formData.profit_sharing_type}
                  onChange={handleChange}
                  className="input-style bg-white"
                >
                  <option value="per_porsi">Per Porsi</option>
                  <option value="persentase">Persentase</option>
                </select>
              </div>
              <div>
                <label className="label-style">Nilai Profit Sharing</label>
                <input
                  type="number"
                  name="profit_sharing_value"
                  value={formData.profit_sharing_value}
                  onChange={handleChange}
                  className="input-style"
                  placeholder={
                    formData.profit_sharing_type === "per_porsi"
                      ? "Rp 200"
                      : "10"
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label-style">Frekuensi Pembayaran</label>
                <select
                  name="payout_frequency"
                  value={formData.payout_frequency}
                  onChange={handleChange}
                  className="input-style bg-white"
                >
                  <option value="bulanan">Bulanan</option>
                  <option value="triwulan">Triwulan</option>
                  <option value="semester">Semester</option>
                  <option value="tahunan">Tahun an</option>
                </select>
              </div>
              <div>
                <label className="label-style">Manajemen</label>
                <select
                  name="management_type"
                  value={formData.management_type}
                  onChange={handleChange}
                  className="input-style bg-white"
                >
                  <option value="platform">Platform</option>
                  <option value="mandiri">Mandiri</option>
                </select>
              </div>
              <div>
                <label className="label-style">Komisi Platform (%)</label>
                <input
                  type="number"
                  name="platform_commission_rate"
                  value={formData.platform_commission_rate}
                  onChange={handleChange}
                  className="input-style"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4 border-t">
              {!isPublished && (
                <button
                  type="button"
                  onClick={() => openConfirm("reject")}
                  className="btn-secondary bg-red-100 text-red-600 hover:bg-red-200 border-none"
                >
                  <X size={16} className="mr-2" /> Tolak
                </button>
              )}
              <button
                type="button"
                onClick={() => openConfirm("publish")}
                className="btn-primary bg-gradient-to-r from-intigizi-green to-intigizi-green-dark hover:from-intigizi-green-dark hover:to-intigizi-green border-none"
                disabled={actionLoading}
              >
                <Send size={16} className="mr-2" /> {publishButtonText}
              </button>
            </div>
          </form>

          {/* Data Asli dari Calon Mitra */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <h3 className="text-lg font-bold mb-4 border-b pb-2 flex items-center text-gray-800">
              <Building size={18} className="mr-3 text-intigizi-orange" />
              Info Badan Hukum (Asli)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem
                icon={<User size={14} />}
                label="Nama Pimpinan"
                value={details.director_name}
              />
              <InfoItem
                icon={<Building size={14} />}
                label="Bentuk Badan Hukum"
                value={details.legal_entity_type}
              />
              <InfoItem
                icon={<Calendar size={14} />}
                label="Berdiri Sejak"
                value={formatDate(details.established_date)}
              />
              <InfoItem
                icon={<Banknote size={14} />}
                label="Rekening"
                value={`${details.bank_account_details?.bank_name} - ${details.bank_account_details?.account_number} (a.n. ${details.bank_account_details?.account_name})`}
              />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <h3 className="text-lg font-bold mb-4 border-b pb-2 flex items-center text-gray-800">
              <Home size={18} className="mr-3 text-intigizi-orange" />
              Info Dapur (Asli)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem
                icon={<Banknote size={14} />}
                label="Target Pendanaan Awal"
                value={formatCurrency(details.target_amount)}
              />
              <InfoItem
                icon={<Users size={14} />}
                label="Target Penerima Manfaat"
                value={details.beneficiary_count}
              />
              <InfoItem
                icon={<Home size={14} />}
                label="Status Lahan"
                value={details.land_status}
              />
              <InfoItem
                icon={<Users size={14} />}
                label="Status Vendor"
                value={details.vendor_status}
              />
              <InfoItem
                icon={<CheckCircle size={14} />}
                label="Status MBG"
                value={details.mbg_status}
              />
              <InfoItemFull
                icon={<MapPin size={14} />}
                label="Alamat Dapur"
                value={details.kitchen_address}
              />
              {details.latitude && details.longitude && (
                <div className="mt-2">
                  <button
                    onClick={() => setIsMapModalOpen(true)}
                    className="btn-secondary text-sm hover:text-intigizi-green"
                  >
                    <MapPin size={16} className="mr-2" /> Lihat Lokasi di Peta
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Kolom Kanan - Analisis & Aksi */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center">
              <AlertCircle size={20} className="mr-2 text-blue-500" /> Risk
              Scoring (AI)
            </h3>
            <div className="mb-4 text-center">
              <div className="inline-block relative">
                <svg viewBox="0 0 36 36" className="w-24 h-24">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#eee"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={
                      application.risk_score > 80
                        ? "#269636"
                        : application.risk_score > 50
                          ? "#F28D35"
                          : "#EF4444"
                    }
                    strokeWidth="3"
                    strokeDasharray={`${application.risk_score}, 100`}
                  />
                </svg>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xl font-bold text-gray-800">
                  {application.risk_score}
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2 font-medium">
                {application.risk_category}
              </p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b pb-2 border-gray-100">
                <span className="text-gray-500">Kredit Skor</span>
                <span className="font-semibold">
                  {application.credit_score || "-"}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2 border-gray-100">
                <span className="text-gray-500">Riwayat Transaksi</span>
                <span className="font-semibold text-intigizi-green">Baik</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
            <h4 className="font-bold text-blue-800 mb-2">Catatan IntiGizi</h4>
            <p className="text-sm text-blue-700 leading-relaxed">
              Pastikan semua dokumen legalitas telah terverifikasi sebelum
              menyetujui pencairan dana. Cek kembali riwayat performa dapur
              dalam 3 bulan terakhir.
            </p>
          </div>
        </div>
      </div>

      {/* Modal Approve */}
      {/* Confirmation Modal Shared */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmAction}
        title={actionType === "reject" ? "Tolak Pengajuan" : "Konfirmasi Aksi"}
        message={
          actionType === "reject"
            ? "Apakah Anda yakin ingin menolak pengajuan ini?"
            : "Apakah Anda yakin ingin melanjutkan aksi ini?"
        }
        loading={actionLoading}
        confirmText={
          actionType === "reject" ? "Tolak Pengajuan" : "Ya, Lanjutkan"
        }
        confirmColor={
          actionType === "reject"
            ? "bg-red-600 hover:bg-red-700"
            : "bg-intigizi-green hover:bg-intigizi-green-dark"
        }
      >
        {actionType === "reject" && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alasan Penolakan
            </label>
            <textarea
              className="w-full border rounded-lg p-3 input-style min-h-[100px]"
              placeholder="Contoh: Dokumen NIB belum lengkap..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            ></textarea>
          </div>
        )}
      </ConfirmationModal>
    </div>
  );
}

export default FundingApplicationDetailPage;
