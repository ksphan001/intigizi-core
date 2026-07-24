import React, { useState, useEffect, useCallback } from "react";
import apiClient from "@/services/api";
import { useNotification } from "@/context/NotificationContext";
import {
  Loader2,
  Edit,
  ExternalLink,
  Plus,
  Image,
  ShoppingCart,
  Trash2,
  Camera,
} from "lucide-react";
import Modal from "@/components/Modal";
import ConfirmationModal from "@/components/ConfirmationModal";
import { API_BASE_URL } from "@/config.js";

// --- Form-form Internal (diadaptasi dari kode asli Anda) ---

const ProfileForm = ({ profile, onSave, loading, categories, onCancel }) => {
  const [formData, setFormData] = useState({
    name: "",
    vendor_category_id: "",
    vendor_description: "",
    vendor_website: "",
    vendor_address: "",
  });
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        vendor_category_id: profile.vendor_category_id || "",
        vendor_description: profile.vendor_description || "",
        vendor_website: profile.vendor_website || "",
        vendor_address: profile.vendor_address || "",
      });
      setPreview(
        profile.profile_picture
          ? `${API_BASE_URL.replace("/app", "")}${profile.profile_picture}`
          : null,
      );
    }
  }, [profile]);

  const handleChange = (e) =>
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePictureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    for (const key in formData) {
      data.append(key, formData[key]);
    }
    if (profilePictureFile) {
      data.append("profile_picture", profilePictureFile);
    }
    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative w-32 h-32 mx-auto">
        <img
          src={preview || "/intigizi-icon.png"}
          alt="Profil"
          className="h-32 w-32 rounded-full object-cover border-4 border-gray-200"
        />
        <label
          htmlFor="profile-pic-upload"
          className="absolute bottom-0 right-0 bg-intigizi-green text-white rounded-full p-2 cursor-pointer hover:bg-opacity-90"
        >
          <Camera size={16} />
          <input
            id="profile-pic-upload"
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
        </label>
      </div>
      <input
        type="text"
        name="name"
        placeholder="Nama Usaha/Vendor"
        value={formData.name}
        onChange={handleChange}
        className="input-style"
        required
      />
      <select
        name="vendor_category_id"
        value={formData.vendor_category_id}
        onChange={handleChange}
        className="input-style bg-white"
        required
      >
        <option value="">Pilih Kategori...</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>
      <textarea
        name="vendor_address"
        placeholder="Alamat Lengkap"
        value={formData.vendor_address}
        onChange={handleChange}
        rows="3"
        className="input-style"
      ></textarea>
      <input
        type="url"
        name="vendor_website"
        placeholder="Website / Media Sosial (https://...)"
        value={formData.vendor_website}
        onChange={handleChange}
        className="input-style"
      />
      <textarea
        name="vendor_description"
        placeholder="Deskripsi Singkat Usaha"
        value={formData.vendor_description}
        onChange={handleChange}
        rows="4"
        className="input-style"
      ></textarea>
      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Batal
        </button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Menyimpan..." : "Simpan Profil"}
        </button>
      </div>
    </form>
  );
};

const PortfolioForm = ({ item, onSave, onCancel, loading }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setDescription(item.description);
      setPreview(
        item.image_path
          ? `${API_BASE_URL.replace("/app", "")}${item.image_path}`
          : null,
      );
    }
  }, [item]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("action", item ? "update" : "add");
    if (item) {
      formData.append("id", item.id);
    }
    formData.append("title", title);
    formData.append("description", description);
    if (image) {
      formData.append("image", image);
    }
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700"
        >
          Judul Portofolio/Proyek
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input-style"
          required
        />
      </div>
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
        >
          Deskripsi
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows="3"
          className="input-style"
        ></textarea>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Gambar
        </label>
        <input
          type="file"
          onChange={handleImageChange}
          accept="image/*"
          className="input-style"
        />
        {preview && (
          <img
            src={preview}
            alt="Preview"
            className="mt-2 h-32 w-auto rounded"
          />
        )}
      </div>
      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Batal
        </button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Mengunggah..." : "Simpan Portofolio"}
        </button>
      </div>
    </form>
  );
};

const ProductForm = ({ item, onSave, onCancel, loading, units }) => {
  const [formData, setFormData] = useState({
    product_name: "",
    description: "",
    price_per_unit: "",
    unit_id: "",
  });

  useEffect(() => {
    setFormData({
      product_name: item?.product_name || "",
      description: item?.description || "",
      price_per_unit: item?.price_per_unit || "",
      unit_id: item?.unit_id || (units.length > 0 ? units[0].id : ""),
    });
  }, [item, units]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...formData, id: item?.id });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="product_name"
          className="block text-sm font-medium text-gray-700"
        >
          Nama Produk/Jasa
        </label>
        <input
          type="text"
          name="product_name"
          id="product_name"
          value={formData.product_name}
          onChange={handleChange}
          className="input-style"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="price_per_unit"
            className="block text-sm font-medium text-gray-700"
          >
            Harga (Rp)
          </label>
          <input
            type="number"
            name="price_per_unit"
            id="price_per_unit"
            value={formData.price_per_unit}
            onChange={handleChange}
            className="input-style"
            required
          />
        </div>
        <div>
          <label
            htmlFor="unit_id"
            className="block text-sm font-medium text-gray-700"
          >
            Satuan
          </label>
          <select
            name="unit_id"
            id="unit_id"
            value={formData.unit_id}
            onChange={handleChange}
            className="input-style bg-white"
            required
          >
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.symbol})
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label
          htmlFor="proddescription"
          className="block text-sm font-medium text-gray-700"
        >
          Deskripsi Produk (Opsional)
        </label>
        <textarea
          name="description"
          id="proddescription"
          value={formData.description}
          onChange={handleChange}
          rows="3"
          className="input-style"
        ></textarea>
      </div>
      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Batal
        </button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Menyimpan..." : "Simpan Produk"}
        </button>
      </div>
    </form>
  );
};

// Halaman Utama
function VendorProfilePage() {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const { showNotification } = useNotification();
  const [modal, setModal] = useState({ type: null, data: null });

  const fetchProfile = useCallback(async () => {
    try {
      const [profileRes, categoriesRes, unitsRes] = await Promise.all([
        apiClient.get("/vendor_get_profile.php"),
        apiClient.get("/vendor_categories_get.php"),
        apiClient.get("/units_get.php"),
      ]);
      setProfileData(profileRes.data);
      setCategories(categoriesRes.data);
      setUnits(unitsRes.data);
    } catch (err) {
      setError("Gagal memuat data profil.");
      showNotification("Gagal memuat data profil.", "error");
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    setLoading(true);
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async (data) => {
    setActionLoading(true);
    try {
      let response;
      if (modal.type === "profile") {
        response = await apiClient.post("/vendor_update_profile.php", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else if (modal.type === "portfolio") {
        response = await apiClient.post("/vendor_manage_portfolio.php", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else if (modal.type === "product") {
        const payload = { action: data.id ? "update" : "add", ...data };
        response = await apiClient.post("/vendor_manage_products.php", payload);
      }
      showNotification(response.data.message, "success");
      setModal({ type: null, data: null });
      await fetchProfile();
    } catch (err) {
      showNotification(
        err.response?.data?.message || `Gagal menyimpan data.`,
        "error",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      const payload = { action: "delete", id: modal.data.id };
      let response;
      if (modal.type === "deletePortfolio") {
        response = await apiClient.post(
          "/vendor_manage_portfolio.php",
          payload,
        );
      } else if (modal.type === "deleteProduct") {
        response = await apiClient.post("/vendor_manage_products.php", payload);
      }
      showNotification(response.data.message, "success");
      setModal({ type: null, data: null });
      await fetchProfile();
    } catch (err) {
      showNotification(
        err.response?.data?.message || "Gagal menghapus data.",
        "error",
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-intigizi-green" size={32} />
      </div>
    );
  }

  if (error || !profileData || !profileData.profile) {
    return (
      <div className="text-center p-8 text-red-600 bg-red-50 rounded-lg">
        {error || "Gagal memuat struktur data profil."}
      </div>
    );
  }

  const { profile, products, portfolio } = profileData;

  return (
    <div>
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex items-start space-x-6">
          <img
            src={
              profile.profile_picture
                ? `${API_BASE_URL.replace("/app", "")}${profile.profile_picture}`
                : "/intigizi-icon.png"
            }
            alt="Profil"
            className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-md"
          />
          <div className="flex-grow">
            <span className="text-sm font-semibold text-intigizi-green bg-green-100 px-3 py-1 rounded-full">
              {profile.category_name || "Belum ada kategori"}
            </span>
            <h1 className="text-3xl font-bold text-gray-800 mt-2">
              {profile.name}
            </h1>
            <p className="text-gray-600 mt-2">
              {profile.vendor_description || (
                <span className="italic text-gray-400">
                  Deskripsi belum ditambahkan.
                </span>
              )}
            </p>
            {profile.vendor_website && (
              <a
                href={profile.vendor_website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-intigizi-green hover:underline mt-2 inline-flex items-center"
              >
                Kunjungi Website <ExternalLink size={14} className="ml-1" />
              </a>
            )}
          </div>
          <button
            onClick={() => setModal({ type: "profile", data: profile })}
            className="btn-secondary flex-shrink-0 flex items-center"
          >
            <Edit size={16} className="mr-2" /> Edit Profil
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <ShoppingCart size={20} className="mr-3 text-intigizi-green" />{" "}
            Daftar Produk & Jasa
          </h2>
          <button
            onClick={() => setModal({ type: "product", data: null })}
            className="btn-primary flex items-center"
          >
            <Plus size={16} className="mr-2" /> Tambah Produk
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Nama Produk/Jasa
                </th>
                <th scope="col" className="px-6 py-3">
                  Harga
                </th>
                <th scope="col" className="px-6 py-3 text-right">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {products.length > 0 ? (
                products.map((p) => (
                  <tr key={p.id} className="bg-white border-b hover:bg-gray-50">
                    <th
                      scope="row"
                      className="px-6 py-4 font-medium text-gray-900"
                    >
                      {p.product_name}
                    </th>
                    <td className="px-6 py-4">
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                      }).format(p.price_per_unit)}{" "}
                      / {p.unit_symbol}
                    </td>
                    <td className="px-6 py-4 flex justify-end space-x-2">
                      <button
                        onClick={() => setModal({ type: "product", data: p })}
                        className="p-1 text-blue-600 hover:text-blue-800"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() =>
                          setModal({ type: "deleteProduct", data: p })
                        }
                        className="p-1 text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-4 text-gray-500">
                    Belum ada produk yang ditambahkan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <Image size={20} className="mr-3 text-intigizi-green" /> Portofolio
            Proyek
          </h2>
          <button
            onClick={() => setModal({ type: "portfolio", data: null })}
            className="btn-primary flex items-center"
          >
            <Plus size={16} className="mr-2" /> Tambah Portofolio
          </button>
        </div>
        {portfolio.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {portfolio.map((item) => (
              <div
                key={item.id}
                className="border rounded-lg overflow-hidden group relative"
              >
                <img
                  src={`${API_BASE_URL.replace("/app", "")}${item.image_path}`}
                  alt={item.title}
                  className="h-48 w-full object-cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() =>
                      setModal({ type: "deletePortfolio", data: item })
                    }
                    className="p-2 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center py-4 text-gray-500">
            Belum ada portofolio yang diunggah.
          </p>
        )}
      </div>

      {modal.type === "profile" && (
        <Modal
          isOpen={true}
          onClose={() => setModal({ type: null, data: null })}
          title="Edit Profil Usaha"
        >
          <ProfileForm
            profile={modal.data}
            onSave={handleSave}
            loading={actionLoading}
            categories={categories}
            onCancel={() => setModal({ type: null, data: null })}
          />
        </Modal>
      )}
      {modal.type === "portfolio" && (
        <Modal
          isOpen={true}
          onClose={() => setModal({ type: null, data: null })}
          title={modal.data ? "Edit Portofolio" : "Tambah Portofolio"}
        >
          <PortfolioForm
            item={modal.data}
            onSave={handleSave}
            loading={actionLoading}
            onCancel={() => setModal({ type: null, data: null })}
          />
        </Modal>
      )}
      {modal.type === "product" && (
        <Modal
          isOpen={true}
          onClose={() => setModal({ type: null, data: null })}
          title={modal.data ? "Edit Produk" : "Tambah Produk Baru"}
        >
          <ProductForm
            item={modal.data}
            units={units}
            onSave={handleSave}
            loading={actionLoading}
            onCancel={() => setModal({ type: null, data: null })}
          />
        </Modal>
      )}
      {(modal.type === "deletePortfolio" || modal.type === "deleteProduct") && (
        <ConfirmationModal
          isOpen={true}
          onClose={() => setModal({ type: null, data: null })}
          onConfirm={handleDelete}
          title="Konfirmasi Hapus"
          message={`Apakah Anda yakin ingin menghapus "${modal.data.title || modal.data.product_name}"?`}
          loading={actionLoading}
        />
      )}
    </div>
  );
}

export default VendorProfilePage;
