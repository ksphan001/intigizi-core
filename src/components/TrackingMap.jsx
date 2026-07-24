import React, { useEffect, useCallback, useState } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  MarkerF,
  Polyline,
  InfoWindowF,
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

  return (
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

      {/* 3. Titik Distribusi & Rute */}
      {distributions.map((dist) => {
        const distPos =
          dist.point_coords?.lat && dist.point_coords?.lon
            ? {
                lat: parseFloat(dist.point_coords.lat),
                lng: parseFloat(dist.point_coords.lon),
              }
            : null;
        if (!distPos) return null;
        const isCompleted = dist.status === "Diterima";
        const strokeColor = isCompleted ? "#10B981" : "#A0AEC0";

        return (
          <React.Fragment key={dist.report_id}>
            <MarkerF
              position={distPos}
              title={dist.point_name}
              onClick={() => setActiveMarker(dist.report_id)}
            >
              {activeMarker === dist.report_id && (
                <InfoWindowF onCloseClick={() => setActiveMarker(null)}>
                  <div className="p-2 max-w-[200px]">
                    <h3 className="font-bold text-gray-800">
                      {dist.point_name}
                    </h3>
                    <p className="text-xs mt-1">{dist.menu_name}</p>
                    <p className="text-xs font-semibold mt-1 text-intigizi-green">
                      {dist.total_beneficiaries} Porsi
                    </p>
                  </div>
                </InfoWindowF>
              )}
            </MarkerF>
            {/* Rute Statis */}
            {kitchenPos && (
              <Polyline
                path={[kitchenPos, distPos]}
                options={{
                  strokeColor: strokeColor,
                  strokeOpacity: 0.6,
                  strokeWeight: 3,
                  geodesic: true,
                }}
              />
            )}
          </React.Fragment>
        );
      })}

      <MapBounds
        mainKitchen={mainKitchen}
        distributions={distributions}
        couriers={activeCouriers}
        map={map}
      />
    </GoogleMap>
  );
}

export default TrackingMap;
