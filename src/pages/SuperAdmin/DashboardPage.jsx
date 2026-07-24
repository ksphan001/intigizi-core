import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import apiClient from "@/services/api";
import { Building, Store, Users, UserCheck, MapPin, Clock } from "lucide-react";
import DistributionMap from "@/components/DistributionMap.jsx";

// Halaman Dasbor Baru untuk Super Admin

const StatCard = ({ icon, title, value, link, linkText }) => (
  <div className="bg-white p-6 rounded-xl shadow-md transition-all hover:shadow-lg hover:-translate-y-1 border border-transparent hover:border-intigizi-green-light">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-bold text-gray-500">{title}</p>
        <p className="text-4xl font-bold text-gray-800 mt-2">{value}</p>
      </div>
      <div className="bg-green-50 text-intigizi-green-dark p-3 rounded-full">
        {icon}
      </div>
    </div>
    {link && (
      <Link
        to={link}
        className="text-sm font-bold text-intigizi-green hover:text-intigizi-green-dark hover:underline mt-4 inline-block transition-colors"
      >
        {linkText}
      </Link>
    )}
  </div>
);

function SuperAdminDashboardPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiClient.get(
          "/superadmin_dashboard_summary.php",
        );
        setSummary(response.data);
      } catch (err) {
        setError("Gagal memuat data dasbor.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading)
    return (
      <div className="text-center p-8 text-intigizi-green font-medium animate-pulse">
        Memuat dasbor Super Admin...
      </div>
    );
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="space-y-6 container mx-auto p-4 selection:bg-intigizi-green-light selection:text-intigizi-green-dark">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Dasbor Super Admin</h1>
        <p className="text-gray-500">
          Ringkasan ekosistem portal IntiGizi Dapur MBG.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Building size={24} />}
          title="Total Mitra Aktif"
          value={summary.total_mitra}
        />
        <StatCard
          icon={<Store size={24} />}
          title="Total Vendor Aktif"
          value={summary.total_vendors}
        />
        <StatCard
          icon={<Users size={24} />}
          title="Total Pengguna"
          value={summary.total_users}
        />
        <StatCard
          icon={<UserCheck size={24} />}
          title="Menunggu Persetujuan"
          value={summary.pending_registrations}
          link="/app/admin/pending-registrations"
          linkText="Lihat Pendaftar"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h3 className="font-bold text-gray-700 mb-4 flex items-center">
            <MapPin size={20} className="mr-3 text-intigizi-green" /> Peta
            Sebaran Mitra Nasional
          </h3>
          <div className="h-96 w-full rounded-lg overflow-hidden border border-gray-100">
            <DistributionMap points={summary.kitchen_locations || []} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h3 className="font-bold text-gray-700 mb-4 flex items-center border-l-4 border-intigizi-orange pl-3">
            <Clock size={20} className="mr-3 text-intigizi-orange" /> Pendaftar
            Terbaru
          </h3>
          <div className="space-y-4">
            {summary.recent_registrants.length > 0 ? (
              summary.recent_registrants.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="font-bold text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-500 font-medium">
                      {item.registration_type}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 font-medium">
                    {new Date(item.created_at).toLocaleDateString("id-ID")}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8 italic">
                Tidak ada pendaftar baru.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SuperAdminDashboardPage;
