// File: src/pages/DistributionReportsPage.jsx
// Penjelasan: Halaman Laporan Distribusi.
// UPDATE: Menambahkan handling status 'Terjadwal' pada badge.

import React, { useState, useEffect, useCallback, useRef } from "react";
import apiClient from "@/services/api";
import { useNotification } from "@/context/NotificationContext";
import {
  Plus,
  Edit,
  Loader2,
  Camera,
  Navigation,
  StopCircle,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import DistributionReportForm from "@/components/DistributionReportForm";
import ImageGalleryModal from "@/components/ImageGalleryModal";
import ConfirmationModal from "@/components/ConfirmationModal";

function DistributionReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingReport, setEditingReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showNotification } = useNotification();
  const [dates, setDates] = useState({
    start: new Date(new Date().setDate(1)).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);

  // --- STATE UNTUK LIVE TRACKING ---
  const [isDelivering, setIsDelivering] = useState(false);
  const [isStopConfirmOpen, setIsStopConfirmOpen] = useState(false);
  const watchIdRef = useRef(null);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(
        `/distribution_reports_get.php?start_date=${dates.start}&end_date=${dates.end}`,
      );
      setReports(response.data);
    } catch (error) {
      showNotification("Gagal memuat data laporan distribusi.", "error");
    } finally {
      setLoading(false);
    }
  }, [dates, showNotification]);

  useEffect(() => {
    fetchReports();
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [fetchReports]);

  // ... (Fungsi Live Tracking tetap sama) ...
  const startDelivery = () => {
    if (!navigator.geolocation) {
      showNotification("Browser Anda tidak mendukung Geolocation.", "error");
      return;
    }
    setIsDelivering(true);
    showNotification(
      "Pengantaran dimulai. Lokasi Anda sedang dilacak.",
      "success",
    );
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          await apiClient.post("/tracking_update.php", { latitude, longitude });
        } catch (error) {
          console.error("Gagal mengirim lokasi:", error);
        }
      },
      (error) => {
        console.error("Error Geolocation:", error);
        showNotification(
          "Gagal mengakses lokasi. Pastikan GPS aktif.",
          "error",
        );
        setIsDelivering(false);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 },
    );
  };

  const stopDelivery = async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    try {
      await apiClient.post("/tracking_stop.php");
    } catch (e) {
      console.log("Gagal stop di server");
    }

    setIsDelivering(false);
    setIsStopConfirmOpen(false);
    showNotification("Pengantaran selesai. Pelacakan dihentikan.", "info");
  };

  const handleToggleDelivery = () => {
    if (isDelivering) setIsStopConfirmOpen(true);
    else startDelivery();
  };

  const handleOpenModal = (report = null) => {
    setEditingReport(report);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingReport(null);
  };

  const handleSaveReport = async (formData, newPhotos = []) => {
    try {
      const data = new FormData();
      for (const key in formData) {
        data.append(key, formData[key] || "");
      }
      if (newPhotos.length > 0) {
        newPhotos.forEach((photoFile) => {
          data.append("photos[]", photoFile);
        });
      }

      let response;
      if (editingReport) {
        data.append("id", editingReport.id);
        response = await apiClient.post(
          "/distribution_reports_update.php",
          data,
          {
            headers: { "Content-Type": "multipart/form-data" },
          },
        );
      } else {
        response = await apiClient.post(
          "/distribution_reports_create.php",
          data,
          {
            headers: { "Content-Type": "multipart/form-data" },
          },
        );
      }
      showNotification(response.data.message, "success");
      handleCloseModal();
      fetchReports();
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Gagal menyimpan data.",
        "error",
      );
    }
  };

  const handleDateChange = (e) => {
    setDates((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const openGallery = (photos) => {
    setGalleryImages(photos);
    setIsGalleryOpen(true);
  };

  const getStatusBadge = (status) => {
    const styles = {
      Terjadwal: "bg-gray-100 text-gray-800 border border-gray-200", // Style Baru
      Dikirim: "bg-blue-100 text-blue-800",
      Diterima: "bg-green-100 text-green-800",
      "Sebagian Diterima": "bg-yellow-100 text-yellow-800",
      Gagal: "bg-red-100 text-red-800",
    };
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || ""}`}
      >
        {status}
      </span>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Laporan Distribusi</h1>

        <div className="flex items-center space-x-4">
          <button
            onClick={handleToggleDelivery}
            className={`flex items-center px-4 py-2 rounded-lg font-semibold transition-all shadow-md ${
              isDelivering
                ? "bg-red-600 text-white hover:bg-red-700 animate-pulse"
                : "bg-intigizi-orange text-white hover:bg-opacity-90"
            }`}
          >
            {isDelivering ? (
              <StopCircle size={20} className="mr-2" />
            ) : (
              <Navigation size={20} className="mr-2" />
            )}
            {isDelivering ? "Stop Live Antar" : "Mulai Pengantaran (Live)"}
          </button>

          <div className="flex items-center space-x-2">
            <input
              type="date"
              name="start"
              value={dates.start}
              onChange={handleDateChange}
              className="input-style"
            />
            <span>-</span>
            <input
              type="date"
              name="end"
              value={dates.end}
              onChange={handleDateChange}
              className="input-style"
            />
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="btn-primary flex items-center"
          >
            <Plus size={20} className="mr-2" /> Jadwalkan
          </button>
        </div>
      </div>

      {isDelivering && (
        <div className="mb-6 bg-green-50 border border-green-200 p-4 rounded-lg flex items-center justify-between animate-fade-in">
          <div className="flex items-center">
            <span className="relative flex h-3 w-3 mr-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <p className="text-green-800 font-medium">
              Sesi pengantaran aktif. Lokasi Anda sedang disiarkan ke publik.
            </p>
          </div>
          <button
            onClick={() => setIsStopConfirmOpen(true)}
            className="text-sm text-red-600 hover:underline font-semibold"
          >
            Matikan
          </button>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md">
        {loading ? (
          <div className="text-center">
            <Loader2 className="animate-spin inline-block" />
          </div>
        ) : reports.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            Belum ada laporan distribusi pada periode ini.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Tanggal</th>
                  <th className="px-6 py-3">Titik Distribusi</th>
                  <th className="px-6 py-3">Menu</th>
                  <th className="px-6 py-3 text-center">Terkirim</th>
                  <th className="px-6 py-3 text-center">Diterima</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-center">Dokumentasi</th>
                  <th className="px-6 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr
                    key={report.id}
                    className="bg-white border-b hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      {new Date(
                        report.distribution_date + "T00:00:00",
                      ).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {report.distribution_point_name}
                    </td>
                    <td className="px-6 py-4">{report.menu_name}</td>
                    <td className="px-6 py-4 text-center">
                      {report.quantity_sent}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {report.quantity_received || "-"}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(report.status)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {report.photos && report.photos.length > 0 ? (
                        <button
                          onClick={() => openGallery(report.photos)}
                          className="text-intigizi-green hover:underline text-xs flex items-center justify-center"
                        >
                          <Camera size={16} className="mr-1" />{" "}
                          {report.photos.length} Foto
                        </button>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <button
                          onClick={() => handleOpenModal(report)}
                          className="btn-secondary text-xs px-3 py-1 flex items-center"
                        >
                          <Edit size={14} className="mr-1" /> Update
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={
          editingReport
            ? "Update Laporan Distribusi"
            : "Jadwalkan Pengiriman Baru"
        }
      >
        <DistributionReportForm
          reportData={editingReport}
          onSave={handleSaveReport}
          onCancel={handleCloseModal}
        />
      </Modal>

      <ImageGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        photos={galleryImages}
      />

      <ConfirmationModal
        isOpen={isStopConfirmOpen}
        onClose={() => setIsStopConfirmOpen(false)}
        onConfirm={stopDelivery}
        title="Hentikan Pelacakan Live?"
        message="Apakah Anda yakin ingin mengakhiri sesi pengantaran ini? Posisi Anda tidak akan lagi diperbarui di peta publik."
        confirmText="Ya, Hentikan"
        confirmColor="bg-red-600 hover:bg-red-700"
        icon={<StopCircle size={16} className="mr-2" />}
      />
    </div>
  );
}

export default DistributionReportsPage;
