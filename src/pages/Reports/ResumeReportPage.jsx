import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/services/api';
import PageHeader from '@/components/PageHeader';
import { Loader2, Download } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';

const ReportRow = ({ label, prevValue, onGoingValue, isHeader = false, isTotal = false }) => {
    const format = (val) => new Intl.NumberFormat('id-ID').format(val || 0);
    const total = (parseFloat(prevValue) || 0) + (parseFloat(onGoingValue) || 0);

    return (
        <tr className={isTotal ? 'font-bold bg-gray-100' : 'border-b'}>
            <td className={`px-6 py-3 ${isHeader ? 'font-semibold' : 'pl-8'}`}>{label}</td>
            <td className="px-6 py-3 text-right">{format(prevValue)}</td>
            <td className="px-6 py-3 text-right">{format(onGoingValue)}</td>
            <td className="px-6 py-3 text-right">{format(total)}</td>
        </tr>
    );
};

function ResumeReportPage() {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();
    const [dates, setDates] = useState({
        start: new Date(new Date().setDate(1)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/financials/reports_get_lr.php', { params: dates });
            setReportData(response.data);
        } catch (error) {
            showNotification('Gagal memuat data laporan.', 'error');
        } finally {
            setLoading(false);
        }
    }, [dates, showNotification]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    const handleDateChange = (e) => {
        setDates(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    
    const d = reportData;
    const totalPenerimaanPrev = d?.previous.penerimaan_bantuan;
    const totalPenerimaanOngoing = d?.ongoing.penerimaan_bantuan;
    const totalPengeluaranPrev = (d?.previous.pengeluaran_bahan_baku || 0) + (d?.previous.pengeluaran_operasional || 0) + (d?.previous.pengeluaran_sewa || 0) + (d?.previous.pengeluaran_tenaga_kerja || 0);
    const totalPengeluaranOngoing = (d?.ongoing.pengeluaran_bahan_baku || 0) + (d?.ongoing.pengeluaran_operasional || 0) + (d?.ongoing.pengeluaran_sewa || 0) + (d?.ongoing.pengeluaran_tenaga_kerja || 0);

    return (
        <div className="space-y-6">
            <PageHeader title="Laporan Resume Keuangan (LR)" />
             <div className="bg-white p-4 rounded-xl shadow-md">
                <div className="flex flex-wrap items-end gap-4">
                    <div><label className="text-xs">Dari Tanggal</label><input type="date" name="start" value={dates.start} onChange={handleDateChange} className="input-style"/></div>
                    <div><label className="text-xs">Sampai Tanggal</label><input type="date" name="end" value={dates.end} onChange={handleDateChange} className="input-style"/></div>
                    <button onClick={fetchReport} disabled={loading} className="btn-primary">Tampilkan</button>
                    <button disabled className="btn-secondary ml-auto disabled:opacity-50"><Download size={16} className="mr-2"/> Unduh</button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
                 {loading ? <div className="text-center p-8"><Loader2 className="animate-spin" /></div> : !d ? <div className="text-center p-8">Gagal memuat data.</div> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                                <tr>
                                    <th className="px-6 py-3 w-1/2">Uraian</th>
                                    <th className="px-6 py-3 text-right">Jumlah Periode Sebelumnya (Rp)</th>
                                    <th className="px-6 py-3 text-right">Periode Berjalan (Rp)</th>
                                    <th className="px-6 py-3 text-right">Jumlah s/d Periode Ini (Rp)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <ReportRow label="PENERIMAAN" isHeader={true} />
                                <ReportRow label="Dana Bantuan Pemerintah" prevValue={d.previous.penerimaan_bantuan} onGoingValue={d.ongoing.penerimaan_bantuan} />
                                <ReportRow label="TOTAL PENERIMAAN" prevValue={totalPenerimaanPrev} onGoingValue={totalPenerimaanOngoing} isTotal={true} />
                                
                                <tr className="h-4"></tr>
                                
                                <ReportRow label="PENGELUARAN" isHeader={true} />
                                <ReportRow label="Biaya Bahan Baku" prevValue={d.previous.pengeluaran_bahan_baku} onGoingValue={d.ongoing.pengeluaran_bahan_baku} />
                                <ReportRow label="Biaya Operasional" prevValue={d.previous.pengeluaran_operasional} onGoingValue={d.ongoing.pengeluaran_operasional} />
                                <ReportRow label="Biaya Tenaga Kerja" prevValue={d.previous.pengeluaran_tenaga_kerja} onGoingValue={d.ongoing.pengeluaran_tenaga_kerja} />
                                <ReportRow label="Biaya Sewa" prevValue={d.previous.pengeluaran_sewa} onGoingValue={d.ongoing.pengeluaran_sewa} />
                                <ReportRow label="TOTAL PENGELUARAN" prevValue={totalPengeluaranPrev} onGoingValue={totalPengeluaranOngoing} isTotal={true} />
                                
                                <tr className="h-4"></tr>
                                
                                <ReportRow label="BUKU KAS UMUM (SALDO AKHIR)" isHeader={true} />
                                <ReportRow label="Kas Tunai" onGoingValue={d.saldo_kas_tunai} />
                                <ReportRow label="Kas di Bank" onGoingValue={d.saldo_kas_bank} />
                                <ReportRow label="TOTAL KAS & BANK" onGoingValue={d.saldo_kas_tunai + d.saldo_kas_bank} isTotal={true} />
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ResumeReportPage;
