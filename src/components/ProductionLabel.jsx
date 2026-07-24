import React from 'react';
import QRCode from 'react-qr-code';

export const ProductionLabel = React.forwardRef(({ task, productionDate, productionTime, bestBeforeTime, kitchenName, nutrition }, ref) => {
    // Format dates or ensure they are strings
    const dateStr = productionDate ? new Date(productionDate).toLocaleDateString('id-ID') : '-';

    // Generate Public URL for QR Code
    const baseUrl = window.location.origin;
    const pid = task?.proposal_code || task?.proposal_id || 'UNK';
    const date = task?.serving_date || '';
    const qrUrl = `${baseUrl}/check-label?pid=${pid}&date=${date}`;

    return (
        <div ref={ref} className="p-2 bg-white text-black font-sans" style={{ width: '80mm', minHeight: '50mm', margin: '0 auto' }}>
            {/* Header */}
            <div className="text-center border-b-2 border-black pb-2 mb-2">
                <h2 className="text-xl font-bold uppercase leading-tight">{task?.menu_name || 'Nama Menu'}</h2>
            </div>

            {/* Info Grid */}
            <div className="text-sm leading-snug space-y-1 mb-3">
                <div className="flex justify-between">
                    <span className="font-semibold">Tgl Produksi:</span>
                    <span>{dateStr}</span>
                </div>
                <div className="flex justify-between">
                    <span className="font-semibold">Waktu Produksi:</span>
                    <span>{productionTime} WIB</span>
                </div>
                <div className="flex justify-between border-b border-dashed border-black pb-1">
                    <span className="font-bold">Baik Sebelum:</span>
                    <span className="font-bold">{bestBeforeTime} WIB</span>
                </div>

                <div className="pt-1">
                    <span className="font-semibold block">Dapur:</span>
                    <span className="text-xs">{kitchenName || 'GiziNow Kitchen'}</span>
                </div>
            </div>

            {/* Nutrition (Optional) */}
            {nutrition && (
                <div className="text-xs border-t border-black pt-2 mb-2">
                    <p className="font-bold mb-1">Nilai Gizi Per Porsi:</p>
                    <div className="grid grid-cols-2 gap-x-2">
                        <span>Energi: {nutrition.energy} kkal</span>
                        <span>Protein: {nutrition.protein} g</span>
                        <span>Lemak: {nutrition.fat} g</span>
                        <span>Karbo: {nutrition.carbo} g</span>
                    </div>
                </div>
            )}

            {/* QR Code */}
            <div className="flex flex-col items-center justify-center mt-4">
                <QRCode value={qrUrl} size={128} />
                <p className="text-[10px] mt-1 font-mono">{task?.proposal_code}</p>
            </div>
            <div className="text-center text-[8px] mt-1 text-gray-500">
                Scan untuk Info Gizi & Produksi<br />
                Dicetak: {new Date().toLocaleString('id-ID')}
            </div>
        </div>
    );
});

export default ProductionLabel;
