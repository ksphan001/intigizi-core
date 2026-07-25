// File: src/pages/DistributionReportsPage.jsx
// Penjelasan: Halaman Laporan Distribusi.
// UPDATE: Menambahkan handling status 'Terjadwal' pada badge.

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import apiClient from "@/services/api";
import { useNotification } from "@/context/NotificationContext";
import {
  Plus,
  Edit,
  Loader2,
  Camera,
  Navigation,
  StopCircle,
  Printer,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import DistributionReportForm from "@/components/DistributionReportForm";
import ImageGalleryModal from "@/components/ImageGalleryModal";
import ConfirmationModal from "@/components/ConfirmationModal";
import PrintDeliveryOrderModal from "@/components/PrintDeliveryOrderModal";

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

  // --- STATE CETAK SURAT TUGAS ---
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedPrintDriver, setSelectedPrintDriver] = useState("");

  // --- STATE PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const uniqueDrivers = useMemo(() => {
    return Array.from(new Set(reports.map(r => r.reporter_name).filter(Boolean)));
  }, [reports]);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(
        `/distribution_reports_get.php?start_date=${dates.start}&end_date=${dates.end}`,
      );
      setReports(response.data);
      setCurrentPage(1); // Reset ke halaman pertama saat data diperbarui
    } catch (error) {
      showNotification("Gagal memuat data laporan distribusi.", "error");
    } finally {
      setLoading(false);
    }
  }, [dates, showNotification]);

  // Hitung data untuk halaman saat ini
  const paginatedReports = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return reports.slice(startIndex, startIndex + itemsPerPage);
  }, [reports, currentPage]);

  const totalPages = Math.ceil(reports.length / itemsPerPage);

  const [kitchenInfo, setKitchenInfo] = useState(null);

  useEffect(() => {
    fetchReports();
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [fetchReports]);

  useEffect(() => {
    const fetchKitchenInfo = async () => {
      try {
        const response = await apiClient.get("/organization_get_settings.php");
        setKitchenInfo(response.data);
      } catch (error) {
        console.warn("Gagal memuat profil dapur untuk kop surat", error);
      }
    };
    fetchKitchenInfo();
  }, []);

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

      // AMBIL KOORDINAT GPS UNTUK VALIDASI GEOFENCE
      if (formData.status === 'Diterima' || formData.status === 'Sebagian Diterima') {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 6000,
              maximumAge: 0
            });
          });
          data.append("latitude", position.coords.latitude);
          data.append("longitude", position.coords.longitude);
        } catch (gpsError) {
          console.warn("Gagal mendapatkan lokasi GPS untuk geofence", gpsError);
        }
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
        <PageHeader title="Laporan Distribusi" />

        <div className="flex items-center space-x-3.5">
          <button
            onClick={handleToggleDelivery}
            className={`h-[38px] flex items-center px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-sm ${
              isDelivering
                ? "bg-red-600 text-white hover:bg-red-700 animate-pulse"
                : "bg-intigizi-orange text-white hover:bg-opacity-90"
            }`}
          >
            {isDelivering ? (
              <StopCircle size={16} className="mr-1.5" />
            ) : (
              <Navigation size={16} className="mr-1.5" />
            )}
            {isDelivering ? "Stop Live" : "Antar Live"}
          </button>

          <div className="flex items-center space-x-1.5">
            <input
              type="date"
              name="start"
              value={dates.start}
              onChange={handleDateChange}
              className="mt-0 h-[38px] py-1 px-3.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-intigizi-green/40 focus:border-intigizi-green shadow-sm text-gray-700 font-medium"
            />
            <span className="text-gray-400 font-bold">-</span>
            <input
              type="date"
              name="end"
              value={dates.end}
              onChange={handleDateChange}
              className="mt-0 h-[38px] py-1 px-3.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-intigizi-green/40 focus:border-intigizi-green shadow-sm text-gray-700 font-medium"
            />
          </div>

          <div className="flex items-center space-x-1.5 border-l pl-3 border-gray-200">
            <select
              value={selectedPrintDriver}
              onChange={(e) => setSelectedPrintDriver(e.target.value)}
              className="mt-0 h-[38px] py-1 px-3.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-intigizi-green/40 focus:border-intigizi-green shadow-sm text-gray-700 font-semibold"
            >
              <option value="">-- Semua Kurir --</option>
              {uniqueDrivers.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="h-[38px] px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center transition-colors shadow-sm"
              title="Cetak Surat Tugas/Jalan"
            >
              <Printer size={16} className="mr-1.5" /> Surat Tugas
            </button>
          </div>

          <button
            onClick={() => handleOpenModal()}
            className="h-[38px] px-4 py-2 rounded-xl bg-intigizi-green text-white hover:bg-intigizi-green-dark text-xs font-bold flex items-center transition-colors shadow-sm"
          >
            <Plus size={16} className="mr-1.5" /> Jadwalkan
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
          <>
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
                {paginatedReports.map((report) => (
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3.5 sm:px-6 mt-4">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Sebelumnya
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Selanjutnya
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs text-gray-700">
                    Menampilkan <span className="font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> hingga{" "}
                    <span className="font-bold">{Math.min(currentPage * itemsPerPage, reports.length)}</span> dari{" "}
                    <span className="font-bold">{reports.length}</span> data laporan
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                    >
                      <span className="sr-only">Sebelumnya</span>
                      &laquo;
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        aria-current={currentPage === page ? "page" : undefined}
                        className={`relative inline-flex items-center px-4 py-2 text-xs font-bold focus:z-20 ${
                          currentPage === page
                            ? "z-10 bg-intigizi-green text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-intigizi-green"
                            : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                    >
                      <span className="sr-only">Selanjutnya</span>
                      &raquo;
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
          </>
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

      <PrintDeliveryOrderModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        distributions={reports}
        date={dates.start} // Gunakan start date sebagai perwakilan tanggal cetak
        driverName={selectedPrintDriver}
        kitchenName={kitchenInfo?.kitchen_name || kitchenInfo?.name}
        kitchenAddress={kitchenInfo?.kitchen_address}
        kitchenPhone={kitchenInfo?.pic_whatsapp}
        directorName={kitchenInfo?.director_name}
        driverPhone={reports.find(r => r.reporter_name === selectedPrintDriver)?.reporter_phone}
      />
    </div>
  );
}

export default DistributionReportsPage;
