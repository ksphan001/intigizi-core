import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/services/api';
import PageHeader from '@/components/PageHeader';
import { useNotification } from '@/context/NotificationContext';
import ConfirmationModal from '@/components/ConfirmationModal';
import { Loader2, CheckCircle, Wallet } from 'lucide-react';

// Halaman untuk Super Admin memverifikasi pembayaran langganan
function SubscriptionVerificationPage() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    
    const { showNotification } = useNotification();

    const fetchInvoices = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/superadmin_get_pending_invoices.php');
            setInvoices(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            setError('Gagal memuat daftar permintaan langganan.');
            showNotification('Gagal memuat data.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);

    const handleVerificationRequest = (invoice) => {
        setSelectedInvoice(invoice);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmVerification = async () => {
        if (!selectedInvoice) return;
        
        setActionLoading(true);
        try {
            const response = await apiClient.post('/superadmin_verify_payment.php', {
                invoice_id: selectedInvoice.id
            });
            showNotification(response.data.message, 'success');
            setIsConfirmModalOpen(false);
            await fetchInvoices(); // Refresh daftar
        } catch (err) {
            showNotification(err.response?.data?.message || 'Gagal memverifikasi pembayaran.', 'error');
            setIsConfirmModalOpen(false);
        } finally {
            setActionLoading(false);
            setSelectedInvoice(null);
        }
    };

    const formatCurrency = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value);
    const formatDate = (dateString) => new Date(dateString).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });

    if (error && invoices.length === 0) return <div className="text-red-500 p-4">{error}</div>;

    return (
        <div>
            <PageHeader title="Verifikasi Pembayaran Langganan" />
            <div className="bg-white p-6 rounded-xl shadow-md">
                {loading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Organisasi</th>
                                    <th scope="col" className="px-6 py-3">Paket</th>
                                    <th scope="col" className="px-6 py-3">Jumlah Tagihan</th>
                                    <th scope="col" className="px-6 py-3">Tanggal Permintaan</th>
                                    <th scope="col" className="px-6 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.length > 0 ? invoices.map((invoice) => (
                                    <tr key={invoice.id} className="bg-white border-b hover:bg-gray-50">
                                        <th scope="row" className="px-6 py-4 font-medium text-gray-900">{invoice.organization_name}</th>
                                        <td className="px-6 py-4">{invoice.package_name}</td>
                                        <td className="px-6 py-4 font-semibold">{formatCurrency(invoice.amount)}</td>
                                        <td className="px-6 py-4">{formatDate(invoice.created_at)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => handleVerificationRequest(invoice)} 
                                                className="btn-primary text-xs px-3 py-1 flex items-center ml-auto"
                                                title="Konfirmasi Pembayaran Telah Diterima"
                                            >
                                                <CheckCircle size={14} className="mr-2" /> Konfirmasi
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="5" className="text-center py-8 text-gray-500">Tidak ada pembayaran yang menunggu verifikasi.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmVerification}
                title="Konfirmasi Pembayaran"
                message={`Apakah Anda yakin sudah menerima pembayaran sebesar ${formatCurrency(selectedInvoice?.amount)} dari "${selectedInvoice?.organization_name}"? Aksi ini akan mengaktifkan langganan mereka.`}
                loading={actionLoading}
                confirmText="Ya, Sudah Diterima"
                confirmColor="bg-green-600 hover:bg-green-700"
            />
        </div>
    );
}

export default SubscriptionVerificationPage;
