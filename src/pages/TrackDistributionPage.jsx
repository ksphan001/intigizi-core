import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import apiClient from "@/services/api";
import PageHeader from "@/components/PageHeader";
import {
  Loader2,
  MapPin,
  Calendar,
  Info,
  Camera,
  Users,
  Radio,
  Navigation,
  Search,
  Filter,
  ChefHat,
  Activity,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import TrackingMap from "@/components/TrackingMap";
import ImageGalleryModal from "@/components/ImageGalleryModal";
import { API_BASE_URL } from "@/config";

// ----------------------------------------------------------------------------
// KOMPONEN: NutritionBadge
// ----------------------------------------------------------------------------
const NutritionBadge = ({
  label,
  value,
  unit,
  colorClass = "bg-gray-100 text-gray-700",
}) => (
  <div className={`flex flex-col items-center p-2 rounded-lg ${colorClass}`}>
    <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
      {label}
    </span>
    <span className="font-bold text-sm">
      {value !== null && value !== undefined && value !== "" ? value : "-"}
      {unit}
    </span>
  </div>
);

// ----------------------------------------------------------------------------
// KOMPONEN: CalendarView
// ----------------------------------------------------------------------------
const CalendarView = ({ onDateSelect, kitchenId }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [highlightedDates, setHighlightedDates] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const fetchEvents = useCallback(
    async (date) => {
      if (!kitchenId) {
        setHighlightedDates([]);
        return;
      }
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
        setHighlightedDates(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Failed to fetch calendar events", error);
        setHighlightedDates([]);
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
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => changeMonth(-1)}
          className="p-2 hover:bg-gray-50 rounded-lg transition-colors text-gray-500"
        >
          &lt;
        </button>
        <h3 className="font-bold text-lg text-gray-800">
          {currentDate.toLocaleString("id-ID", {
            month: "long",
            year: "numeric",
          })}
        </h3>
        <button
          onClick={() => changeMonth(1)}
          className="p-2 hover:bg-gray-50 rounded-lg transition-colors text-gray-500"
        >
          &gt;
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">
        {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {emptyDays.map((_, i) => (
          <div key={`empty-${i}`}></div>
        ))}
        {days.map((day) => {
          const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isEventDay = highlightedDates.includes(dateStr);
          return (
            <button
              key={day}
              onClick={() => isEventDay && onDateSelect(dateStr)}
              className={`
                                w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm transition-all duration-300
                                ${
                                  isEventDay
                                    ? "bg-intigizi-green text-white font-bold shadow-md hover:bg-intigizi-green-dark hover:scale-110"
                                    : "text-gray-300 cursor-default"
                                }
                            `}
              disabled={!isEventDay}
            >
              {day}
            </button>
          );
        })}
      </div>
      {loadingEvents && (
        <div className="text-center text-xs mt-4 text-intigizi-orange animate-pulse">
          Memuat jadwal...
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------------------------------
// HALAMAN: TrackDistributionPage
// ----------------------------------------------------------------------------
function TrackDistributionPage() {
  const [filters, setFilters] = useState({
    provinces: [],
    regencies: [],
    kitchens: [],
  });
  const [selected, setSelected] = useState({
    province: "",
    regency: "",
    kitchen: "",
  });
  const [selectedDate, setSelectedDate] = useState(null);
  const [trackData, setTrackData] = useState(null);
  const [loading, setLoading] = useState({ filters: true, track: false });
  const [error, setError] = useState("");

  // --- STATE MULTI-KURIR ---
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [couriers, setCouriers] = useState([]);
  const pollingInterval = useRef(null);

  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [galleryStartIndex, setGalleryStartIndex] = useState(0);

  // --- STATE UI ---
  const [expandedNutrition, setExpandedNutrition] = useState({}); // Untuk toggle detail gizi per item

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const response = await apiClient.get("/public_get_track_filters.php");
        setFilters(response.data);
      } catch (err) {
        setError("Gagal memuat data filter lokasi.");
      } finally {
        setLoading((prev) => ({ ...prev, filters: false }));
      }
    };
    fetchFilters();
  }, []);

  const handleFilterChange = (type, value) => {
    const newSelected = { ...selected, [type]: value };
    if (type === "province") {
      newSelected.regency = "";
      newSelected.kitchen = "";
    }
    if (type === "regency") {
      newSelected.kitchen = "";
    }
    setSelected(newSelected);
    setSelectedDate(null);
    setTrackData(null);
    setIsLiveMode(false);
    setCouriers([]);
  };

  const fetchTrackData = useCallback(
    async (date) => {
      setSelectedDate(date);
      setLoading((prev) => ({ ...prev, track: true }));
      setError("");
      setTrackData(null);
      setIsLiveMode(false);
      setCouriers([]);
      setExpandedNutrition({}); // Reset nutrition expansion

      try {
        const response = await apiClient.get(
          "/public_get_distribution_track.php",
          {
            params: { org_id: selected.kitchen, date },
          },
        );
        setTrackData(response.data);
      } catch (err) {
        setError("Gagal memuat data pelacakan.");
      } finally {
        setLoading((prev) => ({ ...prev, track: false }));
      }
    },
    [selected.kitchen],
  );

  // --- LOGIKA POLLING MULTI-KURIR ---
  const fetchCouriersLocation = useCallback(async () => {
    if (!selected.kitchen) return;
    try {
      const response = await apiClient.get(
        `/public_get_courier_location.php?org_id=${selected.kitchen}`,
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
      console.error("Gagal mengambil lokasi kurir", err);
    }
  }, [selected.kitchen]);

  const toggleLiveMode = () => {
    if (isLiveMode) {
      setIsLiveMode(false);
      if (pollingInterval.current) clearInterval(pollingInterval.current);
      setCouriers([]);
    } else {
      const today = new Date().toISOString().split("T")[0];
      if (selectedDate !== today) {
        alert(
          "Fitur Pantau Langsung hanya tersedia untuk distribusi hari ini.",
        );
        return;
      }

      setIsLiveMode(true);
      fetchCouriersLocation();
      pollingInterval.current = setInterval(fetchCouriersLocation, 5000);
    }
  };

  const toggleNutrition = (reportId) => {
    setExpandedNutrition((prev) => ({
      ...prev,
      [reportId]: !prev[reportId],
    }));
  };

  useEffect(() => {
    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
    };
  }, []);

  const openGallery = (photos, startIndex) => {
    setGalleryPhotos(photos);
    setGalleryStartIndex(startIndex);
    setIsGalleryOpen(true);
  };

  const filteredRegencies = useMemo(() => {
    return (filters.regencies || []).filter(
      (r) => r && r.id && r.name && r.province_id === selected.province,
    );
  }, [filters.regencies, selected.province]);

  const filteredKitchens = useMemo(() => {
    return (filters.kitchens || []).filter(
      (k) => k && k.id && k.name && k.regency_id === selected.regency,
    );
  }, [filters.kitchens, selected.regency]);

  const isToday = useMemo(() => {
    return selectedDate === new Date().toISOString().split("T")[0];
  }, [selectedDate]);

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* HERO HEADER */}
      <div className="bg-gradient-to-r from-intigizi-green to-intigizi-green-dark text-white pt-24 pb-48 rounded-b-[3rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="container mx-auto px-6 relative z-10 text-center">
          <h1 className="text-3xl lg:text-4xl font-extrabold mb-4">
            Lacak Makananmu
          </h1>
          <p className="text-white/90 text-lg max-w-2xl mx-auto">
            Pantau perjalanan distribusi makanan bergizi dari dapur hingga ke
            tangan penerima manfaat secara real-time.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 -mt-24 relative z-30">
        {/* FILTER CARD */}
        <div className="bg-white p-6 rounded-2xl shadow-xl mb-10 border border-gray-100">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-6 flex items-center gap-2">
            <Filter size={16} /> Filter Lokasi
          </h2>
          {loading.filters ? (
            <div className="flex justify-center py-6">
              <Loader2 className="animate-spin text-intigizi-green" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="relative group">
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  PROVINSI
                </label>
                <select
                  value={selected.province}
                  onChange={(e) =>
                    handleFilterChange("province", e.target.value)
                  }
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl focus:ring-intigizi-green focus:border-intigizi-green block p-3 appearance-none font-medium hover:bg-white transition-colors cursor-pointer"
                >
                  <option value="">-- Pilih Provinsi --</option>
                  {(filters.provinces || [])
                    .filter((p) => p && p.id && p.name)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
                <ChevronDown
                  className="absolute right-3 top-[38px] text-gray-400 pointer-events-none"
                  size={16}
                />
              </div>
              <div className="relative group">
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  KABUPATEN/KOTA
                </label>
                <select
                  value={selected.regency}
                  onChange={(e) =>
                    handleFilterChange("regency", e.target.value)
                  }
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl focus:ring-intigizi-green focus:border-intigizi-green block p-3 appearance-none font-medium hover:bg-white transition-colors cursor-pointer disabled:bg-gray-100 disabled:text-gray-400"
                  disabled={!selected.province}
                >
                  <option value="">-- Pilih Wilayah --</option>
                  {filteredRegencies.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-3 top-[38px] text-gray-400 pointer-events-none"
                  size={16}
                />
              </div>
              <div className="relative group">
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  DAPUR PRODUKSI
                </label>
                <select
                  value={selected.kitchen}
                  onChange={(e) =>
                    handleFilterChange("kitchen", e.target.value)
                  }
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl focus:ring-intigizi-green focus:border-intigizi-green block p-3 appearance-none font-medium hover:bg-white transition-colors cursor-pointer disabled:bg-gray-100 disabled:text-gray-400"
                  disabled={!selected.regency}
                >
                  <option value="">-- Pilih Dapur --</option>
                  {filteredKitchens.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-3 top-[38px] text-gray-400 pointer-events-none"
                  size={16}
                />
              </div>
            </div>
          )}
        </div>

        {selected.kitchen && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <h3 className="font-bold text-lg mb-4 flex items-center text-gray-800">
                <Calendar className="mr-2 text-intigizi-green" size={20} />
                Pilih Tanggal
              </h3>
              <CalendarView
                onDateSelect={fetchTrackData}
                kitchenId={selected.kitchen}
              />
            </div>

            <div className="lg:col-span-2">
              {loading.track && (
                <div className="flex justify-center items-center h-96">
                  <Loader2
                    className="animate-spin text-intigizi-green"
                    size={40}
                  />
                </div>
              )}
              {error && (
                <div className="text-red-500 bg-red-50 p-6 rounded-xl text-center border border-red-100">
                  {error}
                </div>
              )}

              {!loading.track && !trackData && (
                <div className="flex flex-col justify-center items-center h-96 bg-white rounded-3xl border-2 border-dashed border-gray-200 text-center p-10 shadow-sm">
                  <div className="bg-gray-50 p-4 rounded-full mb-4">
                    <Search size={40} className="text-gray-300" />
                  </div>
                  <h3 className="font-bold text-xl text-gray-700">
                    Menunggu Pilihan Anda
                  </h3>
                  <p className="text-gray-500 mt-2 max-w-xs mx-auto">
                    Silakan pilih tanggal pada kalender untuk melihat detail
                    distribusi.
                  </p>
                </div>
              )}

              {trackData && (
                <div className="space-y-6">
                  {/* TRACKING MAP CARD */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                      <div>
                        <h3 className="font-bold text-xl flex items-center text-gray-900">
                          <MapPin className="mr-2 text-intigizi-orange" />
                          Peta Rute Distribusi
                        </h3>
                        <p className="text-sm text-gray-500 ml-7 mt-1">
                          {new Date(
                            selectedDate + "T00:00:00Z",
                          ).toLocaleDateString("id-ID", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>

                      {isToday && (
                        <button
                          onClick={toggleLiveMode}
                          className={`flex items-center px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-md ${isLiveMode ? "bg-red-50 text-red-600 border border-red-200 animate-pulse" : "bg-intigizi-orange text-white hover:bg-intigizi-orange-dark hover:-translate-y-0.5"}`}
                        >
                          {isLiveMode ? (
                            <Radio className="mr-2" size={16} />
                          ) : (
                            <Navigation className="mr-2" size={16} />
                          )}
                          {isLiveMode ? "Matikan Live" : "Pantau Langsung"}
                        </button>
                      )}
                    </div>

                    <div className="h-[400px] w-full rounded-2xl overflow-hidden border border-gray-200 relative shadow-inner">
                      <TrackingMap
                        mainKitchen={trackData.main_kitchen}
                        distributions={trackData.distributions}
                        couriers={couriers}
                      />

                      {isLiveMode && (
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-xl shadow-lg border border-red-100 flex items-center z-10">
                          <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping mr-3"></span>
                          <span className="text-xs font-bold text-red-600">
                            {couriers.length} KURIR AKTIF
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* LIST OF DISTRIBUTIONS */}
                  <div className="space-y-6">
                    {trackData.distributions.map((dist) => (
                      <div
                        key={dist.report_id}
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 overflow-hidden"
                      >
                        <div className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-start gap-4">
                              <div className="bg-intigizi-green-light p-3 rounded-xl text-intigizi-green-dark shrink-0">
                                <MapPin size={24} />
                              </div>
                              <div>
                                <h4 className="font-bold text-lg text-gray-900">
                                  {dist.point_name}
                                </h4>
                                <div className="flex items-center text-sm text-gray-600 mt-1">
                                  <Users size={14} className="mr-1" />
                                  <span className="font-semibold">
                                    {dist.total_beneficiaries} Porsi
                                  </span>
                                  <span className="mx-2 text-gray-300">•</span>
                                  <span className="text-intigizi-green-dark font-medium">
                                    {dist.menu_name}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">
                                Estimasi Tiba
                              </p>
                              <p className="font-mono font-bold text-lg text-gray-800">
                                {dist.delivery_time
                                  ? dist.delivery_time.substring(0, 5)
                                  : "--:--"}
                              </p>
                            </div>
                          </div>

                          {/* NUTRITION FACTS TOGGLE */}
                          <div>
                            <button
                              onClick={() => toggleNutrition(dist.report_id)}
                              className="flex items-center text-sm font-semibold text-intigizi-green hover:text-intigizi-green-dark transition-colors mb-4 focus:outline-none"
                            >
                              {expandedNutrition[dist.report_id] ? (
                                <ChevronUp size={16} className="mr-1" />
                              ) : (
                                <ChevronDown size={16} className="mr-1" />
                              )}
                              {expandedNutrition[dist.report_id]
                                ? "Sembunyikan Nilai Gizi"
                                : "Lihat Informasi Nilai Gizi"}
                            </button>

                            {expandedNutrition[dist.report_id] && (
                              <div className="bg-slate-50 border border-dashed border-gray-300 rounded-xl p-5 mb-5 animate-fadeIn">
                                <div className="flex items-center gap-2 mb-4 text-gray-800 border-b border-gray-200 pb-2">
                                  <Activity
                                    size={18}
                                    className="text-intigizi-green"
                                  />
                                  <h5 className="font-black text-sm uppercase tracking-wider">
                                    Informasi Nilai Gizi{" "}
                                    <span className="text-grat-400 font-normal normal-case">
                                      (Per Porsi)
                                    </span>
                                  </h5>
                                </div>

                                {dist.nutrition ? (
                                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                    <NutritionBadge
                                      label="Energi"
                                      value={Math.round(dist.nutrition.energy)}
                                      unit=" kkal"
                                      colorClass="bg-white border border-gray-200 text-gray-800 col-span-2 sm:col-span-1 shadow-sm"
                                    />
                                    <NutritionBadge
                                      label="Protein"
                                      value={dist.nutrition.protein}
                                      unit="g"
                                      colorClass="bg-blue-50 text-blue-700"
                                    />
                                    <NutritionBadge
                                      label="Lemak"
                                      value={dist.nutrition.fat}
                                      unit="g"
                                      colorClass="bg-yellow-50 text-yellow-700"
                                    />
                                    <NutritionBadge
                                      label="Karbo"
                                      value={dist.nutrition.carbo}
                                      unit="g"
                                      colorClass="bg-green-50 text-green-700"
                                    />
                                    <NutritionBadge
                                      label="Serat"
                                      value={dist.nutrition.fiber}
                                      unit="g"
                                      colorClass="bg-orange-50 text-orange-700"
                                    />
                                  </div>
                                ) : (
                                  <div className="text-center py-4 text-gray-400 text-sm italic">
                                    Data nilai gizi belum tersedia untuk menu
                                    ini.
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* PHOTOS */}
                          {dist.photos && dist.photos.length > 0 && (
                            <div className="border-t border-gray-100 pt-4">
                              <p className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center">
                                <Camera size={14} className="mr-1.5" />
                                Dokumentasi Penerimaan
                              </p>
                              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                {dist.photos.map((p, idx) => (
                                  <img
                                    key={p.id}
                                    src={`${API_BASE_URL.replace("/app", "")}${p.image_path}`}
                                    onClick={() =>
                                      openGallery(dist.photos, idx)
                                    }
                                    className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-xl cursor-pointer hover:opacity-90 border border-gray-200 shadow-sm transition-transform hover:scale-105"
                                    alt={`Dokumentasi ${dist.point_name}`}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
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

export default TrackDistributionPage;
