import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useParams, Link } from "react-router-dom";
import apiClient from "../services/api";
import {
  Loader2,
  MapPin,
  Calendar,
  Camera,
  Info,
  Utensils,
  ArrowLeft,
  Heart,
  Leaf,
  Fish,
  Droplets,
  Users,
  Search,
  Building,
  Clock,
  Truck,
} from "lucide-react";
import TrackingMap from "../components/TrackingMap";
import DistributionMap from "../components/DistributionMap";
import ImageGalleryModal from "../components/ImageGalleryModal";
import { API_BASE_URL } from "../config";

// --- Sub-Komponen untuk Halaman Profil ---

const InfoCard = ({ icon, title, children, className = "" }) => (
  <div
    className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col ${className}`}
  >
    <div className="flex items-center mb-5 flex-shrink-0 border-b border-gray-50 pb-3">
      <div className="p-2 bg-green-50 rounded-lg mr-3">
        {React.cloneElement(icon, {
          size: 20,
          className: "text-intigizi-green",
        })}
      </div>
      <h2 className="text-lg font-bold text-gray-800">{title}</h2>
    </div>
    <div className="flex-grow">{children}</div>
  </div>
);

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
    <div className="bg-white p-4 rounded-lg h-full border border-gray-100 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => changeMonth(-1)}
          className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-intigizi-green transition-colors"
        >
          &lt;
        </button>
        <h3 className="font-semibold text-center text-gray-800">
          {currentDate.toLocaleString("id-ID", {
            month: "long",
            year: "numeric",
          })}
        </h3>
        <button
          onClick={() => changeMonth(1)}
          className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-intigizi-green transition-colors"
        >
          &gt;
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-wide text-gray-400 font-bold mb-2">
        {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
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
              className={`w-8 h-8 flex items-center justify-center rounded-full text-xs transition-all duration-200 
                                ${
                                  isEventDay
                                    ? "bg-intigizi-green text-white font-bold cursor-pointer hover:shadow-md hover:bg-intigizi-green-dark transform hover:-translate-y-0.5"
                                    : "text-gray-400 cursor-default"
                                }`}
              disabled={!isEventDay}
            >
              {day}
            </button>
          );
        })}
      </div>
      {loadingEvents && (
        <div className="text-center text-xs mt-3 text-gray-400 italic">
          Memuat jadwal...
        </div>
      )}
    </div>
  );
};

const NutritionItem = ({ label, value, unit, icon }) => (
  <div className="bg-white rounded p-2 border border-gray-100 flex flex-col items-center justify-center text-center shadow-sm">
    <div className="mb-1">{icon}</div>
    <p className="text-xs font-bold text-gray-800">
      {parseFloat(value || 0).toFixed(0)}{" "}
      <span className="text-[10px] font-normal text-gray-500">{unit}</span>
    </p>
    <p className="text-[9px] text-gray-400 uppercase tracking-wide">{label}</p>
  </div>
);

// --- Halaman Utama ---

function KitchenProfilePage() {
  const { slug } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [trackData, setTrackData] = useState(null);
  const [loadingTrack, setLoadingTrack] = useState(false);

  // Live Tracking State
  const [couriers, setCouriers] = useState([]);
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const pollingInterval = useRef(null);

  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [galleryStartIndex, setGalleryStartIndex] = useState(0);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(
        `/public_get_kitchen_profile.php?slug=${slug}`,
      );
      setProfile(response.data);
    } catch (err) {
      setError(
        "Gagal memuat profil dapur. Mungkin link tidak valid atau dapur belum aktif.",
      );
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const fetchTrackData = useCallback(
    async (date) => {
      if (!profile?.details?.id) return;
      setSelectedDate(date);
      setLoadingTrack(true);
      setTrackData(null);
      try {
        const response = await apiClient.get(
          "/public_get_distribution_track.php",
          {
            params: { org_id: profile.details.id, date },
          },
        );
        setTrackData(response.data);

        // Check if today for live tracking
        const today = new Date().toISOString().split("T")[0];
        if (date === today) {
          setIsLiveTracking(true);
        } else {
          setIsLiveTracking(false);
          setCouriers([]);
        }
      } catch (err) {
        setError("Gagal memuat data pelacakan.");
      } finally {
        setLoadingTrack(false);
      }
    },
    [profile?.details?.id],
  );

  // Polling Courier Location
  useEffect(() => {
    if (isLiveTracking && profile?.details?.id) {
      const fetchCouriers = async () => {
        try {
          const response = await apiClient.get(
            `/public_get_courier_location.php?org_id=${profile.details.id}`,
          );
          if (
            response.data &&
            response.data.found &&
            Array.isArray(response.data.couriers)
          ) {
            setCouriers(response.data.couriers);
          } else {
            setCouriers([]);
          }
        } catch (err) {
          console.error("Error fetching live tracking", err);
        }
      };

      fetchCouriers(); // Initial fetch
      pollingInterval.current = setInterval(fetchCouriers, 5000); // Poll every 5s

      return () => {
        if (pollingInterval.current) clearInterval(pollingInterval.current);
      };
    }
  }, [isLiveTracking, profile?.details?.id]);

  const openGallery = (photos, startIndex) => {
    setGalleryPhotos(photos);
    setGalleryStartIndex(startIndex);
    setIsGalleryOpen(true);
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <Loader2 className="animate-spin text-intigizi-green" size={40} />
        <p className="ml-3 text-gray-500 font-medium">Memuat Profil Dapur...</p>
      </div>
    );
  if (error)
    return (
      <div className="flex flex-col justify-center items-center h-screen text-center px-4">
        <Info size={48} className="text-red-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800">
          Profil Tidak Ditemukan
        </h2>
        <p className="text-gray-600 mt-2">{error}</p>
        <Link to="/" className="mt-6 btn-primary">
          Kembali ke Beranda
        </Link>
      </div>
    );
  if (!profile || !profile.details)
    return (
      <div className="flex justify-center items-center h-screen">
        Data profil tidak lengkap.
      </div>
    );

  const { details } = profile;
  const gallery = profile.gallery || [];
  const schedule = profile.schedule || [];
  const distribution_points = profile.distribution_points || [];
  const profileImageUrl = details.profile_picture
    ? `${API_BASE_URL.replace("/app", "")}${details.profile_picture}`
    : "/intigizi-icon.png";

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* HERO SECTION MODERN */}
      <div className="relative bg-white overflow-hidden mb-8 border-b border-gray-100">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-intigizi-green-light to-white opacity-50 z-0"></div>
        <div className="container mx-auto max-w-7xl px-4 pt-8 pb-8 relative z-10">
          <Link
            to="/"
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-intigizi-green mb-6 transition-colors"
          >
            <ArrowLeft size={16} className="mr-2" />
            Kembali ke Halaman Utama
          </Link>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-intigizi-green to-intigizi-orange rounded-full opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt blur"></div>
              <img
                className="relative w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-white shadow-xl"
                src={profileImageUrl}
                alt={`Profil ${details.kitchen_name}`}
              />
            </div>

            <div className="flex-grow text-center md:text-left mt-2 md:mt-0">
              <div className="inline-flex items-center bg-green-50 text-intigizi-green-dark px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 shadow-sm border border-green-100">
                <Utensils size={12} className="mr-1.5" /> Dapur Terverifikasi
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-2 tracking-tight">
                {details.kitchen_name}
              </h1>
              <p className="text-gray-500 flex items-center justify-center md:justify-start font-medium text-lg mb-4">
                <Building size={18} className="mr-2 text-gray-400" />
                Dikelola oleh:{" "}
                <span className="text-gray-800 ml-1">{details.name}</span>
              </p>
              <p className="text-gray-600 text-base leading-relaxed max-w-3xl mx-auto md:mx-0 bg-white/50 backdrop-blur-sm p-4 rounded-lg border border-gray-100 shadow-sm">
                {details.public_description ||
                  "Dapur ini berdedikasi menyediakan makanan bergizi untuk masyarakat dengan standar kebersihan dan kualitas tinggi."}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-4 mt-6 md:mt-0">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center min-w-[100px]">
                <p className="text-3xl font-bold text-intigizi-green">
                  {schedule.length}
                </p>
                <p className="text-xs text-gray-500 font-medium uppercase mt-1">
                  Jadwal
                  <br />
                  Menu
                </p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center min-w-[100px]">
                <p className="text-3xl font-bold text-intigizi-orange">
                  {distribution_points.length}
                </p>
                <p className="text-xs text-gray-500 font-medium uppercase mt-1">
                  Titik
                  <br />
                  Distribusi
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* LEFT COLUMN */}
          <div className="w-full lg:w-2/3 flex flex-col gap-8">
            <InfoCard icon={<Truck />} title="Lacak Distribusi & Gizi">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full">
                <div className="md:col-span-4 h-full">
                  <CalendarView
                    onDateSelect={fetchTrackData}
                    kitchenId={details.id}
                  />
                </div>
                <div className="md:col-span-8 min-h-[400px] bg-gray-50 rounded-lg border border-gray-200 relative overflow-hidden flex flex-col">
                  {loadingTrack && (
                    <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur flex justify-center items-center">
                      <Loader2
                        className="animate-spin text-intigizi-green"
                        size={32}
                      />
                    </div>
                  )}

                  {trackData && trackData.distributions.length > 0 ? (
                    <div className="flex flex-col h-full">
                      {/* MAP AREA */}
                      <div className="h-64 w-full relative border-b border-gray-200">
                        <TrackingMap
                          mainKitchen={trackData.main_kitchen}
                          distributions={trackData.distributions}
                          couriers={couriers} // Pass live couriers here
                        />
                        {isLiveTracking && (
                          <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow animate-pulse flex items-center">
                            <span className="w-2 h-2 bg-white rounded-full mr-1.5 animate-ping"></span>
                            LIVE
                          </div>
                        )}
                      </div>

                      {/* DETAILS LIST AREA */}
                      <div className="flex-grow overflow-y-auto p-4 space-y-3 bg-white">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                          Laporan Distribusi{" "}
                          {new Date(selectedDate).toLocaleDateString("id-ID")}
                        </h4>
                        {trackData.distributions.map((dist) => (
                          <div
                            key={dist.report_id}
                            className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-bold text-gray-800 text-sm">
                                  {dist.point_name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {dist.menu_name}
                                </p>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${dist.status === "Diterima" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}
                              >
                                {dist.status}
                              </span>
                            </div>

                            {/* Beneficiaries Breakdown or Total */}
                            {dist.beneficiary_breakdown &&
                            dist.beneficiary_breakdown.length > 0 ? (
                              <div className="flex flex-wrap gap-2 mb-3">
                                {dist.beneficiary_breakdown.map((item) => (
                                  <span
                                    key={item.category_name}
                                    className="px-2 py-1 bg-gray-50 border border-gray-100 rounded text-[10px] text-gray-600 font-medium"
                                  >
                                    {item.category_name}:{" "}
                                    <b className="text-intigizi-green">
                                      {item.count}
                                    </b>
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <div className="mb-3">
                                <span className="px-2 py-1 bg-gray-50 border border-gray-100 rounded text-[10px] text-gray-600 font-medium">
                                  Total Porsi:{" "}
                                  <b className="text-intigizi-green">
                                    {dist.total_beneficiaries}
                                  </b>
                                </span>
                              </div>
                            )}

                            {/* Nutrition Info */}
                            {dist.nutrition_per_category &&
                            dist.nutrition_per_category.length > 0 ? (
                              <div className="border-t border-gray-50 pt-3">
                                {dist.nutrition_per_category
                                  .filter((item) => item.nutrition.calories > 0)
                                  .map((item) => (
                                    <div
                                      key={item.category_name}
                                      className="mb-2 last:mb-0"
                                    >
                                      <p className="text-[10px] font-bold text-gray-500 mb-1">
                                        Gizi per porsi ({item.category_name}):
                                      </p>
                                      <div className="grid grid-cols-4 gap-2">
                                        <NutritionItem
                                          icon={
                                            <Heart
                                              size={10}
                                              className="text-red-500 mb-0.5"
                                            />
                                          }
                                          label="Energi"
                                          value={item.nutrition.calories}
                                          unit="kcal"
                                        />
                                        <NutritionItem
                                          icon={
                                            <Fish
                                              size={10}
                                              className="text-blue-500 mb-0.5"
                                            />
                                          }
                                          label="Protein"
                                          value={item.nutrition.protein}
                                          unit="g"
                                        />
                                        <NutritionItem
                                          icon={
                                            <Leaf
                                              size={10}
                                              className="text-green-500 mb-0.5"
                                            />
                                          }
                                          label="Karbo"
                                          value={item.nutrition.carbohydrates}
                                          unit="g"
                                        />
                                        <NutritionItem
                                          icon={
                                            <Droplets
                                              size={10}
                                              className="text-yellow-500 mb-0.5"
                                            />
                                          }
                                          label="Lemak"
                                          value={item.nutrition.fat}
                                          unit="g"
                                        />
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            ) : (
                              <p className="text-[10px] text-gray-400 italic mt-2">
                                Data gizi tidak tersedia untuk laporan ini.
                              </p>
                            )}

                            {/* Photos */}
                            {dist.photos && dist.photos.length > 0 && (
                              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                                {dist.photos.map((p, idx) => (
                                  <img
                                    key={p.id}
                                    src={`${API_BASE_URL.replace("/app", "")}${p.image_path}`}
                                    onClick={() =>
                                      openGallery(dist.photos, idx)
                                    }
                                    className="w-10 h-10 object-cover rounded hover:opacity-80 cursor-pointer shadow-sm border border-white"
                                    alt="Dokumentasi"
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-6 text-center">
                      <div className="bg-white p-4 rounded-full shadow-sm mb-3">
                        <Calendar
                          size={32}
                          className="text-intigizi-green/50"
                        />
                      </div>
                      <p className="font-semibold text-gray-600 mb-1">
                        {selectedDate
                          ? "Tidak Ada Distribusi"
                          : "Pilih Tanggal Distribusi"}
                      </p>
                      <p className="text-xs max-w-[200px]">
                        {selectedDate
                          ? "Belum ada laporan distribusi yang tercatat pada tanggal ini."
                          : "Klik tanggal di kalender untuk melihat riwayat distribusi dan kandungan gizinya."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </InfoCard>

            <InfoCard icon={<Camera />} title="Galeri Aktivitas Terbaru">
              {gallery.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {gallery.map((photo, index) => (
                    <div
                      key={photo.id}
                      className="cursor-pointer group relative aspect-square overflow-hidden rounded-lg shadow-sm"
                      onClick={() => openGallery(gallery, index)}
                    >
                      <img
                        src={`${API_BASE_URL.replace("/app", "")}${photo.image_path}`}
                        alt={photo.caption || "Aktivitas Dapur"}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Camera className="text-white drop-shadow-md" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-100 rounded-lg">
                  <Camera size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm">Galeri dokumentasi belum tersedia.</p>
                </div>
              )}
            </InfoCard>
          </div>

          {/* RIGHT COLUMN */}
          <div className="w-full lg:w-1/3 flex flex-col gap-6">
            <InfoCard
              icon={<Calendar />}
              title="Menu Akan Datang"
              className="bg-white/50"
            >
              {schedule.length > 0 ? (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {schedule.map((item) => (
                    <div
                      key={item.id}
                      className="relative bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="absolute top-4 right-4 bg-green-50 text-intigizi-green text-[10px] font-bold px-2 py-1 rounded-full uppercase">
                        {new Date(item.serving_date).toLocaleDateString(
                          "id-ID",
                          { weekday: "short" },
                        )}
                      </div>
                      <p className="text-xs text-gray-400 font-semibold uppercase mb-1">
                        {new Date(
                          item.serving_date + "T00:00:00",
                        ).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                      <h3 className="font-bold text-gray-800 text-lg mb-2">
                        {item.menu_name}
                      </h3>

                      <div className="flex items-center text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
                        <Utensils
                          size={14}
                          className="mr-2 text-intigizi-orange"
                        />
                        Target:{" "}
                        <b className="ml-1 text-gray-700">
                          {details.target_recipients} Penerima
                        </b>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Clock size={32} className="mx-auto text-gray-300 mb-2" />
                  <p>Belum ada jadwal menu.</p>
                </div>
              )}
            </InfoCard>

            <InfoCard icon={<MapPin />} title="Peta Jangkauan">
              <div className="h-64 w-full rounded-xl overflow-hidden shadow-inner border border-gray-200">
                <DistributionMap points={distribution_points} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {distribution_points.slice(0, 4).map((point) => (
                  <div
                    key={point.id}
                    className="flex items-center text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-100"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-intigizi-green mr-2"></span>
                    <span className="truncate">{point.name}</span>
                  </div>
                ))}
                {distribution_points.length > 4 && (
                  <div className="text-xs text-gray-400 flex items-center justify-center italic">
                    +{distribution_points.length - 4} titik lainnya
                  </div>
                )}
              </div>
            </InfoCard>
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

export default KitchenProfilePage;
