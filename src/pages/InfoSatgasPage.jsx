import React from "react";
import {
  ShieldCheck,
  TrendingUp,
  Users,
  Target,
  Zap,
  HeartHandshake,
  Utensils,
  Truck,
  PiggyBank,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { Link } from "react-router-dom";

function InfoSatgasPage() {
  return (
    <div className="bg-white font-sans text-gray-800 selection:bg-intigizi-green-light selection:text-intigizi-green-dark">
      {/* 1. HERO SECTION: Clean & Impactful */}
      <section className="relative pt-24 pb-20 overflow-hidden bg-gradient-to-b from-intigizi-green-light/30 to-white">
        <div className="container mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center space-x-2 bg-white border border-intigizi-green-light rounded-full px-4 py-1.5 mb-8 shadow-sm">
            <span className="text-sm font-semibold text-intigizi-green-dark tracking-wide uppercase">
              Tentang IntiGizi
            </span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
            Membangun Standar Baru{" "}
            <span className="text-intigizi-green">Ekosistem Pangan</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Kami adalah platform teknologi yang menghubungkan dapur profesional,
            penyedia bahan baku, dan pemodal untuk menciptakan rantai pasok
            pangan yang lebih efisien, transparan, dan berdampak.
          </p>
        </div>

        {/* Background Elements */}
        <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-intigizi-green/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-intigizi-orange/10 rounded-full blur-3xl -z-10"></div>
      </section>

      {/* 2. VISION & MISSION */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="bg-intigizi-green-light rounded-3xl h-[400px] flex items-center justify-center relative overflow-hidden group">
                <img
                  src="https://mbg.taskora.id/uploads/satgasmbg.jpeg"
                  alt="Tim IntiGizi"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-white/50">
                  <div className="flex items-center gap-3">
                    <div className="bg-intigizi-green p-2 rounded-full text-white">
                      <CheckCircle size={20} />
                    </div>
                    <p className="font-semibold text-intigizi-green-dark">
                      Komitmen pada Kualitas
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Misi Kami
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Menyediakan infrastruktur digital yang memungkinkan dapur
                komersial beroperasi dengan standar industri tinggi, menekan
                pemborosan, dan memastikan setiap hidangan yang disajikan
                bergizi dan aman.
              </p>

              <div className="space-y-6">
                <MissionItem
                  title="Digitalisasi Menyeluruh"
                  desc="Mengubah pencatatan manual menjadi data real-time yang akurat."
                />
                <MissionItem
                  title="Transparansi Rantai Pasok"
                  desc="Memastikan asal-usul bahan baku dan alokasi dana yang jelas."
                />
                <MissionItem
                  title="Pemberdayaan UMKM"
                  desc="Membantu dapur skala kecil & menengah naik kelas menjadi industri."
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. OUR ECOSYSTEM (The Core Functions) */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Satu Platform, Tiga Pilar
            </h2>
            <p className="text-gray-600 text-lg">
              Ekosistem IntiGizi dirancang untuk mengintegrasikan seluruh
              pemangku kepentingan dalam industri pangan.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <EcosystemCard
              icon={<Utensils className="text-white" size={32} />}
              color="bg-intigizi-green"
              title="Mitra Dapur"
              desc="Operator dapur yang memproduksi makanan. Kami bantu kelola stok, resep, dan pesanan secara efisien."
            />
            <EcosystemCard
              icon={<Truck className="text-white" size={32} />}
              color="bg-intigizi-orange"
              title="Vendor Bahan"
              desc="Pemasok bahan baku terverifikasi. Terhubung langsung dengan ribuan dapur tanpa perantara."
            />
            <EcosystemCard
              icon={<PiggyBank className="text-white" size={32} />}
              color="bg-intigizi-green-dark"
              title="Investor"
              desc="Pemberi modal untuk operasional dapur. Pantau penggunaan dana dan ROI secara transparan."
            />
          </div>
        </div>
      </section>

      {/* 4. VALUES GRID */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Nilai Inti Kami
              </h2>
              <p className="text-gray-600">
                Prinsip yang menjadi landasan setiap fitur yang kami bangun.
              </p>
            </div>
            <Link
              to="/register"
              className="text-intigizi-green font-bold hover:text-intigizi-green-dark flex items-center gap-2 group transition-colors"
            >
              Bergabung Sekarang{" "}
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <ValueCard
              icon={<Zap />}
              title="Efisien"
              desc="Memangkas birokrasi dan proses manual yang lambat."
            />
            <ValueCard
              icon={<ShieldCheck />}
              title="Aman"
              desc="Standar keamanan pangan dan data yang ketat."
            />
            <ValueCard
              icon={<TrendingUp />}
              title="Terukur"
              desc="Setiap porsi dan rupiah dapat dipertanggungjawabkan."
            />
            <ValueCard
              icon={<HeartHandshake />}
              title="Kolaboratif"
              desc="Tumbuh bersama dalam satu ekosistem yang sehat."
            />
          </div>
        </div>
      </section>

      {/* 5. CTA SECTION */}
      <section className="py-20 bg-intigizi-green-dark text-white text-center">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold mb-6">
            Siap Menjadi Bagian dari Perubahan?
          </h2>
          <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto">
            Baik Anda mengelola dapur, menyuplai bahan, atau ingin berinvestasi
            di sektor pangan, IntiGizi adalah tempatnya.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/register"
              className="bg-intigizi-orange hover:bg-intigizi-orange-dark text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
            >
              Mulai Sekarang
            </Link>
            <Link
              to="/contact"
              className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-xl font-semibold backdrop-blur-sm transition-all border border-white/20"
            >
              Hubungi Kami
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

// Sub-components
const MissionItem = ({ title, desc }) => (
  <div className="flex items-start gap-4">
    <div className="min-w-[40px] h-10 w-10 rounded-full bg-intigizi-green-light flex items-center justify-center text-intigizi-green-dark">
      <CheckCircle size={20} />
    </div>
    <div>
      <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
      <p className="text-gray-600">{desc}</p>
    </div>
  </div>
);

const EcosystemCard = ({ icon, color, title, desc }) => (
  <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:border-intigizi-green/30 hover:-translate-y-1 transition-all duration-300">
    <div
      className={`${color} w-14 h-14 rounded-xl flex items-center justify-center mb-6 shadow-md`}
    >
      {icon}
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{desc}</p>
  </div>
);

const ValueCard = ({ icon, title, desc }) => (
  <div className="bg-gray-50 hover:bg-white p-6 rounded-xl transition-all duration-300 hover:shadow-lg border border-transparent hover:border-gray-100 group">
    <div className="text-intigizi-green mb-4 transform group-hover:scale-110 transition-transform">
      {React.cloneElement(icon, { size: 32 })}
    </div>
    <h4 className="font-bold text-gray-900 mb-2">{title}</h4>
    <p className="text-sm text-gray-600">{desc}</p>
  </div>
);

export default InfoSatgasPage;
