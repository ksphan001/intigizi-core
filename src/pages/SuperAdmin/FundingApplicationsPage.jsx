import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "@/services/api";
import PageHeader from "@/components/PageHeader.jsx";
import { Loader2, Eye, Building } from "lucide-react"; // Import ikon Building
import { useNotification } from "@/context/NotificationContext.jsx";

function FundingApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(
        "/superadmin_get_funding_applications.php",
      );
      setApplications(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError("Gagal memuat daftar pengajuan.");
      showNotification("Gagal memuat daftar pengajuan.", "error");
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const getStatusBadge = (status) => {
    // --- PERBAIKAN DI SINI: Menangani status 'null' atau '' ---
    const effectiveStatus = status || "Sudah Diterima";

    const styles = {
      Diterima: "bg-green-100 text-green-800",
      Published: "bg-green-100 text-green-800", // Status baru
      Ditolak: "bg-red-100 text-red-800",
      "Sedang Diproses": "bg-yellow-100 text-yellow-800",
      "Sudah Diterima": "bg-blue-100 text-blue-800",
    };
    // Ganti nama "Published" menjadi "Diterbitkan" untuk tampilan
    const statusText =
      effectiveStatus === "Published" ? "Diterbitkan" : effectiveStatus;
    return (
      <span
        className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[effectiveStatus] || "bg-gray-100 text-gray-800"}`}
      >
        {statusText}
      </span>
    );
  };

  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div>
      <PageHeader title="Daftar Pengajuan Pendanaan" />
      <div className="bg-white p-6 rounded-xl shadow-md">
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3">
                    Nama Proyek / Dapur
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Organisasi Pemohon
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Nama PIC
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Tanggal Pengajuan
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {applications.length > 0 ? (
                  applications.map((item) => (
                    <tr
                      key={item.id}
                      className="bg-white border-b hover:bg-gray-50 cursor-pointer"
                      onClick={() =>
                        navigate(`/app/admin/funding-applications/${item.id}`)
                      }
                    >
                      {/* --- PERBAIKAN: Menampilkan kitchen_name --- */}
                      <th
                        scope="row"
                        className="px-6 py-4 font-medium text-gray-900"
                      >
                        {item.kitchen_name || "(Nama Dapur Belum Diisi)"}
                      </th>
                      {/* --- PERBAIKAN: Menampilkan legal_entity_name --- */}
                      <td className="px-6 py-4 text-gray-600">
                        <div className="flex items-center">
                          <Building size={14} className="mr-2 text-gray-400" />
                          {item.legal_entity_name || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4">{item.pic_full_name}</td>
                      <td className="px-6 py-4">
                        {new Date(item.created_at).toLocaleDateString("id-ID")}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/app/admin/funding-applications/${item.id}`}
                          className="p-1 text-intigizi-green hover:opacity-80"
                          title="Lihat Detail & Kurasi"
                        >
                          <Eye size={16} />
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-500">
                      Belum ada pengajuan pendanaan yang masuk.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default FundingApplicationsPage;
