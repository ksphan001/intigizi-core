import React, { useState, useEffect, useCallback, useMemo } from 'react';
import apiClient from '@/services/api';
import PageHeader from '@/components/PageHeader.jsx';
import Modal from '@/components/Modal.jsx';
import SupplierForm from '@/components/SupplierForm.jsx';
import ConfirmationModal from '@/components/ConfirmationModal.jsx';
import Pagination from '@/components/Pagination.jsx'; // <-- 1. Impor Pagination
import { Edit, Trash2, Search } from 'lucide-react'; // <-- 2. Impor ikon Search

const ITEMS_PER_PAGE = 10; // Tentukan jumlah item per halaman

function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // --- State baru untuk pencarian dan pagination ---
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [deletingSupplierId, setDeletingSupplierId] = useState(null);

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/suppliers_get.php');
      setSuppliers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError('Gagal memuat data supplier.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  // --- Logika Pencarian ---
  const filteredSuppliers = useMemo(() => {
    if (!searchQuery) {
      return suppliers;
    }
    return suppliers.filter(supplier =>
      supplier.supplier_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [suppliers, searchQuery]);

  // --- Logika Pagination ---
  const totalPages = Math.ceil(filteredSuppliers.length / ITEMS_PER_PAGE);
  const paginatedSuppliers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSuppliers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, filteredSuppliers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);


  const openAddModal = () => {
    setEditingSupplier(null);
    setIsModalOpen(true);
  };

  const openEditModal = (supplier) => {
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const openDeleteConfirm = (id) => {
    setDeletingSupplierId(id);
    setIsConfirmModalOpen(true);
  };

  const handleSave = async (supplierData) => {
    const endpoint = supplierData.id ? '/suppliers_update.php' : '/suppliers_create.php';
    await apiClient.post(endpoint, supplierData);
    setIsModalOpen(false);
    fetchSuppliers();
  };

  const handleDelete = async () => {
    await apiClient.post('/suppliers_delete.php', { id: deletingSupplierId });
    setIsConfirmModalOpen(false);
    setDeletingSupplierId(null);
    fetchSuppliers();
  };

  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div>
      <PageHeader
        title="Manajemen Supplier"
        buttonText="Tambah Supplier"
        onButtonClick={openAddModal}
      />
      <div className="bg-white p-6 rounded-lg shadow-md">
        {/* Kolom Pencarian */}
        <div className="mb-4 relative">
          <input
            type="text"
            placeholder="Cari nama supplier..."
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
                  <th scope="col" className="px-6 py-3">Nama Supplier</th>
                  <th scope="col" className="px-6 py-3">Kontak Person</th>
                  <th scope="col" className="px-6 py-3">User Terhubung</th>
                  <th scope="col" className="px-6 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {/* Gunakan paginatedSuppliers untuk render tabel */}
                {paginatedSuppliers.length > 0 ? paginatedSuppliers.map((item) => (
                  <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                    <th scope="row" className="px-6 py-4 font-medium text-gray-900">{item.supplier_name}</th>
                    <td className="px-6 py-4">{item.contact_person}</td>
                    <td className="px-6 py-4">{item.username}</td>
                    <td className="px-6 py-4 flex justify-end space-x-2">
                      <button onClick={() => openEditModal(item)} className="p-1 text-blue-600 hover:text-blue-800"><Edit size={16}/></button>
                      <button onClick={() => openDeleteConfirm(item.id)} className="p-1 text-red-600 hover:text-red-800"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="4" className="text-center py-4">
                    {searchQuery ? 'Supplier tidak ditemukan.' : 'Tidak ada data supplier.'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Komponen Pagination */}
        <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
        />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingSupplier ? 'Edit Supplier' : 'Tambah Supplier'}>
        <SupplierForm 
          supplier={editingSupplier} 
          onSave={handleSave} 
          onCancel={() => setIsModalOpen(false)} 
        />
      </Modal>

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleDelete}
        title="Konfirmasi Hapus"
        message="Apakah Anda yakin ingin menghapus supplier ini?"
      />
    </div>
  );
}

export default SuppliersPage;
