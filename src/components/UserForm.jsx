import React, { useState, useEffect } from "react";
import apiClient from "@/services/api";

// Formulir untuk menambah atau mengedit data pengguna.

function UserForm({ user, onSave, onCancel, loading }) {
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    email: "",
    phone_number: "",
    password: "",
    role_id: "",
  });
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    // Mengambil daftar peran untuk dropdown
    const fetchRoles = async () => {
      try {
        const response = await apiClient.get("/roles_get.php");
        setRoles(response.data);
        if (!user && response.data.length > 0) {
          // Set default role untuk user baru
          setFormData((prev) => ({ ...prev, role_id: response.data[0].id }));
        }
      } catch (err) {
        console.error("Gagal mengambil data peran", err);
      }
    };
    fetchRoles();

    if (user) {
      setFormData({
        full_name: user.full_name || "",
        username: user.username || "",
        email: user.email || "",
        phone_number: user.phone_number || "",
        password: "", // Password dikosongkan saat edit
        role_id: user.role_id || "",
      });
    } else {
      // Reset form untuk user baru
      setFormData({
        full_name: "",
        username: "",
        email: "",
        phone_number: "",
        password: "",
        role_id: roles.length > 0 ? roles[0].id : "",
      });
    }
  }, [user, roles.length]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await onSave({ ...formData, id: user?.id });
    } catch (err) {
      setError(err.response?.data?.message || "Gagal menyimpan data.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
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
      <div className="mb-4">
        <label
          htmlFor="username"
          className="block text-sm font-medium text-gray-700"
        >
          Username
        </label>
        <input
          type="text"
          name="username"
          id="username"
          value={formData.username}
          onChange={handleChange}
          className="input-style"
          required
        />
      </div>
      <div className="mb-4">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
          Email
        </label>
        <input
          type="email"
          name="email"
          id="email"
          value={formData.email}
          onChange={handleChange}
          className="input-style"
          required
        />
      </div>
      <div className="mb-4">
        <label
          htmlFor="phone_number"
          className="block text-sm font-medium text-gray-700"
        >
          Phone
        </label>
        <input
          type="text"
          name="phone_number"
          id="phone_number"
          value={formData.phone_number}
          onChange={handleChange}
          className="input-style"
        />
      </div>
      <div className="mb-4">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700"
        >
          Password
        </label>
        <input
          type="password"
          name="password"
          id="password"
          value={formData.password}
          onChange={handleChange}
          className="input-style"
          placeholder={user ? "Kosongkan jika tidak ingin diubah" : ""}
          required={!user}
        />
      </div>
      <div className="mb-6">
        <label
          htmlFor="role_id"
          className="block text-sm font-medium text-gray-700"
        >
          Peran
        </label>
        <select
          name="role_id"
          id="role_id"
          value={formData.role_id}
          onChange={handleChange}
          className="input-style bg-white"
          required
        >
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.role_name}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      <div className="flex justify-end space-x-3">
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

export default UserForm;
