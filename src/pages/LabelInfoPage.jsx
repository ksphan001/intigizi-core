import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { Loader2, ChefHat, Calendar, Clock, Info } from "lucide-react";
import { API_BASE_URL } from "../config";

const LabelInfoPage = () => {
  const [searchParams] = useSearchParams();
  const pid = searchParams.get("pid");
  const date = searchParams.get("date");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!pid || !date) {
        setError("Link tidak valid. Parameter tidak lengkap.");
        setLoading(false);
        return;
      }

      try {
        // Use the global API configuration
        const response = await axios.get(
          `${API_BASE_URL}/public/label_check.php`,
          {
            params: { pid, date },
          },
        );
        setData(response.data);
      } catch (err) {
        console.error(err);
        setError(
          err.response?.data?.message || "Gagal memuat informasi label.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [pid, date]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Memverifikasi Label...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center border-t-4 border-red-500">
          <Info className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 mb-2">
            Informasi Tidak Ditemukan
          </h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 font-sans">
      <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-white/10 rotate-12 scale-150 transform z-0"></div>
          <div className="relative z-10">
            <ChefHat className="w-12 h-12 mx-auto mb-2 opacity-90" />
            <h1 className="text-2xl font-bold tracking-tight">
              {data.kitchen_name}
            </h1>
            <p className="text-blue-100 text-sm mt-1">
              Dapur Produksi Bersertifikat
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-1">
              {data.menu_name}
            </h2>
            <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full uppercase tracking-wider">
              {data.proposal_code}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-50 p-4 rounded-xl text-center">
              <Calendar className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <p className="text-xs text-gray-400 uppercase font-semibold">
                Tgl Produksi
              </p>
              <p className="text-gray-800 font-medium whitespace-nowrap">
                {new Date(data.production_date).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            <div
              className={`p-4 rounded-xl text-center ${data.best_before ? "bg-amber-50" : "bg-gray-50"}`}
            >
              <Clock
                className={`w-6 h-6 mx-auto mb-2 ${data.best_before ? "text-amber-500" : "text-gray-400"}`}
              />
              <p className="text-xs text-gray-400 uppercase font-semibold">
                Baik Sebelum
              </p>
              <p className="text-gray-800 font-medium text-sm">
                {data.best_before
                  ? new Date(data.best_before).toLocaleString("id-ID", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "-"}
              </p>
            </div>
          </div>

          {/* Nutrition Facts Label Style */}
          <div className="border-2 border-black p-4 rounded-lg bg-white">
            <h3 className="font-black text-2xl border-b-[10px] border-black pb-1 mb-2">
              Informasi Nilai Gizi
            </h3>
            <p className="text-sm text-gray-600 mb-2">Takaran Saji Per Porsi</p>
            <hr className="border-t-[6px] border-black my-2" />

            <div className="flex justify-between items-baseline font-bold text-xl mb-1">
              <span>Energi Total</span>
              <span>{Math.round(data.nutrition.energy)} kkal</span>
            </div>
            <hr className="border-black my-1" />

            <div className="space-y-1 text-sm">
              <div className="flex justify-between font-bold border-b border-gray-300 py-1">
                <span>Lemak Total</span>
                <span>{data.nutrition.fat} g</span>
              </div>
              <div className="flex justify-between font-bold border-b border-gray-300 py-1">
                <span>Protein</span>
                <span>{data.nutrition.protein} g</span>
              </div>
              <div className="flex justify-between font-bold border-b border-gray-300 py-1">
                <span>Karbohidrat Total</span>
                <span>{data.nutrition.carbo} g</span>
              </div>
              <div className="flex justify-between py-1 pl-4">
                <span>Serat Pangan</span>
                <span>{data.nutrition.fiber} g</span>
              </div>
            </div>

            <hr className="border-t-[6px] border-black mt-3 mb-1" />
            <p className="text-[10px] leading-tight text-gray-500 text-center">
              *Persen AKG berdasarkan kebutuhan energi 2150 kkal. Kebutuhan
              energi anda mungkin lebih tinggi atau lebih rendah.
            </p>
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400">
              Verifikasi Data Produksi by IntiGizi System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabelInfoPage;
