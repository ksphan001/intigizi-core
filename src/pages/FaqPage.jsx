import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqData = [
  {
    question: "Apa itu IntiGizi?",
    answer:
      "IntiGizi adalah platform SaaS (Software as a Service) manajemen dapur terpadu yang dirancang untuk membantu Mitra Dapur, Vendor, dan Investor dalam mengelola operasional, pengadaan, dan pendanaan secara efisien dan transparan.",
  },
  {
    question: "Siapa saja yang bisa menggunakan platform ini?",
    // PERUBAHAN: Teks IntiGizi dihapus, ditambahkan Investor & Calon Mitra
    answer:
      "Platform ini dirancang untuk tiga pengguna utama: 1) Mitra Dapur (pengelola dapur umum, katering, atau layanan gizi), 2) Vendor (pemasok bahan baku), 3) Calon Mitra (yang mencari pendanaan), dan 4) Investor (yang ingin mendanai proyek dapur).",
  },
  {
    question: "Bagaimana cara mendaftar sebagai Mitra Dapur?",
    answer:
      "Anda dapat mendaftar melalui halaman 'Register', memilih opsi 'Mitra Dapur'. Anda akan diminta untuk mengisi data badan hukum, informasi dapur, dan membuat akun administrator. Setelah disetujui oleh Super Admin, Anda dapat mulai menggunakan platform.",
  },
  {
    question: "Bagaimana cara mendaftar sebagai Vendor?",
    answer:
      "Pilih opsi 'Vendor' di halaman 'Register'. Isi profil usaha, kategori, dan lokasi Anda. Setelah disetujui, usaha Anda akan tampil di Direktori Vendor dan dapat menerima Purchase Order (PO) dari Mitra Dapur.",
  },
  {
    question: "Apa itu fitur Pendanaan Dapur?",
    answer:
      "Fitur ini memungkinkan individu atau badan hukum ('Calon Mitra') untuk mengajukan proposal pendanaan untuk membuka dapur baru. Proposal yang disetujui akan dipublikasikan di platform, di mana 'Investor' dapat melihat dan mendanai proyek tersebut.",
  },
  {
    question: "Bagaimana sistem pelacakan distribusi bekerja?",
    answer:
      "Publik dapat mengakses halaman 'Lacak Distribusi', memilih dapur dan tanggal. Sistem akan menampilkan peta real-time yang menunjukkan lokasi dapur utama dan semua titik distribusi yang menerima pasokan pada hari itu, beserta detail menu, jumlah porsi, dan dokumentasi foto.",
  },
  {
    question: "Apakah data saya aman?",
    answer:
      "Ya. Kami menggunakan arsitektur multi-tenant yang berarti data setiap organisasi (Mitra Dapur) terisolasi sepenuhnya. Hanya pengguna yang Anda beri hak akses di dalam organisasi Anda yang dapat melihat data Anda.",
  },
];

const FaqItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full py-5 px-6 text-left"
      >
        {/* PERUBAHAN: Warna teks ke solusimbg-blue */}
        <span className="text-lg font-medium text-intigizi-green">
          {question}
        </span>
        <ChevronDown
          size={24}
          // PERUBAHAN: Warna teks ke solusimbg-blue
          className={`transform transition-transform duration-300 text-intigizi-green ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="pb-5 px-6 text-gray-600 leading-relaxed">{answer}</div>
      </div>
    </div>
  );
};

function FaqPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          {/* PERUBAHAN: Warna teks ke solusimbg-blue */}
          <h1 className="text-4xl font-bold text-intigizi-green mb-4">
            Pertanyaan yang Sering Diajukan (FAQ)
          </h1>
          <p className="text-lg text-gray-600">
            Temukan jawaban atas pertanyaan umum tentang platform IntiGizi.
          </p>
        </div>

        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden border">
          {faqData.map((faq, index) => (
            <FaqItem key={index} question={faq.question} answer={faq.answer} />
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600">
            Tidak menemukan jawaban yang Anda cari?
          </p>
          {/* PERUBAHAN: Warna teks ke solusimbg-blue */}
          <a
            href="mailto:support@intigizi.id"
            className="font-medium text-intigizi-green hover:underline"
          >
            Hubungi Tim Support kami
          </a>
        </div>
      </div>
    </div>
  );
}

export default FaqPage;
