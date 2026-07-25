import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "@/services/api"; // Menggunakan alias path '@'
// --- PERBAIKAN: Mengganti 'login' kembali ke 'refreshUser' ---
import { useAuth } from "@/context/AuthContext"; // Menggunakan alias path '@'
import { useNotification } from "@/context/NotificationContext"; // Menggunakan alias path '@'
import MapPicker from "@/components/MapPicker"; // Menggunakan alias path '@'
import {
  Loader2,
  Eye,
  EyeOff,
  Building,
  Store,
  UserPlus,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

// Posisi default (Jakarta)
const DEFAULT_POSITION = { lat: -6.2088, lng: 106.8456 };

// Komponen Checkbox Kustom
const Checkbox = ({ id, label, checked, onChange, children }) => (
  <div className="flex items-start">
    <div className="flex items-center h-5">
      <input
        id={id}
        name={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        // PERUBAHAN: Warna diubah ke solusimbg-blue
        className="focus:ring-intigizi-green h-4 w-4 text-intigizi-green border-gray-300 rounded"
      />
    </div>
    <div className="ml-3 text-sm">
      <label htmlFor={id} className="font-medium text-gray-700">
        {label}
      </label>
      <div className="text-gray-500">{children}</div>
    </div>
  </div>
);

// Komponen Input Kustom
const Input = ({
  id,
  label,
  type = "text",
  value,
  onChange,
  error,
  required = true,
  placeholder = "",
  children,
}) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700">
      {label}
    </label>
    <div className="mt-1 relative">
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`input-style w-full ${error ? "border-red-500" : ""}`}
        required={required}
      />
      {children}
    </div>
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

// Komponen Select Kustom
const Select = ({
  id,
  label,
  value,
  onChange,
  error,
  required = true,
  children,
  ...props
}) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700">
      {label}
    </label>
    <select
      id={id}
      name={id}
      value={value}
      onChange={onChange}
      className={`input-style w-full bg-white ${error ? "border-red-500" : ""}`}
      required={required}
      {...props}
    >
      {children}
    </select>
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

// Form untuk Mitra Dapur
const MitraForm = ({
  formData,
  setFormData,
  handleRegister,
  loading,
  regions,
  validationErrors,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLocationChange = useCallback(
    (location) => {
      setFormData((prev) => ({
        ...prev,
        latitude: location.lat,
        longitude: location.lng,
        kitchen_address: location.address,
        // Coba isi otomatis provinsi & kabupaten
        province_id: location.provinceId || prev.province_id,
        regency_id: location.regencyId || prev.regency_id,
      }));
    },
    [setFormData],
  );

  const availableRegencies = useMemo(
    () => regions.regencies?.[formData.province_id] || [],
    [formData.province_id, regions.regencies],
  );

  // Setel regency_id ke "" jika provinsinya berubah
  useEffect(() => {
    if (
      formData.province_id &&
      !availableRegencies?.map((r) => r.id)?.includes(formData.regency_id)
    ) {
      setFormData((prev) => ({ ...prev, regency_id: "" }));
    }
  }, [
    formData.province_id,
    availableRegencies,
    formData.regency_id,
    setFormData,
  ]);

  return (
    <form onSubmit={handleRegister} className="space-y-6">
      <div className="p-6 bg-white rounded-lg shadow-md border border-gray-100">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">
          1. Informasi Badan Hukum
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="org_name"
            label="Nama Yayasan / Badan Hukum"
            value={formData.org_name}
            onChange={handleChange}
            error={validationErrors.org_name}
          />
          <Input
            id="director_name"
            label="Nama Ketua Yayasan"
            value={formData.director_name}
            onChange={handleChange}
            error={validationErrors.director_name}
          />
        </div>
      </div>

      <div className="p-6 bg-white rounded-lg shadow-md border border-gray-100">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">
          2. Informasi Dapur & Lokasi
        </h3>
        <div className="space-y-4">
          <Input
            id="kitchen_name"
            label="Nama Dapur (Brand)"
            value={formData.kitchen_name}
            onChange={handleChange}
            error={validationErrors.kitchen_name}
            placeholder="Cth: Dapur Sehat Ceria"
          />

          <div className="h-80 w-full rounded-lg overflow-hidden border">
            <MapPicker
              onLocationChange={handleLocationChange}
              activeTab={true}
            />
          </div>

          <Input
            id="kitchen_address"
            label="Alamat Lengkap Dapur"
            type="textarea"
            value={formData.kitchen_address}
            onChange={handleChange}
            error={validationErrors.kitchen_address}
            placeholder="Pilih dari peta atau isi manual"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              id="province_id"
              label="Provinsi"
              value={formData.province_id}
              onChange={handleChange}
              error={validationErrors.province_id}
            >
              <option value="">Pilih Provinsi</option>
              {regions.provinces?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
            <Select
              id="regency_id"
              label="Kabupaten/Kota"
              value={formData.regency_id}
              onChange={handleChange}
              error={validationErrors.regency_id}
              disabled={!formData.province_id}
            >
              <option value="">Pilih Kabupaten/Kota</option>
              {availableRegencies?.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      <div className="p-6 bg-white rounded-lg shadow-md border border-gray-100">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">
          3. Akun Pengelola Yayasan (Utama)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="pic_name"
            label="Nama Lengkap PIC"
            value={formData.pic_name}
            onChange={handleChange}
            error={validationErrors.pic_name}
          />
          <Input
            id="pic_whatsapp"
            label="Nomor WhatsApp PIC"
            type="tel"
            value={formData.pic_whatsapp}
            onChange={handleChange}
            error={validationErrors.pic_whatsapp}
          />
          <Input
            id="pic_email"
            label="Email PIC (untuk login)"
            type="email"
            value={formData.pic_email}
            onChange={handleChange}
            error={validationErrors.pic_email}
          />
          <Input
            id="username"
            label="Username (untuk login)"
            value={formData.username}
            onChange={handleChange}
            error={validationErrors.username}
          />
          <Input
            id="password"
            label="Password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={handleChange}
            error={validationErrors.password}
          >
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </Input>
          <Input
            id="confirmPassword"
            label="Konfirmasi Password"
            type={showPassword ? "text" : "password"}
            value={formData.confirmPassword}
            onChange={handleChange}
            error={validationErrors.confirmPassword}
          />
        </div>
      </div>

      <button
        type="submit"
        className="btn-primary w-full text-lg py-3"
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="animate-spin" />
        ) : (
          "Daftarkan Yayasan & Dapur Utama"
        )}
      </button>
    </form>
  );
};

// Form untuk Vendor
const VendorForm = ({
  formData,
  setFormData,
  handleRegister,
  loading,
  regions,
  validationErrors,
  vendorCategories,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLocationChange = useCallback(
    (location) => {
      setFormData((prev) => ({
        ...prev,
        latitude: location.lat,
        longitude: location.lng,
        vendor_address: location.address,
        province_id: location.provinceId || prev.province_id,
        regency_id: location.regencyId || prev.regency_id,
      }));
    },
    [setFormData],
  );

  const availableRegencies = useMemo(
    () => regions.regencies?.[formData.province_id] || [],
    [formData.province_id, regions.regencies],
  );

  useEffect(() => {
    if (
      formData.province_id &&
      !availableRegencies?.map((r) => r.id)?.includes(formData.regency_id)
    ) {
      setFormData((prev) => ({ ...prev, regency_id: "" }));
    }
  }, [
    formData.province_id,
    availableRegencies,
    formData.regency_id,
    setFormData,
  ]);

  return (
    <form onSubmit={handleRegister} className="space-y-6">
      <div className="p-6 bg-white rounded-lg shadow-md border border-gray-100">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">
          1. Informasi Usaha Vendor
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="org_name"
            label="Nama Usaha / Brand"
            value={formData.org_name}
            onChange={handleChange}
            error={validationErrors.org_name}
          />
          <Select
            id="vendor_category_id"
            label="Kategori Usaha"
            value={formData.vendor_category_id}
            onChange={handleChange}
            error={validationErrors.vendor_category_id}
          >
            <option value="">Pilih Kategori</option>
            {vendorCategories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="p-6 bg-white rounded-lg shadow-md border border-gray-100">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">
          2. Lokasi Usaha
        </h3>
        <div className="space-y-4">
          <div className="h-80 w-full rounded-lg overflow-hidden border">
            <MapPicker
              onLocationChange={handleLocationChange}
              activeTab={true}
            />
          </div>
          <Input
            id="vendor_address"
            label="Alamat Lengkap Usaha"
            type="textarea"
            value={formData.vendor_address}
            onChange={handleChange}
            error={validationErrors.vendor_address}
            placeholder="Pilih dari peta atau isi manual"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              id="province_id"
              label="Provinsi"
              value={formData.province_id}
              onChange={handleChange}
              error={validationErrors.province_id}
            >
              <option value="">Pilih Provinsi</option>
              {regions.provinces?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
            <Select
              id="regency_id"
              label="Kabupaten/Kota"
              value={formData.regency_id}
              onChange={handleChange}
              error={validationErrors.regency_id}
              disabled={!formData.province_id}
            >
              <option value="">Pilih Kabupaten/Kota</option>
              {availableRegencies?.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      <div className="p-6 bg-white rounded-lg shadow-md border border-gray-100">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">
          3. Akun PIC Vendor
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="pic_name"
            label="Nama Lengkap PIC"
            value={formData.pic_name}
            onChange={handleChange}
            error={validationErrors.pic_name}
          />
          <Input
            id="pic_whatsapp"
            label="Nomor WhatsApp PIC"
            type="tel"
            value={formData.pic_whatsapp}
            onChange={handleChange}
            error={validationErrors.pic_whatsapp}
          />
          <Input
            id="pic_email"
            label="Email PIC (untuk login)"
            type="email"
            value={formData.pic_email}
            onChange={handleChange}
            error={validationErrors.pic_email}
          />
          <Input
            id="username"
            label="Username (untuk login)"
            value={formData.username}
            onChange={handleChange}
            error={validationErrors.username}
          />
          <Input
            id="password"
            label="Password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={handleChange}
            error={validationErrors.password}
          >
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </Input>
          <Input
            id="confirmPassword"
            label="Konfirmasi Password"
            type={showPassword ? "text" : "password"}
            value={formData.confirmPassword}
            onChange={handleChange}
            error={validationErrors.confirmPassword}
          />
        </div>
      </div>

      <button
        type="submit"
        className="btn-primary w-full text-lg py-3"
        disabled={loading}
      >
        {loading ? <Loader2 className="animate-spin" /> : "Daftarkan Vendor"}
      </button>
    </form>
  );
};

// Form untuk Calon Mitra (Pendanaan)
const CalonMitraForm = ({
  formData,
  setFormData,
  handleRegister,
  loading,
  validationErrors,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleRegister} className="space-y-6">
      <div className="p-6 bg-white rounded-lg shadow-md border border-gray-100">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">
          1. Akun Anda
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Buat akun untuk mengakses formulir pengajuan pendanaan. Anda akan
          otomatis login setelah mendaftar.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="pic_name"
            label="Nama Lengkap Anda"
            value={formData.pic_name}
            onChange={handleChange}
            error={validationErrors.pic_name}
            placeholder="Sesuai KTP"
          />
          <Input
            id="pic_whatsapp"
            label="Nomor WhatsApp Aktif"
            type="tel"
            value={formData.pic_whatsapp}
            onChange={handleChange}
            error={validationErrors.pic_whatsapp}
          />
          <Input
            id="pic_email"
            label="Email (untuk login)"
            type="email"
            value={formData.pic_email}
            onChange={handleChange}
            error={validationErrors.pic_email}
          />
          <Input
            id="username"
            label="Username (untuk login)"
            value={formData.username}
            onChange={handleChange}
            error={validationErrors.username}
          />
          <Input
            id="password"
            label="Password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={handleChange}
            error={validationErrors.password}
          >
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </Input>
          <Input
            id="confirmPassword"
            label="Konfirmasi Password"
            type={showPassword ? "text" : "password"}
            value={formData.confirmPassword}
            onChange={handleChange}
            error={validationErrors.confirmPassword}
          />
        </div>
      </div>

      <button
        type="submit"
        className="btn-primary w-full text-lg py-3"
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="animate-spin" />
        ) : (
          "Daftar & Lanjutkan ke Formulir"
        )}
      </button>
    </form>
  );
};

// Form untuk Investor
const InvestorForm = ({
  formData,
  setFormData,
  handleRegister,
  loading,
  validationErrors,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleRegister} className="space-y-6">
      <div className="p-6 bg-white rounded-lg shadow-md border border-gray-100">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">
          1. Akun Investor
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Buat akun investor untuk melihat proyek pendanaan dan mengelola
          portofolio Anda. Anda akan otomatis login setelah mendaftar.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="pic_name"
            label="Nama Lengkap Anda"
            value={formData.pic_name}
            onChange={handleChange}
            error={validationErrors.pic_name}
            placeholder="Sesuai KTP"
          />
          <Input
            id="pic_whatsapp"
            label="Nomor WhatsApp Aktif"
            type="tel"
            value={formData.pic_whatsapp}
            onChange={handleChange}
            error={validationErrors.pic_whatsapp}
          />
          <Input
            id="pic_email"
            label="Email (untuk login)"
            type="email"
            value={formData.pic_email}
            onChange={handleChange}
            error={validationErrors.pic_email}
          />
          <Input
            id="username"
            label="Username (untuk login)"
            value={formData.username}
            onChange={handleChange}
            error={validationErrors.username}
          />
          <Input
            id="password"
            label="Password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={handleChange}
            error={validationErrors.password}
          >
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </Input>
          <Input
            id="confirmPassword"
            label="Konfirmasi Password"
            type={showPassword ? "text" : "password"}
            value={formData.confirmPassword}
            onChange={handleChange}
            error={validationErrors.confirmPassword}
          />
        </div>
      </div>

      <button
        type="submit"
        className="btn-primary w-full text-lg py-3"
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="animate-spin" />
        ) : (
          "Daftar Sebagai Investor"
        )}
      </button>
    </form>
  );
};

// Halaman Registrasi Utama
function RegisterPage() {
  const [registrationType, setRegistrationType] = useState("Yayasan / Pengelola SPPG");
  const [regions, setRegions] = useState({ provinces: [], regencies: {} });
  const [vendorCategories, setVendorCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // --- PERBAIKAN: Menggunakan refreshUser ---
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  // Inisialisasi state form gabungan
  const [formData, setFormData] = useState({
    // Mitra
    org_name: "",
    director_name: "",
    kitchen_name: "",
    kitchen_address: "",
    // Vendor
    vendor_category_id: "",
    vendor_address: "",
    // Calon Mitra & Investor
    pic_name: "",
    pic_email: "",
    pic_whatsapp: "",
    username: "",
    password: "",
    confirmPassword: "",
    // Umum
    province_id: "",
    regency_id: "",
    latitude: DEFAULT_POSITION.lat,
    longitude: DEFAULT_POSITION.lng,
    registration_type: "Yayasan / Pengelola SPPG",
  });

  // Mengambil data wilayah & kategori vendor saat komponen dimuat
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [regionsRes, categoriesRes] = await Promise.all([
          apiClient.get("/public_get_regions.php"),
          apiClient.get("/vendor_categories_get.php"),
        ]);
        setRegions(regionsRes.data);
        setVendorCategories(categoriesRes.data);
      } catch (error) {
        showNotification(
          "Gagal memuat data pendukung (wilayah/kategori).",
          "error",
        );
      }
    };
    fetchInitialData();
  }, [showNotification]);

  // Reset form saat tipe registrasi berubah
  const handleTypeChange = (type) => {
    setRegistrationType(type);
    setValidationErrors({});
    setFormData({
      org_name: "",
      director_name: "",
      kitchen_name: "",
      kitchen_address: "",
      vendor_category_id: "",
      vendor_address: "",
      pic_name: "",
      pic_email: "",
      pic_whatsapp: "",
      username: "",
      password: "",
      confirmPassword: "",
      province_id: "",
      regency_id: "",
      latitude: DEFAULT_POSITION.lat,
      longitude: DEFAULT_POSITION.lng,
      registration_type: type,
    });
  };

  // Validasi form
  const validateForm = () => {
    const errors = {};
    // --- PERBAIKAN: Menggunakan 'confirmPassword' ---
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Konfirmasi password tidak cocok.";
    }
    if (formData.password.length > 0 && formData.password.length < 6) {
      errors.password = "Password minimal harus 6 karakter.";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle submit pendaftaran
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showNotification("Harap perbaiki error pada form.", "warning");
      return;
    }

    setLoading(true);
    try {
      let response;
      let targetRoute = "/login"; // Default
      let autoLogin = false;

      if (registrationType === "Yayasan / Pengelola SPPG") {
        response = await apiClient.post("/register_organization.php", formData);
      } else if (registrationType === "Vendor") {
        response = await apiClient.post("/register_vendor.php", formData);
      } else if (registrationType === "Calon Mitra") {
        response = await apiClient.post("/register_calon_mitra.php", formData);
        targetRoute = "/app/funding/apply";
        autoLogin = true;
      } else if (registrationType === "Investor") {
        response = await apiClient.post("/register_investor.php", formData);
        targetRoute = "/app/investor/dashboard";
        autoLogin = true;
      }

      showNotification(response.data.message, "success");

      if (autoLogin && response.data.token) {
        // --- PERBAIKAN: Menggunakan alur auto-login Anda yang sudah benar ---
        localStorage.setItem("authToken", response.data.token);
        await refreshUser(); // Memaksa AuthContext untuk mengambil data user baru
        // --- AKHIR PERBAIKAN ---

        navigate(targetRoute); // Navigasi setelah user di-refresh
      } else {
        // Alur lama (Mitra Dapur & Vendor)
        navigate(targetRoute);
      }
    } catch (error) {
      console.error("Error saat registrasi:", error);
      showNotification(
        error.response?.data?.message || "Pendaftaran gagal.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  // Opsi Tipe Registrasi
  const registrationOptions = [
    {
      type: "Yayasan / Pengelola SPPG",
      icon: <Building size={24} />,
      desc: "Daftarkan Yayasan Anda untuk mengelola dan memantau unit-unit dapur SPPG di bawahnya.",
    },
    {
      type: "Vendor",
      icon: <Store size={24} />,
      desc: "Daftarkan usaha Anda sebagai vendor/pemasok di direktori kami.",
    },
    {
      type: "Calon Mitra",
      icon: <UserPlus size={24} />,
      desc: "Daftar untuk mengajukan proposal pendanaan dapur baru.",
    },
    {
      type: "Investor",
      icon: <CheckCircle size={24} />,
      desc: "Daftar untuk melihat dan berinvestasi di proyek dapur.",
    },
  ];

  const renderForm = () => {
    switch (registrationType) {
      case "Yayasan / Pengelola SPPG":
        return (
          <MitraForm
            formData={formData}
            setFormData={setFormData}
            handleRegister={handleRegister}
            loading={loading}
            regions={regions}
            validationErrors={validationErrors}
          />
        );
      case "Vendor":
        return (
          <div className="p-8 bg-white border border-gray-100 rounded-2xl text-center space-y-4 shadow-md">
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <Store size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Portal Supplier B2B Terpusat</h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed">
              Untuk memberikan pengalaman pengadaan yang lebih baik, pendaftaran Mitra Supplier kini dipusatkan ke dalam platform **B2B Supplier Marketplace** kami.
            </p>
            <div className="pt-4">
              <a
                href="http://localhost:5174/register"
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all shadow-md shadow-green-600/20 hover:shadow-green-600/30 hover:-translate-y-0.5"
              >
                <span>Buka Portal Supplier B2B</span>
                <ArrowRight size={16} />
              </a>
            </div>
          </div>
        );
      case "Calon Mitra":
        return (
          <CalonMitraForm
            formData={formData}
            setFormData={setFormData}
            handleRegister={handleRegister}
            loading={loading}
            validationErrors={validationErrors}
          />
        );
      case "Investor":
        return (
          <InvestorForm
            formData={formData}
            setFormData={setFormData}
            handleRegister={handleRegister}
            loading={loading}
            validationErrors={validationErrors}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/">
          {/* PERUBAHAN: Logo diubah ke solusimbg-logo.png */}
          <img
            className="mx-auto h-16 w-auto"
            src="/intigizi-logo.png"
            alt="IntiGizi"
          />
        </Link>
        <h2 className="mt-6 text-3xl font-bold text-gray-900">
          Buat Akun Baru
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          {/* PERUBAHAN: Warna link diubah ke solusimbg-blue */}
          Sudah punya akun?{" "}
          <Link
            to="/login"
            className="font-medium text-intigizi-green hover:underline"
          >
            Masuk di sini
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-4xl">
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {registrationOptions.map((opt) => (
              <button
                key={opt.type}
                onClick={() => handleTypeChange(opt.type)}
                className={`flex flex-col items-center justify-center text-center p-3 rounded-lg border-2 transition-all ${
                  registrationType === opt.type
                    ? // PERUBAHAN: Warna diubah ke solusimbg-blue
                      "bg-intigizi-green/10 border-intigizi-green text-intigizi-green"
                    : "bg-transparent border-transparent text-gray-500 hover:bg-gray-100"
                }`}
                title={opt.desc}
              >
                {opt.icon}
                <span className="text-sm font-semibold mt-1.5">{opt.type}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10">
          {renderForm()}
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
