import React, { useState, useEffect, useCallback } from "react";
import apiClient from "@/services/api";
import PageHeader from "@/components/PageHeader.jsx";
import Modal from "@/components/Modal.jsx";
import UserForm from "@/components/UserForm.jsx";
import ConfirmationModal from "@/components/ConfirmationModal.jsx";
import {
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useNotification } from "@/context/NotificationContext.jsx";

// --- Komponen baru untuk Toggle Status ---
const StatusToggle = ({ user, onStatusChange }) => {
  const isActive = user.is_active == 1;
  const Icon = isActive ? ToggleRight : ToggleLeft;
  const color = isActive ? "text-green-500" : "text-gray-400";

  return (
    <button
      onClick={() => onStatusChange(user)}
      className={`flex items-center space-x-1 ${color}`}
      title={isActive ? "Nonaktifkan" : "Aktifkan"}
    >
      <Icon size={24} />
      <span className="text-xs font-semibold">
        {isActive ? "Aktif" : "Nonaktif"}
      </span>
    </button>
  );
};

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);

  // --- State baru untuk mengubah status ---
  const [statusChangeUser, setStatusChangeUser] = useState(null);
  const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);

  const { showNotification } = useNotification();

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/users_get.php");
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError("Gagal memuat data pengguna.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openAddModal = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const openDeleteConfirm = (id) => {
    setDeletingUserId(id);
    setIsConfirmModalOpen(true);
  };

  // --- Fungsi baru untuk membuka konfirmasi ubah status ---
  const handleStatusChangeRequest = (user) => {
    setStatusChangeUser(user);
    setIsStatusConfirmOpen(true);
  };

  const handleSave = async (userData) => {
    setActionLoading(true);
    try {
      const endpoint = userData.id ? "/users_update.php" : "/users_create.php";
      const response = await apiClient.post(endpoint, userData);
      showNotification(response.data.message, "success");
      setIsModalOpen(false);
      await fetchUsers();
    } catch (err) {
      showNotification(
        err.response?.data?.message || "Gagal menyimpan pengguna.",
        "error",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      const response = await apiClient.post("/users_delete.php", {
        id: deletingUserId,
      });
      showNotification(response.data.message, "success");
      setIsConfirmModalOpen(false);
      setDeletingUserId(null);
      await fetchUsers();
    } catch (err) {
      showNotification(
        err.response?.data?.message || "Gagal menghapus pengguna.",
        "error",
      );
    } finally {
      setActionLoading(false);
    }
  };

  // --- Fungsi baru untuk menjalankan perubahan status ---
  const confirmStatusChange = async () => {
    if (!statusChangeUser) return;
    setActionLoading(true);
    try {
      const updatedUser = {
        ...statusChangeUser,
        is_active: statusChangeUser.is_active == 1 ? 0 : 1,
      };
      const response = await apiClient.post("/users_update.php", updatedUser);
      showNotification(response.data.message, "success");
      await fetchUsers();
    } catch (err) {
      showNotification(
        err.response?.data?.message || "Gagal mengubah status.",
        "error",
      );
    } finally {
      setActionLoading(false);
      setIsStatusConfirmOpen(false);
      setStatusChangeUser(null);
    }
  };

  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div>
      <PageHeader
        title="Manajemen Pengguna"
        buttonText="Tambah Pengguna"
        onButtonClick={openAddModal}
      />
      <div className="bg-white p-6 rounded-lg shadow-md">
        {loading ? (
          <p>Memuat data...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3">
                    Nama Lengkap
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Peran
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Email
                  </th>
                  {/* --- Kolom baru: Phone Number --- */}
                  <th scope="col" className="px-6 py-3">
                    PHONE
                  </th>
                  {/* --- Kolom baru: Status --- */}
                  <th scope="col" className="px-6 py-3">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.map((item) => (
                    <tr
                      key={item.id}
                      className="bg-white border-b hover:bg-gray-50"
                    >
                      <th
                        scope="row"
                        className="px-6 py-4 font-medium text-gray-900"
                      >
                        {item.full_name}
                      </th>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {item.role_name}
                        </span>
                      </td>
                      <td className="px-6 py-4">{item.email}</td>
                      <td className="px-6 py-4">{item.phone_number}</td>
                      {/* --- Tampilan Status --- */}
                      <td className="px-6 py-4">
                        <StatusToggle
                          user={item}
                          onStatusChange={handleStatusChangeRequest}
                        />
                      </td>
                      <td className="px-6 py-4 flex justify-end space-x-2">
                        <button
                          title="Edit Pengguna"
                          onClick={() => openEditModal(item)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          title="Hapus Pengguna"
                          onClick={() => openDeleteConfirm(item.id)}
                          className="p-1 text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-4">
                      Tidak ada data pengguna.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? "Edit Pengguna" : "Tambah Pengguna Baru"}
      >
        <UserForm
          user={editingUser}
          onSave={handleSave}
          onCancel={() => setIsModalOpen(false)}
          loading={actionLoading}
        />
      </Modal>

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleDelete}
        title="Konfirmasi Hapus"
        message="Apakah Anda yakin ingin menghapus pengguna ini? Aksi ini tidak dapat dibatalkan."
        loading={actionLoading}
      />

      {/* --- Modal konfirmasi baru untuk ubah status --- */}
      <ConfirmationModal
        isOpen={isStatusConfirmOpen}
        onClose={() => setIsStatusConfirmOpen(false)}
        onConfirm={confirmStatusChange}
        title="Konfirmasi Ubah Status"
        message={`Anda akan mengubah status pengguna "${statusChangeUser?.full_name}" menjadi "${statusChangeUser?.is_active == 1 ? "Nonaktif" : "Aktif"}". Lanjutkan?`}
        loading={actionLoading}
        confirmText="Ya, Ubah"
        confirmColor={
          statusChangeUser?.is_active == 1
            ? "bg-red-600 hover:bg-red-700"
            : "bg-green-600 hover:bg-green-700"
        }
      />
    </div>
  );
}

export default UsersPage;
