import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PageHeader from '@/components/PageHeader';
import Modal from '@/components/Modal';
import HonorariumForm from '@/components/HonorariumForm';
import { useNotification } from '@/context/NotificationContext';
import apiClient from '@/services/api';
import { Users, Loader2 } from 'lucide-react';
import Pagination from '@/components/Pagination';

const ITEMS_PER_PAGE = 10;

function HonorariumPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [dates, setDates] = useState({
        start: new Date(new Date().setDate(1)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });
    
    const { showNotification } = useNotification();

    const fetchHistory = useCallback(async () => {
        setLoadingHistory(true);
        try {
            const response = await apiClient.get('/financials/honorarium_manage.php', {
                params: { start_date: dates.start, end_date: dates.end }
            });
            setHistory(response.data);
        } catch (error) {
            showNotification('Gagal memuat riwayat pembayaran.', 'error');
        } finally {
            setLoadingHistory(false);
        }
    }, [dates, showNotification]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const handleSave = async (data) => {
        setActionLoading(true);
        try {
            const response = await apiClient.post('/financials/honorarium_manage.php', data);
            showNotification(response.data.message, 'success');
            setIsModalOpen(false);
            await fetchHistory();
        } catch (err) {
            showNotification(err.response?.data?.message || 'Gagal menyimpan.', 'error');
        } finally {
            setActionLoading(false);
        }
    };
    
    const handleDateChange = (e) => {
        setDates(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const paginatedHistory = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return history.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [currentPage, history]);

    const totalPages = Math.ceil(history.length / ITEMS_PER_PAGE);
    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val || 0);
    const formatDate = (date) => new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

    return (
        <div>
            <PageHeader title="Pembayaran Honorarium" buttonText="Catat Pembayaran Baru" onButtonClick={() => setIsModalOpen(true)} />
            
             <div className="bg-white p-4 rounded-xl shadow-md mb-6">
                <div className="flex flex-wrap items-end gap-4">
                    <div><label className="text-xs">Dari</label><input type="date" name="start" value={dates.start} onChange={handleDateChange} className="input-style"/></div>
                    <div><label className="text-xs">Sampai</label><input type="date" name="end" value={dates.end} onChange={handleDateChange} className="input-style"/></div>
                    <button onClick={fetchHistory} disabled={loadingHistory} className="btn-primary">Tampilkan</button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
                 <h3 className="text-lg font-semibold text-gray-800 mb-4">Riwayat Pembayaran</h3>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-6 py-3">Tanggal</th>
                                <th className="px-6 py-3">Penerima</th>
                                <th className="px-6 py-3">Uraian</th>
                                <th className="px-6 py-3 text-right">Total Dibayar</th>
                                <th className="px-6 py-3">Dicatat Oleh</th>
                            </tr>
                        </thead>
                         <tbody>
                            {loadingHistory ? (
                                <tr><td colSpan="5" className="text-center py-8"><Loader2 className="animate-spin inline-block"/></td></tr>
                            ) : paginatedHistory.length > 0 ? paginatedHistory.map(item => (
                                <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4">{formatDate(item.payment_date)}</td>
                                    <td className="px-6 py-4 font-medium">{item.volunteer_name}</td>
                                    <td className="px-6 py-4">{item.description}</td>
                                    <td className="px-6 py-4 text-right font-semibold">{formatCurrency(item.total_amount)}</td>
                                    <td className="px-6 py-4 text-gray-500">{item.created_by_name}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan="5" className="text-center py-8 text-gray-500">
                                    <Users size={32} className="mx-auto text-gray-300 mb-2"/>
                                    Tidak ada riwayat pembayaran pada periode ini.
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                 </div>
                 {history.length > 0 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Formulir Pembayaran Honorarium" size="4xl">
                <HonorariumForm onSave={handleSave} onCancel={() => setIsModalOpen(false)} loading={actionLoading} />
            </Modal>
        </div>
    );
}

export default HonorariumPage;

