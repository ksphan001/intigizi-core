import React, { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import apiClient from "@/services/api";
import { Loader2, KeyRound, CheckCircle } from "lucide-react";
import { useNotification } from "@/context/NotificationContext";

// Halaman baru untuk Reset Password
function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const { showNotification } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Password dan konfirmasi password tidak cocok.");
      return;
    }
    if (!token) {
      setError("Token reset tidak valid atau tidak ditemukan.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await apiClient.post("/auth_reset_password.php", {
        token,
        password,
      });
      setIsSuccess(true);
      showNotification(response.data.message, "success");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Gagal mereset password. Tautan mungkin sudah kedaluwarsa.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/">
            {/* PERUBAHAN: Logo diubah ke solusimbg-logo.png */}
            <img
              src="/intigizi-logo.png"
              alt="IntiGizi Logo"
              className="h-12 mx-auto mb-4"
            />
          </Link>
          <h2 className="text-3xl font-bold text-gray-800">
            Atur Ulang Password
          </h2>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-lg">
          {isSuccess ? (
            <div className="text-center">
              <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
              <h3 className="text-xl font-bold text-gray-800">
                Password Berhasil Diperbarui
              </h3>
              <p className="text-gray-600 mt-2">
                Anda sekarang dapat masuk ke akun Anda menggunakan password yang
                baru.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="btn-primary w-full mt-6"
              >
                Ke Halaman Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p className="text-gray-600 mb-6 text-center">
                Masukkan password baru Anda di bawah ini.
              </p>
              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="password"
                >
                  Password Baru
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
              <div className="mb-6">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="confirmPassword"
                >
                  Konfirmasi Password Baru
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-style"
                  required
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm text-center mb-4 p-3 bg-red-100 rounded-md">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  disabled={loading || !token}
                  className="btn-primary w-full"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    "Simpan Password Baru"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
