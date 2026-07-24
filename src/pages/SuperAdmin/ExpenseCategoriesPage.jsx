import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/services/api';
import PageHeader from '@/components/PageHeader';
import Modal from '@/components/Modal';
import ConfirmationModal from '@/components/ConfirmationModal';
import { Loader2, Edit, Trash2 } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';

// Form untuk menambah/mengedit kategori
const CategoryForm = ({ category, onSave, onCancel, loading }) => {
  const [name, setName] = useState('');
  useEffect(() => { setName(category ? category.name : ''); }, [category]);
  const handleSubmit = (e) => { e.preventDefault(); onSave({ id: category?.id, name }); };
  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6"><label className="block text-sm font-medium text-gray-700">Nama Kategori</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-style" required/></div>
      <div className="flex justify-end space-x-3"><button type="button" onClick={onCancel} className="btn-secondary">Batal</button><button type="submit" disabled={loading} className="btn-primary">{loading ? 'Menyimpan...' : 'Simpan'}</button></div>
    </form>
  );
};

function ExpenseCategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [deletingCategory, setDeletingCategory] = useState(null);
    const { showNotification } = useNotification();

    const fetchCategories = useCallback(async () => {
        try { setLoading(true); const response = await apiClient.get('/financials_manage_categories.php'); setCategories(response.data); } 
        catch (err) { showNotification('Gagal memuat kategori.', 'error'); } 
        finally { setLoading(false); }
    }, [showNotification]);

    useEffect(() => { fetchCategories(); }, [fetchCategories]);

    const openAddModal = () => { setEditingCategory(null); setIsModalOpen(true); };
    const openEditModal = (cat) => { setEditingCategory(cat); setIsModalOpen(true); };
    const openDeleteConfirm = (cat) => { setDeletingCategory(cat); setIsConfirmModalOpen(true); };

    const handleSave = async (data) => {
        setActionLoading(true);
        try {
            const response = await apiClient.post('/financials_manage_categories.php', data);
            showNotification(response.data.message, 'success');
            setIsModalOpen(false);
            await fetchCategories();
        } catch (err) { showNotification(err.response?.data?.message || 'Gagal menyimpan.', 'error');
        } finally { setActionLoading(false); }
    };

    const handleDelete = async () => {
        if (!deletingCategory) return;
        setActionLoading(true);
        try {
            const response = await apiClient.delete(`/financials_manage_categories.php?id=${deletingCategory.id}`);
            showNotification(response.data.message, 'success');
            setIsConfirmModalOpen(false);
            await fetchCategories();
        } catch (err) { showNotification(err.response?.data?.message || 'Gagal menghapus.', 'error');
        } finally { setActionLoading(false); setDeletingCategory(null); }
    };

    return (
        <div>
            <PageHeader title="Kategori Biaya Operasional" buttonText="Tambah Kategori" onButtonClick={openAddModal} />
            <div className="bg-white p-6 rounded-xl shadow-md">
                {loading ? <div className="text-center p-8"><Loader2 className="animate-spin"/></div> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50"><tr><th className="px-6 py-3">Nama Kategori</th><th className="px-6 py-3 text-right">Aksi</th></tr></thead>
                            <tbody>
                                {categories.map((item) => (
                                    <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                                        <th className="px-6 py-4 font-medium text-gray-900">{item.name}</th>
                                        <td className="px-6 py-4 flex justify-end space-x-2"><button onClick={() => openEditModal(item)} className="p-1 text-blue-600"><Edit size={16}/></button><button onClick={() => openDeleteConfirm(item)} className="p-1 text-red-600"><Trash2 size={16}/></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCategory ? 'Edit Kategori' : 'Tambah Kategori'}><CategoryForm category={editingCategory} onSave={handleSave} onCancel={() => setIsModalOpen(false)} loading={actionLoading}/></Modal>
            <ConfirmationModal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} onConfirm={handleDelete} title="Konfirmasi Hapus" message={`Anda yakin ingin menghapus kategori "${deletingCategory?.name}"?`} loading={actionLoading}/>
        </div>
    );
}

export default ExpenseCategoriesPage;
