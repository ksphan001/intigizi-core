import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import apiClient from "@/services/api";
import {
  Loader2,
  Star,
  MapPin,
  Phone,
  Mail,
  Globe,
  ShoppingBag,
  Briefcase,
  Building,
  MessageSquare,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";
import { API_BASE_URL } from "@/config.js";

// Komponen untuk menampilkan bintang rating
const StarRating = ({ rating, reviewCount, size = 18 }) => {
  const ratingValue = parseFloat(rating) || 0;
  const fullStars = Math.floor(ratingValue);
  const halfStar = ratingValue % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
  return (
    <div className="flex items-center space-x-1">
      {[...Array(fullStars)].map((_, i) => (
        <Star
          key={`full-${i}`}
          size={size}
          className="text-intigizi-orange"
          fill="currentColor"
        />
      ))}
      {halfStar && (
        <Star
          key={`half-${i}`}
          size={size}
          className="text-intigizi-orange"
          fill="currentColor"
          style={{ clipPath: "polygon(0 0, 50% 0, 50% 100%, 0 100%)" }}
        />
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} size={size} className="text-gray-300" />
      ))}
      <span className="text-sm font-medium text-gray-600 ml-2">
        ({ratingValue.toFixed(1)}) • {reviewCount || 0} Ulasan
      </span>
    </div>
  );
};

// Halaman Detail Publik Vendor yang telah disempurnakan dan responsif
function VendorDetailPage() {
  const { vendorId } = useParams();
  const [vendorData, setVendorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("about");

  useEffect(() => {
    const fetchVendor = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await apiClient.get(
          `/public_vendor_detail_get.php?id=${vendorId}`,
        );
        if (response.data && response.data.details) {
          setVendorData(response.data);
        } else {
          throw new Error(
            "Data vendor tidak ditemukan atau format tidak sesuai.",
          );
        }
      } catch (error) {
        console.error("Gagal memuat detail vendor:", error);
        setError("Vendor tidak ditemukan atau belum aktif.");
      } finally {
        setLoading(false);
      }
    };
    fetchVendor();
  }, [vendorId]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-intigizi-green" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50 px-4 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm max-w-md w-full">
          <p className="text-red-500 font-bold text-lg mb-2">Opss!</p>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            to="/vendor-directory"
            className="btn-primary w-full inline-block"
          >
            Kembali ke Direktori
          </Link>
        </div>
      </div>
    );
  }

  const { details, reviews, products, portfolio } = vendorData;
  const profileImageUrl = details.profile_picture
    ? `${API_BASE_URL.replace("/app", "")}${details.profile_picture}`
    : "/intigizi-icon.png";

  // Tab Button Component
  const TabButton = ({ tabName, label, icon }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`flex items-center px-6 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap outline-none ${activeTab === tabName ? "border-intigizi-green text-intigizi-green" : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50"}`}
    >
      {React.cloneElement(icon, {
        size: 18,
        className:
          activeTab === tabName
            ? "text-intigizi-green mr-2"
            : "text-gray-400 mr-2 group-hover:text-gray-600",
      })}
      {label}
    </button>
  );

  return (
    <div className="bg-gray-50 min-h-screen font-sans selection:bg-intigizi-green-light selection:text-intigizi-green-dark">
      {/* Header Banner Background */}
      <div className="h-48 md:h-64 bg-gradient-to-r from-gray-900 to-gray-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-intigizi-green/20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10 pt-6">
          <Link
            to="/vendor-directory"
            className="inline-flex items-center text-white/80 hover:text-white transition-colors bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-sm font-medium hover:bg-white/20"
          >
            <ArrowLeft size={16} className="mr-2" />
            Direktori Vendor
          </Link>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 sm:px-6 -mt-24 pb-20 relative z-10">
        {/* VENDOR PROFILE HEADER CARD */}
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-8 border border-gray-100">
          <div className="flex flex-col md:flex-row items-center md:items-start md:space-x-8">
            {/* Avatar */}
            <div className="relative -mt-16 md:-mt-20 mb-4 md:mb-0">
              <img
                src={profileImageUrl}
                alt={details.name}
                className="h-32 w-32 md:h-40 md:w-40 rounded-full object-cover border-4 border-white shadow-md bg-white"
              />
              {details.status === "active" && (
                <div
                  className="absolute bottom-2 right-2 bg-green-500 text-white p-1 rounded-full border-2 border-white"
                  title="Verifikasi"
                >
                  <CheckCircle size={16} />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
                <div>
                  <span className="inline-block px-3 py-1 rounded-full bg-intigizi-green-light/30 text-intigizi-green-dark text-xs font-bold uppercase tracking-wider mb-2">
                    {details.category_name || "Umum"}
                  </span>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {details.name}
                  </h1>
                </div>
                <div className="flex flex-col items-center md:items-end">
                  <StarRating
                    rating={details.average_rating}
                    reviewCount={details.review_count}
                    size={20}
                  />
                </div>
              </div>

              <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4 text-sm text-gray-600">
                <div className="flex items-center bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                  <MapPin size={16} className="text-intigizi-orange mr-2" />
                  {details.vendor_address || "-"}
                </div>
                {details.vendor_website && (
                  <a
                    href={details.vendor_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-intigizi-green hover:underline bg-green-50 px-3 py-1.5 rounded-lg border border-green-100"
                  >
                    <Globe size={16} className="mr-2" /> Website
                  </a>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 pt-6 border-t border-gray-100 lg:w-2/3">
                <div className="flex items-center text-sm text-gray-500">
                  <Phone size={16} className="mr-3 text-gray-400" />{" "}
                  {details.pic_phone || "-"}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Mail size={16} className="mr-3 text-gray-400" />{" "}
                  {details.pic_email || "-"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT TABS */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex overflow-x-auto border-b border-gray-100 scrollbar-hide">
            <TabButton tabName="about" label="Profil" icon={<Building />} />
            <TabButton
              tabName="products"
              label="Produk & Layanan"
              icon={<ShoppingBag />}
            />
            <TabButton
              tabName="portfolio"
              label="Portofolio"
              icon={<Briefcase />}
            />
            <TabButton
              tabName="reviews"
              label="Ulasan Klien"
              icon={<MessageSquare />}
            />
          </div>

          <div className="p-6 sm:p-8 min-h-[400px]">
            {activeTab === "about" && (
              <div className="animate-fadeIn">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Building size={20} className="text-intigizi-orange" />
                  Tentang Perusahaan
                </h2>
                <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed">
                  {details.vendor_description ? (
                    <p className="whitespace-pre-wrap">
                      {details.vendor_description}
                    </p>
                  ) : (
                    <p className="italic text-gray-400">
                      Vendor belum menambahkan deskripsi.
                    </p>
                  )}
                </div>
              </div>
            )}

            {activeTab === "products" && (
              <div className="animate-fadeIn">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <ShoppingBag size={20} className="text-intigizi-orange" />
                  Katalog Produk
                </h2>
                {products && products.length > 0 ? (
                  <div className="border rounded-xl overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider text-xs border-b">
                        <tr>
                          <th className="px-6 py-4">Nama Produk</th>
                          <th className="px-6 py-4">Deskripsi</th>
                          <th className="px-6 py-4 text-right">Harga</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {products.map((p) => (
                          <tr
                            key={p.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4 font-bold text-gray-800">
                              {p.product_name}
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              {p.description}
                            </td>
                            <td className="px-6 py-4 text-right font-mono font-bold text-intigizi-green-dark">
                              {formatCurrency(p.price_per_unit)}{" "}
                              <span className="text-gray-400 text-xs font-normal">
                                / {p.unit_symbol}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <ShoppingBag
                      size={48}
                      className="mx-auto text-gray-300 mb-2"
                    />
                    <p className="text-gray-500">Belum ada data produk.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "portfolio" && (
              <div className="animate-fadeIn">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Briefcase size={20} className="text-intigizi-orange" />
                  Galeri Proyek
                </h2>
                {portfolio && portfolio.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {portfolio.map((item) => (
                      <div
                        key={item.id}
                        className="group rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all"
                      >
                        <div className="h-48 overflow-hidden bg-gray-100">
                          <img
                            src={`${API_BASE_URL.replace("/app", "")}${item.image_path}`}
                            alt={item.title}
                            className="h-full w-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                          />
                        </div>

                        <div className="p-5">
                          <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">
                            {item.title}
                          </h3>
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <Briefcase
                      size={48}
                      className="mx-auto text-gray-300 mb-2"
                    />
                    <p className="text-gray-500">
                      Belum ada portofolio yang diunggah.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="animate-fadeIn">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <MessageSquare size={20} className="text-intigizi-orange" />
                  Ulasan Pengguna
                </h2>
                {reviews && reviews.length > 0 ? (
                  <div className="space-y-6">
                    {reviews.map((review, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 p-6 rounded-xl border border-gray-100"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-bold text-gray-900">
                              {review.reviewer_org_name}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {new Date(review.created_at).toLocaleDateString(
                                "id-ID",
                                {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                },
                              )}
                            </p>
                          </div>
                          <div className="flex bg-white px-2 py-1 rounded-lg border border-gray-200">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={14}
                                className={
                                  i < review.rating
                                    ? "text-intigizi-orange"
                                    : "text-gray-200"
                                }
                                fill="currentColor"
                              />
                            ))}
                          </div>
                        </div>
                        <div className="relative pl-4 border-l-4 border-intigizi-green/30">
                          <p className="text-gray-700 italic">
                            "{review.comment || "Tidak ada komentar tertulis."}"
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <MessageSquare
                      size={48}
                      className="mx-auto text-gray-300 mb-2"
                    />
                    <p className="text-gray-500">
                      Belum ada ulasan untuk vendor ini.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VendorDetailPage;
