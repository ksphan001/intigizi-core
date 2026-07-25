import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNotification } from "@/context/NotificationContext";
import {
  Upload,
  X,
  Trash2,
  Loader2,
  CalendarDays,
  Send,
  Users,
} from "lucide-react";
import SearchableSelect from "./SearchableSelect";
import apiClient from "@/services/api";
import { API_BASE_URL } from "@/config";

function DistributionReportForm({ reportData, onSave, onCancel }) {
  const isEditMode = !!reportData;
  const [formData, setFormData] = useState({
    distribution_date: new Date().toISOString().split("T")[0],
    distribution_point_id: "",
    menu_id: "",
    quantity_sent: "",
    delivery_time: "12:00",
    total_beneficiaries: "",
    notes: "",
    quantity_received: "",
    status: "Terjadwal",
    reported_by: "",
  });

  const [newPhotos, setNewPhotos] = useState([]);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  const [distributionPoints, setDistributionPoints] = useState([]);
  const [beneficiaryCategories, setBeneficiaryCategories] = useState([]);
  const [beneficiaryBreakdown, setBeneficiaryBreakdown] = useState([]);
  const [scheduledMenu, setScheduledMenu] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const { showNotification } = useNotification();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [pointsRes, categoriesRes, usersRes] = await Promise.all([
          apiClient.get("/distribution_points_get.php"),
          apiClient.get("/beneficiary_categories_get.php"),
          apiClient.get("/users_get.php"),
        ]);
        setDistributionPoints(pointsRes.data || []);
        setBeneficiaryCategories(categoriesRes.data || []);
        
        // Filter users who have role_id = 6 (Tim Distribusi / Driver)
        const driverList = (usersRes.data || []).filter(u => Number(u.role_id) === 6);
        setDrivers(driverList);
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (isEditMode && reportData) {
      setFormData({
        distribution_date: reportData.distribution_date || "",
        distribution_point_id: reportData.distribution_point_id || "",
        menu_id: reportData.menu_id || "",
        quantity_sent: reportData.quantity_sent || "",
        delivery_time: reportData.delivery_time || "12:00",
        total_beneficiaries: reportData.total_beneficiaries || "",
        notes: reportData.notes || "",
        quantity_received: reportData.quantity_received || "",
        status: reportData.status || "Terjadwal",
        reported_by: reportData.reported_by || "",
      });
      setScheduledMenu({
        id: reportData.menu_id,
        menu_name: reportData.menu_name,
      });
      setExistingPhotos(reportData.photos || []);
    } else {
      // Reset form for create mode
      setFormData({
        distribution_date: new Date().toISOString().split("T")[0],
        distribution_point_id: "",
        menu_id: "",
        quantity_sent: "",
        delivery_time: "12:00",
        total_beneficiaries: "",
        notes: "",
        quantity_received: "",
        status: "Terjadwal",
        reported_by: "",
      });
      setExistingPhotos([]);
      setNewPhotos([]);
      setPhotoPreviews([]);
      setBeneficiaryBreakdown([]);
    }
  }, [reportData, isEditMode]);

  useEffect(() => {
    if (!isEditMode && formData.distribution_date) {
      setScheduledMenu(null);
      setFormData((prev) => ({ ...prev, menu_id: "" }));
      apiClient
        .get(`/menus_get_scheduled.php?date=${formData.distribution_date}`)
        .then((response) => {
          if (response.data && response.data.id) {
            setScheduledMenu(response.data);
            setFormData((prev) => ({ ...prev, menu_id: response.data.id }));
          } else {
            setScheduledMenu(null);
          }
        });
    }
  }, [formData.distribution_date, isEditMode]);

  useEffect(() => {
    if (
      !isEditMode &&
      formData.distribution_point_id &&
      distributionPoints.length > 0 &&
      beneficiaryCategories.length > 0
    ) {
      const selectedPoint = distributionPoints.find(
        (p) => p.id.toString() === formData.distribution_point_id.toString(),
      );
      if (selectedPoint) {
        const totalBeneficiaries =
          selectedPoint.category_counts?.reduce(
            (sum, item) => sum + parseInt(item.count || 0, 10),
            0,
          ) || 0;
        const breakdown = selectedPoint.category_counts
          ?.map((item) => {
            const category = beneficiaryCategories.find(
              (cat) => cat.id.toString() === item.category_id.toString(),
            );
            return {
              name: category ? category.name : "Kategori Tidak Dikenal",
              count: item.count,
            };
          })
          .filter((item) => item.count > 0);

        setBeneficiaryBreakdown(breakdown || []);

        setFormData((prev) => ({
          ...prev,
          quantity_sent: totalBeneficiaries,
          total_beneficiaries: totalBeneficiaries,
        }));
      }
    } else if (!isEditMode && !formData.distribution_point_id) {
      setBeneficiaryBreakdown([]);
    }
  }, [
    formData.distribution_point_id,
    distributionPoints,
    beneficiaryCategories,
    isEditMode,
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    setNewPhotos((prev) => [...prev, ...files]);

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPhotoPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeNewPhoto = (index) => {
    setNewPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteExistingPhoto = async (photoId) => {
    if (!window.confirm("Anda yakin ingin menghapus foto ini?")) return;
    try {
      await apiClient.post("/distribution_photo_delete.php", {
        photo_id: photoId,
      });
      setExistingPhotos((prev) => prev.filter((p) => p.id !== photoId));
      showNotification("Foto berhasil dihapus.", "success");
    } catch (error) {
      showNotification("Gagal menghapus foto.", "error");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setActionLoading(true);
    onSave(formData, newPhotos).finally(() => setActionLoading(false));
  };

  const pointOptions = useMemo(
    () => distributionPoints.map((p) => ({ value: p.id, label: p.name })),
    [distributionPoints],
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 max-h-[75vh] overflow-y-auto pr-2 -mr-2 no-scrollbar"
    >
      {/* --- CREATE MODE (JADWALKAN) --- */}
      {!isEditMode && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-style">Tanggal</label>
              <input
                type="date"
                name="distribution_date"
                value={formData.distribution_date}
                onChange={handleChange}
                className="input-style"
                required
              />
            </div>
            <div>
              <label className="label-style">Jam Rencana</label>
              <input
                type="time"
                name="delivery_time"
                value={formData.delivery_time}
                onChange={handleChange}
                className="input-style"
              />
            </div>
          </div>
          <div>
            <label className="label-style">Tujuan Sekolah / PAUD</label>
            <SearchableSelect
              options={pointOptions}
              value={formData.distribution_point_id}
              onChange={(v) =>
                setFormData((p) => ({ ...p, distribution_point_id: v }))
              }
              placeholder="Pilih titik sekolah tujuan..."
            />
          </div>

          {beneficiaryBreakdown.length > 0 && (
            <div>
              <label className="label-style flex items-center">
                <Users size={14} className="mr-2 text-intigizi-green" /> Rincian Penerima Manfaat
              </label>
              <div className="mt-1 p-3 bg-gray-50 border rounded-xl flex flex-wrap gap-x-4 gap-y-2">
                {beneficiaryBreakdown.map((item) => (
                  <span
                    key={item.name}
                    className="text-xs font-semibold text-gray-700"
                  >
                    {item.name}:{" "}
                    <span className="font-bold text-intigizi-green">
                      {item.count}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="label-style">Menu Terjadwal</label>
            <input
              type="text"
              value={
                scheduledMenu?.menu_name || "Tidak ada menu pada tanggal ini"
              }
              className="input-style bg-gray-50 text-gray-650"
              disabled
            />
          </div>

          <div>
            <label className="label-style">Petugas Driver / Kurir</label>
            <select
              name="reported_by"
              value={formData.reported_by}
              onChange={handleChange}
              className="input-style bg-white"
              required
            >
              <option value="">-- Pilih Driver / Kurir --</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>{d.full_name} ({d.username})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-style">Jumlah Porsi Rencana</label>
              <input
                type="number"
                name="quantity_sent"
                value={formData.quantity_sent}
                onChange={handleChange}
                className="input-style"
                required
                placeholder="Otomatis terisi"
              />
            </div>
            <div>
              <label className="label-style">Status Awal</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="input-style bg-white"
              >
                <option value="Terjadwal">Terjadwal</option>
                <option value="Dikirim">Dikirim</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label-style">Catatan Awal (Opsional)</label>
            <textarea
              name="notes"
              rows="2"
              value={formData.notes}
              onChange={handleChange}
              className="input-style"
            ></textarea>
          </div>
        </div>
      )}

      {/* --- EDIT MODE (UPDATE LAPORAN) --- */}
      {isEditMode && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="quantity_received" className="label-style">
                Porsi Diterima
              </label>
              <input
                type="number"
                name="quantity_received"
                id="quantity_received"
                value={formData.quantity_received}
                onChange={handleChange}
                className="input-style"
              />
            </div>
            <div>
              <label htmlFor="status" className="label-style">
                Status Laporan
              </label>
              <select
                name="status"
                id="status"
                value={formData.status}
                onChange={handleChange}
                className="input-style bg-white"
              >
                <option value="Terjadwal">Terjadwal</option>
                <option value="Dikirim">Dikirim</option>
                <option value="Diterima">Diterima</option>
                <option value="Sebagian Diterima">Sebagian Diterima</option>
                <option value="Gagal">Gagal</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-style">Driver / Kurir</label>
              <select
                name="reported_by"
                value={formData.reported_by}
                onChange={handleChange}
                className="input-style bg-white"
                required
              >
                <option value="">-- Pilih Driver / Kurir --</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>{d.full_name} ({d.username})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-style">Jam Rencana</label>
              <input
                type="time"
                name="delivery_time"
                value={formData.delivery_time}
                onChange={handleChange}
                className="input-style"
              />
            </div>
          </div>

          <div>
            <label className="label-style">Catatan Tambahan</label>
            <textarea
              name="notes"
              rows="2"
              value={formData.notes}
              onChange={handleChange}
              className="input-style"
            ></textarea>
          </div>
          <div>
            <label className="label-style">Dokumentasi Foto</label>
            <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-205 border-dashed rounded-xl bg-gray-50">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-10 w-10 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="photo-upload"
                    className="relative cursor-pointer bg-transparent rounded-md font-bold text-intigizi-green hover:text-intigizi-green-dark focus-within:outline-none"
                  >
                    <span>Unggah file foto</span>
                    <input
                      id="photo-upload"
                      name="photos[]"
                      type="file"
                      className="sr-only"
                      multiple
                      onChange={handlePhotoChange}
                      accept="image/*"
                    />
                  </label>
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4">
              {existingPhotos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={`${API_BASE_URL.replace("/app", "")}${photo.image_path}`}
                    alt="Dokumentasi"
                    className="h-20 w-full object-cover rounded-xl border"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteExistingPhoto(photo.id)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              {photoPreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <img
                    src={preview}
                    alt={`Preview ${index}`}
                    className="h-20 w-full object-cover rounded-xl border"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewPhoto(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <button type="button" onClick={onCancel} className="btn-secondary h-[38px] px-5 rounded-xl font-bold text-xs">
          Batal
        </button>
        <button
          type="submit"
          className="btn-primary h-[38px] px-5 rounded-xl font-bold text-xs flex items-center justify-center min-w-[120px]"
          disabled={actionLoading || (!isEditMode && !formData.menu_id)}
        >
          {actionLoading ? (
            <Loader2 className="animate-spin h-4 w-4" />
          ) : isEditMode ? (
            "Simpan Perubahan"
          ) : (
            "Simpan Jadwal"
          )}
        </button>
      </div>
    </form>
  );
}

export default DistributionReportForm;
