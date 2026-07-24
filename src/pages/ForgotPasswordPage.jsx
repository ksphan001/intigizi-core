import React, { useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "@/services/api";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import { useNotification } from "@/context/NotificationContext";

// Halaman baru untuk Lupa Password
function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { showNotification } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await apiClient.post("/auth_forgot_password.php", {
        email,
      });
      setIsSubmitted(true); // Tampilkan pesan sukses terlepas dari respons
    } catch (error) {
      // Bahkan jika error, tampilkan pesan sukses generik untuk keamanan
      setIsSubmitted(true);
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
          <h2 className="text-3xl font-bold text-gray-800">Lupa Password</h2>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-lg">
          {isSubmitted ? (
            <div className="text-center">
              <Mail size={48} className="mx-auto text-green-500 mb-4" />
              <h3 className="text-xl font-bold text-gray-800">
                Periksa Email Anda
              </h3>
              <p className="text-gray-600 mt-2">
                Jika alamat email yang Anda masukkan terdaftar di sistem kami,
                kami telah mengirimkan sebuah tautan untuk mereset password
                Anda.
              </p>
              <Link
                to="/login"
                className="mt-6 inline-flex items-center text-intigizi-green font-semibold hover:underline"
              >
                <ArrowLeft size={16} className="mr-2" /> Kembali ke Halaman
                Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p className="text-gray-600 mb-6 text-center">
                Masukkan alamat email Anda yang terdaftar. Kami akan mengirimkan
                tautan untuk mengatur ulang password Anda.
              </p>
              <div className="mb-6">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="email"
                >
                  Alamat Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-style"
                  required
                  placeholder="contoh@email.com"
                />
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    "Kirim Tautan Reset"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {!isSubmitted && (
          <p className="text-center text-sm text-gray-600 mt-8">
            Ingat password Anda?{" "}
            <Link
              to="/login"
              className="font-medium text-intigizi-green hover:underline"
            >
              Masuk di sini
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
