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

// Komponen Toggle Status yang menerima data dan fungsi dari induknya
const StatusToggle = ({ org, onStatusChange }) => {
  // PERBAIKAN: Cek secara eksplisit dengan '== 1' untuk menangani string "0" dari API
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

function OrganizationsPage() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  const [selectedOrg, setSelectedOrg] = useState(null);
  const [viewingOrgLocation, setViewingOrgLocation] = useState(null);

  const [actionLoading, setActionLoading] = useState(false);
  const { showNotification } = useNotification();

  const fetchOrganizations = useCallback(async () => {
    try {
      // Jangan set loading true di sini agar tidak ada kedipan saat refresh
      const response = await apiClient.get("/superadmin_get_organizations.php");
      setOrganizations(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Gagal memuat data organisasi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchOrganizations();
  }, [fetchOrganizations]);

  const handleStatusChangeRequest = (org) => {
    setSelectedOrg(org);
    setIsConfirmModalOpen(true);
  };

  const confirmStatusChange = async () => {
    if (!selectedOrg) return;

    setActionLoading(true);
    setIsConfirmModalOpen(false);

    try {
      // PERBAIKAN: Cek secara eksplisit dengan '== 1'
      const newStatus = selectedOrg.is_active == 1 ? 0 : 1;
      const response = await apiClient.post(
        "/superadmin_update_organization_status.php",
        {
          organization_id: selectedOrg.id,
          is_active: newStatus,
        },
      );
      showNotification(response.data.message || "Status berhasil diubah");

      // PERBAIKAN: Panggil fetchOrganizations untuk sinkronisasi data setelah berhasil
      await fetchOrganizations();
    } catch (err) {
      showNotification(
        err.response?.data?.message || "Gagal mengubah status organisasi.",
        "error",
      );
    } finally {
      setActionLoading(false);
      setSelectedOrg(null);
    }
  };

  const openMapModal = (org) => {
    setViewingOrgLocation(org);
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
  }, [searchQuery]);

  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div>
      <PageHeader title="Manajemen Organisasi" />
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="mb-4 relative">
          <input
            type="text"
            placeholder="Cari nama organisasi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-style w-full pl-10"
          />
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
        </div>

        {loading ? (
          <div className="text-center p-8">Memuat data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3">
                    Nama Organisasi
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Nama Direktur
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
                      <td className="px-6 py-4">
                        {item.director_name || (
                          <span className="text-gray-400 italic">N/A</span>
                        )}
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
                          className="p-1 text-gray-600 hover:text-gray-800"
                          title="Lihat Detail"
                        >
                          <Eye size={16} />
                        </Link>
                        {item.latitude && item.longitude && (
                          <button
                            onClick={() => openMapModal(item)}
                            className="p-1 text-intigizi-green hover:opacity-80"
                            title="Lihat Lokasi Dapur"
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
                      {searchQuery
                        ? "Organisasi tidak ditemukan."
                        : "Belum ada organisasi yang terdaftar."}
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

export default OrganizationsPage;
