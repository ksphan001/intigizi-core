import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  BookOpen,
  BarChart3,
  Store,
  Quote,
  Loader2,
  MapPin,
  PiggyBank,
  Zap,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import apiClient from "../services/api";
import { API_BASE_URL } from "../config";

const KitchenCard = ({ kitchen }) => {
  const profileImageUrl = kitchen.profile_picture
    ? `${API_BASE_URL.replace("/app", "")}${kitchen.profile_picture}`
    : "/intigizi-icon.png";

  const descriptionSnippet = kitchen.public_description
    ? `${kitchen.public_description.substring(0, 70)}...`
    : "Mitra Dapur terverifikasi oleh IntiGizi.";

  return (
    <Link
      to={`/dapur/${kitchen.slug}`}
      className="group block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
    >
      <div className="p-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="relative">
            <img
              src={profileImageUrl}
              alt={kitchen.kitchen_name}
              className="h-14 w-14 rounded-full object-cover border-2 border-intigizi-green-light"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/intigizi-icon.png";
              }}
            />
            <div className="absolute -bottom-1 -right-1 bg-intigizi-green text-white p-0.5 rounded-full border-2 border-white">
              <ShieldCheck size={12} />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800 group-hover:text-intigizi-green transition-colors">
              {kitchen.kitchen_name}
            </h3>
            <p className="text-xs text-gray-500 flex items-center mt-1">
              <MapPin size={12} className="mr-1 text-intigizi-orange" />
              {kitchen.regency_name}, {kitchen.province_name}
            </p>
          </div>
        </div>
        <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
          {descriptionSnippet}
        </p>
      </div>
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center group-hover:bg-intigizi-green-light/30 transition-colors">
        <span className="text-sm font-semibold text-intigizi-green-dark">
          Lihat Profil
        </span>
        <ArrowRight
          size={16}
          className="text-intigizi-green-dark transform group-hover:translate-x-1 transition-transform"
        />
      </div>
    </Link>
  );
};

function LandingPage() {
  const [featuredKitchens, setFeaturedKitchens] = useState([]);
  const [loadingKitchens, setLoadingKitchens] = useState(true);

  useEffect(() => {
    const fetchFeaturedKitchens = async () => {
      try {
        const response = await apiClient.get(
          "/public_get_featured_kitchens.php",
        );
        setFeaturedKitchens(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Gagal memuat dapur unggulan:", error);
      } finally {
        setLoadingKitchens(false);
      }
    };
    fetchFeaturedKitchens();
  }, []);

  return (
    <div className="bg-white text-gray-800 font-sans selection:bg-intigizi-green-light selection:text-intigizi-green-dark overflow-x-hidden">
      {/* 1. HERO SECTION: Clean, Modern, Trustworthy */}
      <section className="relative pt-28 pb-16 lg:pt-32 lg:pb-32 overflow-hidden bg-gradient-to-b from-intigizi-green-light/30 to-white">
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-20">
            <div className="lg:w-1/2 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 bg-white border border-intigizi-green-light rounded-full px-3 py-1 mb-6 shadow-sm">
                <span className="flex h-2 w-2 rounded-full bg-intigizi-green animate-pulse"></span>
                <span className="text-xs font-semibold text-intigizi-green-dark tracking-wide uppercase">
                  Platform Ekosistem MBG #1
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-extrabold leading-tight tracking-tight text-gray-900 mb-4 lg:mb-6">
                Revolusi Manajemen{" "}
                <span className="text-intigizi-green">Dapur Profesional</span>
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0">
                IntiGizi menghubungkan Dapur Mitra, Vendor, dan Investor dalam
                satu ekosistem digital. Kelola operasional lebih cerdas,
                efisien, dan transparan.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link
                  to="/register"
                  className="btn-primary w-full sm:w-auto px-8 py-3.5 text-lg shadow-lg shadow-intigizi-green/20"
                >
                  Mulai Sekarang
                </Link>
                <Link
                  to="/funding"
                  className="w-full sm:w-auto px-8 py-3.5 text-lg font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-intigizi-green transition-all duration-300 flex items-center justify-center gap-2 group"
                >
                  <PiggyBank
                    size={20}
                    className="text-intigizi-orange group-hover:scale-110 transition-transform"
                  />
                  <span>Cari Pendanaan</span>
                </Link>
              </div>

              <div className="mt-12 flex items-center justify-center lg:justify-start space-x-8 text-gray-400 grayscale hover:grayscale-0 transition-all duration-500 opacity-70 hover:opacity-100">
                {/* Placeholder logos for social proof */}
                <div className="flex items-center gap-2 font-bold text-xl">
                  <Store size={24} /> MitraDapur
                </div>
                <div className="flex items-center gap-2 font-bold text-xl">
                  <ShieldCheck size={24} /> Terverifikasi
                </div>
              </div>
            </div>

            <div className="lg:w-1/2 relative w-full max-w-md lg:max-w-full mx-auto">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/50 bg-white p-2 sm:p-4 transform rotate-1 hover:rotate-0 transition-transform duration-500">
                <div className="bg-intigizi-green-light/50 rounded-2xl h-56 sm:h-80 lg:h-[500px] flex items-center justify-center relative overflow-hidden group">
                  {/* Modern abstract representation or actual image */}
                  <img
                    src="/petugas-solusimbg.png"
                    alt="App Dashboard"
                    className="absolute bottom-0 w-3/4 sm:w-4/5 object-contain drop-shadow-2xl transform group-hover:scale-105 transition-transform duration-700"
                  />

                  {/* Floating Badge */}
                  <div className="absolute top-4 right-4 sm:top-10 sm:right-10 bg-white p-2 sm:p-4 rounded-xl sm:rounded-2xl shadow-xl animate-bounce-slow max-w-[120px] sm:max-w-none">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="bg-intigizi-orange/10 p-1.5 sm:p-2 rounded-lg">
                        <BarChart3 className="text-intigizi-orange" size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] sm:text-xs text-gray-500 font-medium">
                          Efisiensi
                        </p>
                        <p className="text-sm sm:text-lg font-bold text-gray-800">
                          +45%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Background Blobs */}
              <div className="absolute -top-10 -right-10 w-72 h-72 bg-intigizi-green/30 rounded-full blur-3xl -z-10 mix-blend-multiply opacity-70 animate-blob"></div>
              <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-intigizi-orange/30 rounded-full blur-3xl -z-10 mix-blend-multiply opacity-70 animation-delay-2000 animate-blob"></div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. VALUE PROPOSITION: Clean Grid */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-sm font-bold text-intigizi-orange tracking-widest uppercase mb-3">
              Kenapa IntiGizi?
            </h2>
            <h3 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Solusi Terintegrasi untuk Bisnis Kuliner
            </h3>
            <p className="text-gray-600 text-lg">
              Kami menyederhanakan proses bisnis yang kompleks menjadi platform
              yang mudah digunakan, transparan, dan terukur.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            <FeatureItem
              icon={<Zap size={32} className="text-white" />}
              color="bg-intigizi-orange"
              title="Operasional Cepat"
              desc="Otomatisasi stok, resep, dan pesanan bahan baku dalam satu dashboard terpusat."
            />
            <FeatureItem
              icon={<ShieldCheck size={32} className="text-white" />}
              color="bg-intigizi-green"
              title="Standar Terjamin"
              desc="Semua mitra dapur dan vendor melalui proses verifikasi ketat untuk menjamin kualitas."
            />
            <FeatureItem
              icon={<BarChart3 size={32} className="text-white" />}
              color="bg-intigizi-green-dark"
              title="Data Real-time"
              desc="Pantau performa bisnis, arus kas, dan distribusi bantuan pangan secara transparan."
            />
          </div>
        </div>
      </section>

      {/* 3. FEATURED KITCHENS: Carousel/Grid Style */}
      <section className="py-24 bg-intigizi-green-light/20 relative">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div className="max-w-xl">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Mitra Dapur Unggulan
              </h2>
              <p className="text-gray-600">
                Jelajahi dapur-dapur profesional yang telah bergabung dan siap
                melayani kebutuhan pangan berskala besar.
              </p>
            </div>
            <Link
              to="/register"
              className="text-intigizi-green-dark font-semibold hover:text-intigizi-orange transition-colors flex items-center gap-1 group"
            >
              Bergabung Sebagai Mitra{" "}
              <ArrowRight
                size={18}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
          </div>

          {loadingKitchens ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-intigizi-green" size={40} />
            </div>
          ) : featuredKitchens.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredKitchens.slice(0, 3).map((kitchen) => (
                <KitchenCard key={kitchen.id} kitchen={kitchen} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-300">
              <Store className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500">
                Belum ada dapur unggulan yang ditampilkan saat ini.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 4. STATISTICS / TRUST */}
      <section className="py-20 bg-gradient-to-br from-intigizi-green to-intigizi-green-dark text-white relative overflow-hidden">
        {/* Decorative Circles */}
        <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-intigizi-orange/20 rounded-full blur-3xl"></div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <StatItem number="500+" label="Mitra Dapur" />
            <StatItem number="10k+" label="Transaksi Rutin" />
            <StatItem number="99%" label="Kepuasan Vendor" />
            <StatItem number="24/7" label="Dukungan Sistem" />
          </div>
        </div>
      </section>

      {/* 5. CTA SECTION */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="bg-intigizi-green-light rounded-3xl sm:rounded-[2.5rem] p-8 sm:p-20 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-intigizi-green/10 rounded-full blur-3xl transform translate-x-1/4 -translate-y-1/4"></div>

            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-intigizi-green-dark mb-4 sm:mb-6">
                Siap Mengembangkan Bisnis Dapur Anda?
              </h2>
              <p className="text-base sm:text-lg text-gray-700 mb-8 sm:mb-10 w-full md:w-4/5 mx-auto">
                Bergabunglah dengan ribuan mitra lainnya yang telah meningkatkan
                efisiensi dan transparansi operasional mereka dengan IntiGizi.
              </p>
              <Link
                to="/register"
                className="inline-block bg-intigizi-orange text-white px-8 py-3 sm:px-10 sm:py-4 rounded-xl font-bold text-base sm:text-lg shadow-xl shadow-intigizi-orange/20 hover:bg-intigizi-orange-dark hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto"
              >
                Daftar Sekarang Gratis
              </Link>
              <p className="mt-6 text-sm text-gray-500 flex items-center justify-center gap-2">
                <CheckCircle2 size={16} className="text-intigizi-green" /> Tidak
                butuh kartu kredit
                <span className="mx-2">•</span>
                <CheckCircle2 size={16} className="text-intigizi-green" /> Setup
                instan
              </p>

              <div className="mt-8 pt-8 border-t border-intigizi-green/20">
                <p className="text-sm font-semibold text-intigizi-green-dark mb-4 uppercase tracking-wider">
                  Tersedia juga di Mobile App
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <a
                    href="https://drive.google.com/file/d/1pIIOI7JJb61eUaZldUkloXcC374YoK-t/view?usp=sharing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-black text-white px-4 py-2 rounded-xl flex items-center hover:bg-gray-800 transition-colors shadow-lg"
                  >
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                      alt="Get it on Google Play"
                      className="h-8"
                    />
                  </a>
                  <a
                    href="https://drive.google.com/file/d/1pIIOI7JJb61eUaZldUkloXcC374YoK-t/view?usp=sharing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-black text-white px-5 py-2 rounded-xl flex items-center hover:bg-gray-800 transition-colors shadow-lg"
                  >
                    <div className="flex items-center space-x-2">
                      <svg
                        viewBox="0 0 384 512"
                        fill="currentColor"
                        className="w-6 h-6"
                      >
                        <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 52.3-11.4 69.5-34.3z" />
                      </svg>
                      <span className="text-xs font-medium text-left">
                        <span className="block text-[10px] leading-tight opacity-80">
                          Download on the
                        </span>
                        <span className="text-sm font-bold">App Store</span>
                      </span>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// Sub-components
const FeatureItem = ({ icon, title, desc, color }) => (
  <div className="bg-white p-8 rounded-3xl border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300 group">
    <div
      className={`${color} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-lg`}
    >
      {icon}
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{desc}</p>
  </div>
);

const StatItem = ({ number, label }) => (
  <div>
    <div className="text-4xl lg:text-5xl font-bold mb-2 text-white">
      {number}
    </div>
    <div className="text-intigizi-green-light font-medium tracking-wide uppercase text-sm">
      {label}
    </div>
  </div>
);

export default LandingPage;
