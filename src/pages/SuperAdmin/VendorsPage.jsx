import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import apiClient from "@/services/api";
import PageHeader from "@/components/PageHeader.jsx";
import Pagination from "@/components/Pagination.jsx";
import ConfirmationModal from "@/components/ConfirmationModal.jsx";
import MapDisplayModal from "@/components/MapDisplayModal.jsx";
import { Search, ToggleLeft, ToggleRight, Eye, MapPin } from "lucide-react";
import { useNotification } from "@/context/NotificationContext.jsx";

const ITEMS_PER_PAGE = 10;

const StatusToggle = ({ org, onStatusChange }) => {
  const isActive = org.is_active == 1;
  const Icon = isActive ? ToggleRight : ToggleLeft;
  const color = isActive ? "text-green-500" : "text-gray-400";

  const handleClick = () => {
    onStatusChange(org);
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center space-x-1 ${color}`}
    >
      <Icon size={24} />
      <span className="text-xs font-semibold">
        {isActive ? "Aktif" : "Nonaktif"}
      </span>
    </button>
  );
};

function VendorsPage() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [regions, setRegions] = useState({ provinces: [], regencies: {} });

  // --- PERBAIKAN DI SINI: Nama state filter diubah agar sesuai dengan backend ---
  const [filters, setFilters] = useState({ province: "", regency: "" });

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  const [selectedOrg, setSelectedOrg] = useState(null);
  const [viewingOrgLocation, setViewingOrgLocation] = useState(null);

  const [actionLoading, setActionLoading] = useState(false);
  const { showNotification } = useNotification();

  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const response = await apiClient.get("/public_get_regions.php");
        setRegions(response.data);
      } catch (error) {
        console.error("Gagal memuat data wilayah", error);
      }
    };
    fetchRegions();
  }, []);

  const fetchOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      // --- PERBAIKAN DI SINI: Parameter 'type' diganti menjadi 'registration_type' ---
      // dan filter dikirim dengan benar
      const params = {
        type: "Vendor", // Selalu filter untuk Vendor di halaman ini
        province: filters.province,
        regency: filters.regency,
      };
      const response = await apiClient.get(
        "/superadmin_get_organizations.php",
        { params },
      );
      setOrganizations(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Gagal memuat data vendor.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    if (name === "province") {
      newFilters.regency = "";
    }
    setFilters(newFilters);
  };

  const handleStatusChangeRequest = (org) => {
    setSelectedOrg(org);
    setIsConfirmModalOpen(true);
  };

  const confirmStatusChange = async () => {
    if (!selectedOrg) return;

    setActionLoading(true);
    try {
      const newStatus = selectedOrg.is_active == 1 ? 0 : 1;
      const response = await apiClient.post(
        "/superadmin_update_organization_status.php",
        {
          organization_id: selectedOrg.id,
          is_active: newStatus,
        },
      );
      showNotification(response.data.message || "Status berhasil diubah");
      await fetchOrganizations();
    } catch (err) {
      showNotification(
        err.response?.data?.message || "Gagal mengubah status organisasi.",
        "error",
      );
    } finally {
      setActionLoading(false);
      setIsConfirmModalOpen(false);
      setSelectedOrg(null);
    }
  };

  const openMapModal = (org) => {
    // Memastikan data yang dikirim ke map modal memiliki nama yang benar
    setViewingOrgLocation({
      name: org.name,
      address: org.vendor_address,
      latitude: org.latitude,
      longitude: org.longitude,
    });
    setIsMapModalOpen(true);
  };

  const filteredOrgs = useMemo(() => {
    if (!searchQuery) return organizations;
    return organizations.filter((org) =>
      org.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [organizations, searchQuery]);

  const totalPages = Math.ceil(filteredOrgs.length / ITEMS_PER_PAGE);
  const paginatedOrgs = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrgs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, filteredOrgs]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters]);

  const availableRegencies = regions.regencies[filters.province] || [];

  if (error && organizations.length === 0)
    return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div>
      <PageHeader title="Manajemen Vendor" />
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Cari nama vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-style w-full pl-10"
            />
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
          </div>
          <select
            name="province"
            value={filters.province}
            onChange={handleFilterChange}
            className="input-style bg-white"
          >
            <option value="">Semua Provinsi</option>
            {regions.provinces.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            name="regency"
            value={filters.regency}
            onChange={handleFilterChange}
            className="input-style bg-white"
            disabled={!filters.province}
          >
            <option value="">Semua Kabupaten/Kota</option>
            {availableRegencies.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center p-8">Memuat data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3">
                    Nama Vendor
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Lokasi
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Kontak PIC
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrgs.length > 0 ? (
                  paginatedOrgs.map((item) => (
                    <tr
                      key={item.id}
                      className="bg-white border-b hover:bg-gray-50"
                    >
                      <th
                        scope="row"
                        className="px-6 py-4 font-medium text-gray-900"
                      >
                        {item.name}
                      </th>
                      {/* --- PERBAIKAN TAMPILAN LOKASI --- */}
                      <td className="px-6 py-4">
                        {item.regency_name || ""}, {item.province_name || ""}
                      </td>
                      <td className="px-6 py-4">
                        {item.pic_whatsapp || (
                          <span className="text-gray-400 italic">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <StatusToggle
                          org={item}
                          onStatusChange={handleStatusChangeRequest}
                        />
                      </td>
                      <td className="px-6 py-4 text-right flex items-center justify-end space-x-2">
                        <Link
                          to={`/app/admin/organizations/${item.id}`}
                          state={{ from: "/app/admin/vendors" }}
                          className="p-1 text-gray-600 hover:text-gray-800"
                          title="Lihat Detail"
                        >
                          <Eye size={16} />
                        </Link>
                        {item.latitude && item.longitude && (
                          <button
                            onClick={() => openMapModal(item)}
                            className="p-1 text-intigizi-green hover:opacity-80"
                            title="Lihat Lokasi Vendor"
                          >
                            <MapPin size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-4">
                      Tidak ada data vendor yang cocok dengan filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmStatusChange}
        title={`Konfirmasi Ubah Status`}
        message={`Apakah Anda yakin ingin mengubah status organisasi "${selectedOrg?.name}" menjadi "${selectedOrg?.is_active == 1 ? "Nonaktif" : "Aktif"}"?`}
        loading={actionLoading}
        confirmText="Ya, Ubah Status"
        confirmColor={
          selectedOrg?.is_active == 1
            ? "bg-red-600 hover:bg-red-700"
            : "bg-green-600 hover:bg-green-700"
        }
      />

      <MapDisplayModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        point={viewingOrgLocation}
      />
    </div>
  );
}

export default VendorsPage;
