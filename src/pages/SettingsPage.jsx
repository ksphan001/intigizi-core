import React, { useState, useEffect, useCallback, useMemo } from "react";
import apiClient from "../services/api.js"; // Path relatif
import { useNotification } from "../context/NotificationContext.jsx"; // Path relatif
import MapPicker from "../components/MapPicker.jsx"; // Path relatif
import PageHeader from "../components/PageHeader.jsx"; // Path relatif
import {
  Loader2,
  Upload,
  Trash2,
  Image as ImageIcon,
  CookingPot,
  Globe,
  MapPin,
  Camera,
  User,
} from "lucide-react"; // Impor ikon
import { API_BASE_URL } from "../config.js"; // Impor API_BASE_URL
import { usePrinter } from "../context/PrinterContext.jsx";

const PrinterSettingsSection = () => {
  const {
    connectPrinter,
    disconnect,
    isConnected,
    isSupported,
    printTest,
    error,
    device,
  } = usePrinter();
  const [testLoading, setTestLoading] = useState(false);

  const handleTestPrint = async () => {
    setTestLoading(true);
    await printTest();
    setTestLoading(false);
  };

  if (!isSupported) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded">
        Browser ini tidak mendukung Web Bluetooth API. Gunakan Chrome di
        Android/Desktop atau Bluefy di iOS.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center">
          <div
            className={`w-3 h-3 rounded-full mr-3 ${isConnected ? "bg-green-500" : "bg-red-500"}`}
          ></div>
          <div>
            <p className="font-semibold text-gray-800">
              {isConnected ? "Terhubung" : "Terputus"}
            </p>
            {isConnected && (
              <p className="text-xs text-gray-500">{device?.name}</p>
            )}
          </div>
        </div>
        <div>
          {!isConnected ? (
            <button
              type="button"
              onClick={connectPrinter}
              className="btn-primary flex items-center"
            >
              <Camera className="mr-2" size={16} /> Hubungkan Printer
            </button>
          ) : (
            <button
              type="button"
              onClick={disconnect}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Putuskan Koneksi
            </button>
          )}
        </div>
      </div>

      {error && <div className="text-red-500 text-sm">{error}</div>}

      {isConnected && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleTestPrint}
            disabled={testLoading}
            className="btn-secondary"
          >
            {testLoading ? (
              <Loader2 className="animate-spin mr-2" size={16} />
            ) : null}
            Test Print
          </button>
        </div>
      )}
    </div>
  );
};

const DEFAULT_POSITION = { lat: -6.2088, lng: 106.8456 }; // Default Jakarta

function SettingsPage() {
  const [formData, setFormData] = useState({
    // --- PERBAIKAN: Menambahkan kitchen_name ---
    kitchen_name: "",
    kitchen_address: "",
    latitude: DEFAULT_POSITION.lat,
    longitude: DEFAULT_POSITION.lng,
    slug: "",
    public_description: "",
    profile_picture: null, // Akan berisi file object jika diganti
  });
  const [currentProfilePicture, setCurrentProfilePicture] = useState(null); // URL gambar saat ini
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [newGalleryImage, setNewGalleryImage] = useState(null);
  const [newGalleryCaption, setNewGalleryCaption] = useState("");

  const { showNotification } = useNotification();

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/organization_get_settings.php");
      const data = response.data;
      setFormData({
        // --- PERBAIKAN: Mengisi kitchen_name ---
        kitchen_name: data.kitchen_name || data.name || "", // Fallback ke nama org jika kitchen_name null
        kitchen_address: data.kitchen_address || "",
        latitude:
          data.latitude !== null && data.latitude !== undefined
            ? parseFloat(data.latitude)
            : DEFAULT_POSITION.lat,
        longitude:
          data.longitude !== null && data.longitude !== undefined
            ? parseFloat(data.longitude)
            : DEFAULT_POSITION.lng,
        slug: data.slug || "",
        public_description: data.public_description || "",
        profile_picture: null, // Reset file input
      });
      setCurrentProfilePicture(data.profile_picture); // Set URL gambar saat ini
    } catch (err) {
      showNotification("Gagal memuat pengaturan", "error");
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const fetchGallery = useCallback(async () => {
    setGalleryLoading(true);
    try {
      const response = await apiClient.get("/kitchen_gallery_manage.php");
      setGallery(response.data);
    } catch (err) {
      showNotification("Gagal memuat galeri", "error");
    } finally {
      setGalleryLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchSettings();
    fetchGallery();
  }, [fetchSettings, fetchGallery]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFormData((prev) => ({ ...prev, profile_picture: e.target.files[0] }));
    }
  };

  const handleLocationChange = useCallback((location) => {
    setFormData((prev) => ({
      ...prev,
      latitude: location.lat,
      longitude: location.lng,
      kitchen_address: location.address || prev.kitchen_address,
    }));
  }, []);

  const mapInitialPosition = useMemo(
    () => ({
      lat: formData.latitude,
      lng: formData.longitude,
    }),
    [formData.latitude, formData.longitude],
  );

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const submissionData = new FormData();
    // --- PERBAIKAN: Menambahkan kitchen_name ke form data ---
    submissionData.append("kitchen_name", formData.kitchen_name);
    submissionData.append("kitchen_address", formData.kitchen_address);
    submissionData.append("latitude", formData.latitude);
    submissionData.append("longitude", formData.longitude);
    submissionData.append("slug", formData.slug);
    submissionData.append("public_description", formData.public_description);
    if (formData.profile_picture) {
      submissionData.append("profile_picture", formData.profile_picture);
    }

    try {
      const response = await apiClient.post(
        "/organization_update_settings.php",
        submissionData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      showNotification(response.data.message, "success");
      fetchSettings(); // Muat ulang data untuk menampilkan gambar baru
    } catch (err) {
      showNotification(
        err.response?.data?.message || "Gagal menyimpan pengaturan",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  // --- FUNGSI GALERI ---

  const handleGalleryFileChange = (e) => {
    if (e.target.files[0]) {
      setNewGalleryImage(e.target.files[0]);
    }
  };

  const handleGalleryUpload = async () => {
    if (!newGalleryImage) {
      showNotification("Pilih file gambar terlebih dahulu", "error");
      return;
    }
    setGalleryLoading(true);
    const galleryData = new FormData();
    galleryData.append("action", "add");
    galleryData.append("image", newGalleryImage);
    galleryData.append("caption", newGalleryCaption);

    try {
      const response = await apiClient.post(
        "/kitchen_gallery_manage.php",
        galleryData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      showNotification(response.data.message, "success");
      setNewGalleryImage(null);
      setNewGalleryCaption("");
      document.getElementById("gallery_upload").value = null; // Reset input file
      fetchGallery(); // Muat ulang galeri
    } catch (err) {
      showNotification(
        err.response?.data?.message || "Gagal mengunggah foto",
        "error",
      );
    } finally {
      setGalleryLoading(false);
    }
  };

  const handleGalleryDelete = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus foto ini?")) return;

    setGalleryLoading(true);
    try {
      const response = await apiClient.post("/kitchen_gallery_manage.php", {
        action: "delete",
        id: id,
      });
      showNotification(response.data.message, "success");
      fetchGallery(); // Muat ulang galeri
    } catch (err) {
      showNotification(
        err.response?.data?.message || "Gagal menghapus foto",
        "error",
      );
    } finally {
      setGalleryLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader title="Pengaturan Organisasi" />

      <form
        onSubmit={handleFormSubmit}
        className="space-y-6 bg-white p-6 rounded-lg shadow"
      >
        {/* Bagian Profil Publik */}
        <h3 className="text-lg font-semibold border-b pb-2">Profil Publik</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Kolom Kiri: Info */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <label
                htmlFor="slug"
                className="block text-sm font-medium text-gray-700"
              >
                Link Profil Publik (Slug)
              </label>
              <div className="flex items-center mt-1">
                <span className="text-sm text-gray-500 bg-gray-100 p-2.5 rounded-l-md border border-r-0">
                  intigizi.com/dapur/
                </span>
                <input
                  type="text"
                  name="slug"
                  id="slug"
                  value={formData.slug}
                  onChange={handleFormChange}
                  className="input-style rounded-l-none"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Hanya boleh berisi huruf, angka, dan tanda hubung (-).
              </p>
            </div>
            <div>
              <label
                htmlFor="public_description"
                className="block text-sm font-medium text-gray-700"
              >
                Deskripsi Publik
              </label>
              <textarea
                name="public_description"
                id="public_description"
                rows="4"
                value={formData.public_description}
                onChange={handleFormChange}
                className="input-style"
                placeholder="Ceritakan tentang dapur Anda..."
              />
            </div>
          </div>
          {/* Kolom Kanan: Foto Profil */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Foto Profil Publik
            </label>
            <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
              {formData.profile_picture ? (
                <img
                  src={URL.createObjectURL(formData.profile_picture)}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : currentProfilePicture ? (
                <img
                  src={`${API_BASE_URL.replace("/app", "")}${currentProfilePicture}`}
                  alt="Foto Profil"
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon size={48} className="text-gray-400" />
              )}
            </div>
            <input
              type="file"
              name="profile_picture"
              id="profile_picture"
              onChange={handleFileChange}
              className="input-style"
              accept="image/*"
            />
          </div>
        </div>

        {/* Bagian Lokasi Dapur Utama */}
        <h3 className="text-lg font-semibold border-b pb-2">
          Lokasi Dapur Utama
        </h3>
        <div className="space-y-4">
          {/* --- PERBAIKAN: Input Nama Dapur ditambahkan --- */}
          <div>
            <label
              htmlFor="kitchen_name"
              className="block text-sm font-medium text-gray-700"
            >
              Nama Dapur Publik
            </label>
            <input
              type="text"
              name="kitchen_name"
              id="kitchen_name"
              value={formData.kitchen_name}
              onChange={handleFormChange}
              className="input-style"
              placeholder="Cth: Dapur Sehat Ceria"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Nama ini akan tampil di halaman publik (Landing Page, Profil
              Dapur).
            </p>
          </div>
          {/* --- AKHIR PERBAIKAN --- */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tandai Lokasi di Peta
            </label>
            <div className="mt-1 h-80 rounded-lg overflow-hidden border">
              <MapPicker
                onLocationChange={handleLocationChange}
                initialPosition={mapInitialPosition}
                activeTab={true} // Selalu aktif
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="kitchen_address"
              className="block text-sm font-medium text-gray-700"
            >
              Alamat Dapur Utama
            </label>
            <textarea
              name="kitchen_address"
              id="kitchen_address"
              rows="2"
              value={formData.kitchen_address}
              onChange={handleFormChange}
              className="input-style"
              placeholder="Akan terisi otomatis dari peta, atau isi manual"
              required
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? (
              <Loader2 className="animate-spin" />
            ) : (
              "Simpan Pengaturan"
            )}
          </button>
        </div>
      </form>

      {/* Bagian Pengaturan Printer */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold border-b pb-2 mb-4">
          Pengaturan Printer Thermal (Bluetooth)
        </h3>
        <PrinterSettingsSection />
      </div>

      {/* Bagian Galeri Dapur */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold border-b pb-2 mb-4">
          Galeri Publik Dapur
        </h3>

        {/* Form Upload */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 border rounded-lg bg-gray-50">
          <div className="flex-1">
            <label
              htmlFor="gallery_upload"
              className="block text-sm font-medium text-gray-700"
            >
              File Gambar Baru
            </label>
            <input
              type="file"
              id="gallery_upload"
              onChange={handleGalleryFileChange}
              className="input-style"
              accept="image/*"
            />
          </div>
          <div className="flex-1">
            <label
              htmlFor="gallery_caption"
              className="block text-sm font-medium text-gray-700"
            >
              Keterangan (Opsional)
            </label>
            <input
              type="text"
              id="gallery_caption"
              value={newGalleryCaption}
              onChange={(e) => setNewGalleryCaption(e.target.value)}
              className="input-style"
              placeholder="Misal: Dapur saat produksi..."
            />
          </div>
          <div className="flex-shrink-0 md:self-end">
            <button
              onClick={handleGalleryUpload}
              className="btn-primary w-full md:w-auto"
              disabled={galleryLoading || !newGalleryImage}
            >
              {galleryLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Upload size={20} />
              )}
              <span className="ml-2">Unggah</span>
            </button>
          </div>
        </div>

        {/* Tampilan Galeri */}
        {galleryLoading && gallery.length === 0 ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="animate-spin" />
          </div>
        ) : gallery.length === 0 ? (
          <p className="text-gray-500 text-center">
            Belum ada foto di galeri Anda.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {gallery.map((item) => (
              <div
                key={item.id}
                className="relative group border rounded-lg overflow-hidden shadow-sm"
              >
                <img
                  src={`${API_BASE_URL.replace("/app", "")}${item.image_path}`}
                  alt={item.caption || "Foto Galeri"}
                  className="w-full h-36 object-cover"
                />
                {item.caption && (
                  <p className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 truncate">
                    {item.caption}
                  </p>
                )}
                <button
                  onClick={() => handleGalleryDelete(item.id)}
                  className="absolute top-1 right-1 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Hapus foto"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SettingsPage;
