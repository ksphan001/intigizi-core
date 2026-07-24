import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '@/services/api';
import PageHeader from '@/components/PageHeader.jsx';
import Modal from '@/components/Modal.jsx';
import ProposalForm from '@/components/ProposalForm.jsx';
import ConfirmationModal from '@/components/ConfirmationModal.jsx';
import Pagination from '@/components/Pagination.jsx';
import { Edit, Trash2, Eye, Search, UserCheck } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext.jsx';
import { useAuth } from '@/context/AuthContext';

const ITEMS_PER_PAGE = 10;

function ProposalsPage() {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState(null);
  const [deletingProposalId, setDeletingProposalId] = useState(null);
  const { showNotification } = useNotification();
  const { user } = useAuth(); // Dapatkan info user saat ini

  const fetchProposals = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/proposals_get.php');
      setProposals(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError('Gagal memuat data proposal.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const filteredProposals = useMemo(() => {
    if (!searchQuery) {
      return proposals;
    }
    return proposals.filter(p =>
      p.proposal_code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [proposals, searchQuery]);

  const totalPages = Math.ceil(filteredProposals.length / ITEMS_PER_PAGE);
  const paginatedProposals = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProposals.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, filteredProposals]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);


  const openAddModal = () => {
    setEditingProposal(null);
    setIsModalOpen(true);
  };

  const openEditModal = (proposal) => {
    setEditingProposal(proposal);
    setIsModalOpen(true);
  };

  const openDeleteConfirm = (id) => {
    setDeletingProposalId(id);
    setIsConfirmModalOpen(true);
  };

  const handleSave = async (proposalData) => {
    setActionLoading(true);
    try {
        const endpoint = proposalData.id ? '/proposals_update.php' : '/proposals_create.php';
        const response = await apiClient.post(endpoint, proposalData);
        showNotification(response.data.message, 'success');
        setIsModalOpen(false);
        await fetchProposals();
    } catch(err) {
        showNotification(err.response?.data?.message || 'Gagal menyimpan proposal', 'error');
    } finally {
        setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
        await apiClient.post('/proposals_delete.php', { id: deletingProposalId });
        showNotification('Proposal berhasil dihapus', 'success');
        setIsConfirmModalOpen(false);
        setDeletingProposalId(null);
        await fetchProposals();
    } catch(err) {
        showNotification(err.response?.data?.message || 'Gagal menghapus proposal', 'error');
    } finally {
        setActionLoading(false);
    }
  };
  
  const getStatusBadge = (status) => {
    const styles = {
      'Draft': 'bg-gray-200 text-gray-800',
      'Diajukan': 'bg-yellow-200 text-yellow-800',
      'Disetujui': 'bg-green-200 text-green-800',
      'Ditolak': 'bg-red-200 text-red-800',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || ''}`}>{status}</span>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };
  
  // Peran yang diizinkan untuk mengedit
  const canEdit = user && [2, 3, 7].includes(Number(user.role_id)); // Kepala Dapur, Akuntan, Admin

  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div>
      <PageHeader
        title="Manajemen Proposal"
        buttonText="Buat Proposal Baru"
        onButtonClick={openAddModal}
      />
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-4 relative">
          <input
            type="text"
            placeholder="Cari kode proposal..."
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
                  <th scope="col" className="px-6 py-3">Kode Proposal</th>
                  <th scope="col" className="px-6 py-3">Periode</th>
                  <th scope="col" className="px-6 py-3">Terakhir Diedit</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                  <th scope="col" className="px-6 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProposals.length > 0 ? paginatedProposals.map((item) => {
                    const isEditable = canEdit && (item.status === 'Draft' || (item.status === 'Disetujui' && !item.has_po_generated));
                    return (
                      <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                        <th scope="row" className="px-6 py-4 font-medium text-gray-900">{item.proposal_code}</th>
                        <td className="px-6 py-4">{formatDate(item.start_date)} - {formatDate(item.end_date)}</td>
                        <td className="px-6 py-4 text-xs text-gray-500">
                          {item.last_edited_by_name ? (
                            <div className="flex items-center">
                              <UserCheck size={14} className="mr-1.5" />
                              <span>{item.last_edited_by_name}</span>
                            </div>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(item.status)}</td>
                        <td className="px-6 py-4 flex justify-end space-x-2">
                          <Link to={`/app/proposals/${item.id}`} title="Lihat Detail" className="p-1 text-gray-600 hover:text-gray-800">
                            <Eye size={16}/>
                          </Link>
                          {isEditable && (
                            <button title="Edit Proposal" onClick={() => openEditModal(item)} className="p-1 text-blue-600 hover:text-blue-800"><Edit size={16}/></button>
                          )}
                          {item.status === 'Draft' && (
                            <button title="Hapus Proposal" onClick={() => openDeleteConfirm(item.id)} className="p-1 text-red-600 hover:text-red-800"><Trash2 size={16}/></button>
                          )}
                        </td>
                      </tr>
                    )
                }) : (
                  <tr><td colSpan="5" className="text-center py-4">
                    {searchQuery ? 'Proposal tidak ditemukan.' : 'Belum ada proposal yang dibuat.'}
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProposal ? 'Edit Proposal' : 'Buat Proposal Baru'}>
        <ProposalForm 
          proposal={editingProposal} 
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
        message="Apakah Anda yakin ingin menghapus proposal ini?"
        loading={actionLoading}
      />
    </div>
  );
}

export default ProposalsPage;

