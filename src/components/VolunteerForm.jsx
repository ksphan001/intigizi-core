import React, { useState, useEffect } from "react";

// Form untuk menambah atau mengedit data sukarelawan/tenaga kerja.
function VolunteerForm({ volunteer, onSave, onCancel, loading }) {
  const [formData, setFormData] = useState({
    full_name: "",
    job_type: "",
    phone_number: "",
    address: "",
    is_active: 1,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (volunteer) {
      setFormData({
        full_name: volunteer.full_name || "",
        job_type: volunteer.job_type || "",
        phone_number: volunteer.phone_number || "",
        address: volunteer.address || "",
        is_active: volunteer.is_active || 1,
      });
    } else {
      setFormData({
        full_name: "",
        job_type: "",
        phone_number: "",
        address: "",
        is_active: 1,
      });
    }
  }, [volunteer]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await onSave({ ...formData, id: volunteer?.id });
    } catch (err) {
      setError(err.response?.data?.message || "Gagal menyimpan data.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="full_name"
            className="block text-sm font-medium text-gray-700"
          >
            Nama Lengkap
          </label>
          <input
            type="text"
            name="full_name"
            id="full_name"
            value={formData.full_name}
            onChange={handleChange}
            className="input-style"
            required
          />
        </div>
        <div>
          <label
            htmlFor="job_type"
            className="block text-sm font-medium text-gray-700"
          >
            Jenis Pekerjaan
          </label>
          <input
            type="text"
            name="job_type"
            id="job_type"
            value={formData.job_type}
            onChange={handleChange}
            className="input-style"
            placeholder="Cth: Juru Masak, Logistik"
            required
          />
        </div>
      </div>
      <div>
        <label
          htmlFor="phone_number"
          className="block text-sm font-medium text-gray-700"
        >
          Nomor Telepon
        </label>
        <input
          type="tel"
          name="phone_number"
          id="phone_number"
          value={formData.phone_number}
          onChange={handleChange}
          className="input-style"
        />
      </div>
      <div>
        <label
          htmlFor="address"
          className="block text-sm font-medium text-gray-700"
        >
          Alamat
        </label>
        <textarea
          name="address"
          id="address"
          value={formData.address}
          onChange={handleChange}
          rows="2"
          className="input-style"
        ></textarea>
      </div>
      <div className="flex items-center">
        <input
          type="checkbox"
          name="is_active"
          id="is_active"
          checked={formData.is_active == 1}
          onChange={handleChange}
          className="h-4 w-4 text-intigizi-green focus:ring-intigizi-green border-gray-300 rounded"
        />
        <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
          Aktif
        </label>
      </div>

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Batal
        </button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Menyimpan..." : "Simpan"}
        </button>
      </div>
    </form>
  );
}

export default VolunteerForm;
