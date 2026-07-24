import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import { Loader2, Search } from 'lucide-react';

// --- PERBAIKAN PERFORMA ---
// Peringatan "libraries prop as new array" diperbaiki
// dengan mendefinisikan array di luar komponen.
const GOOGLE_MAPS_LIBRARIES = ["places"];

// Konfigurasi Peta
const containerStyle = {
  width: '100%',
  height: '100%'
};
const defaultCenter = { lat: -6.2088, lng: 106.8456 }; // Default: Jakarta

function MapPicker({ onLocationChange, initialPosition, activeTab }) {
  const mapRef = useRef(null);
  const searchInputRef = useRef(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [geocoder, setGeocoder] = useState(null);
  const [autocomplete, setAutocomplete] = useState(null);
  const [reverseGeocodeLoading, setReverseGeocodeLoading] = useState(false);

  // --- PERBAIKAN: 'preventGoogleFontsLoading: true' ---
  // Kita memberi tahu loader untuk TIDAK memuat skrip lagi,
  // karena kita sudah memuatnya di index.html.
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyDsMrxBtfH08YQnLzvQRq75R_3RX7--D1c",
    libraries: GOOGLE_MAPS_LIBRARIES,
    preventGoogleFontsLoading: true, 
  });

  const currentPosition = useMemo(() => {
    return initialPosition && initialPosition.lat && typeof initialPosition.lat === 'number'
      ? { lat: initialPosition.lat, lng: initialPosition.lng }
      : defaultCenter;
  }, [initialPosition]);
  
  // 1. Inisialisasi Peta
  useEffect(() => {
    // Cek 'window.google' untuk memastikan skrip dari index.html sudah dimuat
    if (isLoaded && mapRef.current && !map && window.google) {
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: currentPosition,
        zoom: 15,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      });
      
      const markerInstance = new window.google.maps.Marker({
        position: currentPosition,
        map: mapInstance,
        draggable: true
      });
      
      const geocoderInstance = new window.google.maps.Geocoder();
      
      const autocompleteInstance = new window.google.maps.places.Autocomplete(searchInputRef.current, {
          componentRestrictions: { country: 'id' },
          fields: ['geometry', 'formatted_address', 'address_components']
      });

      setMap(mapInstance);
      setMarker(markerInstance);
      setGeocoder(geocoderInstance);
      setAutocomplete(autocompleteInstance);
    }
  }, [isLoaded, mapRef, map, currentPosition]);

  // 2. Fungsi untuk Reverse Geocode (dipanggil oleh listener)
  const reverseGeocode = useCallback(async (latLng) => {
    if (!geocoder) return;
    
    setReverseGeocodeLoading(true);
    try {
      // Pastikan latLng adalah objek LatLng yang valid
      const validLatLng = new window.google.maps.LatLng(latLng.lat(), latLng.lng());
      const { results } = await geocoder.geocode({ location: validLatLng });

      if (results && results[0]) {
        let province = '';
        let regency = '';
        for (const component of results[0].address_components) {
            if (component.types.includes('administrative_area_level_1')) {
                province = component.long_name;
            }
            if (component.types.includes('administrative_area_level_2')) {
                regency = component.long_name;
            }
        }
        onLocationChange({
          lat: validLatLng.lat(),
          lng: validLatLng.lng(),
          address: results[0].formatted_address,
          province: province,
          regency: regency
        });
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error);
    } finally {
      setReverseGeocodeLoading(false);
    }
  }, [geocoder, onLocationChange]);

  // 3. Pasang Event Listeners ke peta dan marker
  useEffect(() => {
    if (map && marker) {
      map.addListener('click', (e) => {
        marker.setPosition(e.latLng);
        reverseGeocode(e.latLng);
      });
      
      marker.addListener('dragend', () => {
        reverseGeocode(marker.getPosition());
      });
    }
  }, [map, marker, reverseGeocode]);

  // 4. Pasang Listener ke Autocomplete
  useEffect(() => {
    if (autocomplete && map && marker) {
        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (place.geometry && place.geometry.location) {
                map.setCenter(place.geometry.location);
                map.setZoom(17);
                marker.setPosition(place.geometry.location);
                
                let province = '';
                let regency = '';
                if (place.address_components) {
                    for (const component of place.address_components) {
                        if (component.types.includes('administrative_area_level_1')) {
                            province = component.long_name;
                        }
                        if (component.types.includes('administrative_area_level_2')) {
                            regency = component.long_name;
                        }
                    }
                }
                
                onLocationChange({
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng(),
                    address: place.formatted_address,
                    province: province,
                    regency: regency
                });
            } else {
                console.error("Autocomplete place not found");
            }
        });
    }
  }, [autocomplete, map, marker, onLocationChange]);
  
  // 5. Update posisi marker jika initialPosition berubah
  useEffect(() => {
      if (marker && initialPosition && typeof initialPosition.lat === 'number' && typeof initialPosition.lng === 'number') {
          const newPos = { lat: initialPosition.lat, lng: initialPosition.lng };
          marker.setPosition(newPos);
      }
  }, [initialPosition, marker]);
  
  // 6. Resize peta saat tab aktif
  useEffect(() => {
      if(activeTab && map) {
          setTimeout(() => {
              if (window.google) {
                window.google.maps.event.trigger(map, 'resize');
                map.setCenter(currentPosition);
              }
          }, 100);
      }
  }, [activeTab, map, currentPosition]);


  if (loadError) return <div>Gagal memuat Google Maps. Periksa API key Anda.</div>;

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 w-full max-w-sm px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden flex items-center">
          <Search size={20} className="text-gray-400 mx-3 flex-shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Cari alamat atau nama tempat..."
            className="w-full px-0 py-3 border-0 focus:outline-none focus:ring-0 text-sm"
          />
        </div>
      </div>
      
      {!isLoaded ? (
        <div className="flex justify-center items-center h-full bg-gray-100">
            <Loader2 className="animate-spin" />
        </div>
      ) : (
         <div ref={mapRef} style={containerStyle} />
      )}
      
      {reverseGeocodeLoading && (
        <div className="absolute bottom-2 left-2 bg-white p-2 rounded shadow-lg z-10 flex items-center">
            <Loader2 className="animate-spin mr-2" size={16} />
            <span className="text-xs">Memuat info lokasi...</span>
        </div>
      )}
    </div>
  );
}

export default React.memo(MapPicker);