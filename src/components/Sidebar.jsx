import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  Database,
  Home,
  Utensils,
  Send,
  Truck,
  BookCopy,
  ClipboardList,
  ShoppingCart,
  Package,
  Users,
  MapPin,
  FileText,
  X,
  Settings,
  BarChart3,
  Wallet,
  UserCheck,
  Store,
  Briefcase,
  LayoutDashboard,
  GalleryVertical,
  Inbox,
  Building,
  Banknote,
  CreditCard,
  CheckCircle,
  History,
  PieChart,
  CookingPot,
  UserPlus,
  BookOpen as JournalIcon,
  Printer,
  ArrowUp,
  ArrowDown,
  Landmark,
  Users2,
  FileBarChart,
  PiggyBank,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";

const ROLES = {
  AHLI_GIZI: 1,
  KEPALA_DAPUR: 2,
  AKUNTAN: 3,
  YAYASAN: 4,
  SUPPLIER: 5,
  TIM_DISTRIBUSI: 6,
  ADMINISTRATOR: 7,
  SUPER_ADMIN: 8,
  INVESTOR: 9,
  CALON_MITRA: 10,
};

function Sidebar({ isOpen, setIsOpen }) {
  const { user } = useAuth();
  const location = useLocation();
  const [activeCategory, setActiveCategory] = useState(null);

  useEffect(() => {
    const path = location.pathname;
    if (
      path.includes("/app/proposals") ||
      path.includes("/app/production-tasks") ||
      path.includes("/app/purchase-orders") ||
      path.includes("/app/stock") ||
      path.includes("/app/distribution-reports") ||
      path.includes("/app/quick-distribution")
    ) {
      setActiveCategory("operasional");
    } else if (path.includes("/app/financials")) {
      setActiveCategory("keuangan");
    } else if (path.includes("/app/reports")) {
      setActiveCategory("laporan");
    } else if (
      path.includes("/app/menus") ||
      path.includes("/app/ingredients") ||
      path.includes("/app/suppliers") ||
      path.includes("/app/distribution-points") ||
      path.includes("/app/beneficiaries") ||
      path.includes("/app/volunteers")
    ) {
      setActiveCategory("database");
    } else if (
      path.includes("/app/users") ||
      path.includes("/app/kitchen-gallery") ||
      path.includes("/app/settings")
    ) {
      setActiveCategory("administrasi");
    } else if (
      path.includes("/app/admin/kitchen-partners") ||
      path.includes("/app/admin/vendors") ||
      path.includes("/app/admin/pending-registrations")
    ) {
      setActiveCategory("platform");
    } else if (
      path.includes("/app/admin/funding-applications") ||
      path.includes("/app/admin/investment-verification")
    ) {
      setActiveCategory("pendanaan");
    } else if (
      path.includes("/app/admin/subscription-history") ||
      path.includes("/app/admin/subscription-verification") ||
      path.includes("/app/admin/subscription-settings")
    ) {
      setActiveCategory("langganan");
    } else if (
      path.includes("/app/admin/vendor-categories") ||
      path.includes("/app/admin/expense-categories") ||
      path.includes("/app/admin/beneficiary-categories") ||
      path.includes("/app/admin/master-ingredients")
    ) {
      setActiveCategory("konfigurasi");
    }
  }, [location.pathname]);

  const navLinkClasses =
    "flex items-center px-4 py-2 text-gray-600 rounded-xl hover:bg-intigizi-green-light hover:text-intigizi-green-dark text-sm font-semibold transition-all duration-200 mb-0.5";
  const activeNavLinkClasses =
    "bg-intigizi-green-light text-intigizi-green-dark shadow-sm border border-intigizi-green/20 translate-x-1";

  const hasAccess = (allowedRoles) => {
    if (!user) return false;
    return allowedRoles.includes(Number(user.role_id));
  };

  const renderLink = (to, Icon, text) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `${navLinkClasses} ${isActive ? activeNavLinkClasses : ""}`
      }
      key={to}
      onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
    >
      <Icon className="mr-3" size={20} /> {text}
    </NavLink>
  );

  const renderCategory = (key, title, children) => {
    const isExpanded = activeCategory === key;
    return (
      <div className="mb-2" key={key}>
        <button
          onClick={() => setActiveCategory(isExpanded ? null : key)}
          className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-bold text-gray-400 hover:text-gray-600 uppercase tracking-wider transition-colors focus:outline-none"
        >
          <span>{title}</span>
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        {isExpanded && (
          <div className="space-y-0.5 mt-1 pl-1 transition-all duration-300">
            {children}
          </div>
        )}
      </div>
    );
  };

  const isSuperAdmin = user && Number(user.role_id) === ROLES.SUPER_ADMIN;
  const isExternalVendor =
    user && Number(user.role_id) === ROLES.SUPPLIER && user.org_type === "Vendor";
  const isInternalSupplier =
    user && Number(user.role_id) === ROLES.SUPPLIER && user.org_type !== "Vendor";
  const isCalonMitra = user && Number(user.role_id) === ROLES.CALON_MITRA;
  const isInvestor = user && Number(user.role_id) === ROLES.INVESTOR;

  const isKitchenManagement =
    user &&
    !isSuperAdmin &&
    !isExternalVendor &&
    !isInternalSupplier &&
    !isCalonMitra &&
    !isInvestor;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden ${isOpen ? "block" : "hidden"}`}
        onClick={() => setIsOpen(false)}
      ></div>
      <aside
        className={`fixed lg:relative inset-y-0 left-0 bg-white border-r border-gray-200 w-64 p-4 transform ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 transition-transform duration-300 ease-in-out z-30 flex flex-col`}
      >
        <div className="flex items-center justify-between mb-8 px-2">
          <img src="/intigizi-logo.png" alt="IntiGizi Logo" className="h-10" />
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto no-scrollbar">
          <nav className="space-y-4">
            {/* --- DASHBOARD STANDALONE (SELALU MUNCUL DI ATAS UNTUK AKSES CEPAT) --- */}
            {isKitchenManagement && renderLink("/app/dashboard", Home, "Dashboard")}
            {hasAccess([ROLES.YAYASAN]) && renderLink("/app/manage-sppgs", Building, "Manajemen SPPG")}
            {isSuperAdmin && (
              <>
                {renderLink("/app/admin/dashboard", LayoutDashboard, "Dasbor Admin")}
                {renderLink("/app/admin/analytics", BarChart3, "Analitik Platform")}
              </>
            )}

            {/* --- MENU PERAN DENGAN JUMLAH LINK SEDIKIT (SELALU TERBUKA/TIDAK PERLU COLLAPSE) --- */}
            {(isCalonMitra || hasAccess([ROLES.YAYASAN])) && (
              <div className="space-y-1">
                <div className="px-3 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Pengajuan Kemitraan
                </div>
                {renderLink("/app/funding/dashboard", LayoutDashboard, "Dasbor Pengajuan")}
                {renderLink("/app/funding/apply", FileText, "Formulir Pengajuan")}
              </div>
            )}

            {isInvestor && (
              <div className="space-y-1">
                <div className="px-3 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Investor Area
                </div>
                {renderLink("/app/investor/dashboard", Briefcase, "Portofolio Saya")}
                {renderLink("/funding", PiggyBank, "Proyek Pendanaan")}
              </div>
            )}

            {isExternalVendor && (
              <div className="space-y-1">
                <div className="px-3 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Vendor Area
                </div>
                {renderLink("/app/vendor/dashboard", LayoutDashboard, "Dasbor Vendor")}
                {renderLink("/app/vendor/orders", Inbox, "Pesanan Masuk")}
                {renderLink("/app/vendor/profile", Briefcase, "Profil & Portofolio")}
              </div>
            )}

            {isInternalSupplier && (
              <div className="space-y-1">
                <div className="px-3 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Supplier Area
                </div>
                {renderLink("/app/supplier/dashboard", LayoutDashboard, "Dasbor Supplier")}
                {renderLink("/app/vendor/orders", Inbox, "Pesanan Masuk")}
              </div>
            )}

            {/* --- KATEGORI COLLAPSIBLE (HANYA UNTUK KITCHEN MANAGEMENT & SUPER ADMIN YANG MEMILIKI BANYAK LINK) --- */}
            {isKitchenManagement && (
              <>
                {hasAccess([
                  ROLES.KEPALA_DAPUR,
                  ROLES.AKUNTAN,
                  ROLES.TIM_DISTRIBUSI,
                  ROLES.ADMINISTRATOR,
                ]) &&
                  renderCategory("operasional", "Operasional", (
                    <>
                      {hasAccess([ROLES.KEPALA_DAPUR, ROLES.ADMINISTRATOR]) &&
                        renderLink("/app/proposals", ClipboardList, "Proposal")}
                      {hasAccess([ROLES.KEPALA_DAPUR, ROLES.ADMINISTRATOR]) &&
                        renderLink("/app/production-tasks", CookingPot, "Tugas Produksi")}
                      {hasAccess([ROLES.AKUNTAN, ROLES.ADMINISTRATOR]) &&
                        renderLink("/app/purchase-orders", ShoppingCart, "Purchase Order")}
                      {hasAccess([ROLES.KEPALA_DAPUR, ROLES.ADMINISTRATOR]) &&
                        renderLink("/app/stock", Package, "Stok Gudang")}
                      {hasAccess([ROLES.TIM_DISTRIBUSI, ROLES.ADMINISTRATOR]) &&
                        renderLink("/app/distribution-reports", FileText, "Laporan Distribusi")}
                      {hasAccess([ROLES.TIM_DISTRIBUSI, ROLES.ADMINISTRATOR]) &&
                        renderLink("/app/quick-distribution", Send, "Publikasi Cepat")}
                    </>
                  ))}

                {hasAccess([ROLES.AKUNTAN, ROLES.ADMINISTRATOR]) &&
                  renderCategory("keuangan", "Keuangan", (
                    <>
                      {renderLink("/app/financials/journal", JournalIcon, "Jurnal Umum")}
                      {renderLink("/app/financials/honorarium", Wallet, "Honorarium")}
                    </>
                  ))}

                {hasAccess([
                  ROLES.YAYASAN,
                  ROLES.AKUNTAN,
                  ROLES.AHLI_GIZI,
                  ROLES.KEPALA_DAPUR,
                  ROLES.ADMINISTRATOR,
                ]) &&
                  renderCategory("laporan", "Laporan", (
                    <>
                      {hasAccess([ROLES.AKUNTAN, ROLES.YAYASAN, ROLES.ADMINISTRATOR]) &&
                        renderLink("/app/reports/resume", FileBarChart, "Resume Keuangan (LR)")}
                      {hasAccess([ROLES.AKUNTAN, ROLES.YAYASAN, ROLES.ADMINISTRATOR]) &&
                        renderLink("/app/reports/bku", JournalIcon, "Buku Kas Umum")}
                      {hasAccess([ROLES.AKUNTAN, ROLES.YAYASAN, ROLES.ADMINISTRATOR]) &&
                        renderLink("/app/reports/bp-penerimaan", ArrowUp, "BP Penerimaan")}
                      {hasAccess([ROLES.AKUNTAN, ROLES.YAYASAN, ROLES.ADMINISTRATOR]) &&
                        renderLink("/app/reports/bp-pengeluaran", ArrowDown, "BP Pengeluaran")}
                      {hasAccess([ROLES.AKUNTAN, ROLES.YAYASAN, ROLES.ADMINISTRATOR]) &&
                        renderLink("/app/reports/bp-pajak", Landmark, "BP Pajak")}
                      {hasAccess([ROLES.AKUNTAN, ROLES.YAYASAN, ROLES.ADMINISTRATOR]) &&
                        renderLink("/app/reports/printable", Printer, "Cetak Dokumen")}
                      {hasAccess([ROLES.YAYASAN, ROLES.AKUNTAN, ROLES.ADMINISTRATOR]) &&
                        renderLink("/app/reports/financials", PieChart, "Laporan Keuangan")}
                      {hasAccess([ROLES.KEPALA_DAPUR, ROLES.YAYASAN, ROLES.ADMINISTRATOR]) &&
                        renderLink("/app/reports/production", History, "Riwayat Produksi")}
                      {hasAccess([ROLES.YAYASAN, ROLES.ADMINISTRATOR]) &&
                        renderLink("/app/reports/distribution", BarChart3, "Kinerja Distribusi")}
                      {hasAccess([ROLES.AKUNTAN, ROLES.ADMINISTRATOR]) &&
                        renderLink("/app/reports/purchasing", Truck, "Pembelian Supplier")}
                      {hasAccess([ROLES.AHLI_GIZI, ROLES.KEPALA_DAPUR, ROLES.ADMINISTRATOR]) &&
                        renderLink("/app/reports/usage", Utensils, "Penggunaan Bahan")}
                      {hasAccess([ROLES.YAYASAN, ROLES.AKUNTAN, ROLES.ADMINISTRATOR]) &&
                        renderLink("/app/reports/budget", Wallet, "Ringkasan Anggaran")}
                    </>
                  ))}

                {hasAccess([
                  ROLES.AHLI_GIZI,
                  ROLES.AKUNTAN,
                  ROLES.KEPALA_DAPUR,
                  ROLES.ADMINISTRATOR,
                  ROLES.SUPER_ADMIN,
                ]) &&
                  renderCategory("database", "Data Master", (
                    <>
                      {hasAccess([ROLES.AHLI_GIZI, ROLES.ADMINISTRATOR, ROLES.SUPER_ADMIN]) &&
                        renderLink("/app/menus", BookCopy, "Menu & Resep")}
                      {hasAccess([ROLES.AHLI_GIZI, ROLES.KEPALA_DAPUR, ROLES.ADMINISTRATOR, ROLES.SUPER_ADMIN]) &&
                        renderLink("/app/ingredients", Utensils, "Bahan Baku")}
                      {hasAccess([ROLES.AKUNTAN, ROLES.ADMINISTRATOR, ROLES.SUPER_ADMIN]) &&
                        renderLink("/app/suppliers", Truck, "Supplier")}
                      {hasAccess([ROLES.KEPALA_DAPUR, ROLES.ADMINISTRATOR, ROLES.SUPER_ADMIN]) &&
                        renderLink("/app/distribution-points", MapPin, "Titik Distribusi")}
                      {hasAccess([ROLES.KEPALA_DAPUR, ROLES.ADMINISTRATOR, ROLES.SUPER_ADMIN]) &&
                        renderLink("/app/beneficiaries", Users, "Penerima Manfaat")}
                      {hasAccess([ROLES.KEPALA_DAPUR, ROLES.ADMINISTRATOR, ROLES.SUPER_ADMIN]) &&
                        renderLink("/app/volunteers", Users2, "Sukarelawan")}
                    </>
                  ))}

                {hasAccess([ROLES.ADMINISTRATOR, ROLES.YAYASAN]) &&
                  renderCategory("administrasi", "Administrasi", (
                    <>
                      {hasAccess([ROLES.ADMINISTRATOR, ROLES.YAYASAN]) &&
                        renderLink("/app/users", Users, "Manajemen Pengguna")}
                      {hasAccess([ROLES.ADMINISTRATOR]) &&
                        renderLink("/app/kitchen-gallery", GalleryVertical, "Galeri Dapur")}
                      {renderLink("/app/settings", Settings, "Pengaturan")}
                    </>
                  ))}
              </>
            )}

            {/* --- KATEGORI COLLAPSIBLE SUPER ADMIN --- */}
            {isSuperAdmin && (
              <>
                {renderCategory("platform", "Manajemen Platform", (
                  <>
                    {renderLink("/app/admin/kitchen-partners", Building, "Mitra Dapur")}
                    {renderLink("/app/admin/pending-registrations", UserCheck, "Persetujuan")}
                  </>
                ))}

                {renderCategory("pendanaan", "Pendanaan", (
                  <>
                    {renderLink("/app/admin/funding-applications", Banknote, "Pengajuan")}
                    {renderLink("/app/admin/investment-verification", CheckCircle, "Verifikasi Investasi")}
                  </>
                ))}

                {renderCategory("langganan", "Langganan", (
                  <>
                    {renderLink("/app/admin/subscription-history", History, "Riwayat")}
                    {renderLink("/app/admin/subscription-verification", CheckCircle, "Verifikasi")}
                    {renderLink("/app/admin/subscription-settings", Settings, "Pengaturan")}
                  </>
                ))}

                {renderCategory("konfigurasi", "Konfigurasi", (
                  <>
                    {renderLink("/app/admin/expense-categories", Wallet, "Kategori Biaya")}
                    {renderLink("/app/admin/beneficiary-categories", UserPlus, "Kategori Penerima")}
                    {renderLink("/app/admin/master-ingredients", BookOpen, "Pustaka Bahan Baku")}
                    {renderLink("/app/admin/backup-restore", Database, "Backup & Restore")}
                  </>
                ))}
              </>
            )}
          </nav>
        </div>

        <div className="flex-shrink-0 mt-auto">
          {hasAccess([ROLES.ADMINISTRATOR]) && (isKitchenManagement || isCalonMitra) && (
            <div className="pt-4 border-t">
              <NavLink
                to="/app/subscription"
                className={({ isActive }) =>
                  `${navLinkClasses} ${isActive ? activeNavLinkClasses : ""}`
                }
              >
                <CreditCard className="mr-3" size={20} /> Langganan
              </NavLink>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
