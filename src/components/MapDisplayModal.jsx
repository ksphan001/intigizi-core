import React, { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import { Loader2 } from 'lucide-react';
import Modal from './Modal.jsx'; // Menggunakan path relatif

// --- PERBAIKAN PERFORMA ---
const GOOGLE_MAPS_LIBRARIES = ["places"];

// Konfigurasi Peta
const containerStyle = {
  width: '100%',
  height: '20rem' // 320px
};

function MapDisplayModal({ isOpen, onClose, point }) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyDsMrxBtfH08YQnLzvQRq75R_3RX7--D1c",
    libraries: GOOGLE_MAPS_LIBRARIES,
    preventGoogleFontsLoading: true, // Sudah dimuat di index.html
  });

  const [map, setMap] = useState(null);

  const onLoad = useCallback((mapInstance) => {
    if (point?.latitude && point?.longitude) {
      const position = { lat: parseFloat(point.latitude), lng: parseFloat(point.longitude) };
      mapInstance.setCenter(position);
      mapInstance.setZoom(15);
    }
    setMap(mapInstance);
  }, [point]);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  if (!isOpen || !point) {
    return null;
  }

  const position = (point.latitude && point.longitude) 
    ? { lat: parseFloat(point.latitude), lng: parseFloat(point.longitude) } 
    : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Lokasi: ${point.name}`}>
      <div className="w-full rounded-lg overflow-hidden">
        {loadError && <div>Gagal memuat peta.</div>}
        {!isLoaded && <div className="flex justify-center items-center h-80 bg-gray-100"><Loader2 className="animate-spin" /></div>}
        {isLoaded && position && (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={position}
            zoom={15}
            onLoad={onLoad}
            onUnmount={onUnmount}
            options={{
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
            }}
          >
            <MarkerF position={position} title={point.name} />
          </GoogleMap>
        )}
      </div>
      {point.address && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <p className="font-semibold text-sm">Alamat:</p>
              <p className="text-sm text-gray-700">{point.address}</p>
          </div>
      )}
    </Modal>
  );
}

export default MapDisplayModal;