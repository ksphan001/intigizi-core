import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import apiClient from "@/services/api";
import { API_BASE_URL } from "@/config";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import {
  Loader2,
  ArrowLeft,
  PiggyBank,
  Building,
  MapPin,
  Users,
  Target,
  BadgePercent,
  Calendar,
  FileText,
  Banknote,
  Shield,
  Copy,
  Check,
  ChevronRight,
  Calculator,
  TrendingUp,
} from "lucide-react";
import Modal from "@/components/Modal";
import ConfirmationModal from "@/components/ConfirmationModal";

// --- FUNGSI HELPER ---
const formatCurrency = (value) => {
  if (isNaN(value)) {
    value = 0;
  }
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value || 0);
};

// --- KOMPONEN MODAL INSTRUKSI PEMBAYARAN ---
const PaymentInstructionsModal = ({ isOpen, onClose, details }) => {
  const [copied, setCopied] = useState(null);

  if (!isOpen || !details) return null;

  const handleCopy = (text, id) => {
    try {
      navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch (e) {
      console.error("Failed to copy text: ", e);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Instruksi Pembayaran">
      <div>
        <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex items-start gap-3 mb-6">
          <Check className="text-green-600 mt-0.5" size={20} />
          <div>
            <h4 className="font-bold text-green-800">
              Komitmen Investasi Berhasil!
            </h4>
            <p className="text-sm text-green-700">
              Silakan selesaikan pembayaran untuk mengaktifkan kepemilikan lot
              Anda.
            </p>
          </div>
        </div>

        <div className="bg-white border-2 border-dashed border-gray-200 p-6 rounded-xl text-center mb-6">
          <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2">
            TOTAL PEMBAYARAN
          </p>
          <p className="text-4xl font-extrabold text-intigizi-green-dark">
            {formatCurrency(details.total_investment)}
          </p>
        </div>

        <p className="font-bold text-gray-800 mb-4 px-1">
          Transfer ke rekening Virtual Account:
        </p>
        <div className="space-y-4">
          {details.bank_accounts &&
            details.bank_accounts.map((account, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm hover:border-intigizi-green transition-colors"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-gray-900">
                    {account.bank_name}
                  </span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">
                    Virtual Account
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xl font-mono text-gray-700 tracking-wide">
                    {account.account_number}
                  </p>
                  <button
                    onClick={() => handleCopy(account.account_number, index)}
                    className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${copied === index ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                  >
                    {copied === index ? (
                      <Check size={14} className="mr-1" />
                    ) : (
                      <Copy size={14} className="mr-1" />
                    )}
                    {copied === index ? "Tersalin" : "Salin"}
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-2 border-t pt-2 border-gray-50 flex justify-between">
                  <span>Atas Nama:</span>
                  <span className="font-medium text-gray-800">
                    {account.account_name}
                  </span>
                </p>
              </div>
            ))}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            className="btn-primary w-full md:w-auto"
            onClick={onClose}
          >
            Saya Sudah Bayar
          </button>
        </div>
      </div>
    </Modal>
  );
};

// Komponen Badge Info
const DataBadge = ({ label, value, icon }) => (
  <div className="flex flex-col">
    <span className="text-xs text-gray-400 font-medium uppercase mb-1 flex items-center gap-1">
      {icon && React.cloneElement(icon, { size: 12 })} {label}
    </span>
    <span className="font-bold text-gray-800 text-base">{value}</span>
  </div>
);

// Komponen Detail Investasi
const InvestmentDetails = ({ details, terms }) => {
  const target = parseFloat(details.target_amount || 0);
  const lotPrice = parseFloat(details.lot_price || 0);
  const totalLots = lotPrice > 0 ? Math.floor(target / lotPrice) : 0;
  const current = parseFloat(details.current_amount || 0);
  const lotsSold = lotPrice > 0 ? Math.floor(current / lotPrice) : 0;
  const lotsAvailable = totalLots - lotsSold;

  // --- LOGIKA: Hitung Total Profit Pool Harian ---
  const fullDailyProfitText = useMemo(() => {
    const basePortionProfit = 2000;
    const safeBeneficiaries = parseInt(details.beneficiaries_count, 10) || 0;
    const profitShareValue = parseFloat(terms.profit_sharing_value) || 0;
    let fullDailyProfit = 0;

    if (terms.profit_sharing_type === "per_porsi") {
      fullDailyProfit = profitShareValue * safeBeneficiaries;
    } else if (terms.profit_sharing_type === "persentase") {
      const baseTotalProfit = basePortionProfit * safeBeneficiaries;
      fullDailyProfit = baseTotalProfit * (profitShareValue / 100);
    }
    return `${formatCurrency(fullDailyProfit)} / hari`;
  }, [details, terms]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center border-b border-gray-100 pb-4">
        <Banknote size={24} className="mr-3 text-intigizi-green" />
        Detail Penawaran
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <DataBadge
          label="Target Dana"
          value={formatCurrency(target)}
          icon={<Target />}
        />
        <DataBadge
          label="Harga/Lot"
          value={formatCurrency(lotPrice)}
          icon={<BadgePercent />}
        />
        <DataBadge
          label="Total Lot"
          value={totalLots.toLocaleString("id-ID")}
        />
        <DataBadge
          label="Sisa Lot"
          value={lotsAvailable.toLocaleString("id-ID")}
        />
        <DataBadge label="Min. Investasi" value="1 Lot" />
        <DataBadge
          label="Potensi Profit Pool"
          value={fullDailyProfitText}
          icon={<TrendingUp className="text-green-500" />}
        />
        <DataBadge
          label="Frekuensi Bagi Hasil"
          value={terms.payout_frequency || "-"}
          icon={<Calendar />}
        />
        <DataBadge
          label="Tipe Manajemen"
          value={terms.management_type || "-"}
          icon={<Users />}
        />
      </div>
    </div>
  );
};

// Komponen Kalkulator Simulasi
const InvestmentCalculator = ({
  lotPrice,
  profitType,
  profitValue,
  onLotChange,
  lotCount,
  targetAmount,
  beneficiariesCount,
}) => {
  const { totalInvestment, estimatedProfitText } = useMemo(() => {
    const basePortionProfit = 2000;
    const investAmount = (lotCount || 0) * (lotPrice || 0);
    const safeTargetAmount = targetAmount || 0;
    const safeBeneficiaries = beneficiariesCount || 0;
    const profitShareValue = parseFloat(profitValue) || 0;

    let fullDailyProfit = 0;

    if (profitType === "per_porsi") {
      fullDailyProfit = profitShareValue * safeBeneficiaries;
    } else if (profitType === "persentase") {
      const baseTotalProfit = basePortionProfit * safeBeneficiaries;
      fullDailyProfit = baseTotalProfit * (profitShareValue / 100);
    }

    let investorDailyProfit = 0;
    if (safeTargetAmount > 0) {
      investorDailyProfit = (investAmount / safeTargetAmount) * fullDailyProfit;
    }

    return {
      totalInvestment: investAmount,
      estimatedProfitText: `${formatCurrency(investorDailyProfit)}`,
    };
  }, [
    lotCount,
    lotPrice,
    profitType,
    profitValue,
    targetAmount,
    beneficiariesCount,
  ]);

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-xl p-6 md:p-8 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>

      <h2 className="text-xl font-bold mb-6 flex items-center relative z-10">
        <Calculator size={24} className="mr-3 text-intigizi-orange" />
        Simulasi Keuntungan
      </h2>

      <div className="grid md:grid-cols-2 gap-8 relative z-10">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Berapa Lot yang ingin Anda pantau?
          </label>
          <div className="flex items-center bg-white/10 rounded-xl p-1 border border-white/10">
            <button
              className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
              onClick={() => onLotChange(Math.max(1, lotCount - 1))}
            >
              -
            </button>
            <input
              type="number"
              value={lotCount}
              onChange={(e) =>
                onLotChange(Math.max(1, parseInt(e.target.value, 10) || 1))
              }
              className="bg-transparent border-none text-center text-white text-xl font-bold w-full focus:ring-0"
              min="1"
            />
            <button
              className="w-10 h-10 flex items-center justify-center bg-intigizi-green rounded-lg hover:bg-intigizi-green-dark transition-colors"
              onClick={() => onLotChange(lotCount + 1)}
            >
              +
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-white/10 pb-2">
            <span className="text-gray-400 text-sm">Modal Investasi</span>
            <span className="font-bold text-lg">
              {formatCurrency(totalInvestment)}
            </span>
          </div>
          <div>
            <span className="text-gray-400 text-sm block mb-1">
              Estimasi Passive Income (Harian)
            </span>
            <span className="font-bold text-3xl text-intigizi-green">
              {estimatedProfitText}
            </span>
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-6 relative z-10">
        *Simulasi ini berdasarkan performa operasional optimal. Hasil aktual
        dapat bervariasi.
      </p>
    </div>
  );
};

// --- KOMPONEN Sidebar Investasi (Sticky) ---
const InvestmentSidebar = ({ details, onInvestClick, loading, lotCount }) => {
  const target = parseFloat(details.target_amount || 0);
  const current = parseFloat(details.current_amount || 0);
  const progress = target > 0 ? (current / target) * 100 : 0;
  const lotPrice = parseFloat(details.lot_price || 0);
  const totalLots = lotPrice > 0 ? Math.floor(target / lotPrice) : 0;
  const lotsSold = lotPrice > 0 ? Math.floor(current / lotPrice) : 0;
  const lotsAvailable = totalLots - lotsSold;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sticky top-28">
      <div className="mb-6">
        <p className="text-sm font-semibold text-gray-500 mb-1">
          Dana Terkumpul
        </p>
        <div className="flex items-baseline gap-2 mb-3">
          <span className="font-extrabold text-3xl text-gray-900">
            {formatCurrency(current)}
          </span>
          <span className="text-sm text-gray-400">
            dari {formatCurrency(target)}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-intigizi-green to-intigizi-green-dark h-3 rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-2 text-xs font-bold">
          <span className="text-intigizi-green">
            {progress.toFixed(1)}% Tercapai
          </span>
          <span className="text-gray-400">
            {lotsAvailable.toLocaleString("id-ID")} Lot Tersisa
          </span>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
          <span className="text-gray-600 text-sm">Harga per Lot</span>
          <span className="font-bold text-gray-900">
            {formatCurrency(lotPrice)}
          </span>
        </div>
        <div className="flex justify-between items-center p-2">
          <span className="text-gray-600 text-sm">Return on Inv. (Est)</span>
          <span className="font-bold text-intigizi-orange">12 - 18% p.a</span>
        </div>
      </div>

      <button
        onClick={onInvestClick}
        className="btn-primary w-full text-lg py-4 shadow-lg shadow-intigizi-green/20"
        disabled={details.status !== "active" || loading || lotCount <= 0}
      >
        {loading ? (
          <Loader2 className="animate-spin inline-block" />
        ) : details.status === "active" ? (
          `Investasi ${lotCount} Lot Sekarang`
        ) : (
          "Pendanaan Ditutup"
        )}
      </button>

      <p className="text-xs text-center text-gray-400 mt-4 flex items-center justify-center gap-1">
        <Shield size={12} /> Transaksi aman & terverifikasi
      </p>
    </div>
  );
};

// Halaman Detail Kampanye Publik
function PublicFundingDetailPage() {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [lotCount, setLotCount] = useState(1);
  const [investmentLoading, setInvestmentLoading] = useState(false);

  const fetchCampaign = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(
        `/public_funding_campaign_detail_get.php?id=${campaignId}`,
      );
      setCampaign(response.data);
    } catch (err) {
      setError("Gagal memuat detail proyek. Mungkin proyek tidak tersedia.");
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

  // Tombol di Sidebar sekarang memicu ini
  const handleInvestClick = () => {
    if (!user) {
      navigate("/login", { state: { from: `/funding/${campaignId}` } });
      return;
    }
    if (user.role_id !== 9) {
      showNotification(
        "Hanya akun Investor yang dapat melakukan investasi.",
        "warning",
      );
      return;
    }
    setIsConfirmModalOpen(true);
  };

  const handleConfirmInvestment = async () => {
    setInvestmentLoading(true);
    setIsConfirmModalOpen(false);
    try {
      const response = await apiClient.post("/invest_in_campaign.php", {
        campaign_id: campaignId,
        lot_count: lotCount,
      });
      showNotification(response.data.message, "success");
      await fetchCampaign();

      setPaymentDetails({
        bank_accounts: response.data.bank_accounts,
        total_investment: response.data.total_investment,
      });
    } catch (err) {
      showNotification(
        err.response?.data?.message || "Gagal melakukan investasi.",
        "error",
      );
    } finally {
      setInvestmentLoading(false);
      setLotCount(1);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-intigizi-green" size={40} />
      </div>
    );
  if (error)
    return (
      <div className="flex flex-col justify-center items-center h-screen text-center px-4 bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-sm">
          <p className="text-red-500 font-bold mb-4">{error}</p>
          <Link to="/funding" className="btn-primary">
            Kembali ke Daftar
          </Link>
        </div>
      </div>
    );
  if (!campaign) return null;

  const { details, documents } = campaign;
  const terms = details.terms_override || {};

  const coverImageUrl = details.cover_image_path
    ? `${API_BASE_URL.replace("/app", "")}${details.cover_image_path}`
    : `https://placehold.co/1200x600/269636/FFFFFF?text=${details.title}`;

  const totalInvestment = lotCount * parseFloat(details.lot_price || 0);

  return (
    <div className="bg-gray-50 min-h-screen font-sans selection:bg-intigizi-green-light selection:text-intigizi-green-dark">
      {/* HEAD IMAGE BANNER */}
      <div className="relative h-64 md:h-96 w-full bg-gray-200">
        <img
          src={coverImageUrl}
          alt={details.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
        <div className="absolute top-6 left-6 md:left-12">
          <Link
            to="/funding"
            className="inline-flex items-center text-white/80 hover:text-white transition-colors bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium hover:bg-white/30"
          >
            <ArrowLeft size={16} className="mr-2" />
            Kembali
          </Link>
        </div>
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12">
          <div className="container mx-auto">
            <div className="flex items-center text-intigizi-orange font-bold text-sm uppercase tracking-wider mb-2">
              <Target size={16} className="mr-2" /> Proyek Terverifikasi
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 max-w-4xl">
              {details.title}
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center text-white/90 gap-x-6 gap-y-2">
              <div className="flex items-center">
                <Building
                  size={16}
                  className="mr-2 text-intigizi-green-light"
                />
                <span className="font-medium">{details.organization_name}</span>
              </div>
              <div className="flex items-center">
                <MapPin size={16} className="mr-2 text-intigizi-green-light" />
                <span>{details.location_address}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-12 -mt-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* --- Kolom Kiri (Konten Utama) --- */}
          <div className="lg:col-span-2 space-y-8">
            {/* Deskripsi */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Tentang Proyek
              </h2>
              <div className="prose prose-green max-w-none text-gray-600 leading-relaxed">
                <p>{details.description_override || details.description}</p>
              </div>
            </div>

            {/* Detail Investasi */}
            <InvestmentDetails details={details} terms={terms} />

            {/* Kalkulator Simulasi */}
            <InvestmentCalculator
              lotPrice={parseFloat(details.lot_price)}
              profitType={terms.profit_sharing_type}
              profitValue={terms.profit_sharing_value}
              lotCount={lotCount}
              onLotChange={setLotCount}
              targetAmount={parseFloat(details.target_amount)}
              beneficiariesCount={parseInt(details.beneficiaries_count, 10)}
            />

            {/* Dokumen */}
            {documents && documents.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <FileText size={24} className="mr-3 text-intigizi-orange" />
                  Dokumen Legalitas & Prospektus
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={`${API_BASE_URL.replace("/app", "")}${doc.file_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group bg-gray-50 border border-gray-200 p-4 rounded-xl flex items-center hover:border-intigizi-green hover:shadow-md transition-all"
                    >
                      <div className="bg-white p-2 rounded-lg shadow-sm mr-4 group-hover:scale-110 transition-transform">
                        <FileText size={20} className="text-red-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate group-hover:text-intigizi-green transition-colors">
                          {doc.document_name}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          PDF • Klik untuk unduh
                        </p>
                      </div>
                      <ChevronRight
                        size={16}
                        className="text-gray-300 group-hover:text-intigizi-green"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* --- Kolom Kanan (Sidebar Investasi) --- */}
          <div className="lg:col-span-1">
            <InvestmentSidebar
              details={details}
              onInvestClick={handleInvestClick}
              loading={investmentLoading}
              lotCount={lotCount}
            />
          </div>
        </div>
      </div>

      {/* Modal Konfirmasi */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmInvestment}
        title="Konfirmasi Investasi Anda"
        message={`Anda akan melakukan komitmen investasi sebesar ${formatCurrency(totalInvestment)} untuk ${lotCount} Lot pada proyek "${details.title}". Lanjutkan ke pembayaran?`}
        loading={investmentLoading}
        confirmText="Ya, Lanjutkan Pembayaran"
      />

      {/* Modal Instruksi Pembayaran */}
      <PaymentInstructionsModal
        isOpen={!!paymentDetails}
        onClose={() => setPaymentDetails(null)}
        details={paymentDetails}
      />
    </div>
  );
}

export default PublicFundingDetailPage;
