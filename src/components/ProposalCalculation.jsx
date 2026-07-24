import React from 'react';
import { Loader2 } from 'lucide-react';

function ProposalCalculation({ calculation, loading, error }) {

    const formatCurrency = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value || 0);
    const formatNumber = (value) => new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value || 0);

    if (loading) {
        return <div className="text-center p-4"><Loader2 className="animate-spin inline-block" /> Memuat kalkulasi...</div>;
    }

    if (error) {
        return <div className="text-red-500 p-4 bg-red-100 rounded-md">Error: {error}</div>;
    }

    if (!calculation || !calculation.required_ingredients) {
        return <div className="text-center text-gray-500 p-4">Data kalkulasi tidak tersedia.</div>;
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Rincian Kebutuhan Bahan Baku</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Bahan</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Dibutuhkan</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Estimasi Biaya</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {calculation.required_ingredients.length > 0 ? (
                            calculation.required_ingredients.map(item => (
                                <tr key={item.ingredient_id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.ingredient_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{formatNumber(item.total_needed)} {item.unit_symbol}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{formatCurrency(item.estimated_cost)}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="3" className="text-center py-4 text-sm text-gray-500">Tidak ada bahan baku yang dibutuhkan. Jadwalkan menu terlebih dahulu.</td>
                            </tr>
                        )}
                    </tbody>
                    <tfoot className="bg-gray-50">
                        <tr>
                            <td colSpan="2" className="px-6 py-3 text-right text-sm font-bold text-gray-700">TOTAL ESTIMASI ANGGARAN</td>
                            <td className="px-6 py-3 text-right text-sm font-bold text-gray-900">{formatCurrency(calculation.total_estimated_budget)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}

export default ProposalCalculation;
