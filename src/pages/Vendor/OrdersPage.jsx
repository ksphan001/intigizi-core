import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../services/api.js';
import PageHeader from '../../components/PageHeader.jsx';
import ConfirmationModal from '../../components/ConfirmationModal.jsx';
import { Loader2, Check, X as XIcon, Eye } from 'lucide-react'; // 1. Impor ikon Eye
import { useNotification } from '../../context/NotificationContext.jsx';

// Halaman BARU untuk Vendor melihat dan mengelola pesanan masuk

function VendorOrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [actionType, setActionType] = useState(null); // 'confirm' atau 'reject'
    
    const { showNotification } = useNotification();

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/vendor_get_pos.php');
            setOrders(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            setError('Gagal memuat daftar pesanan.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);
    
    const handleActionRequest = (order, type) => {
        setSelectedOrder(order);
        setActionType(type);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmAction = async () => {
        if (!selectedOrder || !actionType) return;

        setActionLoading(true);
        try {
            const newStatus = actionType === 'confirm' ? 'Dikonfirmasi' : 'Ditolak';
            const response = await apiClient.post('/vendor_manage_po.php', {
                po_id: selectedOrder.id,
                new_status: newStatus
            });
            showNotification(response.data.message, 'success');
            await fetchOrders();
        } catch (err) {
            showNotification(err.response?.data?.message || 'Gagal memperbarui status pesanan.', 'error');
        } finally {
            setActionLoading(false);
            setIsConfirmModalOpen(false);
            setSelectedOrder(null);
            setActionType(null);
        }
    };

    const formatCurrency = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value);
    
    const getStatusBadge = (status) => {
        const styles = {
          'Menunggu Konfirmasi': 'bg-yellow-100 text-yellow-800',
          'Dikonfirmasi': 'bg-green-100 text-green-800',
          'Ditolak': 'bg-red-100 text-red-800',
        };
        return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
    };

    if (error) return <div className="text-red-500 p-4">{error}</div>;

    return (
        <div>
            <PageHeader title="Pesanan Masuk" />
            <div className="bg-white p-6 rounded-lg shadow-md">
                {loading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Kode PO</th>
                                    <th scope="col" className="px-6 py-3">Nama Dapur Pemesan</th>
                                    <th scope="col" className="px-6 py-3">Tanggal Pesan</th>
                                    <th scope="col" className="px-6 py-3 text-right">Total Nilai</th>
                                    <th scope="col" className="px-6 py-3 text-center">Status</th>
                                    <th scope="col" className="px-6 py-3 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.length > 0 ? orders.map((order) => (
                                    <tr key={order.id} className="bg-white border-b hover:bg-gray-50">
                                        <th scope="row" className="px-6 py-4 font-medium text-gray-900">{order.po_code}</th>
                                        <td className="px-6 py-4">{order.kitchen_name}</td>
                                        <td className="px-6 py-4">{new Date(order.created_at).toLocaleDateString('id-ID')}</td>
                                        <td className="px-6 py-4 text-right font-semibold">{formatCurrency(order.total_amount)}</td>
                                        <td className="px-6 py-4 text-center">{getStatusBadge(order.vendor_status)}</td>
                                        {/* --- PERBAIKAN DI SINI --- */}
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center space-x-2">
                                                <Link to={`/app/purchase-orders/${order.id}`} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full" title="Lihat Detail">
                                                    <Eye size={16} />
                                                </Link>
                                                {order.vendor_status === 'Menunggu Konfirmasi' && (
                                                    <>
                                                        <button onClick={() => handleActionRequest(order, 'reject')} className="p-2 text-red-600 hover:bg-red-100 rounded-full" title="Tolak Pesanan"><XIcon size={16}/></button>
                                                        <button onClick={() => handleActionRequest(order, 'confirm')} className="p-2 text-green-600 hover:bg-green-100 rounded-full" title="Konfirmasi Pesanan"><Check size={16}/></button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="6" className="text-center py-8 text-gray-500">Tidak ada pesanan masuk.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmAction}
                title={`Konfirmasi Pesanan ${selectedOrder?.po_code}`}
                message={`Apakah Anda yakin ingin ${actionType === 'confirm' ? 'mengonfirmasi' : 'menolak'} pesanan ini?`}
                loading={actionLoading}
                confirmText={actionType === 'confirm' ? 'Ya, Konfirmasi' : 'Ya, Tolak'}
                confirmColor={actionType === 'confirm' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            />
        </div>
    );
}

export default VendorOrdersPage;
