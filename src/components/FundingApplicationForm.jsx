import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  Upload,
  Info,
  Building,
  MapPin,
  Users,
  Home,
  Banknote,
  Percent,
  Send,
  Calendar,
  Briefcase,
  Handshake,
  Shield,
  Circle,
  CheckCircle,
} from "lucide-react";
import MapPicker from "./MapPicker.jsx";
import apiClient from "../services/api.js";
import { useNotification } from "../context/NotificationContext.jsx";

// Posisi default (Jakarta)
const DEFAULT_POSITION = { lat: -6.2088, lng: 106.8456 };

// --- PERBAIKAN: Komponen-komponen ini dipindahkan ke LUAR fungsi utama ---
const StepIndicator = ({ current, total }) => (
  <div className="flex justify-center items-center space-x-2 mb-6">
    {Array.from({ length: total }, (_, i) => i + 1).map((step) => (
      <div key={step} className="flex items-center">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${current === step ? "bg-intigizi-green text-white" : current > step ? "bg-green-200 text-intigizi-green" : "bg-gray-200 text-gray-500"}`}
        >
          {current > step ? <CheckCircle size={16} /> : step}
        </div>
        {step < total && (
          <div
            className={`w-12 h-0.5 ${current > step ? "bg-green-200" : "bg-gray-200"}`}
          ></div>
        )}
      </div>
    ))}
  </div>
);

const Section = ({ title, icon, children }) => (
  <div className="space-y-5">
    <h3 className="text-lg font-semibold text-gray-800 flex items-center border-b pb-2">
      {React.cloneElement(icon, {
        size: 20,
        className: "mr-3 text-intigizi-green",
      })}
      {title}
    </h3>
    {children}
  </div>
);
// --- AKHIR PERBAIKAN ---

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
  ...props
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
        {...props}
      />
      {children}
    </div>
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

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

const Textarea = ({
  id,
  label,
  value,
  onChange,
  error,
  required = true,
  placeholder = "",
  rows = 3,
}) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700">
      {label}
    </label>
    <div className="mt-1 relative">
      <textarea
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className={`input-style w-full ${error ? "border-red-500" : ""}`}
        required={required}
      />
    </div>
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

const Checkbox = ({ id, label, checked, onChange, children }) => (
  <div className="flex items-start">
    <div className="flex items-center h-5">
      <input
        id={id}
        name={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
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

// Form Pengajuan Utama
function FundingApplicationForm({ onSuccess }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Info PIC & Legal
    pic_full_name: "",
    pic_email: "",
    pic_whatsapp: "",
    legal_entity_type: "Perorangan",
    director_name: "",
    legal_entity_name: "",
    established_date: "",
    bank_name: "",
    account_number: "",
    account_name: "",
    // Step 2: Info Dapur
    kitchen_name: "",
    kitchen_address: "",
    latitude: DEFAULT_POSITION.lat,
    longitude: DEFAULT_POSITION.lng,
    province_id: "",
    regency_id: "",
    mbg_status: "",
    land_status: "",
    vendor_status: "",
    beneficiary_count: "",
    target_amount: "", // <-- FIELD BARU DITAMBAHKAN
    // Step 3: Skema & Dokumen
    profit_sharing_type: "per_porsi",
    profit_sharing_value: "",
    public_description: "",
    payout_frequency: "bulanan",
    platform_commission_rate: "5",
    management_type: "platform",
    legalitas: [],
    agree_terms: false,
    agree_commission: false,
  });

  const [regions, setRegions] = useState({ provinces: [], regencies: {} });
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const { showNotification } = useNotification();

  // Ambil data wilayah
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const response = await apiClient.get("/public_get_regions.php");
        setRegions(response.data);
      } catch (err) {
        showNotification("Gagal memuat data wilayah.", "error");
      }
    };
    fetchRegions();
  }, [showNotification]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "file") {
      setFormData((prev) => ({ ...prev, [name]: Array.from(files) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleLocationChange = useCallback((location) => {
    // --- PERBAIKAN: Menggabungkan panggilan setFormData ---
    setFormData((prev) => ({
      ...prev,
      latitude: location.lat,
      longitude: location.lng,
      kitchen_address: location.address || prev.kitchen_address,
      province_id: location.provinceId || prev.province_id,
      regency_id: location.regencyId || prev.regency_id,
    }));
  }, []);

  const availableRegencies = useMemo(
    () => regions.regencies[formData.province_id] || [],
    [formData.province_id, regions.regencies],
  );

  useEffect(() => {
    if (
      formData.province_id &&
      !availableRegencies.map((r) => r.id).includes(formData.regency_id)
    ) {
      setFormData((prev) => ({ ...prev, regency_id: "" }));
    }
  }, [formData.province_id, availableRegencies, formData.regency_id]);

  const mapInitialPosition = useMemo(
    () => ({
      lat: formData.latitude,
      lng: formData.longitude,
    }),
    [formData.latitude, formData.longitude],
  );

  const validateStep = (currentStep) => {
    const errors = {};
    if (currentStep === 1) {
      if (!formData.pic_full_name)
        errors.pic_full_name = "Nama PIC wajib diisi.";
      if (!formData.pic_email) errors.pic_email = "Email PIC wajib diisi.";
      if (!formData.pic_whatsapp)
        errors.pic_whatsapp = "WhatsApp PIC wajib diisi.";
      if (!formData.legal_entity_name)
        errors.legal_entity_name = "Nama Badan Hukum/Perorangan wajib diisi.";
      if (!formData.director_name)
        errors.director_name = "Nama Pimpinan/Penanggung Jawab wajib diisi.";
      if (!formData.established_date)
        errors.established_date = "Tanggal berdiri/KTP wajib diisi.";
    } else if (currentStep === 2) {
      if (!formData.kitchen_name)
        errors.kitchen_name = "Nama Dapur wajib diisi.";
      if (!formData.kitchen_address)
        errors.kitchen_address = "Alamat Dapur wajib diisi.";
      if (!formData.province_id) errors.province_id = "Provinsi wajib dipilih.";
      if (!formData.regency_id)
        errors.regency_id = "Kabupaten/Kota wajib dipilih.";
      if (!formData.mbg_status)
        errors.mbg_status = "Status pendaftaran MBG wajib dipilih.";
      if (!formData.land_status)
        errors.land_status = "Status lahan wajib dipilih.";
      if (!formData.vendor_status)
        errors.vendor_status = "Status vendor wajib dipilih.";
      if (!formData.beneficiary_count)
        errors.beneficiary_count = "Jumlah penerima wajib diisi.";
      if (!formData.target_amount)
        errors.target_amount = "Target Pendanaan wajib diisi."; // <-- VALIDASI BARU
    } else if (currentStep === 3) {
      if (!formData.profit_sharing_value)
        errors.profit_sharing_value = "Nilai bagi hasil wajib diisi.";
      if (!formData.public_description)
        errors.public_description = "Deskripsi publik wajib diisi.";
      if (formData.legalitas.length === 0)
        errors.legalitas = "Minimal unggah satu dokumen legalitas.";
      if (!formData.agree_terms)
        errors.agree_terms = "Anda harus menyetujui Syarat & Ketentuan.";
      if (!formData.agree_commission)
        errors.agree_commission = "Anda harus menyetujui Komisi Platform.";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((s) => s + 1);
      window.scrollTo(0, 0);
    } else {
      showNotification(
        "Harap lengkapi semua field yang wajib diisi.",
        "warning",
      );
    }
  };

  const prevStep = () => {
    setStep((s) => s - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(3)) {
      showNotification(
        "Harap lengkapi semua field yang wajib diisi dan setujui ketentuan.",
        "warning",
      );
      return;
    }

    setLoading(true);

    const submissionData = new FormData();
    // Loop melalui semua state formData dan menambahkannya ke FormData
    Object.keys(formData).forEach((key) => {
      if (key === "legalitas") {
        formData.legalitas.forEach((file, index) => {
          submissionData.append(`legalitas[]`, file);
        });
      } else if (key !== "agree_terms" && key !== "agree_commission") {
        submissionData.append(key, formData[key]);
      }
    });

    try {
      const response = await apiClient.post(
        "/funding_application_create.php",
        submissionData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      showNotification(response.data.message, "success");
      onSuccess(); // Panggil callback sukses
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Gagal mengirim pengajuan.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const profitValueLabel =
    formData.profit_sharing_type === "per_porsi"
      ? "Nominal per Porsi (Rp)"
      : "Persentase Keuntungan (%)";

  const profitValuePlaceholder =
    formData.profit_sharing_type === "per_porsi" ? "Cth: 500" : "Cth: 15";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <StepIndicator current={step} total={3} />

      {/* --- STEP 1: INFORMASI LEGAL --- */}
      {step === 1 && (
        <div className="space-y-6">
          <Section title="Informasi PIC & Legalitas" icon={<Briefcase />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                id="pic_full_name"
                label="Nama Lengkap PIC (Sesuai KTP)"
                value={formData.pic_full_name}
                onChange={handleChange}
                error={validationErrors.pic_full_name}
              />
              <Input
                id="pic_email"
                label="Email PIC"
                type="email"
                value={formData.pic_email}
                onChange={handleChange}
                error={validationErrors.pic_email}
              />
              <Input
                id="pic_whatsapp"
                label="Nomor WhatsApp PIC"
                type="tel"
                value={formData.pic_whatsapp}
                onChange={handleChange}
                error={validationErrors.pic_whatsapp}
              />
              <Select
                id="legal_entity_type"
                label="Bentuk Badan Hukum"
                value={formData.legal_entity_type}
                onChange={handleChange}
                error={validationErrors.legal_entity_type}
              >
                <option value="Perorangan">Perorangan</option>
                <option value="Yayasan">Yayasan</option>
                <option value="PT">PT</option>
                <option value="CV">CV</option>
                <option value="Koperasi">Koperasi</option>
              </Select>
              <Input
                id="legal_entity_name"
                label="Nama Badan Hukum / Perorangan"
                value={formData.legal_entity_name}
                onChange={handleChange}
                error={validationErrors.legal_entity_name}
              />
              <Input
                id="director_name"
                label="Nama Pimpinan / Penanggung Jawab"
                value={formData.director_name}
                onChange={handleChange}
                error={validationErrors.director_name}
              />
              <Input
                id="established_date"
                label="Tanggal Berdiri / Tgl. Lahir (jika perorangan)"
                type="date"
                value={formData.established_date}
                onChange={handleChange}
                error={validationErrors.established_date}
              />
            </div>
          </Section>

          <Section title="Rekening Bank (Pencairan Dana)" icon={<Banknote />}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                id="bank_name"
                label="Nama Bank"
                value={formData.bank_name}
                onChange={handleChange}
                error={validationErrors.bank_name}
                placeholder="Cth: BCA"
              />
              <Input
                id="account_number"
                label="Nomor Rekening"
                type="number"
                value={formData.account_number}
                onChange={handleChange}
                error={validationErrors.account_number}
                placeholder="Hanya angka"
              />
              <Input
                id="account_name"
                label="Nama Pemilik Rekening"
                value={formData.account_name}
                onChange={handleChange}
                error={validationErrors.account_name}
              />
            </div>
          </Section>
        </div>
      )}

      {/* --- STEP 2: INFORMASI PROYEK DAPUR --- */}
      {step === 2 && (
        <div className="space-y-6">
          <Section title="Lokasi & Detail Proyek Dapur" icon={<MapPin />}>
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
                activeTab={step === 2}
                initialPosition={mapInitialPosition}
              />
            </div>
            <Textarea
              id="kitchen_address"
              label="Alamat Lengkap Dapur"
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
                {regions.provinces.map((p) => (
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
                {availableRegencies.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </Select>
            </div>
          </Section>

          <Section title="Status Kesiapan Dapur" icon={<Building />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                id="mbg_status"
                label="Status Pendaftaran Dapur di MBG"
                value={formData.mbg_status}
                onChange={handleChange}
                error={validationErrors.mbg_status}
              >
                <option value="">Pilih Status</option>
                <option value="sudah_verifikasi">
                  Sudah Verifikasi Titik Dapur
                </option>
                <option value="menunggu_verifikasi">Menunggu Verifikasi</option>
                <option value="sudah_membangun">
                  Sudah Mulai Membangun Dapur
                </option>
                <option value="baru_mengajukan">
                  Baru Akan Memulai Pengajuan ke MBG
                </option>
              </Select>
              <Select
                id="land_status"
                label="Status Kepemilikan Lahan"
                value={formData.land_status}
                onChange={handleChange}
                error={validationErrors.land_status}
              >
                <option value="">Pilih Status Lahan</option>
                <option value="memiliki_lahan_bangunan">
                  Memiliki Lahan & Bangunan
                </option>
                <option value="memiliki_lahan_saja">
                  Memiliki Lahan (Tanpa Bangunan)
                </option>
              </Select>
              <Select
                id="vendor_status"
                label="Kesiapan Vendor Perlengkapan"
                value={formData.vendor_status}
                onChange={handleChange}
                error={validationErrors.vendor_status}
              >
                <option value="">Pilih Status Vendor</option>
                <option value="sudah_ada_vendor">Sudah Ada Vendor</option>
                <option value="belum_ada_vendor">Belum Ada Vendor</option>
              </Select>
              <Input
                id="beneficiary_count"
                label="Target Jumlah Penerima Manfaat"
                type="number"
                value={formData.beneficiary_count}
                onChange={handleChange}
                error={validationErrors.beneficiary_count}
                min="1"
                placeholder="Cth: 300"
              />
            </div>
          </Section>

          {/* --- FIELD BARU DITAMBAHKAN --- */}
          <Section title="Target Pendanaan" icon={<Banknote />}>
            <Input
              id="target_amount"
              label="Jumlah Dana yang Diajukan (Rp)"
              type="number"
              value={formData.target_amount}
              onChange={handleChange}
              error={validationErrors.target_amount}
              min="1000000"
              placeholder="Cth: 150000000"
            />
            <p className="text-xs text-gray-500 -mt-2">
              Masukkan total dana yang Anda butuhkan untuk proyek dapur ini.
            </p>
          </Section>
          {/* --- AKHIR FIELD BARU --- */}
        </div>
      )}

      {/* --- STEP 3: SKEMA KERJASAMA & DOKUMEN --- */}
      {step === 3 && (
        <div className="space-y-6">
          <Section title="Skema Kerjasama & Bagi Hasil" icon={<Handshake />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                id="profit_sharing_type"
                label="Bentuk Bagi Hasil"
                value={formData.profit_sharing_type}
                onChange={handleChange}
                error={validationErrors.profit_sharing_type}
              >
                <option value="per_porsi">Per Porsi Penerima Manfaat</option>
                <option value="persentase">Persentase dari Keuntungan</option>
              </Select>
              <Input
                id="profit_sharing_value"
                label={profitValueLabel}
                type="number"
                value={formData.profit_sharing_value}
                onChange={handleChange}
                error={validationErrors.profit_sharing_value}
                placeholder={profitValuePlaceholder}
                min="1"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                id="payout_frequency"
                label="Jangka Waktu Sharing Profit"
                value={formData.payout_frequency}
                onChange={handleChange}
                error={validationErrors.payout_frequency}
              >
                <option value="bulanan">Setiap Bulan</option>
                <option value="triwulan">Per 3 Bulan</option>
                <option value="semester">Per 6 Bulan</option>
                <option value="tahunan">Per Tahun</option>
              </Select>
              <Select
                id="management_type"
                label="Pengelolaan Dapur"
                value={formData.management_type}
                onChange={handleChange}
                error={validationErrors.management_type}
              >
                <option value="platform">Dikelola oleh Platform</option>
                <option value="mandiri">Dikelola Mandiri</option>
              </Select>
            </div>
            <Textarea
              id="public_description"
              label="Deskripsi Proyek (untuk Investor)"
              value={formData.public_description}
              onChange={handleChange}
              error={validationErrors.public_description}
              placeholder="Jelaskan mengapa proyek dapur Anda layak didanai. Ceritakan potensi dan dampaknya."
              rows={5}
            />
          </Section>

          <Section title="Dokumen Pendukung" icon={<Upload />}>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Unggah Legalitas
              </label>
              <input
                type="file"
                name="legalitas"
                onChange={handleChange}
                className="input-style"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
              />
              <p className="text-xs text-gray-500 mt-1">
                Anda bisa mengunggah lebih dari satu file (KTP, Akta, NIB, dll).
                Maks 5MB per file.
              </p>
              {formData.legalitas.length > 0 && (
                <ul className="mt-2 list-disc pl-5 text-sm text-gray-600">
                  {formData.legalitas.map((file, index) => (
                    <li key={index}>{file.name}</li>
                  ))}
                </ul>
              )}
              {validationErrors.legalitas && (
                <p className="mt-1 text-xs text-red-600">
                  {validationErrors.legalitas}
                </p>
              )}
            </div>
          </Section>

          <Section title="Persetujuan" icon={<CheckCircle />}>
            <input
              type="hidden"
              name="platform_commission_rate"
              value={formData.platform_commission_rate}
            />
            <Checkbox
              id="agree_terms"
              label="Saya menyetujui Syarat & Ketentuan platform GiziNow."
              checked={formData.agree_terms}
              onChange={handleChange}
            >
              {validationErrors.agree_terms && (
                <p className="mt-1 text-xs text-red-600">
                  {validationErrors.agree_terms}
                </p>
              )}
            </Checkbox>
            <Checkbox
              id="agree_commission"
              label={`Saya menyetujui pemotongan komisi platform sebesar ${formData.platform_commission_rate}% dari total dana terkumpul.`}
              checked={formData.agree_commission}
              onChange={handleChange}
            >
              {validationErrors.agree_commission && (
                <p className="mt-1 text-xs text-red-600">
                  {validationErrors.agree_commission}
                </p>
              )}
            </Checkbox>
          </Section>
        </div>
      )}

      {/* --- Tombol Navigasi --- */}
      <div className="flex justify-between items-center pt-5 border-t">
        <button
          type="button"
          onClick={prevStep}
          className={`btn-secondary ${step === 1 ? "invisible" : "visible"}`}
          disabled={loading}
        >
          <ArrowLeft size={16} className="mr-2" />
          Kembali
        </button>

        {step < 3 ? (
          <button
            type="button"
            onClick={nextStep}
            className="btn-primary"
            disabled={loading}
          >
            Lanjutkan
            <ArrowRight size={16} className="ml-2" />
          </button>
        ) : (
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                Kirim Pengajuan
                <Send size={16} className="ml-2" />
              </>
            )}
          </button>
        )}
      </div>
    </form>
  );
}

export default FundingApplicationForm;
