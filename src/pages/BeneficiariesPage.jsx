import React, { useState, useEffect, useCallback, useMemo } from 'react';
import apiClient from '@/services/api';
import PageHeader from '@/components/PageHeader.jsx';
import Modal from '@/components/Modal.jsx';
import BeneficiaryForm from '@/components/BeneficiaryForm.jsx';
import ConfirmationModal from '@/components/ConfirmationModal.jsx';
import BeneficiaryDetailModal from '@/components/BeneficiaryDetailModal.jsx';
import BeneficiaryUploadModal from '@/components/BeneficiaryUploadModal.jsx'; // Impor modal upload
import Pagination from '@/components/Pagination.jsx';
import { Edit, Trash2, Search, Eye, Plus, Upload, Activity } from 'lucide-react'; // Impor ikon Upload
import { useNotification } from '@/context/NotificationContext.jsx';

const ITEMS_PER_PAGE = 10;

function BeneficiariesPage() {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false); // State untuk modal upload

  const [editingBeneficiary, setEditingBeneficiary] = useState(null);
  const [deletingBeneficiary, setDeletingBeneficiary] = useState(null);
  const [viewingBeneficiary, setViewingBeneficiary] = useState(null);
  
  const { showNotification } = useNotification();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/beneficiaries_manage.php');
      setBeneficiaries(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError('Gagal memuat data penerima manfaat.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredBeneficiaries = useMemo(() => {
    if (!searchQuery) return beneficiaries;
    return beneficiaries.filter(b => 
        b.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.nik_nisn && b.nik_nisn.includes(searchQuery))
    );
  }, [beneficiaries, searchQuery]);

  const totalPages = Math.ceil(filteredBeneficiaries.length / ITEMS_PER_PAGE);
  const paginatedBeneficiaries = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBeneficiaries.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, filteredBeneficiaries]);

  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  const openAddModal = () => { setEditingBeneficiary(null); setIsFormModalOpen(true); };
  const openEditModal = (beneficiary) => { setEditingBeneficiary(beneficiary); setIsFormModalOpen(true); };
  const openDeleteConfirm = (beneficiary) => { setDeletingBeneficiary(beneficiary); setIsConfirmModalOpen(true); };
  
  const openDetailModal = (beneficiary) => { 
    setViewingBeneficiary(beneficiary); 
    setIsDetailModalOpen(true); 
  };

  const handleSave = async (data) => {
    setActionLoading(true);
    try {
      const payload = { ...data, action: data.id ? 'update' : 'create' };
      const response = await apiClient.post('/beneficiaries_manage.php', payload);
      showNotification(response.data.message, 'success');
      setIsFormModalOpen(false);
      await fetchData();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Gagal menyimpan data.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingBeneficiary) return;
    setActionLoading(true);
    try {
      const response = await apiClient.post('/beneficiaries_manage.php', { id: deletingBeneficiary.id, action: 'delete' });
      showNotification(response.data.message, 'success');
      setIsConfirmModalOpen(false);
      await fetchData();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Gagal menghapus data.', 'error');
    } finally {
      setActionLoading(false);
      setDeletingBeneficiary(null);
    }
  };
  
  // Fungsi untuk menangani refresh data setelah upload/update BMI
  const handleDataUpdate = () => {
    fetchData(); // Muat ulang semua data
    // Jika modal detail sedang terbuka, kita juga harus menutupnya
    // atau memperbarui data 'viewingBeneficiary'
    if(viewingBeneficiary) {
        // Optimis: tutup modal detail agar pengguna melihat data baru di tabel
        setIsDetailModalOpen(false);
        setViewingBeneficiary(null);
    }
  };

  const getBmiStatusColor = (bmi) => {
    if (!bmi) return 'text-gray-500';
    if (bmi < 18.5) return 'text-yellow-600';
    if (bmi < 24.9) return 'text-green-600';
    if (bmi < 29.9) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Database Penerima Manfaat</h1>
        <div className="flex space-x-2">
            <button onClick={() => setIsUploadModalOpen(true)} className="btn-secondary">
                <Upload size={16} className="mr-2" /> Impor dari Excel
            </button>
            <button onClick={openAddModal} className="btn-primary">
                <Plus size={16} className="mr-2" /> Tambah Data
            </button>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-4 relative">
          <input
            type="text"
            placeholder="Cari nama atau NIK/NISN..."
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
                  <th scope="col" className="px-6 py-3">Nama Lengkap</th>
                  <th scope="col" className="px-6 py-3">NIK / NISN</th>
                  <th scope="col" className="px-6 py-3">Kategori</th>
                  <th scope="col" className="px-6 py-3">Titik Distribusi</th>
                  <th scope="col" className="px-6 py-3 text-right">BMI Terakhir</th>
                  <th scope="col" className="px-6 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBeneficiaries.length > 0 ? paginatedBeneficiaries.map((item) => (
                  <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                    <th scope="row" className="px-6 py-4 font-medium text-gray-900">{item.full_name}</th>
                    <td className="px-6 py-4">{item.nik_nisn || '-'}</td>
                    <td className="px-6 py-4">{item.category_name || '-'}</td>
                    <td className="px-6 py-4">{item.distribution_point_name || '-'}</td>
                    <td className={`px-6 py-4 text-right font-bold ${getBmiStatusColor(item.current_bmi)}`}>
                        {item.current_bmi ? parseFloat(item.current_bmi).toFixed(1) : '-'}
                    </td>
                    <td className="px-6 py-4 flex justify-end space-x-2">
                      <button title="Lihat Detail & Riwayat BMI" onClick={() => openDetailModal(item)} className="p-1 text-gray-600 hover:text-gray-800"><Eye size={16}/></button>
                      <button title="Edit" onClick={() => openEditModal(item)} className="p-1 text-blue-600 hover:text-blue-800"><Edit size={16}/></button>
                      <button title="Hapus" onClick={() => openDeleteConfirm(item)} className="p-1 text-red-600 hover:text-red-800"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="6" className="text-center py-4">{searchQuery ? 'Data tidak ditemukan.' : 'Belum ada data penerima manfaat.'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={editingBeneficiary ? 'Edit Penerima Manfaat' : 'Tambah Penerima Manfaat'}>
        <BeneficiaryForm 
          beneficiary={editingBeneficiary} 
          onSave={handleSave} 
          onCancel={() => setIsFormModalOpen(false)}
          loading={actionLoading}
        />
      </Modal>
      
      <BeneficiaryDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        beneficiary={viewingBeneficiary}
        onDataUpdate={handleDataUpdate} // Kirim callback
      />

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleDelete}
        title="Konfirmasi Hapus"
        message={`Apakah Anda yakin ingin menghapus data "${deletingBeneficiary?.full_name}"? Semua riwayat BMI juga akan terhapus.`}
        loading={actionLoading}
      />
      
      <BeneficiaryUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleDataUpdate} // Panggil refresh data saat upload sukses
      />
    </div>
  );
}

export default BeneficiariesPage;