import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import FundingApplicationForm from '@/components/FundingApplicationForm'; // Impor komponen form yang baru

function FundingApplicationPage() {
    const [isSuccess, setIsSuccess] = useState(false);
    const navigate = useNavigate();

    // Fungsi ini akan dipanggil oleh form setelah berhasil submit
    const handleSuccess = () => {
        setIsSuccess(true);
    };

    if (isSuccess) {
        return (
            <div className="container mx-auto max-w-2xl px-4 py-12 text-center">
                <CheckCircle size={64} className="mx-auto text-green-500 mb-6" />
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Pengajuan Terkirim!</h2>
                <p className="text-gray-600 mb-8">Terima kasih. Pengajuan Anda telah berhasil kami terima dan akan segera ditinjau oleh tim Super Admin. Anda dapat memantau status pengajuan Anda di dasbor.</p>
                {/* --- PERBAIKAN DI SINI --- */}
                <button onClick={() => navigate('/app/funding/dashboard')} className="btn-primary">
                    Kembali ke Dasbor Pengajuan
                </button>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-4xl px-4 py-6">
            <PageHeader title="Formulir Pengajuan Pendanaan" />
            <p className="text-gray-600 -mt-4 mb-6 max-w-3xl mx-auto text-center">
                Lengkapi formulir di bawah ini dengan data yang akurat. Data ini akan digunakan oleh Super Admin untuk proses verifikasi dan akan ditampilkan kepada calon investor.
            </p>
            <div className="bg-white p-8 rounded-xl shadow-lg">
                {/* Komponen form sekarang dipanggil di sini */}
                <FundingApplicationForm onSuccess={handleSuccess} />
            </div>
        </div>
    );
}

export default FundingApplicationPage;