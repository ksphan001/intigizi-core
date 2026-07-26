import React, { useState, useEffect, useRef } from "react";
import { Outlet, Link } from "react-router-dom";
import { Menu, X, LogIn } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

function PublicLayout() {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeAllMenus = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link to={user ? "/app/dashboard" : "/"} onClick={closeAllMenus}>
            <img src="/intigizi-logo.png" alt="IntiGizi Logo" className="h-8" />
          </Link>

          {/* Menu untuk Desktop - Disederhanakan */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/info-tim"
              className="text-gray-600 hover:text-intigizi-green font-medium"
            >
              Tentang Kami
            </Link>
            <Link
              to="/info-permodalan"
              className="text-gray-600 hover:text-intigizi-green font-medium"
            >
              Akses Permodalan
            </Link>
            <Link
              to="/lacak-distribusi"
              className="text-gray-600 hover:text-intigizi-green font-medium"
            >
              Lacak Distribusi
            </Link>
            <Link
              to="/funding"
              className="text-gray-600 hover:text-intigizi-green font-medium"
            >
              Pendanaan Dapur
            </Link>
            <a
              href="http://intigizi-supplier-core.test/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white bg-intigizi-orange hover:bg-opacity-90 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors"
            >
              Sentra IntiGizi
            </a>

            {user ? (
              <Link
                to="/app/dashboard"
                className="bg-intigizi-green text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors text-sm font-medium flex items-center"
              >
                <LogIn size={16} className="mr-2" /> Ke Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-intigizi-green font-medium"
                >
                  Masuk
                </Link>
                <Link
                  to="/register"
                  className="bg-intigizi-green text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors text-sm font-medium"
                >
                  Daftar
                </Link>
              </>
            )}
          </div>

          {/* Tombol Hamburger untuk Mobile */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </nav>

        {/* Dropdown Menu Mobile - Disederhanakan */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t absolute w-full shadow-lg">
            <div className="px-2 pt-2 pb-3 sm:px-3 flex flex-col">
              <Link
                to="/info-tim"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50"
                onClick={closeAllMenus}
              >
                Tentang Kami
              </Link>
              <Link
                to="/info-permodalan"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50"
                onClick={closeAllMenus}
              >
                Akses Permodalan
              </Link>
              <Link
                to="/lacak-distribusi"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50"
                onClick={closeAllMenus}
              >
                Lacak Distribusi
              </Link>
              <Link
                to="/funding"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50"
                onClick={closeAllMenus}
              >
                Pendanaan Dapur
              </Link>
              <a
                href="http://intigizi-supplier-core.test/"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center bg-intigizi-orange text-white mx-3 my-2 px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors text-base font-semibold"
                onClick={closeAllMenus}
              >
                Sentra IntiGizi
              </a>

              <div className="border-t my-2 mx-3"></div>

              {user ? (
                <Link
                  to="/app/dashboard"
                  className="block text-center bg-intigizi-green text-white mx-3 my-2 px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors text-base font-medium"
                  onClick={closeAllMenus}
                >
                  Ke Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50"
                    onClick={closeAllMenus}
                  >
                    Masuk
                  </Link>
                  <Link
                    to="/register"
                    className="block text-center bg-intigizi-green text-white mx-3 my-2 px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors text-base font-medium"
                    onClick={closeAllMenus}
                  >
                    Daftar
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* --- FOOTER MODERN (DESAIN ULANG) --- */}
      <footer className="bg-gradient-to-br from-intigizi-green to-intigizi-green-dark text-white">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {/* Kolom Logo & Deskripsi */}
            <div className="col-span-1 md:col-span-2">
              <div className="bg-white inline-block px-3 py-2 rounded-xl mb-4 shadow-sm">
                <img
                  src="/intigizi-logo.png"
                  alt="IntiGizi Logo"
                  className="h-10"
                />
              </div>
              <p className="text-white/80 max-w-md">
                Platform digital terpadu untuk ekosistem pangan profesional.
                Menghubungkan Mitra Dapur, Sentra IntiGizi, dan Investor dalam satu
                sistem yang efisien dan transparan.
              </p>
            </div>

            {/* Kolom Link Jelajahi */}
            <div>
              <h4 className="font-semibold uppercase text-white mb-4">
                Jelajahi
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/info-tim"
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    Tentang Kami
                  </Link>
                </li>
                <li>
                  <Link
                    to="/info-permodalan"
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    Akses Permodalan
                  </Link>
                </li>
              </ul>
            </div>

            {/* Kolom Link Layanan */}
            <div>
              <h4 className="font-semibold uppercase text-white mb-4">
                Layanan
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/lacak-distribusi"
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    Lacak Distribusi
                  </Link>
                </li>
                <li>
                  <Link
                    to="/funding"
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    Pendanaan Dapur
                  </Link>
                </li>
              </ul>
            </div>

            {/* Kolom Download App */}
            <div>
              <h4 className="font-semibold uppercase text-white mb-4">
                Download Aplikasi
              </h4>
              <p className="text-white/80 text-sm mb-4">
                Dapatkan akses mudah ke manajemen dapur dan pelacakan
                distribusi.
              </p>
              <div className="flex flex-row flex-wrap gap-2">
                <a
                  href="https://drive.google.com/file/d/1pIIOI7JJb61eUaZldUkloXcC374YoK-t/view?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-black/20 hover:bg-black/40 transition-colors text-white w-10 h-10 rounded-lg flex items-center justify-center border border-white/20"
                >
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/d/d0/Google_Play_Arrow_logo.svg"
                    alt="Google Play"
                    className="w-5 h-5"
                  />
                </a>
                <a
                  href="https://drive.google.com/file/d/1pIIOI7JJb61eUaZldUkloXcC374YoK-t/view?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-black/20 hover:bg-black/40 transition-colors text-white w-10 h-10 rounded-lg flex items-center justify-center border border-white/20"
                >
                  <svg
                    viewBox="0 0 384 512"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 52.3-11.4 69.5-34.3z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-white/20 mt-10 pt-6 text-center text-sm text-white/60">
            <p>
              &copy; {new Date().getFullYear()} IntiGizi. Seluruh hak cipta
              dilindungi.
            </p>
          </div>
        </div>
      </footer>
      {/* --- AKHIR FOOTER MODERN --- */}
    </div>
  );
}

export default PublicLayout;
