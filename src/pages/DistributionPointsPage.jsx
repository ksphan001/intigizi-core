import React, { useState, useEffect, useCallback, useMemo } from 'react';
import apiClient from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { Edit, Trash2, Loader2, Users } from 'lucide-react';
import Modal from '../components/Modal';
import DistributionPointForm from '../components/DistributionPointForm';
import ConfirmationModal from '../components/ConfirmationModal';
import PageHeader from '../components/PageHeader';
import Pagination from '../components/Pagination';

const ITEMS_PER_PAGE = 10;

function DistributionPointsPage() {
  const [points, setPoints] = useState([]);
  const [categories, setCategories] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [pointToDelete, setPointToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { showNotification } = useNotification();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [pointsRes, categoriesRes] = await Promise.all([
        apiClient.get('/distribution_points_get.php'),
        apiClient.get('/beneficiary_categories_get.php')
      ]);
      
      setPoints(Array.isArray(pointsRes.data) ? pointsRes.data : []);
      setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : []); 
    } catch (error) {
      showNotification('Gagal memuat data awal.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchData(); 
  }, [fetchData]);

  const handleOpenModal = (point = null) => {
    setEditingPoint(point);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPoint(null);
  };

  const handleSavePoint = async (formData) => {
    try {
      let response;
      if (editingPoint) {
        // --- PERBAIKAN KODE: ---
        // 'formData' sudah berisi semua data yang diperlukan, termasuk 'id'.
        // Tidak perlu menyebarkannya atau menambahkan 'id' secara manual.
        response = await apiClient.post('/distribution_points_update.php', formData);
      } else {
        response = await apiClient.post('/distribution_points_create.php', formData);
      }
      showNotification(response.data.message, 'success');
      handleCloseModal();
      fetchData(); 
    } catch (error) {
      showNotification(error.response?.data?.message || 'Gagal menyimpan data.', 'error');
      // Melemparkan error kembali agar form tidak menutup
      throw error;
    }
  };

  const openDeleteConfirm = (point) => {
    setPointToDelete(point);
    setIsConfirmModalOpen(true);
  };

  const handleDeletePoint = async () => {
    if (!pointToDelete) return;
    try {
      const response = await apiClient.post('/distribution_points_delete.php', { id: pointToDelete.id });
      showNotification(response.data.message, 'success');
      setIsConfirmModalOpen(false);
      setPointToDelete(null);
      fetchData(); 
    } catch (error) {
      showNotification(error.response?.data?.message || 'Gagal menghapus titik distribusi.', 'error');
      setIsConfirmModalOpen(false);
    }
  };
  
  const calculateTotalBeneficiaries = (categoryCounts) => {
      if (!categoryCounts || categoryCounts.length === 0) return 0;
      // --- PERBAIKAN: Pastikan item.count tidak null/undefined ---
      return categoryCounts.reduce((total, item) => total + (parseInt(item.count, 10) || 0), 0);
  };

  const totalPages = Math.ceil(points.length / ITEMS_PER_PAGE);
  const paginatedPoints = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return points.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, points]);

  return (
    <div>
      <PageHeader 
        title="Manajemen Titik Distribusi" 
        buttonText="Tambah Titik Baru" 
        onButtonClick={() => handleOpenModal()} 
      />

      <div className="bg-white p-6 rounded-lg shadow-md">
        {loading ? (
          <div className="text-center"><Loader2 className="animate-spin inline-block" /></div>
        ) : points.length === 0 ? (
          <p className="text-center text-gray-500">Belum ada titik distribusi yang ditambahkan.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">Nama Titik</th>
                    <th className="px-6 py-3">Alamat</th>
                    <th className="px-6 py-3">Total Penerima</th>
                    <th className="px-6 py-3">PIC</th>
                    <th className="px-6 py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPoints.map((point) => (
                    <tr key={point.id} className="bg-white border-b hover:bg-gray-50">
                      <th className="px-6 py-4 font-medium text-gray-900">{point.name}</th>
                      <td className="px-6 py-4">{point.address}</td>
                      <td className="px-6 py-4 font-semibold flex items-center">
                          <Users size={14} className="mr-2 text-gray-500"/>
                          {calculateTotalBeneficiaries(point.category_counts)} orang
                      </td>
                      <td className="px-6 py-4">{point.pic_name} ({point.pic_phone})</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center space-x-2">
                          <button onClick={() => handleOpenModal(point)} className="text-blue-600 hover:text-blue-800 p-1"><Edit size={16} /></button>
                          <button onClick={() => openDeleteConfirm(point)} className="text-red-600 hover:text-red-800 p-1"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingPoint ? 'Edit Titik Distribusi' : 'Tambah Titik Distribusi Baru'} size="lg">
        <DistributionPointForm
          point={editingPoint}
          categories={categories}
          onSave={handleSavePoint}
          onCancel={handleCloseModal}
        />
      </Modal>
      
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleDeletePoint}
        title="Konfirmasi Penghapusan"
        message={`Apakah Anda yakin ingin menghapus titik distribusi "${pointToDelete?.name}"?`}
      />
    </div>
  );
}

export default DistributionPointsPage;