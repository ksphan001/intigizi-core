import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import apiClient from "@/services/api";
import { API_BASE_URL } from "@/config";
// --- PERBAIKAN: Menambahkan 'Clock' ke daftar impor ---
import {
  ArrowLeft,
  Loader2,
  User,
  Building,
  Phone,
  CheckCircle,
  XCircle,
  ShoppingCart,
  Image as ImageIcon,
  Users,
  MapPin,
  ClipboardList,
  Wallet,
  BarChart2,
  CookingPot,
  Clock,
} from "lucide-react";
import DistributionMap from "@/components/DistributionMap.jsx";

// Komponen Kartu Statistik
const StatCard = ({ icon, title, value, valueClass = "" }) => (
  <div className="bg-white p-5 rounded-xl shadow-md flex items-center space-x-4 overflow-hidden">
    <div className="bg-blue-50 p-3 rounded-full flex-shrink-0">{icon}</div>
    <div className="min-w-0 flex-1">
      <p className="text-sm text-gray-500 truncate">{title}</p>
      <p
        className={`text-2xl font-bold text-gray-800 break-words ${valueClass}`}
      >
        {value}
      </p>
    </div>
  </div>
);

// Komponen Section Wrapper untuk konten di dalam tab
const InfoSection = ({ title, icon, children }) => (
  <div className="bg-white p-6 rounded-lg shadow-md mt-6">
    <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-800">
      {React.cloneElement(icon, {
        size: 20,
        className: "mr-3 text-intigizi-green",
      })}
      {title}
    </h2>
    <div className="overflow-x-auto">{children}</div>
  </div>
);

function OrganizationDetailPage() {
  const { orgId } = useParams();
  const location = useLocation();
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("summary");

  const backPath = location.state?.from || "/app/admin/dashboard";

  const fetchOrganizationDetails = useCallback(async () => {
    // Pastikan orgId ada sebelum memanggil
    if (!orgId) {
      setLoading(false);
      setError("ID Organisasi tidak ditemukan di URL.");
      return;
    }
    try {
      setLoading(true);
      const response = await apiClient.get(
        `/superadmin_get_organization_details.php?id=${orgId}`,
      );
      setOrganization(response.data);
    } catch (err) {
      setError("Gagal memuat detail organisasi.");
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    // Hanya panggil jika orgId sudah valid
    if (orgId) {
      fetchOrganizationDetails();
    }
  }, [orgId, fetchOrganizationDetails]); // Pastikan orgId ada di dependencies

  const formatCurrency = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value || 0);
  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  const formatNumber = (num) => (num || 0).toLocaleString("id-ID");

  if (loading)
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin mr-2" /> Memuat detail...
      </div>
    );
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  // Pastikan organisasi dan detail ada sebelum lanjut render
  if (!organization || !organization.details) {
    // Tampilkan error jika data tidak ada setelah selesai loading (misal: ID tidak ditemukan)
    if (!loading && !error) {
      setError("Data organisasi tidak ditemukan.");
    }
    return <div className="text-red-500 p-4">{error}</div>;
  }

  const { details, users, ...restData } = organization;

  // Tentukan nama utama dan sub-nama
  const isVendor = details.registration_type === "Vendor";
  const mainName = isVendor
    ? details.name
    : details.kitchen_name || details.name;
  const subName = isVendor
    ? null
    : details.kitchen_name && details.kitchen_name !== details.name
      ? details.name
      : null;

  const stats = [
    {
      title: "Status Akun",
      value: details.is_active == 1 ? "Aktif" : "Nonaktif",
      icon: details.is_active == 1 ? <CheckCircle /> : <XCircle />,
      valueClass: details.is_active == 1 ? "text-green-600" : "text-red-600",
    },
    {
      title: "Tipe Registrasi",
      value: details.registration_type,
      icon: <Building />,
    },
    {
      title: "Total Pengguna",
      value: `${users?.length || 0} Pengguna`,
      icon: <Users />,
    },
    {
      title: "Bergabung Pada",
      value: new Date(details.created_at).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      icon: <Clock />,
    },
  ];

  if (!isVendor) {
    stats.push(
      {
        title: "Total Produksi",
        value: `${formatNumber(restData.total_production)} Porsi`,
        icon: <BarChart2 />,
      },
      {
        title: "Total Realisasi Biaya",
        value: formatCurrency(restData.total_spending),
        icon: <Wallet />,
      },
    );
  }

  const TabButton = ({ tabName, label, icon }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        activeTab === tabName
          ? "bg-intigizi-green text-white shadow"
          : "text-gray-600 hover:bg-gray-200"
      }`}
    >
      {React.cloneElement(icon, { size: 16, className: "mr-2" })}
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <Link
        to={backPath}
        className="flex items-center text-gray-500 hover:text-gray-800"
      >
        <ArrowLeft size={20} className="mr-2" />
        Kembali ke Daftar
      </Link>

      {/* Header Detail Organisasi */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{mainName}</h1>
            {subName && (
              <p className="text-lg text-gray-500 flex items-center mt-1">
                <Building size={16} className="mr-2 flex-shrink-0" />
                Dikelola oleh: {subName}
              </p>
            )}
          </div>
          <div className="mt-4 sm:mt-0">
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${details.is_active == 1 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
            >
              {details.is_active == 1 ? "Aktif" : "Nonaktif"}
            </span>
          </div>
        </div>
      </div>

      {/* Grid Statistik */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Navigasi Tab */}
      <div className="bg-white p-2 rounded-lg shadow-md flex space-x-2">
        <TabButton tabName="summary" label="Ringkasan" icon={<BarChart2 />} />
        <TabButton tabName="users" label="Pengguna Akun" icon={<Users />} />
        {details.registration_type !== "Vendor" && (
          <>
            <TabButton
              tabName="production"
              label="Produksi"
              icon={<CookingPot />}
            />
            <TabButton
              tabName="points"
              label="Titik Distribusi"
              icon={<MapPin />}
            />
            <TabButton
              tabName="beneficiaries"
              label="Penerima Manfaat"
              icon={<Users />}
            />
          </>
        )}
        {details.registration_type === "Vendor" && (
          <>
            <TabButton
              tabName="products"
              label="Produk"
              icon={<ShoppingCart />}
            />
            <TabButton
              tabName="portfolio"
              label="Portofolio"
              icon={<ImageIcon />}
            />
          </>
        )}
      </div>

      {/* Konten Tab */}
      <div>
        {activeTab === "summary" && (
          <div className="space-y-6">
            {details.registration_type !== "Vendor" ? (
              <>
                <div className="h-96 w-full rounded-lg overflow-hidden shadow-md">
                  <DistributionMap
                    points={restData.distribution_points || []}
                  />
                </div>
                <InfoSection
                  title="Aktivitas Distribusi Terakhir"
                  icon={<ClipboardList />}
                >
                  {restData.recent_reports &&
                  restData.recent_reports.length > 0 ? (
                    <table className="w-full text-sm">
                      <tbody>
                        {restData.recent_reports.map((report) => (
                          <tr
                            key={report.id}
                            className="border-b last:border-b-0"
                          >
                            <td className="py-2 px-1 font-semibold">
                              {formatDate(report.distribution_date)}
                            </td>
                            <td>{report.distribution_point_name}</td>
                            <td className="text-right">
                              {report.quantity_sent} porsi
                            </td>
                            <td className="text-right">
                              <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                {report.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-center text-gray-500 py-4">
                      Belum ada aktivitas.
                    </p>
                  )}
                </InfoSection>
              </>
            ) : (
              <p className="text-center text-gray-500 py-8 bg-white rounded-lg shadow-md">
                Ringkasan detail untuk Vendor dapat dilihat di tab Produk dan
                Portofolio.
              </p>
            )}
          </div>
        )}

        {activeTab === "users" && (
          <InfoSection title="Daftar Pengguna Akun" icon={<User />}>
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-2">Nama</th>
                  <th className="px-4 py-2">Username</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Peran</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b">
                    <td className="px-4 py-2 font-medium">{user.full_name}</td>
                    <td className="px-4 py-2">{user.username}</td>
                    <td className="px-4 py-2">{user.email}</td>
                    <td className="px-4 py-2">
                      <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {user.role_name}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </InfoSection>
        )}

        {activeTab === "production" &&
          details.registration_type !== "Vendor" && (
            <InfoSection title="Log Produksi" icon={<CookingPot />}>
              {restData.recent_production &&
              restData.recent_production.length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th className="px-4 py-2">Tanggal</th>
                      <th className="px-4 py-2">Proposal</th>
                      <th className="px-4 py-2 text-right">Jumlah Porsi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {restData.recent_production.map((p) => (
                      <tr key={p.id} className="border-b">
                        <td className="px-4 py-2 font-medium">
                          {formatDate(p.production_date)}
                        </td>
                        <td className="px-4 py-2">{p.proposal_code}</td>
                        <td className="px-4 py-2 text-right font-semibold">
                          {formatNumber(p.target_recipients)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-center text-gray-500 py-4">
                  Belum ada data produksi yang tercatat.
                </p>
              )}
            </InfoSection>
          )}

        {activeTab === "points" && details.registration_type !== "Vendor" && (
          <InfoSection title="Daftar Titik Distribusi" icon={<MapPin />}>
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-2">Tipe</th>
                  <th className="px-4 py-2">Nama Lokasi</th>
                  <th className="px-4 py-2">Alamat</th>
                </tr>
              </thead>
              <tbody>
                {restData.distribution_points.map((p) => (
                  <tr key={p.id} className="border-b">
                    <td className="px-4 py-2 font-medium">
                      {p.is_main_kitchen ? "Dapur Utama" : "Titik Sebar"}
                    </td>
                    <td className="px-4 py-2">{p.name}</td>
                    <td className="px-4 py-2">{p.address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </InfoSection>
        )}

        {activeTab === "beneficiaries" &&
          details.registration_type !== "Vendor" && (
            <InfoSection title="Daftar Penerima Manfaat" icon={<Users />}>
              {restData.beneficiaries && restData.beneficiaries.length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th className="px-4 py-2">Nama</th>
                      <th className="px-4 py-2">NIK</th>
                      <th className="px-4 py-2">Titik Distribusi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {restData.beneficiaries.map((b) => (
                      <tr key={b.id} className="border-b">
                        <td className="px-4 py-2 font-medium">{b.full_name}</td>
                        <td className="px-4 py-2">{b.nik_nisn}</td>
                        <td className="px-4 py-2">
                          {b.distribution_point_name}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-center text-gray-500 py-4">
                  Belum ada data.
                </p>
              )}
            </InfoSection>
          )}

        {activeTab === "products" && details.registration_type === "Vendor" && (
          <InfoSection title="Daftar Produk" icon={<ShoppingCart />}>
            {restData.products && restData.products.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-4 py-2">Nama Produk</th>
                    <th className="px-4 py-2">Harga</th>
                    <th className="px-4 py-2">Deskripsi</th>
                  </tr>
                </thead>
                <tbody>
                  {restData.products.map((p) => (
                    <tr key={p.id} className="border-b">
                      <td className="px-4 py-2 font-medium">
                        {p.product_name}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {formatCurrency(p.price_per_unit)} / {p.unit_symbol}
                      </td>
                      <td className="px-4 py-2">{p.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-center text-gray-500 py-4">
                Vendor ini belum menambahkan produk.
              </p>
            )}
          </InfoSection>
        )}

        {activeTab === "portfolio" &&
          details.registration_type === "Vendor" && (
            <InfoSection title="Portofolio" icon={<ImageIcon />}>
              {restData.portfolio && restData.portfolio.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {restData.portfolio.map((item) => (
                    <div
                      key={item.id}
                      className="border rounded-lg overflow-hidden"
                    >
                      <img
                        src={`${API_BASE_URL.replace("/app", "")}${item.image_path}`}
                        alt={item.title}
                        className="w-full h-40 object-cover"
                      />
                      <div className="p-3">
                        <h4 className="font-bold text-sm">{item.title}</h4>
                        <p className="text-xs text-gray-600">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">
                  Vendor ini belum menambahkan portofolio.
                </p>
              )}
            </InfoSection>
          )}
      </div>
    </div>
  );
}

export default OrganizationDetailPage;
