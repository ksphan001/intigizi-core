import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '@/services/api';
import PageHeader from '@/components/PageHeader.jsx';
import Modal from '@/components/Modal.jsx';
import MenuForm from '@/components/MenuForm.jsx';
import ConfirmationModal from '@/components/ConfirmationModal.jsx';
import Pagination from '@/components/Pagination.jsx';
import { Edit, Trash2, BookOpen, Search } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext.jsx'; // 1. Impor useNotification

const ITEMS_PER_PAGE = 10;

function MenusPage() {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [deletingMenuId, setDeletingMenuId] = useState(null);
  const { showNotification } = useNotification(); // 2. Gunakan hook notifikasi

  const fetchMenus = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/menus_get.php');
      setMenus(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError('Gagal memuat data menu.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  const filteredMenus = useMemo(() => {
    if (!searchQuery) {
      return menus;
    }
    return menus.filter(menu =>
      menu.menu_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [menus, searchQuery]);

  const totalPages = Math.ceil(filteredMenus.length / ITEMS_PER_PAGE);
  const paginatedMenus = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMenus.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, filteredMenus]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);


  const openAddModal = () => {
    setEditingMenu(null);
    setIsModalOpen(true);
  };

  const openEditModal = (menu) => {
    setEditingMenu(menu);
    setIsModalOpen(true);
  };

  const openDeleteConfirm = (id) => {
    setDeletingMenuId(id);
    setIsConfirmModalOpen(true);
  };

  const handleSave = async (menuData) => {
    setActionLoading(true);
    const endpoint = menuData.id ? '/menus_update.php' : '/menus_create.php';
    await apiClient.post(endpoint, menuData);
    setIsModalOpen(false);
    await fetchMenus();
    setActionLoading(false);
    showNotification(menuData.id ? 'Menu berhasil diperbarui.' : 'Menu berhasil dibuat.');
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      // 3. Tangkap response dari API saat menghapus
      const response = await apiClient.post('/menus_delete.php', { id: deletingMenuId });
      showNotification(response.data.message);
      await fetchMenus();
    } catch (err) {
      // 4. Tampilkan pesan error spesifik dari backend jika ada
      showNotification(err.response?.data?.message || 'Gagal menghapus menu.', 'error');
    } finally {
      setIsConfirmModalOpen(false);
      setDeletingMenuId(null);
      setActionLoading(false);
    }
  };

  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div>
      <PageHeader
        title="Manajemen Menu & Resep"
        buttonText="Tambah Menu"
        onButtonClick={openAddModal}
      />
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-4 relative">
          <input
            type="text"
            placeholder="Cari nama menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-style w-full pl-10"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        </div>

        {loading ? <p>Memuat data...</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3">Nama Menu</th>
                  <th scope="col" className="px-6 py-3">Dibuat Oleh</th>
                  <th scope="col" className="px-6 py-3">Tanggal Dibuat</th>
                  <th scope="col" className="px-6 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMenus.length > 0 ? paginatedMenus.map((item) => (
                  <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                    <th scope="row" className="px-6 py-4 font-medium text-gray-900">{item.menu_name}</th>
                    <td className="px-6 py-4">{item.created_by_name}</td>
                    <td className="px-6 py-4">{new Date(item.created_at).toLocaleDateString('id-ID')}</td>
                    <td className="px-6 py-4 flex justify-end space-x-2">
                      <Link to={`/app/menus/${item.id}`} title="Kelola Resep" className="p-1 text-green-600 hover:text-green-800">
                        <BookOpen size={16}/>
                      </Link>
                      <button title="Edit Menu" onClick={() => openEditModal(item)} className="p-1 text-blue-600 hover:text-blue-800"><Edit size={16}/></button>
                      <button title="Hapus Menu" onClick={() => openDeleteConfirm(item.id)} className="p-1 text-red-600 hover:text-red-800"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="4" className="text-center py-4">
                    {searchQuery ? 'Menu tidak ditemukan.' : 'Tidak ada data menu.'}
                  </td></tr>
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingMenu ? 'Edit Menu' : 'Tambah Menu Baru'}>
        <MenuForm 
          menu={editingMenu} 
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
        message="Apakah Anda yakin ingin menghapus menu ini?"
        loading={actionLoading}
      />
    </div>
  );
}

export default MenusPage;
