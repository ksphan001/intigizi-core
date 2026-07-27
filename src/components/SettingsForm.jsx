import React, { useState, useEffect, useRef } from "react";
import { Camera, User, Globe, MapPin } from "lucide-react";
import MapPicker from "./MapPicker.jsx"; // Asumsi MapPicker ada di folder yang sama
// --- 1. Impor API_BASE_URL ---
import { API_BASE_URL } from "../config.js"; // Sesuaikan path jika perlu

function SettingsForm({ initialData, onSave, loading }) {
  const [formData, setFormData] = useState({
    kitchen_address: "",
    latitude: null,
    longitude: null,
    slug: "",
    public_description: "",
    profile_picture: null,
  });
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        kitchen_address: initialData.kitchen_address || "",
        latitude: initialData.latitude || null,
        longitude: initialData.longitude || null,
        slug: initialData.slug || "",
        public_description: initialData.public_description || "",
        profile_picture: null,
      });

      // --- 2. PERBAIKAN LOGIKA URL PRATINJAU ---
      if (initialData.profile_picture) {
        // Buat URL lengkap dari path relatif yang dikirim backend
        const fullUrl = initialData.profile_picture.startsWith("http")
          ? initialData.profile_picture
          : `${API_BASE_URL.replace("/app", "")}${initialData.profile_picture}`;
        setPreview(fullUrl);
      }
      // --- Akhir Perbaikan ---
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, profile_picture: file }));
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleLocationChange = (location) => {
    setFormData((prev) => ({
      ...prev,
      kitchen_address: location.address,
      latitude: location.lat,
      longitude: location.lng,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSave = new FormData();

    // Tambahkan semua data ke FormData
    dataToSave.append("kitchen_address", formData.kitchen_address);
    dataToSave.append("latitude", formData.latitude || "");
    dataToSave.append("longitude", formData.longitude || "");
    dataToSave.append("slug", formData.slug);
    dataToSave.append("public_description", formData.public_description);

    // Hanya tambahkan file jika ada file baru yang dipilih
    if (formData.profile_picture) {
      dataToSave.append("profile_picture", formData.profile_picture);
    }

    onSave(dataToSave);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Bagian Profil Publik */}
      <div className="bg-white p-6 rounded-xl shadow-md border">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <Globe size={20} className="mr-3 text-intigizi-green" />
          Pengaturan Halaman Profil Publik
        </h2>

        <div className="flex items-center space-x-6 mb-6">
          <div className="relative">
            {preview ? (
              <img
                src={preview}
                alt="Preview Profil"
                className="h-24 w-24 rounded-full object-cover"
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center">
                <User size={40} className="text-gray-400" />
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              className="absolute -bottom-2 -right-2 bg-intigizi-green text-white p-2 rounded-full shadow-md hover:bg-intigizi-orange transition-colors"
            >
              <Camera size={16} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/png, image/jpeg"
            />
          </div>
          <div className="flex-1">
            <label
              htmlFor="slug"
              className="block text-sm font-medium text-gray-700"
            >
              Nama Alamat Halaman Profil (Unik)
            </label>
            <div className="flex items-center">
              <span className="text-gray-500 bg-gray-100 p-2.5 rounded-l-md border border-r-0">
                {window.location.host}/dapur/
              </span>
              <input
                type="text"
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                className="input-style rounded-l-none"
                placeholder="cth: dapur-sejahtera"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Gunakan huruf kecil, angka, dan tanda hubung (-).
            </p>
          </div>
        </div>

        <div>
          <label
            htmlFor="public_description"
            className="block text-sm font-medium text-gray-700"
          >
            Deskripsi Publik
          </label>
          <textarea
            id="public_description"
            name="public_description"
            rows="3"
            value={formData.public_description}
            onChange={handleChange}
            className="input-style"
            placeholder="Ceritakan tentang dapur Anda..."
          ></textarea>
        </div>
      </div>

      {/* Bagian Alamat Dapur */}
      <div className="bg-white p-6 rounded-xl shadow-md border">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <MapPin size={20} className="mr-3 text-intigizi-green" />
          Pengaturan Alamat Dapur Operasional
        </h2>
        <MapPicker
          initialLocation={{
            lat: formData.latitude,
            lng: formData.longitude,
            address: formData.kitchen_address,
          }}
          onLocationChange={handleLocationChange}
        />
      </div>

      <div className="flex justify-end pt-6 border-t">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>
    </form>
  );
}

export default SettingsForm;
