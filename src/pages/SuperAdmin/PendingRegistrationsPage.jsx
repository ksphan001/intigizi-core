import React, { useState, useEffect, useCallback } from "react";
import apiClient from "@/services/api";
import PageHeader from "@/components/PageHeader.jsx";
import ConfirmationModal from "@/components/ConfirmationModal.jsx";
import Modal from "@/components/Modal.jsx";
import MapDisplayModal from "@/components/MapDisplayModal.jsx";
import { Loader2, CheckCircle, Eye, MapPin } from "lucide-react";
import { useNotification } from "@/context/NotificationContext.jsx";

/**
 * Komponen Modal untuk menampilkan detail pendaftar.
 * PENJELASAN: Tata letak komponen ini dirombak total menggunakan grid yang lebih baik
 * dan dibagi menjadi beberapa section untuk keterbacaan yang lebih baik.
 */
const RegistrantDetailModal = ({
  registrant,
  detailLoading,
  onClose,
  onApprove,
  actionLoading,
  onViewMap,
}) => {
  if (detailLoading) {
    return (
      <Modal isOpen={true} onClose={onClose} title="Memuat Detail...">
        <div className="flex justify-center items-center h-48">
          <Loader2 className="animate-spin text-intigizi-green" size={32} />
        </div>
      </Modal>
    );
  }

  if (!registrant) return null;

  const DetailItem = ({ label, value }) => (
    <div>
      <p className="text-xs text-gray-500 uppercase font-semibold">{label}</p>
      <p className="font-medium text-gray-800 break-words">{value || "-"}</p>
    </div>
  );

  const DetailItemFull = ({ label, value }) => (
    <div className="md:col-span-2">
      <p className="text-xs text-gray-500 uppercase font-semibold">{label}</p>
      <p className="font-medium text-gray-800 break-words">{value || "-"}</p>
    </div>
  );

  const Section = ({ title, children }) => (
    <div className="border-t pt-4 mt-4">
      <h4 className="text-base font-bold text-intigizi-green-dark mb-3">
        {title}
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </div>
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Detail Pendaftar: ${registrant.organization_name}`}
      size="2xl"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <DetailItem
            label="Tipe Pendaftaran"
            value={registrant.registration_type}
          />
          <DetailItem
            label="Nama Usaha/Organisasi"
            value={registrant.organization_name}
          />
          {registrant.registration_type === "Vendor" && (
            <DetailItem
              label="Kategori"
              value={registrant.vendor_category_name}
            />
          )}
          <DetailItem
            label="Anggota HIPMI"
            value={registrant.is_hipmi_member}
          />
          <DetailItem label="Nama Pimpinan" value={registrant.director_name} />
        </div>

        <Section title="Informasi Penanggung Jawab (PIC)">
          <DetailItem label="Nama PIC" value={registrant.pic_name} />
          <DetailItem label="Username" value={registrant.username} />
          <DetailItem label="Email" value={registrant.pic_email} />
          <DetailItem label="No. WhatsApp" value={registrant.pic_whatsapp} />
        </Section>

        <Section title="Informasi Lokasi">
          <DetailItem label="Provinsi" value={registrant.province_name} />
          <DetailItem label="Kabupaten/Kota" value={registrant.regency_name} />
          {/* --- PERBAIKAN DI SINI: Menggunakan `registrant.address` --- */}
          <DetailItemFull label="Alamat Lengkap" value={registrant.address} />
          {registrant.latitude && registrant.longitude && (
            <div className="mt-2">
              <button
                onClick={() => onViewMap(registrant)}
                className="btn-secondary text-sm flex items-center"
              >
                <MapPin size={16} className="mr-2" /> Lihat Lokasi di Peta
              </button>
            </div>
          )}
        </Section>

        <div className="flex justify-end pt-6 mt-4 border-t">
          <button
            onClick={() => onApprove(registrant)}
            disabled={actionLoading}
            className="btn-primary flex items-center"
          >
            {actionLoading ? (
              <Loader2 className="animate-spin mr-2" />
            ) : (
              <CheckCircle size={16} className="mr-2" />
            )}
            Setujui Pendaftaran Ini
          </button>
        </div>
      </div>
    </Modal>
  );
};

function PendingRegistrationsPage() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  const [selectedRegistrant, setSelectedRegistrant] = useState(null);
  const { showNotification } = useNotification();

  const fetchPending = useCallback(async () => {
    try {
      // Jangan set loading true di sini agar tidak ada kedipan saat refresh
      const response = await apiClient.get(
        "/superadmin_get_pending_registrations.php",
      );
      setPending(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError("Gagal memuat daftar pendaftar.");
      showNotification("Gagal memuat daftar pendaftar.", "error");
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    setLoading(true); // Hanya set loading true saat komponen pertama kali dimuat
    fetchPending();
  }, [fetchPending]);

  const handleViewDetails = useCallback(
    async (registrant) => {
      if (!registrant || !registrant.registrant_id) {
        showNotification(
          "Gagal membuka detail: ID Pendaftar tidak ditemukan.",
          "error",
        );
        return;
      }
      setIsDetailModalOpen(true);
      setDetailLoading(true);
      try {
        const response = await apiClient.get(
          `/superadmin_get_registrant_details.php?id=${registrant.registrant_id}`,
        );
        setSelectedRegistrant(response.data);
      } catch (err) {
        showNotification("Gagal mengambil detail pendaftar.", "error");
        setIsDetailModalOpen(false);
      } finally {
        setDetailLoading(false);
      }
    },
    [showNotification],
  );

  const handleApproveRequest = (registrant) => {
    setSelectedRegistrant(registrant);
    setIsConfirmModalOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedRegistrant) return;
    const idToApprove =
      selectedRegistrant.registrant_id || selectedRegistrant.id;

    if (!idToApprove) {
      showNotification("Gagal menyetujui: ID pendaftar tidak valid.", "error");
      return;
    }

    setActionLoading(true);
    try {
      const response = await apiClient.post(
        "/superadmin_approve_registration.php",
        { registrant_id: idToApprove },
      );
      showNotification(response.data.message, "success");
      setIsConfirmModalOpen(false);
      setIsDetailModalOpen(false);
      await fetchPending();
    } catch (err) {
      showNotification(
        err.response?.data?.message || "Gagal menyetujui pendaftar.",
        "error",
      );
    } finally {
      setActionLoading(false);
      setSelectedRegistrant(null);
    }
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedRegistrant(null);
  };

  const handleViewMap = (registrant) => {
    setSelectedRegistrant(registrant);
    setIsMapModalOpen(true);
  };

  if (error && pending.length === 0)
    return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div>
      <PageHeader title="Persetujuan Pendaftar" />
      <div className="bg-white p-6 rounded-xl shadow-md">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3">
                    Nama Organisasi/Vendor
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Tipe
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Nama PIC
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Tanggal Daftar
                  </th>
                  <th scope="col" className="px-6 py-3 text-right">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {pending.length > 0 ? (
                  pending.map((item) => (
                    <tr
                      key={item.registrant_id}
                      className="bg-white border-b hover:bg-gray-50"
                    >
                      <th
                        scope="row"
                        className="px-6 py-4 font-medium text-gray-900"
                      >
                        {item.organization_name}
                      </th>
                      <td className="px-6 py-4">{item.registration_type}</td>
                      <td className="px-6 py-4">{item.pic_name}</td>
                      <td className="px-6 py-4">
                        {new Date(item.created_at).toLocaleDateString("id-ID")}
                      </td>
                      <td className="px-6 py-4 flex justify-end space-x-2">
                        <button
                          onClick={() => handleViewDetails(item)}
                          className="p-1 text-gray-600 hover:text-gray-800"
                          title="Lihat Detail"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleApproveRequest(item)}
                          className="p-1 text-green-600 hover:text-green-800"
                          title="Setujui"
                        >
                          <CheckCircle size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-gray-500">
                      Tidak ada pendaftar baru yang menunggu persetujuan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isDetailModalOpen && (
        <RegistrantDetailModal
          registrant={selectedRegistrant}
          detailLoading={detailLoading}
          onClose={closeDetailModal}
          onApprove={handleApproveRequest}
          actionLoading={actionLoading}
          onViewMap={handleViewMap}
        />
      )}

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleApprove}
        title="Konfirmasi Persetujuan"
        message={`Apakah Anda yakin ingin menyetujui pendaftaran untuk "${selectedRegistrant?.organization_name}"?`}
        loading={actionLoading}
        confirmText="Ya, Setujui"
        confirmColor="bg-intigizi-green hover:bg-intigizi-green-dark"
      />

      <MapDisplayModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        point={{
          name: selectedRegistrant?.organization_name,
          // --- PERBAIKAN DI SINI: Menggunakan `address` dari data yang baru ---
          address: selectedRegistrant?.address,
          latitude: selectedRegistrant?.latitude,
          longitude: selectedRegistrant?.longitude,
        }}
      />
    </div>
  );
}

export default PendingRegistrationsPage;
