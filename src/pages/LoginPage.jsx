import React, { useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "@/services/api";
import { API_BASE_URL } from "@/config";
import { useNotification } from "@/context/NotificationContext";
import { Loader2 } from "lucide-react";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!API_BASE_URL) {
      showNotification("Konfigurasi API URL belum diatur.", "error");
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient.post("/auth_login.php", {
        email: email,
        password: password,
      });

      const token = response.data.token;
      localStorage.setItem("authToken", token);

      window.location.href = "/app/dashboard";
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        showNotification(err.response.data.message, "error");
      } else {
        showNotification("Terjadi kesalahan. Silakan coba lagi.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/">
            {/* PERUBAHAN: Logo diubah ke intigizi-logo.png */}
            <img
              src="/intigizi-logo.png"
              alt="IntiGizi Logo"
              className="h-12 mx-auto mb-4"
            />
          </Link>
          <h2 className="text-3xl font-bold text-gray-800">
            Selamat Datang Kembali
          </h2>
          <p className="text-gray-500 mt-2">
            Masuk ke akun Anda untuk melanjutkan.
          </p>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-lg">
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="email"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-style"
                required
              />
            </div>
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="password"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-style"
                required
              />
            </div>

            <div className="text-right mb-6">
              {/* PERUBAHAN: Warna link diubah ke solusimbg-blue */}
              <Link
                to="/forgot-password"
                className="text-sm text-intigizi-green hover:underline"
              >
                Lupa password?
              </Link>
            </div>

            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? <Loader2 className="animate-spin" /> : "Masuk"}
              </button>
            </div>
          </form>
        </div>
        <p className="text-center text-sm text-gray-600 mt-8">
          Belum punya akun?{" "}
          <Link
            to="/register"
            className="font-medium text-intigizi-green hover:underline"
          >
            Daftar di sini
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
