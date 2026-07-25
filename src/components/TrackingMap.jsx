import React, { useEffect, useCallback, useState, useMemo } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  MarkerF,
  Polyline,
  InfoWindowF,
  DirectionsRenderer,
} from "@react-google-maps/api";
import { Loader2 } from "lucide-react";

const GOOGLE_MAPS_LIBRARIES = ["places"];

const containerStyle = {
  width: "100%",
  height: "100%",
};
const defaultCenter = { lat: -6.2088, lng: 106.8456 };

// Auto-zoom agar semua elemen (Dapur, Titik Distribusi, SEMUA Kurir) masuk frame
function MapBounds({ mainKitchen, distributions, couriers, map }) {
  useEffect(() => {
    if (map && window.google) {
      const bounds = new window.google.maps.LatLngBounds();
      let hasPoints = false;

      // 1. Dapur Utama
      if (mainKitchen?.latitude && mainKitchen?.longitude) {
        bounds.extend({
          lat: parseFloat(mainKitchen.latitude),
          lng: parseFloat(mainKitchen.longitude),
        });
        hasPoints = true;
      }

      // 2. Titik Distribusi
      distributions.forEach((d) => {
        if (d.point_coords?.lat && d.point_coords?.lon) {
          bounds.extend({
            lat: parseFloat(d.point_coords.lat),
            lng: parseFloat(d.point_coords.lon),
          });
          hasPoints = true;
        }
      });

      // 3. SEMUA Kurir (Multi-User)
      if (couriers && Array.isArray(couriers)) {
        couriers.forEach((c) => {
          if (c.latitude && c.longitude) {
            bounds.extend({
              lat: parseFloat(c.latitude),
              lng: parseFloat(c.longitude),
            });
            hasPoints = true;
          }
        });
      }

      if (hasPoints) {
        map.fitBounds(bounds);
      }
    }
  }, [mainKitchen, distributions, couriers, map]);

  return null;
}

function TrackingMap({ mainKitchen, distributions, couriers = [] }) {
  // Menerima array couriers
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyDsMrxBtfH08YQnLzvQRq75R_3RX7--D1c", // Ganti dengan key asli Anda
    libraries: GOOGLE_MAPS_LIBRARIES,
    preventGoogleFontsLoading: true,
  });

  const [map, setMap] = useState(null);
  const onLoad = useCallback((mapInstance) => setMap(mapInstance), []);
  const onUnmount = useCallback(() => setMap(null), []);

  const [icons, setIcons] = useState(null);
  const [activeMarker, setActiveMarker] = useState(null);

  useEffect(() => {
    if (isLoaded && window.google) {
      setIcons({
        kitchen: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: "#1A335A",
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "#FFFFFF",
          scale: 10,
        },
        truck: {
          path: "M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z",
          fillColor: "#C4A873",
          fillOpacity: 1,
          strokeWeight: 1,
          strokeColor: "#FFFFFF",
          scale: 1.5,
          anchor: new window.google.maps.Point(12, 12),
        },
      });
    }
  }, [isLoaded]);

  if (loadError) return <div>Gagal memuat Google Maps.</div>;
  if (!isLoaded || !icons)
    return (
      <div className="flex justify-center items-center h-full w-full">
        <Loader2 className="animate-spin" />
      </div>
    );

  const kitchenPos = mainKitchen
    ? {
        lat: parseFloat(mainKitchen.latitude),
        lng: parseFloat(mainKitchen.longitude),
      }
    : null;

  // Pastikan couriers adalah array
  const activeCouriers = Array.isArray(couriers) ? couriers : [];

  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [routeMetrics, setRouteMetrics] = useState({ distance: "", duration: "" });

  useEffect(() => {
    if (isLoaded && window.google && kitchenPos && distributions.length > 0) {
      const directionsService = new window.google.maps.DirectionsService();

      // Urutkan sekolah secara kronologis berdasarkan waktu rencana
      const sortedStops = [...distributions]
        .filter(d => d.point_coords?.lat && d.point_coords?.lon)
        .sort((a, b) => (a.delivery_time || "").localeCompare(b.delivery_time || ""));

      if (sortedStops.length === 0) return;

      const origin = kitchenPos;
      const destination = {
        lat: parseFloat(sortedStops[sortedStops.length - 1].point_coords.lat),
        lng: parseFloat(sortedStops[sortedStops.length - 1].point_coords.lon)
      };

      // Waypoints adalah titik singgah di antara awal dan akhir
      const waypoints = [];
      for (let i = 0; i < sortedStops.length - 1; i++) {
        waypoints.push({
          location: {
            lat: parseFloat(sortedStops[i].point_coords.lat),
            lng: parseFloat(sortedStops[i].point_coords.lon)
          },
          stopover: true
        });
      }

      directionsService.route(
        {
          origin: origin,
          destination: destination,
          waypoints: waypoints,
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            setDirectionsResponse(result);
            
            // Hitung akumulasi jarak dan waktu tempuh rute
            let totalDistMeter = 0;
            let totalDurSec = 0;
            result.routes[0].legs.forEach(leg => {
              totalDistMeter += leg.distance.value;
              totalDurSec += leg.duration.value;
            });
            
            const distanceText = (totalDistMeter / 1000).toFixed(1) + " km";
            const durationText = Math.round(totalDurSec / 60) + " menit";
            setRouteMetrics({ distance: distanceText, duration: durationText });
          } else {
            console.error(`Directions request failed: ${status}`);
          }
        }
      );
    }
  }, [isLoaded, kitchenPos, distributions]);

  const navigationUrl = useMemo(() => {
    if (!kitchenPos || distributions.length === 0) return "#";
    const sortedStops = [...distributions]
      .filter(d => d.point_coords?.lat && d.point_coords?.lon)
      .sort((a, b) => (a.delivery_time || "").localeCompare(b.delivery_time || ""));
      
    if (sortedStops.length === 0) return "#";

    const origin = `${kitchenPos.lat},${kitchenPos.lng}`;
    const destination = `${sortedStops[sortedStops.length - 1].point_coords.lat},${sortedStops[sortedStops.length - 1].point_coords.lon}`;
    
    const waypointsList = [];
    for (let i = 0; i < sortedStops.length - 1; i++) {
      waypointsList.push(`${sortedStops[i].point_coords.lat},${sortedStops[i].point_coords.lon}`);
    }
    const waypoints = waypointsList.length > 0 ? `&waypoints=${waypointsList.join("|")}` : "";

    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints}&travelmode=driving`;
  }, [kitchenPos, distributions]);

  return (
    <div className="relative w-full h-full">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={10}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
      >
        {/* 1. Marker Dapur Utama */}
        {kitchenPos && (
          <MarkerF
            position={kitchenPos}
            icon={icons.kitchen}
            title={`Dapur Utama: ${mainKitchen.name}`}
            zIndex={10}
            onClick={() => setActiveMarker("kitchen")}
          >
            {activeMarker === "kitchen" && (
              <InfoWindowF onCloseClick={() => setActiveMarker(null)}>
                <div className="p-2">
                  <h3 className="font-bold text-intigizi-green-dark">
                    {mainKitchen.name}
                  </h3>
                  <p className="text-xs">Pusat Produksi</p>
                </div>
              </InfoWindowF>
            )}
          </MarkerF>
        )}

        {/* 2. Marker Para Kurir (Multi-User) */}
        {activeCouriers.map((courier) => (
          <MarkerF
            key={courier.user_id}
            position={{
              lat: parseFloat(courier.latitude),
              lng: parseFloat(courier.longitude),
            }}
            icon={icons.truck}
            title={courier.name}
            zIndex={100}
            onClick={() => setActiveMarker(`courier-${courier.user_id}`)}
          >
            {activeMarker === `courier-${courier.user_id}` && (
              <InfoWindowF onCloseClick={() => setActiveMarker(null)}>
                <div className="p-2">
                  <h3 className="font-bold text-intigizi-orange">
                    {courier.name}
                  </h3>
                  <p className="text-xs">Sedang dalam perjalanan</p>
                  <p className="text-[10px] text-gray-500">
                    Update: {new Date(courier.last_updated).toLocaleTimeString()}
                  </p>
                </div>
              </InfoWindowF>
            )}
          </MarkerF>
        ))}

        {/* 3. Render Rute Jalan Raya (Directions Service) */}
        {directionsResponse ? (
          <DirectionsRenderer
            directions={directionsResponse}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: "#2563EB",
                strokeOpacity: 0.8,
                strokeWeight: 5,
              }
            }}
          />
        ) : (
          /* Fallback ke Polyline garis lurus jika rute jalan raya belum termuat */
          kitchenPos && (() => {
            const courierGroups = {};
            distributions.forEach((d) => {
              const key = d.courier_id || "unassigned";
              if (!courierGroups[key]) {
                courierGroups[key] = [];
              }
              courierGroups[key].push(d);
            });

            const getRouteColor = (courierId) => {
              if (!courierId || courierId === "unassigned") return "#94A3B8";
              const colors = ["#2563EB", "#7C3AED", "#0D9488", "#D97706", "#DB2777", "#4F46E5", "#059669"];
              return colors[parseInt(courierId) % colors.length];
            };

            return Object.keys(courierGroups).map((courierKey) => {
              const stops = [...courierGroups[courierKey]];
              stops.sort((a, b) => (a.delivery_time || "").localeCompare(b.delivery_time || ""));

              const pathPoints = [kitchenPos];
              stops.forEach((s) => {
                if (s.point_coords?.lat && s.point_coords?.lon) {
                  pathPoints.push({
                    lat: parseFloat(s.point_coords.lat),
                    lng: parseFloat(s.point_coords.lon)
                  });
                }
              });

              return (
                <Polyline
                  key={`route-${courierKey}`}
                  path={pathPoints}
                  options={{
                    strokeColor: getRouteColor(courierKey),
                    strokeOpacity: 0.8,
                    strokeWeight: 4,
                    geodesic: true,
                  }}
                />
              );
            });
          })()
        )}

        {/* 4. Marker Titik Distribusi (Sekolah/PAUD) */}
        {distributions.map((dist) => {
          const distPos =
            dist.point_coords?.lat && dist.point_coords?.lon
              ? {
                  lat: parseFloat(dist.point_coords.lat),
                  lng: parseFloat(dist.point_coords.lon),
                }
              : null;
          if (!distPos) return null;

          return (
            <MarkerF
              key={dist.report_id}
              position={distPos}
              title={dist.point_name}
              onClick={() => setActiveMarker(dist.report_id)}
            >
              {activeMarker === dist.report_id && (
                <InfoWindowF onCloseClick={() => setActiveMarker(null)}>
                  <div className="p-2 max-w-[220px]">
                    <h3 className="font-bold text-gray-800 text-sm">
                      {dist.point_name}
                    </h3>
                    <p className="text-xs text-gray-650 mt-1">Menu: {dist.menu_name}</p>
                    <p className="text-xs font-semibold text-intigizi-green mt-0.5">
                      Kapasitas: {dist.total_beneficiaries} Porsi
                    </p>
                    <div className="mt-2 pt-1.5 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase">
                      <span>Status: {dist.status}</span>
                      <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">
                        {dist.courier_name || "Beli Manual"}
                      </span>
                    </div>
                  </div>
                </InfoWindowF>
              )}
            </MarkerF>
          );
        })}

        <MapBounds
          mainKitchen={mainKitchen}
          distributions={distributions}
          couriers={activeCouriers}
          map={map}
        />
      </GoogleMap>

      {/* Floating Info & Navigation Panel */}
      {routeMetrics.distance && (
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-gray-150 z-10 max-w-[260px] text-xs font-sans">
          <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider mb-2">Informasi Rute & Navigasi</h4>
          <div className="space-y-1.5 text-gray-650 mb-3">
            <p className="flex justify-between gap-6"><span className="font-medium text-gray-500">Total Jarak:</span> <span className="font-bold text-gray-800">{routeMetrics.distance}</span></p>
            <p className="flex justify-between gap-6"><span className="font-medium text-gray-500">Estimasi Waktu:</span> <span className="font-bold text-gray-850">{routeMetrics.duration}</span></p>
          </div>
          {navigationUrl !== "#" && (
            <a
              href={navigationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-center font-bold flex items-center justify-center transition-colors shadow-sm cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 mr-1.5 fill-current" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
              Mulai Navigasi Suara
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default TrackingMap;
