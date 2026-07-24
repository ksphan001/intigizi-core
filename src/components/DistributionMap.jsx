import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import { Loader2 } from 'lucide-react';

// --- PERBAIKAN PERFORMA ---
const GOOGLE_MAPS_LIBRARIES = ["places"];

// Konfigurasi Peta
const containerStyle = {
  width: '100%',
  height: '100%'
};
const defaultCenter = { lat: -6.2088, lng: 106.8456 }; // Default: Jakarta

// Komponen untuk auto-zoom
function MapBounds({ points, map }) {
  useEffect(() => {
    // Pastikan window.google ada sebelum mengakses LatLngBounds
    if (map && window.google) {
      const validPoints = points.filter(p => p.latitude && p.longitude);
      if (validPoints.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        validPoints.forEach(p => {
          bounds.extend({ lat: parseFloat(p.latitude), lng: parseFloat(p.longitude) });
        });
        map.fitBounds(bounds);
        // Mencegah zoom terlalu dekat jika hanya ada 1 titik
        if (validPoints.length === 1) {
            map.setZoom(15);
        }
      }
    }
  }, [points, map]);

  return null;
}

// Komponen utama untuk menampilkan semua titik distribusi di satu peta.
function DistributionMap({ points }) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyDsMrxBtfH08YQnLzvQRq75R_3RX7--D1c",
    libraries: GOOGLE_MAPS_LIBRARIES,
    preventGoogleFontsLoading: true, // Sudah dimuat di index.html
  });
  
  const [map, setMap] = useState(null);
  const onLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
  }, []);
  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  if (loadError) return <div>Gagal memuat Google Maps. Periksa API key Anda.</div>;
  if (!isLoaded) return <div className="flex justify-center items-center h-full w-full"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="h-full w-full rounded-lg overflow-hidden">
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
        {points.map(point => (
          point.latitude && point.longitude && (
            <MarkerF 
                key={point.id} 
                position={{ lat: parseFloat(point.latitude), lng: parseFloat(point.longitude) }}
                title={point.name}
            />
          )
        ))}
        <MapBounds points={points} map={map} />
      </GoogleMap>
    </div>
  );
}

export default DistributionMap;