import React, { useState, useEffect } from "react";
import apiClient from "../services/api";
import { Link } from "react-router-dom";
import {
  Loader2,
  PiggyBank,
  MapPin,
  Target,
  TrendingUp,
  Users,
  ArrowRight,
} from "lucide-react";
import { API_BASE_URL } from "../config";

// Fungsi helper untuk format mata uang
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Komponen Card untuk setiap Kampanye
const CampaignCard = ({ campaign }) => {
  const currentAmount = parseFloat(campaign.current_amount || 0);
  const targetAmount = parseFloat(campaign.target_amount);
  const progress = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;

  const coverImageUrl = campaign.cover_image_path
    ? `${API_BASE_URL.replace("/app", "")}${campaign.cover_image_path}`
    : "/intigizi-icon.png";

  return (
    <Link
      to={`/funding/${campaign.id}`}
      className="group block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transform hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
    >
      <div className="h-56 bg-gray-100 relative overflow-hidden">
        <img
          src={coverImageUrl}
          alt={`Cover ${campaign.title}`}
          className="h-full w-full object-cover transform group-hover:scale-110 transition-transform duration-700"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/intigizi-icon.png";
          }}
        />
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-intigizi-green-dark shadow-sm">
          Sedang Berlangsung
        </div>
      </div>
      <div className="p-6">
        <div className="mb-4">
          <div className="flex items-center text-xs text-gray-500 mb-2">
            <MapPin size={12} className="mr-1 text-intigizi-orange" />
            {campaign.organization_name || "Lokasi tidak tersedia"}
          </div>
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-intigizi-green transition-colors line-clamp-2">
            {campaign.title}
          </h3>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-semibold text-gray-500">
              Terkumpul
            </span>
            <span className="text-sm font-bold text-intigizi-green">
              {progress.toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-intigizi-green to-intigizi-green-dark h-full rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <div className="flex justify-between items-center border-t border-gray-50 pt-4">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
              Target Dana
            </p>
            <p className="text-base font-bold text-gray-800">
              {formatCurrency(targetAmount)}
            </p>
          </div>
          <div className="bg-intigizi-green-light/30 p-2 rounded-full text-intigizi-green-dark group-hover:bg-intigizi-green group-hover:text-white transition-colors">
            <ArrowRight size={18} />
          </div>
        </div>
      </div>
    </Link>
  );
};

// Halaman utama Daftar Pendanaan Publik
function PublicFundingListPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Ambil data kampanye saat komponen dimuat
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const response = await apiClient.get(
          "/public_funding_campaigns_get.php",
        );
        setCampaigns(response.data);
      } catch (error) {
        console.error("Gagal memuat data pendanaan:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen font-sans selection:bg-intigizi-green-light selection:text-intigizi-green-dark">
      {/* 1. HERO HEADER */}
      <section className="relative pt-24 pb-32 bg-gradient-to-br from-intigizi-green-dark to-intigizi-green text-white overflow-hidden rounded-b-[3rem] shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-intigizi-orange/20 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>

        <div className="container mx-auto px-6 relative z-10 text-center max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
            Investasi Berdampak Sosial
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-10 leading-relaxed font-light">
            Dukung pertumbuhan dapur profesional lokal dan dapatkan imbal hasil
            yang menarik. Transparan, terukur, dan memberdayakan.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm font-semibold">
            <div className="bg-white/10 backdrop-blur rounded-full px-5 py-2 flex items-center gap-2 border border-white/20">
              <TrendingUp size={16} className="text-intigizi-orange" /> Potensi
              Bagi Hasil Menarik
            </div>
            <div className="bg-white/10 backdrop-blur rounded-full px-5 py-2 flex items-center gap-2 border border-white/20">
              <Users size={16} className="text-intigizi-orange" /> Dampak
              Langsung ke Masyarakat
            </div>
            <div className="bg-white/10 backdrop-blur rounded-full px-5 py-2 flex items-center gap-2 border border-white/20">
              <Target size={16} className="text-intigizi-orange" />{" "}
              Terverifikasi & Aman
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 -mt-16 relative z-20 pb-20">
        {/* LIST CAMPAIGNS */}
        {loading ? (
          <div className="flex justify-center items-center py-32 bg-white rounded-3xl shadow-sm border border-gray-100">
            <div className="flex flex-col items-center">
              <Loader2 className="w-12 h-12 animate-spin text-intigizi-green mb-4" />
              <p className="text-gray-500 font-medium">
                Memuat peluang investasi...
              </p>
            </div>
          </div>
        ) : campaigns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {campaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-3xl shadow-sm border border-gray-100">
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <PiggyBank size={40} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Belum Ada Proyek Aktif
            </h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              Saat ini belum ada dapur yang membuka penggalangan dana. Silakan
              kembali lagi nanti untuk peluang baru.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PublicFundingListPage;
