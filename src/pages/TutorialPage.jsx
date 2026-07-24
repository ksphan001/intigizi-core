import React from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import {
  FileText,
  Building,
  Utensils,
  MousePointerClick,
  CheckSquare,
  Clock,
  ArrowRight,
  UserCheck,
  Server,
  Cpu,
  Shield,
  ChefHat,
  Store,
  Database,
  ArrowLeftRight,
  Layers,
  BookOpen,
  Users,
} from "lucide-react";

function TutorialPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto max-w-5xl px-4 py-12">
        <PageHeader title="Panduan Portal IntiGizi" />
        <p className="text-center text-gray-600 -mt-4 mb-12 max-w-3xl mx-auto">
          Selamat datang! Ikuti panduan langkah demi langkah di bawah ini untuk
          memulai perjalanan Anda bersama kami, baik sebagai Mitra Dapur maupun
          sebagai Vendor.
        </p>

        <div className="space-y-16">
          {/* BAGIAN ANALISIS APLIKASI SECARA LENGKAP */}
          <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
            <div className="border-b pb-6 mb-8">
              <span className="bg-intigizi-green bg-opacity-10 text-intigizi-green px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                Analisis Sistem
              </span>
              <h2 className="text-3xl font-extrabold text-gray-800 mt-3 mb-2">
                Hasil Analisis Aplikasi Intigizi: Fungsi, Alur, dan Bagan Sistem
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Dokumen ini menyajikan hasil analisis menyeluruh dari aplikasi{" "}
                <strong className="text-gray-800 font-semibold">Intigizi</strong>, yang terdiri dari Frontend (
                <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm text-red-600">intigizi-core</code> berbasis React + Vite + Tailwind CSS) dan Backend (
                <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm text-red-600">intigizi-api</code> berbasis PHP Procedural + MySQL).
              </p>
            </div>

            {/* 1. Ringkasan Sistem */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-intigizi-green bg-opacity-10 rounded-lg text-intigizi-green">
                  <BookOpen size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-800">
                  1. Ringkasan Sistem (Executive Summary)
                </h3>
              </div>
              <p className="text-gray-600 leading-relaxed ml-11">
                <strong className="text-gray-800 font-semibold">Intigizi</strong> adalah platform ekosistem pengelolaan makanan gizi sehat (seperti program makanan bergizi gratis) yang mengintegrasikan berbagai pemangku kepentingan (<em>stakeholders</em>) dalam satu rantai pasok terpadu. Sistem ini memfasilitasi perencanaan gizi, pemesanan bahan baku dari pemasok lokal, pencatatan transaksi kas keuangan, pelacakan pengiriman makanan bergizi, hingga manajemen investasi/pendanaan dapur mitra.
              </p>
            </div>

            {/* 2. Peran/Aktor Utama dalam Sistem */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-intigizi-orange bg-opacity-10 rounded-lg text-intigizi-orange">
                  <Users size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-800">
                  2. Peran/Aktor Utama dalam Sistem
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 ml-0 md:ml-11">
                {/* Super Admin */}
                <div className="bg-gray-50 p-5 rounded-lg border border-gray-100 flex flex-col items-center text-center">
                  <div className="p-3 bg-red-100 text-red-600 rounded-full mb-3">
                    <Shield size={24} />
                  </div>
                  <h4 className="font-bold text-gray-800 mb-2">Super Admin</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Mengelola kemitraan dapur, memverifikasi registrasi dapur/mitra baru, mengaudit permohonan pendanaan, melacak analitik makro, dan mengelola paket langganan.
                  </p>
                </div>

                {/* Mitra Dapur */}
                <div className="bg-gray-50 p-5 rounded-lg border border-gray-100 flex flex-col items-center text-center">
                  <div className="p-3 bg-green-100 text-intigizi-green rounded-full mb-3">
                    <ChefHat size={24} />
                  </div>
                  <h4 className="font-bold text-gray-800 mb-2">Mitra Dapur (Kitchen)</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Pengguna utama yang mengelola operasional dapur, merencanakan menu bernutrisi, memesan bahan baku ke vendor, mendata penerima manfaat, memproduksi makanan, mendokumentasikan distribusi, dan mencatat Buku Kas Umum.
                  </p>
                </div>

                {/* Vendor / Supplier */}
                <div className="bg-gray-50 p-5 rounded-lg border border-gray-100 flex flex-col items-center text-center">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-full mb-3">
                    <Store size={24} />
                  </div>
                  <h4 className="font-bold text-gray-800 mb-2">Vendor / Supplier</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Menyediakan bahan makanan baku berkualitas, menerima Purchase Order (PO) dari dapur, memperbarui stok barang dagangan, dan mengunggah invoice penagihan pembayaran.
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Bagan & Alur Sistem (Visual Diagram) */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <Layers size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-800">
                  3. Bagan & Alur Interaksi Sistem
                </h3>
              </div>

              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 ml-0 md:ml-11">
                {/* Tech Stack Badge Row */}
                <div className="flex flex-wrap gap-4 justify-center mb-8 border-b pb-6">
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm border text-sm">
                    <Cpu size={16} className="text-indigo-600" />
                    <span className="font-medium text-gray-700">Frontend: React + Vite + Tailwind</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm border text-sm">
                    <ArrowLeftRight size={16} className="text-gray-400" />
                    <span className="text-gray-500 font-mono text-xs">REST APIs</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm border text-sm">
                    <Server size={16} className="text-green-600" />
                    <span className="font-medium text-gray-700">Backend: PHP Procedural</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm border text-sm">
                    <Database size={16} className="text-blue-600" />
                    <span className="font-medium text-gray-700">Database: MySQL</span>
                  </div>
                </div>

                {/* System Interaction Flow Diagram */}
                <div className="flex flex-col md:flex-row items-stretch justify-center gap-4">
                  {/* Step 1: Admin & Verification */}
                  <div className="flex-1 bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div>
                      <span className="bg-red-50 text-red-700 text-xs px-2 py-0.5 rounded font-semibold">Fase 1</span>
                      <h5 className="font-bold text-gray-800 mt-2 mb-1">Registrasi & Verifikasi</h5>
                      <p className="text-xs text-gray-500">
                        Mitra Dapur & Vendor mendaftar secara online. Super Admin memverifikasi keabsahan data organisasi sebelum memberi hak akses penuh.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-dashed flex justify-center text-red-500">
                      <Shield size={20} />
                    </div>
                  </div>

                  {/* Arrow Indicator */}
                  <div className="flex items-center justify-center text-gray-300">
                    <ArrowRight className="rotate-90 md:rotate-0" />
                  </div>

                  {/* Step 2: Operational & PO */}
                  <div className="flex-1 bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div>
                      <span className="bg-green-50 text-intigizi-green text-xs px-2 py-0.5 rounded font-semibold">Fase 2</span>
                      <h5 className="font-bold text-gray-800 mt-2 mb-1">Operasional & Pengadaan</h5>
                      <p className="text-xs text-gray-500">
                        Dapur merencanakan menu gizi dan sistem otomatis menghasilkan kebutuhan bahan baku. PO dikirimkan langsung ke Vendor terpilih.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-dashed flex justify-center text-intigizi-green">
                      <ChefHat size={20} />
                    </div>
                  </div>

                  {/* Arrow Indicator */}
                  <div className="flex items-center justify-center text-gray-300">
                    <ArrowRight className="rotate-90 md:rotate-0" />
                  </div>

                  {/* Step 3: Logistics & Financials */}
                  <div className="flex-1 bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div>
                      <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded font-semibold">Fase 3</span>
                      <h5 className="font-bold text-gray-800 mt-2 mb-1">Produksi, Distribusi & BKU</h5>
                      <p className="text-xs text-gray-500">
                        Dapur memproduksi makanan sehat, melacak distribusi porsi secara real-time via koordinat GPS, dan mencatat transaksi kas di Buku Kas Umum.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-dashed flex justify-center text-blue-500">
                      <Store size={20} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <TutorialSection
            icon={<Building className="w-12 h-12 text-intigizi-green" />}
            title="Panduan untuk Mitra Dapur"
            description="Untuk Anda yang telah memiliki dapur dan siap beroperasi."
            imageSrc="https://mbg.taskora.id/uploads/intigizi-dashboard.png"
            steps={[
              {
                icon: <MousePointerClick />,
                title: "1. Pilih Tipe Pendaftaran",
                text: "Pada halaman registrasi, pilih opsi 'Mitra Dapur' untuk membuka formulir yang sesuai.",
              },
              {
                icon: <FileText />,
                title: "2. Lengkapi Formulir",
                text: "Isi semua informasi yang diperlukan, termasuk detail organisasi, data PIC, dan informasi dapur utama Anda.",
              },
              {
                icon: <Clock />,
                title: "3. Tunggu Persetujuan Admin",
                text: "Setelah mendaftar, akun Anda akan ditinjau dan diverifikasi oleh tim kami sebelum dapat diaktifkan.",
              },
            ]}
            nextSteps={[
              {
                icon: <ArrowRight />,
                text: "Mulai buat Proposal pertamamu di menu Operasional setelah akun disetujui.",
              },
              {
                icon: <ArrowRight />,
                text: "Tambahkan anggota tim Anda di menu Manajemen Pengguna.",
              },
            ]}
          />

          <TutorialSection
            icon={<Utensils className="w-12 h-12 text-intigizi-orange" />}
            title="Panduan untuk Vendor"
            description="Untuk penyedia bahan baku, peralatan, atau jasa yang ingin menjadi rekanan."
            imageSrc="https://mbg.taskora.id/uploads/profil-vendor.png
"
            steps={[
              {
                icon: <MousePointerClick />,
                title: "1. Pilih Tipe Pendaftaran",
                text: "Pilih opsi 'Vendor' pada halaman registrasi untuk menampilkan formulir pendaftaran khusus.",
              },
              {
                icon: <FileText />,
                title: "2. Lengkapi Profil Usaha",
                text: "Isi detail usaha Anda, pilih kategori yang sesuai, dan buat akun PIC yang akan mengelola portal vendor.",
              },
              {
                icon: <UserCheck />,
                title: "3. Tunggu Persetujuan",
                text: "Pendaftaran Vendor akan ditinjau dan diverifikasi terlebih dahulu oleh tim kami sebelum akun Anda diaktifkan.",
              },
            ]}
            nextSteps={[
              {
                icon: <ArrowRight />,
                text: "Lengkapi Profil & Portofolio Anda setelah akun disetujui.",
              },
              {
                icon: <ArrowRight />,
                text: "Nantikan pesanan (Purchase Order) dari Mitra Dapur.",
              },
            ]}
          />
        </div>

        <div className="mt-20 text-center bg-white p-8 rounded-lg border shadow-md">
          <h3 className="text-2xl font-bold text-gray-800">
            Siap untuk Bergabung?
          </h3>
          <p className="text-gray-600 mt-2 mb-6">
            Prosesnya cepat dan mudah. Jadilah bagian dari ekosistem pangan yang
            lebih efisien sekarang juga.
          </p>
          <Link to="/register" className="btn-primary px-8 py-3 text-lg">
            Daftar Sekarang
          </Link>
        </div>
      </div>
    </div>
  );
}

const TutorialSection = ({
  icon,
  title,
  description,
  steps,
  nextSteps,
  imageSrc,
}) => (
  <div className="bg-white p-8 rounded-xl shadow-lg">
    <div className="flex flex-col md:flex-row md:items-center mb-6">
      <div className="flex-shrink-0 mr-6 mb-4 md:mb-0">{icon}</div>
      <div>
        <h2 className="text-3xl font-bold text-gray-800">{title}</h2>
        <p className="text-gray-500">{description}</p>
      </div>
    </div>
    <div className="border-t pt-6 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
      <div>
        <h3 className="font-semibold text-lg text-gray-700 mb-4">
          Langkah Pendaftaran:
        </h3>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start">
              <div className="flex-shrink-0 mr-4 mt-1 text-intigizi-green">
                {React.cloneElement(step.icon, { size: 20 })}
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">{step.title}</h4>
                <p className="text-sm text-gray-600">{step.text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 border-t pt-4">
          <h4 className="font-semibold text-gray-700 mb-2">
            Setelah Mendaftar:
          </h4>
          <ul className="space-y-2 text-sm text-gray-600">
            {nextSteps.map((step, index) => (
              <li key={index} className="flex items-center">
                <ArrowRight size={14} className="mr-2 text-intigizi-orange" />
                {step.text}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="flex justify-center items-center">
        <img
          src={imageSrc}
          alt={title}
          className="rounded-lg shadow-md max-h-80"
        />
      </div>
    </div>
  </div>
);

export default TutorialPage;
