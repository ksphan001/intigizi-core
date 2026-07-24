import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "@/services/api";
import PageHeader from "@/components/PageHeader";
import {
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  ShieldCheck,
  Eye,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

// Halaman Dasbor BARU khusus untuk Calon Mitra (role_id 10)

const StatusCard = ({ status, reason, campaignId }) => {
  let config = {
    icon: <Clock size={32} className="text-yellow-500" />,
    title: "Pengajuan Sedang Ditinjau",
    message:
      "Tim Super Admin sedang meninjau data dan dokumen yang Anda kirimkan. Anda akan menerima notifikasi jika ada pembaruan.",
    color: "bg-yellow-50 border-yellow-200",
  };

  if (status === "Ditolak") {
    config = {
      icon: <XCircle size={32} className="text-red-500" />,
      title: "Pengajuan Ditolak",
      message: `Mohon maaf, pengajuan Anda ditolak. Alasan: ${reason || "Tidak ada alasan spesifik."}`,
      color: "bg-red-50 border-red-200",
    };
  } else if (
    status === "Published" ||
    status === "Diterima" ||
    status === "Funded" ||
    status === "Completed"
  ) {
    config = {
      icon: <CheckCircle size={32} className="text-green-500" />,
      title: "Pengajuan Diterbitkan!",
      message:
        "Selamat! Pengajuan Anda telah disetujui dan diterbitkan di halaman pendanaan publik. Anda dapat melihatnya sekarang.",
      color: "bg-green-50 border-green-200",
    };
  } else if (status === "Sedang Diproses") {
    config = {
      icon: <ShieldCheck size={32} className="text-blue-500" />,
      title: "Pengajuan Sedang Diproses",
      message:
        "Tim Super Admin sedang memproses pengajuan Anda untuk diterbitkan. Mohon tunggu.",
      color: "bg-blue-50 border-blue-200",
    };
  }

  return (
    <div className={`p-6 rounded-lg border ${config.color}`}>
      <div className="flex items-center">
        <div className="flex-shrink-0">{config.icon}</div>
        <div className="ml-4">
          <h3 className="text-lg font-bold text-gray-800">{config.title}</h3>
          <p className="text-sm text-gray-600 mt-1">{config.message}</p>
        </div>
      </div>
      {(status === "Published" ||
        status === "Funded" ||
        status === "Completed") &&
        campaignId && (
          <div className="mt-4 pt-4 border-t border-gray-300 text-right">
            <Link to={`/funding/${campaignId}`} className="btn-primary">
              Lihat Kampanye Anda <Eye size={16} className="ml-2" />
            </Link>
          </div>
        )}
    </div>
  );
};

function CalonMitraDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/calon_mitra_get_status.php");

      if (response.data === null) {
        // Jika tidak ada pengajuan, arahkan ke formulir
        navigate("/app/funding/apply");
      } else {
        setApplication(response.data);
      }
    } catch (err) {
      setError("Gagal memuat status pengajuan Anda.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-intigizi-green" size={32} />
      </div>
    );
  }

  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="space-y-6">
      <PageHeader title={`Halo, ${user?.username || "Calon Mitra"}!`} />

      <p className="text-lg text-gray-600">
        Selamat datang di dasbor pengajuan Anda. Di sini Anda dapat memantau
        status pengajuan pendanaan Anda.
      </p>

      {application && (
        <StatusCard
          status={application.status}
          reason={application.rejection_reason}
          campaignId={application.campaign_id}
        />
      )}

      {application?.status !== "Ditolak" && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Langkah Selanjutnya
          </h3>
          <ul className="list-disc pl-5 space-y-2 text-gray-600">
            <li>Pastikan data yang Anda ajukan sudah benar.</li>
            <li>
              Tim Super Admin akan melakukan verifikasi data dan dokumen Anda.
            </li>
            <li>
              Jika disetujui, pengajuan Anda akan diterbitkan di Halaman
              Pendanaan Publik.
            </li>
            <li>
              Anda akan menerima notifikasi email dan pemberitahuan di portal
              jika ada pembaruan status.
            </li>
          </ul>
        </div>
      )}

      {application?.status === "Ditolak" && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Apa yang harus dilakukan?
          </h3>
          <p className="text-gray-600 mb-4">
            Anda dapat memperbaiki pengajuan Anda berdasarkan alasan penolakan
            dan mengirimkannya kembali.
          </p>
          <Link to="/app/funding/apply" className="btn-secondary">
            Edit dan Ajukan Ulang Formulir{" "}
            <ArrowRight size={16} className="ml-2" />
          </Link>
        </div>
      )}
    </div>
  );
}

export default CalonMitraDashboardPage;
