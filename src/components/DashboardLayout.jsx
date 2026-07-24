import React, { useState, useEffect, useRef } from "react";
import Sidebar from "./Sidebar";
import { Outlet, useLocation, Link, useNavigate } from "react-router-dom";
import { Menu, Search, Bell, Loader2, AlertTriangle, User, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import NotificationDropdown from "./NotificationDropdown";
import apiClient from "@/services/api";
import Modal from "./Modal";
import SppgSwitcher from "./SppgSwitcher";

// Komponen Modal khusus untuk langganan berakhir
const SubscriptionExpiredModal = ({ isOpen }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md text-center p-8">
        <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800">Langganan Berakhir</h2>
        <p className="text-gray-600 mt-2 mb-6">
          Masa langganan atau trial Anda telah berakhir. Silakan perbarui
          langganan Anda untuk kembali mengakses semua fitur.
        </p>
        <button
          onClick={() => navigate("/app/subscription")}
          className="btn-primary w-full"
        >
          Ke Halaman Langganan
        </button>
      </div>
    </div>
  );
};

function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, loading: authLoading, logout } = useAuth();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const response = await apiClient.get("/notifications_get.php");
      setNotifications(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      if (err.response?.data?.subscription_required) {
        // Jangan tampilkan error jika ini karena langganan berakhir
      } else {
        console.error("Gagal mengambil notifikasi", err);
      }
      setNotifications([]);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifRef, profileRef]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getPageTitle = () => {
    const pathSegments = location.pathname.split("/").filter(Boolean);
    const path = pathSegments.pop();

    if (!path || path === "app" || path === "dashboard") return "Dashboard";
    if (path === "profile") return "Profil Saya";

    if (!isNaN(path)) {
      const parentPath = pathSegments.pop().replace(/-/g, " ");
      return parentPath.replace(/\b\w/g, (l) => l.toUpperCase()) + " Detail";
    }

    return path.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-intigizi-green" size={48} />
      </div>
    );
  }

  // --- PERBAIKAN DI SINI ---
  // Peran yang dikecualikan dari pemeriksaan langganan
  const subscriptionExemptRoles = [
    8, // Super Admin
    9, // Investor
    10, // Calon Mitra
    5, // Supplier (Vendor Internal & Eksternal)
  ];

  const showSubscriptionModal =
    user &&
    !subscriptionExemptRoles.includes(Number(user.role_id)) && // Cek apakah peran BUKAN salah satu yang dikecualikan
    ["expired", "inactive"].includes(user.subscription_status) &&
    location.pathname !== "/app/subscription";
  // --- AKHIR PERBAIKAN ---

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex justify-between items-center py-4 px-6 bg-white border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="text-gray-500 focus:outline-none lg:hidden mr-2"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-semibold text-gray-800">
              {getPageTitle()}
            </h1>
            <SppgSwitcher />
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <input
                type="text"
                placeholder="Search..."
                className="bg-gray-100 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-intigizi-green text-sm"
              />
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
            </div>

            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="text-gray-500 hover:text-gray-800 relative"
              >
                <Bell size={22} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                    {unreadCount}
                  </span>
                )}
              </button>
              {isNotifOpen && (
                <NotificationDropdown
                  notifications={notifications}
                  onClose={() => setIsNotifOpen(false)}
                  onRefresh={fetchNotifications}
                />
              )}
            </div>

            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 cursor-pointer focus:outline-none"
              >
                <div className="w-8 h-8 bg-intigizi-green rounded-full flex items-center justify-center text-white font-bold">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700">
                  {user?.username}
                </span>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 border border-gray-100 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-800 truncate">{user?.username}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email || 'Mitra Dapur'}</p>
                  </div>
                  <Link
                    to="/app/profile"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <User size={16} className="mr-2 text-gray-400" />
                    Profil Saya
                  </Link>
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left transition-colors"
                  >
                    <LogOut size={16} className="mr-2 text-red-400" />
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 relative">
          <Outlet />
          {/* Tampilkan modal jika langganan berakhir */}
          <SubscriptionExpiredModal isOpen={showSubscriptionModal} />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
