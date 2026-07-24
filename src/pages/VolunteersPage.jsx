import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/services/api';
import PageHeader from '@/components/PageHeader';
import Modal from '@/components/Modal';
import ConfirmationModal from '@/components/ConfirmationModal';
import VolunteerForm from '@/components/VolunteerForm';
import { Loader2, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';

function VolunteersPage() {
    const [volunteers, setVolunteers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [editingVolunteer, setEditingVolunteer] = useState(null);
    const [deletingVolunteer, setDeletingVolunteer] = useState(null);
    const { showNotification } = useNotification();

    const fetchVolunteers = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/volunteers_manage.php');
            setVolunteers(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            showNotification('Gagal memuat data sukarelawan.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    useEffect(() => {
        fetchVolunteers();
    }, [fetchVolunteers]);

    const openModal = (volunteer = null) => {
        setEditingVolunteer(volunteer);
        setIsModalOpen(true);
    };

    const handleSave = async (data) => {
        setActionLoading(true);
        try {
            const response = await apiClient.post('/volunteers_manage.php', data);
            showNotification(response.data.message, 'success');
            setIsModalOpen(false);
            await fetchVolunteers();
        } catch (err) {
            showNotification(err.response?.data?.message || 'Gagal menyimpan.', 'error');
            throw err; // Re-throw error to keep modal open on failure
        } finally {
            setActionLoading(false);
        }
    };

    const openDeleteConfirm = (volunteer) => {
        setDeletingVolunteer(volunteer);
        setIsConfirmModalOpen(true);
    };

    const handleDelete = async () => {
        if (!deletingVolunteer) return;
        setActionLoading(true);
        try {
            const response = await apiClient.delete(`/volunteers_manage.php?id=${deletingVolunteer.id}`);
            showNotification(response.data.message, 'success');
            await fetchVolunteers();
        } catch (err) {
            showNotification(err.response?.data?.message || 'Gagal menghapus.', 'error');
        } finally {
            setActionLoading(false);
            setIsConfirmModalOpen(false);
            setDeletingVolunteer(null);
        }
    };

    return (
        <div>
            <PageHeader title="Data Sukarelawan & Tenaga Kerja" buttonText="Tambah Data" onButtonClick={() => openModal()} />
            <div className="bg-white p-6 rounded-xl shadow-md">
                {loading ? <div className="text-center p-8"><Loader2 className="animate-spin" /></div> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3">Nama Lengkap</th>
                                    <th className="px-6 py-3">Jenis Pekerjaan</th>
                                    <th className="px-6 py-3">No. Telepon</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {volunteers.map((item) => (
                                    <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                                        <th className="px-6 py-4 font-medium text-gray-900">{item.full_name}</th>
                                        <td className="px-6 py-4">{item.job_type}</td>
                                        <td className="px-6 py-4">{item.phone_number || '-'}</td>
                                        <td className="px-6 py-4">
                                            {item.is_active == 1 ? 
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle size={14} className="mr-1"/>Aktif</span> :
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"><XCircle size={14} className="mr-1"/>Nonaktif</span>
                                            }
                                        </td>
                                        <td className="px-6 py-4 flex justify-end space-x-2">
                                            <button onClick={() => openModal(item)} className="p-1 text-blue-600"><Edit size={16}/></button>
                                            <button onClick={() => openDeleteConfirm(item)} className="p-1 text-red-600"><Trash2 size={16}/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingVolunteer ? 'Edit Data' : 'Tambah Sukarelawan Baru'}>
                <VolunteerForm volunteer={editingVolunteer} onSave={handleSave} onCancel={() => setIsModalOpen(false)} loading={actionLoading} />
            </Modal>
            <ConfirmationModal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} onConfirm={handleDelete} title="Konfirmasi Hapus" message={`Anda yakin ingin menghapus data "${deletingVolunteer?.full_name}"?`} loading={actionLoading} />
        </div>
    );
}

export default VolunteersPage;
