import React, { useState, useEffect } from "react";
import apiClient from "../services/api";
import { Link } from "react-router-dom";
import {
  Loader2,
  Search,
  MapPin,
  Building,
  Star,
  Filter,
  ArrowRight,
  Store,
  ChefHat,
  ShoppingBag,
} from "lucide-react";
import { API_BASE_URL } from "../config";

// Komponen Card untuk setiap Vendor
const VendorCard = ({ vendor }) => {
  const profileImageUrl = vendor.profile_picture
    ? `${API_BASE_URL.replace("/app", "")}${vendor.profile_picture}`
    : "/intigizi-icon.png";

  return (
    <Link
      to={`/vendors/${vendor.id}`}
      className="group block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transform hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
    >
      <div className="h-48 bg-gray-100 relative overflow-hidden">
        <img
          src={profileImageUrl}
          alt={`${vendor.name} profile`}
          className="h-full w-full object-cover transform group-hover:scale-110 transition-transform duration-700"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/intigizi-icon.png";
          }}
        />
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-intigizi-green-dark shadow-sm flex items-center gap-1">
          <Star
            size={12}
            fill="currentColor"
            className="text-intigizi-orange"
          />{" "}
          {parseFloat(vendor.average_rating || 0).toFixed(1)}
        </div>
      </div>
      <div className="p-6">
        <div className="mb-4">
          <div className="flex items-center text-xs font-bold uppercase tracking-wider text-intigizi-orange mb-2">
            <ChefHat size={14} className="mr-1.5" />
            {vendor.category_name || "Umum"}
          </div>
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-intigizi-green transition-colors line-clamp-1">
            {vendor.name}
          </h3>
        </div>

        <p className="text-sm text-gray-500 mb-6 flex items-center">
          <MapPin size={14} className="mr-2 text-gray-400 flex-shrink-0" />
          <span className="truncate">
            {vendor.province || "Lokasi tidak tersedia"}
          </span>
        </p>

        <div className="flex justify-between items-center border-t border-gray-50 pt-4">
          <span className="text-sm font-semibold text-gray-400 group-hover:text-intigizi-green transition-colors">
            Lihat Profil
          </span>
          <div className="bg-intigizi-green-light/30 p-2 rounded-full text-intigizi-green-dark group-hover:bg-intigizi-green group-hover:text-white transition-colors">
            <ArrowRight size={18} />
          </div>
        </div>
      </div>
    </Link>
  );
};

// Halaman utama Direktori Vendor
function VendorDirectoryPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");

  // Data untuk filter
  const [categories, setCategories] = useState([]);
  const [provinces, setProvinces] = useState([]);

  // Ambil data vendor dan filter saat komponen dimuat
  useEffect(() => {
    const fetchVendorsAndFilters = async () => {
      try {
        const [vendorsRes, categoriesRes, provincesRes] = await Promise.all([
          apiClient.get("/public_vendors_get.php"),
          apiClient.get("/vendor_categories_get.php"),
          apiClient.get("/public_provinces_get.php"),
        ]);

        setVendors(vendorsRes.data);
        setCategories(categoriesRes.data);
        setProvinces(provincesRes.data);
      } catch (error) {
        console.error("Gagal memuat data vendor:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVendorsAndFilters();
  }, []);

  // Logika untuk memfilter vendor
  const filteredVendors = vendors.filter((vendor) => {
    const nameMatch = vendor.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const categoryMatch =
      !selectedCategory || vendor.category_name === selectedCategory;
    const provinceMatch =
      !selectedProvince || vendor.province === selectedProvince;
    return nameMatch && categoryMatch && provinceMatch;
  });

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      {/* 1. HERO HEADER */}
      <section className="relative pt-24 pb-32 bg-gradient-to-r from-intigizi-green-dark to-intigizi-green text-white overflow-hidden rounded-b-[3rem] shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3"></div>

        <div className="container mx-auto px-6 relative z-10 text-center max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
            Direktori Mitra Vendor
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-8 leading-relaxed font-light max-w-2xl mx-auto">
            Temukan pemasok bahan baku berkualitas dan penyedia peralatan dapur
            terverifikasi untuk mendukung operasional Anda.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-6 -mt-20 relative z-20 pb-20">
        {/* FILTER BAR */}
        <div className="bg-white p-6 rounded-2xl shadow-xl mb-10 border border-gray-100">
          <div className="flex items-center gap-2 mb-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
            <Filter size={14} /> Filter & Pencarian
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Input Pencarian */}
            <div className="relative md:col-span-2">
              <input
                type="text"
                placeholder="Cari nama vendor..."
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-intigizi-green focus:border-transparent outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>

            {/* Filter Kategori */}
            <div className="relative">
              <select
                className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-intigizi-green focus:border-transparent outline-none appearance-none cursor-pointer"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">Semua Kategori</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>
            </div>

            {/* Filter Provinsi */}
            <div className="relative">
              <select
                className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-intigizi-green focus:border-transparent outline-none appearance-none cursor-pointer"
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
              >
                <option value="">Semua Provinsi</option>
                {provinces.map((province, index) => (
                  <option key={index} value={province}>
                    {province}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* LIST VENDORS */}
        {loading ? (
          <div className="flex justify-center items-center py-32 bg-white rounded-3xl shadow-sm border border-gray-100">
            <div className="flex flex-col items-center">
              <Loader2 className="w-12 h-12 animate-spin text-intigizi-green mb-4" />
              <p className="text-gray-500 font-medium">Memuat data vendor...</p>
            </div>
          </div>
        ) : filteredVendors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredVendors.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-3xl shadow-sm border border-gray-100">
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Store size={40} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Vendor Tidak Ditemukan
            </h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              Coba sesuaikan kata kunci pencarian atau filter kategori Anda.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default VendorDirectoryPage;
