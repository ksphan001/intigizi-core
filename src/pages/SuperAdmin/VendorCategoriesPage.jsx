import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/services/api';
import PageHeader from '@/components/PageHeader.jsx';
import Modal from '@/components/Modal.jsx';
import ConfirmationModal from '@/components/ConfirmationModal.jsx';
import { Loader2, Edit, Trash2 } from 'lucide-react';

// Form sederhana untuk menambah/mengedit kategori
const CategoryForm = ({ category, onSave, onCancel, loading }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    setName(category ? category.name : '');
  }, [category]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ id: category?.id, name });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6">
        <label htmlFor="category_name" className="block text-sm font-medium text-gray-700">Nama Kategori</label>
        <input
          type="text"
          id="category_name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-style"
          required
        />
      </div>
      <div className="flex justify-end space-x-3">
        <button type="button" onClick={onCancel} className="btn-secondary">Batal</button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>
    </form>
  );
};


function VendorCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/superadmin_manage_vendor_categories.php');
      setCategories(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError('Gagal memuat data kategori.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openAddModal = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const openDeleteConfirm = (id) => {
    setDeletingCategoryId(id);
    setIsConfirmModalOpen(true);
  };

  const handleSave = async (categoryData) => {
    setActionLoading(true);
    try {
      await apiClient.post('/superadmin_manage_vendor_categories.php', categoryData);
      setIsModalOpen(false);
      await fetchCategories();
    } catch (err) {
      // Menampilkan error di form jika ada
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await apiClient.post('/superadmin_manage_vendor_categories.php', { delete_id: deletingCategoryId });
      setIsConfirmModalOpen(false);
      setDeletingCategoryId(null);
      await fetchCategories();
    } finally {
      setActionLoading(false);
    }
  };

  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div>
      <PageHeader
        title="Manajemen Kategori Vendor"
        buttonText="Tambah Kategori"
        onButtonClick={openAddModal}
      />
      <div className="bg-white p-6 rounded-xl shadow-md">
        {loading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3">Nama Kategori</th>
                  <th scope="col" className="px-6 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {categories.length > 0 ? categories.map((item) => (
                  <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                    <th scope="row" className="px-6 py-4 font-medium text-gray-900">{item.name}</th>
                    <td className="px-6 py-4 text-right flex items-center justify-end space-x-2">
                       <button onClick={() => openEditModal(item)} className="p-1 text-blue-600 hover:text-blue-800" title="Edit Kategori">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => openDeleteConfirm(item.id)} className="p-1 text-red-600 hover:text-red-800" title="Hapus Kategori">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="2" className="text-center py-8 text-gray-500">Belum ada kategori vendor yang ditambahkan.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}>
        <CategoryForm 
            category={editingCategory}
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
        message={`Apakah Anda yakin ingin menghapus kategori ini? Menghapus kategori dapat mempengaruhi data vendor yang sudah ada.`}
        loading={actionLoading}
      />
    </div>
  );
}

export default VendorCategoriesPage;
