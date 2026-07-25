import React, { useMemo } from "react";
import { X, Printer } from "lucide-react";

const PrintDeliveryOrderModal = ({ isOpen, onClose, distributions = [], date, kitchenName = "DAPUR GIZI UTAMA SPPG", driverName = "" }) => {
  if (!isOpen) return null;

  // Filter pengiriman sesuai kurir jika nama kurir disertakan
  const filteredStops = useMemo(() => {
    let list = [...distributions];
    if (driverName) {
      list = list.filter(d => d.courier_name === driverName || d.reported_by_name === driverName);
    }
    // Urutkan berdasarkan waktu pengantaran jika ada
    return list.sort((a, b) => (a.delivery_time || "").localeCompare(b.delivery_time || ""));
  }, [distributions, driverName]);

  const totalPortions = useMemo(() => {
    return filteredStops.reduce((sum, d) => sum + parseInt(d.total_beneficiaries || d.quantity_sent || 0), 0);
  }, [filteredStops]);

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(date + "T00:00:00").toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const docNumber = useMemo(() => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    const dateCode = date ? date.replace(/-/g, "") : "TODAY";
    return `ST/${dateCode}/${rand}`;
  }, [date]);

  return (
    <div className="fixed inset-0 top-0 left-0 w-full h-full bg-black/60 z-50 flex justify-center items-start p-4 overflow-y-auto outline-none border-none">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col my-8 outline-none border-none print:hidden">
        {/* Header Modal */}
        <div className="flex-shrink-0 flex justify-between items-center p-4 border-b">
          <h3 className="text-sm font-bold text-gray-800">Pratinjau Surat Tugas & Surat Jalan</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="h-[34px] px-4 py-2 rounded-xl bg-intigizi-green hover:bg-intigizi-green-dark text-white font-bold text-xs flex items-center transition-colors shadow-sm"
            >
              <Printer size={14} className="mr-1.5" /> Cetak Sekarang
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800 p-1.5 focus:outline-none">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Area Dokumen Preview */}
        <div className="p-8 bg-gray-100 flex-1 overflow-y-auto max-h-[70vh]">
          <div id="print-document-area" className="bg-white p-12 shadow-md max-w-2xl mx-auto border border-gray-200 text-black font-sans leading-relaxed text-sm">
            {/* Kop Surat */}
            <div className="border-b-4 border-black pb-4 text-center">
              <h2 className="text-lg font-black tracking-wider uppercase">{kitchenName}</h2>
              <p className="text-xs text-gray-650 mt-1">Program Makan Bergizi Gratis (MBG) Nasional - Badan Gizi Nasional (BGN)</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Alamat Operasional SPPG Terdaftar | Hub: +62 811-XXXX-XXXX</p>
            </div>

            {/* Judul Dokumen */}
            <div className="my-6 text-center">
              <h3 className="text-base font-black underline tracking-wide">SURAT JALAN & TUGAS PENGANTARAN</h3>
              <p className="text-xs font-mono text-gray-500 mt-1">Nomor: {docNumber}</p>
            </div>

            {/* Identitas Tugas */}
            <div className="grid grid-cols-2 gap-4 mb-6 pb-4 border-b border-dashed border-gray-300 text-xs">
              <div>
                <p><span className="font-bold text-gray-600 inline-block w-24">Pemberi Tugas</span>: Kepala Dapur SPPG</p>
                <p className="mt-1"><span className="font-bold text-gray-600 inline-block w-24">Tanggal Pengiriman</span>: {formattedDate}</p>
              </div>
              <div>
                <p><span className="font-bold text-gray-600 inline-block w-24">Nama Kurir/Driver</span>: <span className="font-bold underline">{driverName || "Petugas Ditunjuk"}</span></p>
                <p className="mt-1"><span className="font-bold text-gray-600 inline-block w-24">Status Tugas</span>: Distribusi Makanan Hangat</p>
              </div>
            </div>

            {/* Instruksi */}
            <p className="text-xs mb-4 text-gray-700">Diberikan tugas kepada personel kurir di atas untuk mengantarkan dan mendistribusikan Paket Makanan MBG sejumlah **{totalPortions} Porsi** menuju titik-titik penerima berikut sesuai urutan rute:</p>

            {/* Tabel Rute Pengantaran */}
            <table className="w-full text-xs text-left border border-collapse border-black mb-8">
              <thead>
                <tr className="bg-gray-100 border-b border-black">
                  <th className="border-r border-black p-2 text-center w-8">No</th>
                  <th className="border-r border-black p-2">Sekolah / PAUD Penerima</th>
                  <th className="border-r border-black p-2">Menu Makanan</th>
                  <th className="border-r border-black p-2 text-center w-20">Porsi Target</th>
                  <th className="p-2 text-center w-28">Tanda Tangan / Cap</th>
                </tr>
              </thead>
              <tbody>
                {filteredStops.map((stop, idx) => (
                  <tr key={stop.report_id} className="border-b border-black">
                    <td className="border-r border-black p-2 text-center">{idx + 1}</td>
                    <td className="border-r border-black p-2">
                      <p className="font-bold">{stop.point_name || stop.distribution_point_name}</p>
                    </td>
                    <td className="border-r border-black p-2">{stop.menu_name}</td>
                    <td className="border-r border-black p-2 text-center font-bold">
                      {stop.total_beneficiaries || stop.quantity_sent}
                    </td>
                    <td className="p-2 text-center h-12"></td>
                  </tr>
                ))}
                {filteredStops.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-4 text-center italic text-gray-500">Belum ada titik rute pengantaran aktif pada kurir ini.</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Tanda Tangan */}
            <div className="flex justify-between text-xs mt-12">
              <div className="text-center w-40">
                <p>Penerima Tugas,</p>
                <div className="h-16"></div>
                <p className="font-bold underline">{driverName || "Driver / Kurir"}</p>
                <p className="text-[10px] text-gray-500">Personel Armada</p>
              </div>
              <div className="text-center w-40">
                <p>Mengetahui,</p>
                <div className="h-16"></div>
                <p className="font-bold underline">Kepala Dapur Gizi</p>
                <p className="text-[10px] text-gray-500">Penanggung Jawab SPPG</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Style Khas Cetak CSS Media Print */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #print-document-area, #print-document-area * {
            visibility: visible !important;
          }
          #print-document-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}} />
    </div>
  );
};

export default PrintDeliveryOrderModal;
