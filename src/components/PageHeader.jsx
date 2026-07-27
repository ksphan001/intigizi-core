import React, { useState } from "react";
import { Plus, HelpCircle, X, Info, BookOpen } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

// Kamus Panduan Penggunaan Halaman Terintegrasi Lengkap (Fungsi Fitur & Alur Penggunaan)
const PAGE_GUIDES = {
  "Dasbor": {
    desc: "Dasbor Utama Konsolidasi & Monitoring Operasional",
    steps: [
      "Fungsi Fitur: Menampilkan sebaran peta titik distribusi, jadwal memasak harian, stok kritis, dan status gizi (BMI/Stunting) anak secara real-time.",
      "Alur Penggunaan: Pengguna Yayasan menggunakan switcher kanan atas untuk memfilter data dapur spesifik atau konsolidasi seluruh dapur. Tim pelaksana dapur memantau grafik stok kritis untuk merencanakan belanja harian."
    ]
  },
  "Stok Gudang": {
    desc: "Manajemen Inventaris & Pelaporan Penyusutan Bahan Pangan",
    steps: [
      "Fungsi Fitur: Menampilkan saldo persediaan gudang saat ini (dalam satuan standar) dan riwayat barang rusak.",
      "Alur Penggunaan: Stok bertambah otomatis dari penyelesaian Purchase Order (PO). Tekan tombol 'Laporkan Bahan Rusak' untuk memotong stok jika ada barang busuk/tumpah. Sistem otomatis mencatat kerugian pada Buku Kas Keuangan."
    ]
  },
  "Manajemen Bahan Baku": {
    desc: "Katalog Bahan Baku Lokal & Harga Acuan",
    steps: [
      "Fungsi Fitur: Mengelola daftar komoditas bahan pangan lokal yang digunakan untuk resep gizi.",
      "Alur Penggunaan: Tambahkan bahan manual atau impor dari 'Pustaka Bahan'. Klik 'Sesuaikan Harga Acuan' untuk menyelaraskan harga beli lokal secara otomatis dengan rata-rata harga pasar nasional."
    ]
  },
  "Manajemen SPPG": {
    desc: "Pendaftaran & Profil Unit Dapur Anak (Yayasan)",
    steps: [
      "Fungsi Fitur: Mengelola unit-unit dapur SPPG pelaksana di bawah naungan Yayasan.",
      "Alur Penggunaan: Daftarkan dapur baru dengan mengklik 'Tambah Unit Baru'. Sistem otomatis men-generate 4 akun tim dapur pendukung (Gizi, Chef, Akuntan, Kurir). Gunakan tombol 'Edit Unit' untuk update profil/password."
    ]
  },
  "Data Sukarelawan": {
    desc: "Kelola Sukarelawan & Tenaga Kerja Lapangan",
    steps: [
      "Fungsi Fitur: Pendataan profil relawan pengantar makanan (kurir) dan relawan dapur.",
      "Alur Penggunaan: Klik 'Tambah Data', isi nama, nomor WhatsApp aktif, dan penugasan kerja. Data nomor HP digunakan untuk notifikasi koordinasi pengiriman."
    ]
  },
  "Tugas Produksi": {
    desc: "Pelaksanaan Rencana Memasak & Cetak Label Gizi",
    steps: [
      "Fungsi Fitur: Mengelola penugasan memasak harian berdasarkan menu yang diajukan.",
      "Alur Penggunaan: Klik 'Cetak Label' untuk mengunduh stiker info gizi kemasan. Klik 'Selesaikan Produksi' untuk memotong bahan baku dari stok gudang secara real-time."
    ]
  },
  "Buku Kas Umum": {
    desc: "Laporan Buku Kas Umum (BKU) Dapur",
    steps: [
      "Fungsi Fitur: Laporan arus kas masuk-keluar utama organisasi dapur mitra.",
      "Alur Penggunaan: Transaksi belanja bahan baku, pembayaran gaji, dan kerugian bahan rusak tercatat otomatis. Akuntan dapat memfilter tanggal untuk rekonsiliasi kas dan mencetak laporan BKU."
    ]
  },
  "Buku Pembantu": {
    desc: "Buku Pembantu Kas, Pengeluaran, Penerimaan & Pajak",
    steps: [
      "Fungsi Fitur: Rincian buku besar kas pembantu keuangan khusus sesuai standardisasi.",
      "Alur Penggunaan: Pilih filter tanggal laporan. Gunakan data pembantu ini untuk mencocokkan mutasi kas belanja, potongan pajak supplier, dan penerimaan hibah modal."
    ]
  },
  "Laporan Pemakaian": {
    desc: "Analitik Pemakaian Bahan Baku & Estimasi Biaya",
    steps: [
      "Fungsi Fitur: Visualisasi grafik jumlah dan estimasi biaya bahan pangan yang dikonsumsi untuk produksi makanan.",
      "Alur Penggunaan: Masukkan periode tanggal, klik filter untuk memperbarui grafik. Gunakan laporan ini untuk mengevaluasi pemborosan stok dapur."
    ]
  },
  "Laporan Pembelian": {
    desc: "Analitik Volume & Biaya Belanja Bahan Baku Dapur",
    steps: [
      "Fungsi Fitur: Melacak grafik realisasi transaksi belanja persediaan ke pemasok.",
      "Alur Penggunaan: Tentukan filter tanggal untuk melihat tren nominal belanja terbesar dan melakukan negosiasi ulang harga bahan dengan supplier."
    ]
  },
  "Lacak Distribusi": {
    desc: "Monitoring Pengiriman Makanan Secara Live",
    steps: [
      "Fungsi Fitur: Pelacakan posisi koordinat gps kurir dan status penerimaan makanan di sekolah.",
      "Alur Penggunaan: Koordinator menugaskan kurir dan rute pengiriman. Kurir mengaktifkan geolokasi saat mengirim, dan status penerimaan diperbarui secara otomatis setelah dipindai di titik distribusi."
    ]
  },
  "Penerima Manfaat": {
    desc: "Manajemen Data Anak Penerima Bantuan Gizi",
    steps: [
      "Fungsi Fitur: Pendataan identitas anak, NIK, sekolah, serta pencatatan tinggi & berat badan berkala.",
      "Alur Penggunaan: Masukkan data anak baru secara berkala. Catat tinggi dan berat badan bulanan untuk mengevaluasi perkembangan BMI dan mendeteksi risiko stunting."
    ]
  },
  "Manajemen Menu": {
    desc: "Penyusunan Porsi & Perhitungan Nutrisi Menu Makanan",
    steps: [
      "Fungsi Fitur: Merancang daftar resep makanan bergizi harian beserta kalkulasi nutrisi.",
      "Alur Penggunaan: Tambahkan menu, masukkan porsi gram bahan per anak. Sistem otomatis menghitung kecukupan energi (kalori), protein, karbohidrat, dan lemak sesuai standar kesehatan."
    ]
  },
  "Proposal": {
    desc: "Pengajuan Anggaran Belanja Gizi Mingguan",
    steps: [
      "Fungsi Fitur: Pengajuan siklus anggaran belanja mingguan kepada Yayasan/Superadmin.",
      "Alur Penggunaan: Pilih siklus tanggal dan daftar menu harian. Aplikasi otomatis mengkalkulasi kebutuhan biaya belanja berdasarkan target porsi anak. Klik 'Ajukan' untuk verifikasi persetujuan dana."
    ]
  },
  "Pemesanan Bahan Baku": {
    desc: "Purchase Order (PO) Belanja Persediaan Dapur",
    steps: [
      "Fungsi Fitur: Pembuatan dokumen pemesanan bahan baku resmi ke Supplier/Vendor.",
      "Alur Penggunaan: Pilih bahan baku, kuantitas, dan vendor. Setelah barang sampai di dapur, klik 'Selesaikan & Bayar' untuk memasukkan barang ke stok gudang secara otomatis."
    ]
  },
  "Manajemen Purchase Order": {
    desc: "Manajemen Purchase Order (PO) Persediaan Dapur",
    steps: [
      "Fungsi Fitur: Pembuatan dokumen pemesanan bahan baku resmi ke Supplier/Vendor.",
      "Alur Penggunaan: Pilih bahan baku, kuantitas, dan vendor. Setelah barang sampai di dapur, klik 'Selesaikan & Bayar' untuk memasukkan barang ke stok gudang secara otomatis."
    ]
  },
  "Pengaturan Organisasi": {
    desc: "Profil Lembaga & Koordinat Lokasi Dapur",
    steps: [
      "Fungsi Fitur: Konfigurasi data legalitas, PIC kontak, serta koordinat geografis dapur utama.",
      "Alur Penggunaan: Isi detail informasi organisasi secara akurat. Koordinat GPS latitude/longitude sangat penting untuk akurasi perhitungan jarak rute pengiriman makanan."
    ]
  },
  "Pembayaran Honorarium": {
    desc: "Catatan Pembayaran Gaji Relawan & Tim Dapur",
    steps: [
      "Fungsi Fitur: Dokumentasi pengeluaran gaji bulanan staf pelaksana program.",
      "Alur Penggunaan: Klik 'Catat Pembayaran', pilih relawan/karyawan, masukkan nominal honor, dan simpan. Pengeluaran otomatis dicatat di Buku Kas Umum."
    ]
  },
  "Kemitraan Dapur": {
    desc: "Audit & Manajemen Dapur Pelaksana (Super Admin)",
    steps: [
      "Fungsi Fitur: Memantau dan mengaudit seluruh status organisasi dapur pelaksana.",
      "Alur Penggunaan: Super Admin menyetujui, menolak, menonaktifkan akun dapur, serta melacak masa aktif langganan uji coba/trial."
    ]
  },
  "Persetujuan Pendaftar": {
    desc: "Verifikasi Pendaftaran Akun Baru (Super Admin)",
    steps: [
      "Fungsi Fitur: Persetujuan pendaftaran akun Yayasan, Mitra Dapur, Pemasok, atau Calon Mitra baru.",
      "Alur Penggunaan: Super Admin mengaudit berkas yang diunggah pendaftar, lalu mengklik 'Setujui' atau 'Tolak' untuk mengaktifkan hak akses masuk mereka."
    ]
  },
  "Verifikasi Pembayaran": {
    desc: "Audit Transaksi Langganan & Investasi (Super Admin)",
    steps: [
      "Fungsi Fitur: Verifikasi berkas gambar bukti pembayaran yang diunggah pengguna.",
      "Alur Penggunaan: Periksa keaslian bukti transfer uang fisik. Klik 'Setujui' untuk mengonfirmasi dana masuk dan mengaktifkan kuota paket langganan atau menambah modal kampanye pendanaan."
    ]
  },
  "Profil Saya": {
    desc: "Pengaturan Akun & Kata Sandi Pengguna",
    steps: [
      "Fungsi Fitur: Mengelola detail informasi login pengguna saat ini.",
      "Alur Penggunaan: Perbarui nama lengkap, alamat email, atau ganti kata sandi secara aman dari form profil."
    ]
  },
  "Status Berlangganan": {
    desc: "Informasi Tagihan & Paket Langganan Dapur",
    steps: [
      "Fungsi Fitur: Memantau masa aktif status langganan dapur mitra.",
      "Alur Penggunaan: Lihat tanggal kedaluwarsa langganan. Lakukan unggah bukti transfer ke rekening platform jika ingin melakukan perpanjangan paket."
    ]
  },
  
  // HALAMAN TAMBAHAN YANG DI-REQUEST:
  "Laporan Distribusi": {
    desc: "Laporan Penerimaan & Status Distribusi Makanan",
    steps: [
      "Fungsi Fitur: Rekapitulasi jumlah porsi makanan yang dikirim dan yang sukses diterima di setiap sekolah.",
      "Alur Penggunaan: Saring data berdasarkan rentang tanggal. Pantau kolom status ('Diterima' / 'Pending') untuk mendeteksi kendala keterlambatan pengantaran kurir di lapangan."
    ]
  },
  "Quick Distribution": {
    desc: "Publikasi Cepat & Pengiriman Instan Makanan",
    steps: [
      "Fungsi Fitur: Memulai rute distribusi porsi makanan instan tanpa proposal siklus menu.",
      "Alur Penggunaan: Pilih titik sekolah tujuan, masukkan jumlah porsi makanan, pilih kurir, dan klik 'Mulai Kirim' untuk mengaktifkan live-tracking map secara instan."
    ]
  },
  "Publikasi Cepat": {
    desc: "Publikasi Cepat & Pengiriman Instan Makanan",
    steps: [
      "Fungsi Fitur: Memulai rute distribusi porsi makanan instan tanpa proposal siklus menu.",
      "Alur Penggunaan: Pilih titik sekolah tujuan, masukkan jumlah porsi makanan, pilih kurir, dan klik 'Mulai Kirim' untuk mengaktifkan live-tracking map secara instan."
    ]
  },
  "Publikasi Distribusi Cepat": {
    desc: "Publikasi Cepat & Pengiriman Instan Makanan",
    steps: [
      "Fungsi Fitur: Memulai rute distribusi porsi makanan instan tanpa proposal siklus menu.",
      "Alur Penggunaan: Pilih titik sekolah tujuan, masukkan jumlah porsi makanan, pilih kurir, dan klik 'Mulai Kirim' untuk mengaktifkan live-tracking map secara instan."
    ]
  },
  "Jurnal Umum": {
    desc: "Pembukuan Buku Jurnal Umum Keuangan Dapur",
    steps: [
      "Fungsi Fitur: Catatan transaksi kronologis keuangan double-entry (Debit & Kredit) secara sistematis.",
      "Alur Penggunaan: Akuntan meninjau seluruh mutasi kas otomatis dan dapat menambahkan entri penyesuaian manual di bawah akun yang sesuai."
    ]
  },
  "Laporan Resume Keuangan": {
    desc: "Laporan Ringkasan Finansial & Laba Rugi (LR)",
    steps: [
      "Fungsi Fitur: Menampilkan rangkuman total pendapatan, pengeluaran bahan baku, biaya operasional, dan laba/rugi bersih dapur.",
      "Alur Penggunaan: Tentukan bulan & tahun laporan, lalu klik 'Tampilkan' untuk menganalisis efisiensi biaya pengeluaran dapur."
    ]
  },
  "Laporan Cetak (PDF)": {
    desc: "Cetak Laporan Keuangan Format PDF Resmi",
    steps: [
      "Fungsi Fitur: Pengeksporan berkas Buku Kas Umum (BKU) dan Buku Pembantu ke format PDF siap cetak.",
      "Alur Penggunaan: Pilih jenis laporan keuangan, pilih periode bulan, lalu tekan tombol 'Cetak PDF' untuk menghasilkan berkas resmi."
    ]
  },
  "Laporan Keuangan": {
    desc: "Ringkasan Laporan Finansial & Pembukuan Kas Dapur",
    steps: [
      "Fungsi Fitur: Mengakses berkas cetak BKU, Buku Pembantu Kas, dan Resume Laba Rugi.",
      "Alur Penggunaan: Pilih sub-menu laporan keuangan yang Anda butuhkan (Buku Kas, Laba Rugi, atau Laporan Pajak) dan saring berdasarkan periode audit."
    ]
  },
  "Riwayat Produksi": {
    desc: "Riwayat Penyelesaian Memasak & Log Makanan",
    steps: [
      "Fungsi Fitur: Menyimpan dokumentasi log tanggal produksi porsi makanan yang telah selesai.",
      "Alur Penggunaan: Cari riwayat berdasarkan nama menu atau filter tanggal untuk memverifikasi volume porsi yang diproduksi dapur pada hari tertentu."
    ]
  },
  "Laporan Kinerja Distribusi": {
    desc: "Analisis Ketepatan Waktu & Rating Layanan Distribusi",
    steps: [
      "Fungsi Fitur: Menyajikan grafik metrik rata-rata durasi pengiriman kurir dan persentase sukses distribusi.",
      "Alur Penggunaan: Analisis tren kecepatan pengiriman makanan untuk mengevaluasi efisiensi kurir atau rute perjalanan yang bermasalah."
    ]
  },
  "Laporan Ringkasan Anggaran": {
    desc: "Analisis Rencana vs Realisasi Belanja Anggaran Dapur",
    steps: [
      "Fungsi Fitur: Perbandingan dana anggaran yang direncanakan di proposal dengan pengeluaran belanja riil.",
      "Alur Penggunaan: Pantau grafik selisih anggaran (variance) untuk memastikan pengeluaran dapur tetap berada di bawah batas pagu dana bantuan."
    ]
  },
  "Manajemen Supplier": {
    desc: "Kemitraan Vendor & Pemasok Bahan Pangan",
    steps: [
      "Fungsi Fitur: Mengelola daftar supplier lokal mitra penyedia bahan makanan.",
      "Alur Penggunaan: Tambahkan supplier baru dengan mengisi nama vendor, kategori bahan (protein/sayur), alamat, dan kontak untuk memudahkan alur Purchase Order."
    ]
  },
  "Manajemen Titik Distribusi": {
    desc: "Manajemen Posyandu & Sekolah Penerima Layanan",
    steps: [
      "Fungsi Fitur: Mengelola lokasi sebaran tujuan pengantaran makanan bergizi.",
      "Alur Penggunaan: Klik 'Tambah Titik', isi nama sekolah/posyandu, alamat detail, koordinat GPS peta, serta jumlah target anak penerima manfaat."
    ]
  },
  "Database Penerima Manfaat": {
    desc: "Basis Data Anak Penerima Program Makan Bergizi",
    steps: [
      "Fungsi Fitur: Menampilkan database lengkap anak penerima bantuan gizi.",
      "Alur Penggunaan: Gunakan kolom pencarian untuk memfilter anak berdasarkan sekolah. Klik detail anak untuk memantau riwayat grafik tinggi/berat badan."
    ]
  },
  "Manajemen Pengguna": {
    desc: "Manajemen Akun Hak Akses Tim & Karyawan",
    steps: [
      "Fungsi Fitur: Mengelola akun login seluruh staf organisasi (Admin, Koki, Akuntan, Kurir).",
      "Alur Penggunaan: Tambahkan anggota tim baru, pilih peran (Role), serta atur status aktif/non-aktif akun untuk mengontrol hak akses masuk mereka."
    ]
  },
  "Manajemen Galeri Dapur": {
    desc: "Dokumentasi Foto Kebersihan & Kegiatan Memasak Dapur",
    steps: [
      "Fungsi Fitur: Galeri album foto kegiatan operasional dan kepatuhan standar sanitasi dapur.",
      "Alur Penggunaan: Unggah foto kebersihan dapur, proses memasak, atau penyajian makanan harian sebagai bukti kepatuhan mutu kepada Yayasan & Donatur."
    ]
  }
};

// Fungsi helper untuk mencocokkan judul halaman dengan kamus panduan secara dua arah (Robust Substring Matching)
const getHelpContent = (title) => {
  if (!title) return null;
  const normalizedTitle = title.toLowerCase().trim();
  const keys = Object.keys(PAGE_GUIDES);
  
  const matchedKey = keys.find(k => {
    const normalizedKey = k.toLowerCase().trim();
    return normalizedTitle.includes(normalizedKey) || normalizedKey.includes(normalizedTitle);
  });
  
  return matchedKey ? PAGE_GUIDES[matchedKey] : null;
};

function PageHeader({ title, buttonText, onButtonClick }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { user } = useAuth();
  const hasButton = buttonText && onButtonClick;
  const help = getHelpContent(title);

  return (
    <div className={`w-full flex items-center mb-6 flex-wrap gap-4 ${hasButton ? "justify-between" : "justify-between"}`}>
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
        {help && (
          <button 
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="text-gray-400 hover:text-intigizi-green p-1 transition-colors duration-200"
            title="Lihat Panduan Halaman Ini"
          >
            <HelpCircle size={20} />
          </button>
        )}
      </div>

      {hasButton && (
        <button onClick={onButtonClick} className="btn-primary">
          <Plus size={20} className="mr-2" />
          {buttonText}
        </button>
      )}

      {/* HELP DRAWER OVERLAY (SLIDE OVER) */}
      {isDrawerOpen && help && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop overlay */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-40 transition-opacity duration-300 backdrop-blur-xs"
            onClick={() => setIsDrawerOpen(false)}
          />

          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            {/* Drawer Panel */}
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out border-l border-gray-100">
              <div className="px-6 py-5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-intigizi-green">
                  <BookOpen size={20} />
                  <h3 className="font-bold text-gray-800 text-lg">Panduan Halaman</h3>
                </div>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                  <h4 className="text-xl font-bold text-gray-800 mb-2">{title}</h4>
                  <p className="text-sm text-gray-500 leading-relaxed">{help.desc}</p>
                </div>

                <div className="bg-green-50 rounded-xl p-4 border border-green-100 flex gap-3 text-intigizi-green-dark">
                  <Info size={20} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-xs uppercase tracking-wider mb-1">Konsep Fitur</h5>
                    <p className="text-xs leading-relaxed text-gray-600">
                      Sistem ini dirancang terintegrasi. Tindakan di halaman ini akan otomatis memengaruhi modul terkait (Stok, Keuangan, Jurnal Kas, dll).
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h5 className="font-bold text-xs text-gray-400 uppercase tracking-wider">
                    Fungsi & Alur Penggunaan:
                  </h5>
                  <ol className="space-y-3.5">
                    {help.steps.map((step, index) => (
                      <li key={index} className="flex gap-3 text-sm text-gray-600 leading-relaxed">
                        <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-intigizi-green bg-opacity-10 text-intigizi-green font-bold text-xs">
                          {index === 0 ? "F" : "A"}
                        </span>
                        <span className="mt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl text-sm transition-colors"
                >
                  Tutup Panduan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PageHeader;
