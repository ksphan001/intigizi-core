import React, { useState, useEffect, useCallback } from "react";
import apiClient from "@/services/api";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import { Loader2, Plus, CheckCircle, XCircle, Building2, User, Phone, Calendar, Mail, Lock, MapPin, Edit } from "lucide-react";
import { useNotification } from "@/context/NotificationContext";
import MapDisplayModal from "@/components/MapDisplayModal.jsx";

function ManageSppgPage() {
  const [sppgs, setSppgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingSppgId, setEditingSppgId] = useState(null);
  
  // States for Map display
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);

  const { showNotification } = useNotification();

  // Region dropdown data
  const [regions, setRegions] = useState({ provinces: [], regencies: {} });
  const [selectedProvince, setSelectedProvince] = useState("");
  const [availableRegencies, setAvailableRegencies] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    director_name: "",
    pic_name: "",
    pic_email: "",
    pic_whatsapp: "",
    username: "",
    password: "",
    address: "",
    province_id: "",
    regency_id: "",
    latitude: "",
    longitude: "",
  });

  const fetchSppgs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/yayasan_get_sppgs.php");
      setSppgs(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      showNotification("Gagal memuat daftar SPPG.", "error");
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const fetchRegions = useCallback(async () => {
    try {
      const response = await apiClient.get("/public_get_regions.php");
      if (response.data) {
        setRegions({
          provinces: response.data.provinces || [],
          regencies: response.data.regencies || {},
        });
      }
    } catch (err) {
      console.error("Gagal memuat data wilayah", err);
    }
  }, []);

  useEffect(() => {
    fetchSppgs();
    fetchRegions();
  }, [fetchSppgs, fetchRegions]);

  const handleProvinceChange = (e) => {
    const provId = e.target.value;
    setSelectedProvince(provId);
    setAvailableRegencies(regions.regencies?.[provId] || []);
    setFormData((prev) => ({ ...prev, province_id: provId, regency_id: "" }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setIsEditing(false);
    setEditingSppgId(null);
    setFormData({
      name: "",
      director_name: "",
      pic_name: "",
      pic_email: "",
      pic_whatsapp: "",
      username: "",
      password: "",
      address: "",
      province_id: "",
      regency_id: "",
      latitude: "",
      longitude: "",
    });
    setSelectedProvince("");
    setAvailableRegencies([]);
    setIsModalOpen(true);
  };

  const openEditModal = (sppg) => {
    setIsEditing(true);
    setEditingSppgId(sppg.id);
    setFormData({
      name: sppg.name || "",
      director_name: sppg.director_name || "",
      pic_name: sppg.pic_name || "",
      pic_email: sppg.pic_email || "",
      pic_whatsapp: sppg.pic_whatsapp || "",
      username: sppg.username || "",
      password: "", // Kosongkan saat edit
      address: sppg.address || "",
      province_id: sppg.province_id || "",
      regency_id: sppg.regency_id || "",
      latitude: sppg.latitude || "",
      longitude: sppg.longitude || "",
    });
    setSelectedProvince(sppg.province_id || "");
    setAvailableRegencies(regions.regencies?.[sppg.province_id] || []);
    setIsModalOpen(true);
  };

  const openMapModal = (sppg) => {
    setSelectedPoint({
      name: sppg.name,
      latitude: sppg.latitude,
      longitude: sppg.longitude,
      address: sppg.address
    });
    setIsMapModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (isEditing) {
        const response = await apiClient.put("/yayasan_get_sppgs.php", {
          ...formData,
          id: editingSppgId,
        });
        showNotification(response.data.message || "SPPG berhasil diperbarui.", "success");
      } else {
        const response = await apiClient.post("/yayasan_get_sppgs.php", formData);
        showNotification(response.data.message || "SPPG berhasil didaftarkan.", "success");
      }
      setIsModalOpen(false);
      fetchSppgs();
    } catch (err) {
      showNotification(err.response?.data?.message || (isEditing ? "Gagal memperbarui SPPG." : "Gagal mendaftarkan SPPG."), "error");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daftar Unit SPPG & Dapur"
        buttonText="Daftarkan Unit Baru"
        onButtonClick={openAddModal}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <Loader2 className="animate-spin text-intigizi-green" size={40} />
          </div>
        ) : sppgs.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl shadow-md p-12 text-center border border-gray-100">
            <Building2 className="mx-auto text-gray-300 mb-4" size={56} />
            <h3 className="text-lg font-bold text-gray-700">Belum Ada Unit SPPG</h3>
            <p className="text-gray-500 mt-2">Daftarkan unit SPPG/Dapur pertama Anda untuk memulai pemantauan.</p>
          </div>
        ) : (
          sppgs.map((sppg) => (
            <div key={sppg.id} className="bg-white rounded-2xl shadow-sm border border-gray-150 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-intigizi-green-light p-2.5 rounded-xl">
                      <Building2 className="text-intigizi-green" size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-lg leading-tight">{sppg.name}</h4>
                      <span className="text-xs text-gray-500">Terdaftar: {new Date(sppg.created_at).toLocaleDateString("id-ID")}</span>
                    </div>
                  </div>
                  <div>
                    {sppg.is_active == 1 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                        <CheckCircle size={12} className="mr-1" /> Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                        <XCircle size={12} className="mr-1" /> Non-aktif
                      </span>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <User size={16} className="text-gray-400 mr-2" />
                    <span>Direktur: <strong className="text-gray-700">{sppg.director_name || "-"}</strong></span>
                  </div>
                  <div className="flex items-center">
                    <User size={16} className="text-gray-400 mr-2" />
                    <span>PIC: <strong className="text-gray-700">{sppg.pic_name || "-"}</strong></span>
                  </div>
                  <div className="flex items-center">
                    <Phone size={16} className="text-gray-400 mr-2" />
                    <span>WA PIC: <strong className="text-gray-700">{sppg.pic_whatsapp || "-"}</strong></span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Unit Dapur</span>
                  <span className="text-sm font-bold text-intigizi-green bg-intigizi-green-light px-3 py-1 rounded-lg">Trial</span>
                </div>
                <div className="flex items-center space-x-2">
                  {sppg.latitude && sppg.longitude && (
                    <button
                      type="button"
                      onClick={() => openMapModal(sppg)}
                      className="flex items-center space-x-1 text-xs font-bold text-green-600 hover:text-green-800 transition-colors bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg border border-green-200"
                      title="Lihat Titik Peta"
                    >
                      <MapPin size={12} />
                      <span>Peta</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => openEditModal(sppg)}
                    className="flex items-center space-x-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200"
                  >
                    <Edit size={12} />
                    <span>Edit Unit</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? "Edit Unit SPPG / Dapur" : "Pendaftaran Unit SPPG / Dapur Baru"} size="3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <h4 className="text-sm font-bold text-gray-700 uppercase border-b pb-1">{isEditing ? "1. Edit Informasi Unit SPPG" : "1. Informasi Unit SPPG"}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Nama Unit SPPG</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="input-field w-full"
                required
                placeholder="Contoh: Dapur SPPG Sukadamai"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Nama Direktur/Ketua Unit</label>
              <input
                type="text"
                name="director_name"
                value={formData.director_name}
                onChange={handleInputChange}
                className="input-field w-full"
                required
                placeholder="Contoh: H. Ahmad"
              />
            </div>
          </div>

          <h4 className="text-sm font-bold text-gray-700 uppercase border-b pb-1 pt-2">2. Lokasi Fisik Dapur</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Provinsi</label>
              <select
                value={selectedProvince}
                onChange={handleProvinceChange}
                className="input-field w-full"
                required
              >
                <option value="">Pilih Provinsi</option>
                {regions.provinces.map((prov) => (
                  <option key={prov.id} value={prov.id}>
                    {prov.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Kabupaten / Kota</label>
              <select
                name="regency_id"
                value={formData.regency_id}
                onChange={handleInputChange}
                className="input-field w-full"
                required
                disabled={!selectedProvince}
              >
                <option value="">Pilih Kabupaten / Kota</option>
                {availableRegencies.map((reg) => (
                  <option key={reg.id} value={reg.id}>
                    {reg.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Alamat Lengkap Dapur</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="input-field w-full h-20"
              required
              placeholder="Tuliskan alamat lengkap jalan, nomor, RT/RW, kelurahan/desa, kecamatan..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Latitude (Koordinat)</label>
              <input
                type="text"
                name="latitude"
                value={formData.latitude}
                onChange={handleInputChange}
                className="input-field w-full"
                placeholder="Cth: -7.013100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Longitude (Koordinat)</label>
              <input
                type="text"
                name="longitude"
                value={formData.longitude}
                onChange={handleInputChange}
                className="input-field w-full"
                placeholder="Cth: 110.429547"
              />
            </div>
          </div>

          <h4 className="text-sm font-bold text-gray-700 uppercase border-b pb-1 pt-2">3. Kontak PIC (Penanggung Jawab)</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Nama PIC</label>
              <input
                type="text"
                name="pic_name"
                value={formData.pic_name}
                onChange={handleInputChange}
                className="input-field w-full"
                required
                placeholder="Nama Lengkap PIC"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Email PIC</label>
              <input
                type="email"
                name="pic_email"
                value={formData.pic_email}
                onChange={handleInputChange}
                className="input-field w-full"
                required
                placeholder="email@domain.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">WhatsApp PIC</label>
              <input
                type="text"
                name="pic_whatsapp"
                value={formData.pic_whatsapp}
                onChange={handleInputChange}
                className="input-field w-full"
                required
                placeholder="Contoh: 0812XXXXXXXX"
              />
            </div>
          </div>

          <h4 className="text-sm font-bold text-gray-700 uppercase border-b pb-1 pt-2">4. Kredensial Login Administrator SPPG</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Username Login</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="input-field w-full"
                required
                placeholder="Username admin unit"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="input-field w-full"
                required={!isEditing}
                placeholder={isEditing ? "Kosongkan jika tidak ingin mengubah password" : "Password minimal 6 karakter"}
              />
            </div>
          </div>

          <div className="pt-4 border-t flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-gray-150 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="btn-primary"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={16} /> {isEditing ? "Menyimpan..." : "Mendaftarkan..."}
                </>
              ) : (
                isEditing ? "Simpan Perubahan" : "Daftarkan Unit"
              )}
            </button>
          </div>
        </form>
      </Modal>

      <MapDisplayModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        point={selectedPoint}
      />
    </div>
  );
}

export default ManageSppgPage;
