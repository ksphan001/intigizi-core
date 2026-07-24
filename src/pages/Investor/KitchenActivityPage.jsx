import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import apiClient from "@/services/api";
import { API_BASE_URL } from "@/config";
import {
  Loader2,
  Calendar,
  MapPin,
  ArrowLeft,
  Search,
  Users,
  Building,
  Heart,
  Fish,
  Leaf,
  Droplets,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import TrackingMap from "@/components/TrackingMap"; // Komponen re-usable
import ImageGalleryModal from "@/components/ImageGalleryModal"; // Komponen re-usable

// --- Sub-Komponen Kalender (Di-copy dari KitchenProfilePage) ---
const CalendarView = ({ onDateSelect, kitchenId }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const fetchEvents = useCallback(
    async (date) => {
      if (!kitchenId) return;
      setLoadingEvents(true);
      try {
        const start = new Date(date.getFullYear(), date.getMonth(), 1)
          .toISOString()
          .split("T")[0];
        const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)
          .toISOString()
          .split("T")[0];
        const response = await apiClient.get(
          "/public_get_distribution_events.php",
          {
            params: { org_id: kitchenId, start, end },
          },
        );
        setEvents(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Failed to fetch calendar events", error);
      } finally {
        setLoadingEvents(false);
      }
    },
    [kitchenId],
  );

  useEffect(() => {
    fetchEvents(currentDate);
  }, [currentDate, fetchEvents]);

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0,
  ).getDate();
  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1,
  ).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth });

  const changeMonth = (offset) => {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1),
    );
  };

  return (
    <div className="bg-white p-4 rounded-lg h-full border shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => changeMonth(-1)}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          &lt;
        </button>
        <h3 className="font-semibold text-center">
          {currentDate.toLocaleString("id-ID", {
            month: "long",
            year: "numeric",
          })}
        </h3>
        <button
          onClick={() => changeMonth(1)}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          &gt;
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 font-semibold">
        {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 mt-2">
        {emptyDays.map((_, i) => (
          <div key={`empty-${i}`}></div>
        ))}
        {days.map((day) => {
          const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isEventDay = events.includes(dateStr);
          return (
            <button
              key={day}
              onClick={() => isEventDay && onDateSelect(dateStr)}
              className={`w-9 h-9 flex items-center justify-center rounded-full text-sm transition-colors disabled:text-gray-300 disabled:cursor-default ${isEventDay ? "bg-intigizi-green text-white font-bold cursor-pointer hover:bg-opacity-80" : "text-gray-600"}`}
              disabled={!isEventDay}
            >
              {day}
            </button>
          );
        })}
      </div>
      {loadingEvents && (
        <div className="text-center text-xs mt-2 text-gray-500">
          Memuat tanggal...
        </div>
      )}
    </div>
  );
};

// --- Sub-Komponen Gizi (Di-copy dari KitchenProfilePage) ---
const NutritionItem = ({ label, value, unit, icon }) => (
  <div className="flex items-center space-x-1.5">
    <div className="text-gray-500">{icon}</div>
    <div>
      <p className="text-xs font-semibold text-gray-800">
        {parseFloat(value || 0).toFixed(0)}{" "}
        <span className="font-normal">{unit}</span>
      </p>
      <p className="text-[10px] text-gray-500 -mt-1">{label}</p>
    </div>
  </div>
);

// --- Halaman Utama ---
function InvestorKitchenActivityPage() {
  const { orgId } = useParams();
  const [selectedDate, setSelectedDate] = useState(null);
  const [trackData, setTrackData] = useState(null);
  const [loadingTrack, setLoadingTrack] = useState(false);
  const [error, setError] = useState("");

  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [galleryStartIndex, setGalleryStartIndex] = useState(0);

  const kitchenName = trackData?.main_kitchen?.name || `Dapur (ID: ${orgId})`;

  const fetchTrackData = useCallback(
    async (date) => {
      if (!orgId) return;
      setSelectedDate(date);
      setLoadingTrack(true);
      setTrackData(null);
      setError("");
      try {
        const response = await apiClient.get(
          "/public_get_distribution_track.php",
          {
            params: { org_id: orgId, date },
          },
        );
        if (response.data && response.data.distributions.length > 0) {
          setTrackData(response.data);
        } else {
          setTrackData(null); // Set ke null jika tidak ada data
        }
      } catch (err) {
        setError("Gagal memuat data pelacakan.");
      } finally {
        setLoadingTrack(false);
      }
    },
    [orgId],
  );

  const openGallery = (photos, startIndex) => {
    setGalleryPhotos(photos);
    setGalleryStartIndex(startIndex);
    setIsGalleryOpen(true);
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      <Link
        to="/app/investor/dashboard"
        className="inline-flex items-center text-gray-600 hover:text-intigizi-green mb-4 transition-colors"
      >
        <ArrowLeft size={16} className="mr-2" />
        Kembali ke Portofolio
      </Link>

      <PageHeader
        title="Pantau Aktivitas Dapur"
        subtitle={`Melihat data distribusi harian dari ${kitchenName}`}
      />

      {error && (
        <div className="text-red-500 p-4 bg-red-100 rounded-md">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Kolom Kalender */}
        <div className="md:col-span-1 lg:col-span-1">
          <CalendarView onDateSelect={fetchTrackData} kitchenId={orgId} />
        </div>

        {/* Kolom Data */}
        <div className="md:col-span-1 lg:col-span-2">
          <div className="bg-white p-4 rounded-lg border shadow-sm min-h-[400px]">
            {loadingTrack ? (
              <div className="flex justify-center items-center h-full min-h-[350px]">
                <Loader2 className="animate-spin text-intigizi-green" />
              </div>
            ) : trackData && trackData.distributions.length > 0 ? (
              <div className="space-y-4">
                <div className="h-48 w-full rounded-lg overflow-hidden border">
                  <TrackingMap
                    mainKitchen={trackData.main_kitchen}
                    distributions={trackData.distributions}
                  />
                </div>
                <h3 className="font-semibold text-lg">
                  Laporan Distribusi{" "}
                  {new Date(selectedDate + "T00:00:00Z").toLocaleDateString(
                    "id-ID",
                    { weekday: "long", day: "numeric", month: "long" },
                  )}
                </h3>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {trackData.distributions.map((dist) => (
                    <div
                      key={dist.report_id}
                      className="bg-gray-50 p-4 rounded-lg border"
                    >
                      <p className="font-bold text-intigizi-green flex items-center">
                        <MapPin size={16} className="mr-2" />
                        {dist.point_name}
                      </p>
                      <p className="text-sm text-gray-600 ml-7 -mt-1">
                        {dist.menu_name} -{" "}
                        <span className="font-semibold">
                          {dist.total_beneficiaries} Porsi
                        </span>
                      </p>

                      {dist.beneficiary_breakdown &&
                        dist.beneficiary_breakdown.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs font-semibold mb-1 flex items-center">
                              <Users size={12} className="mr-1.5" />
                              Rincian Penerima:
                            </p>
                            <div className="flex flex-wrap gap-x-3 gap-y-1">
                              {dist.beneficiary_breakdown.map((item) => (
                                <span
                                  key={item.category_name}
                                  className="text-xs font-medium text-gray-600"
                                >
                                  {item.category_name}:{" "}
                                  <span className="font-bold">
                                    {item.count}
                                  </span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                      {dist.photos && dist.photos.length > 0 && (
                        <div className="flex space-x-2 mt-3 pt-3 border-t">
                          {dist.photos.map((p, idx) => (
                            <img
                              key={p.id}
                              src={`${API_BASE_URL.replace("/app", "")}${p.image_path}`}
                              onClick={() => openGallery(dist.photos, idx)}
                              className="w-16 h-16 object-cover rounded-md cursor-pointer hover:opacity-80 border"
                              alt={`Dokumentasi ${dist.point_name}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 h-full flex flex-col justify-center items-center min-h-[350px]">
                <Search size={32} className="text-gray-300 mb-2" />
                <p className="font-semibold">
                  {selectedDate ? "Tidak Ada Data" : "Pilih Tanggal"}
                </p>
                <p className="text-sm px-4">
                  {selectedDate
                    ? `Tidak ada laporan distribusi pada tanggal ini.`
                    : "Klik tanggal yang aktif di kalender untuk melihat data."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ImageGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        photos={galleryPhotos}
        startIndex={galleryStartIndex}
      />
    </div>
  );
}

export default InvestorKitchenActivityPage;
