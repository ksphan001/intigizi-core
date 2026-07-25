import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '@/services/api';
import PageHeader from '@/components/PageHeader.jsx';
import Modal from '@/components/Modal.jsx';
import ManualPOForm from '@/components/ManualPOForm.jsx';
import Pagination from '@/components/Pagination.jsx';
import { Eye, Search } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPOs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/purchase_orders_get.php');
      setPurchaseOrders(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError('Gagal memuat data Purchase Order.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPOs();
  }, [fetchPOs]);

  const handleSaveManualPO = async (data) => {
    setActionLoading(true);
    await apiClient.post('/purchase_orders_create_manual.php', data);
    setIsModalOpen(false);
    await fetchPOs();
    setActionLoading(false);
  };

  const filteredPOs = useMemo(() => {
    if (!searchQuery) {
      return purchaseOrders;
    }
    return purchaseOrders.filter(po =>
      po.po_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (po.proposal_code && po.proposal_code.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [purchaseOrders, searchQuery]);

  const totalPages = Math.ceil(filteredPOs.length / ITEMS_PER_PAGE);
  const paginatedPOs = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPOs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, filteredPOs]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);


  const formatCurrency = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  
  const getStatusBadge = (status) => {
    const styles = {
      'Dikirim': 'bg-blue-200 text-blue-800',
      'Diverifikasi': 'bg-yellow-200 text-yellow-800',
      'Dibayar': 'bg-purple-200 text-purple-800',
      'Selesai': 'bg-green-200 text-green-800',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || ''}`}>{status}</span>;
  };

  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div>
      <PageHeader 
        title="Manajemen Purchase Order"
        buttonText="Buat PO Manual"
        onButtonClick={() => setIsModalOpen(true)}
      />
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-4 relative">
          <input
            type="text"
            placeholder="Cari kode PO atau proposal..."
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
                  <th scope="col" className="px-6 py-3">Kode PO</th>
                  <th scope="col" className="px-6 py-3">Supplier</th>
                  <th scope="col" className="px-6 py-3">Total</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                  <th scope="col" className="px-6 py-3">Proposal Terkait</th>
                  <th scope="col" className="px-6 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPOs.length > 0 ? paginatedPOs.map((item) => (
                  <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                    <th scope="row" className="px-6 py-4 font-medium text-gray-900">{item.po_code}</th>
                    <td className="px-6 py-4">{item.supplier_name || <span className="italic text-gray-400">Belum Ditentukan</span>}</td>
                    <td className="px-6 py-4">{formatCurrency(item.total_amount)}</td>
                    <td className="px-6 py-4">{getStatusBadge(item.status)}</td>
                    <td className="px-6 py-4">{item.proposal_code || <span className="italic text-gray-400">Manual</span>}</td>
                    <td className="px-6 py-4 flex justify-end">
                      {/* --- PERBAIKAN DI SINI --- */}
                      <Link to={`/app/purchase-orders/${item.id}`} title="Lihat Detail PO" className="p-1 text-gray-600 hover:text-gray-800">
                        <Eye size={16}/>
                      </Link>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="6" className="text-center py-4">
                    {searchQuery ? 'Purchase Order tidak ditemukan.' : 'Belum ada Purchase Order yang dibuat.'}
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Buat Purchase Order Manual" size="4xl">
        <ManualPOForm
            onSave={handleSaveManualPO}
            onCancel={() => setIsModalOpen(false)}
            loading={actionLoading}
        />
      </Modal>
    </div>
  );
}

export default PurchaseOrdersPage;
