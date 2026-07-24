import React from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle,
  Rocket,
  ShieldCheck,
  TrendingUp,
  Send,
  FileCheck,
  Award,
  Users,
  ArrowRight,
  PiggyBank,
  Briefcase,
} from "lucide-react";

const FeatureCard = ({ icon, title, description, color }) => (
  <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
    <div
      className={`${color} w-14 h-14 rounded-xl flex items-center justify-center mb-6 shadow-md transform group-hover:scale-110 transition-transform`}
    >
      {icon}
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </div>
);

const ProcessStep = ({ icon, title, description, stepNumber }) => (
  <div className="relative pl-10 md:pl-0">
    <div className="md:hidden absolute left-0 top-0 bottom-0 w-0.5 bg-gray-200"></div>
    <div className="md:hidden absolute left-[-5px] top-0 w-3 h-3 rounded-full bg-intigizi-green"></div>

    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-intigizi-green/30 transition-colors">
      <div className="absolute top-0 right-0 bg-gray-50 px-3 py-1 rounded-bl-xl text-lg font-bold text-gray-300 group-hover:text-intigizi-green transition-colors">
        0{stepNumber}
      </div>
      <div className="bg-intigizi-green-light w-12 h-12 rounded-full flex items-center justify-center text-intigizi-green-dark mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  </div>
);

function InfoPermodalanPage() {
  return (
    <div className="bg-white font-sans text-gray-800 selection:bg-intigizi-green-light selection:text-intigizi-green-dark">
      {/* 1. HERO SECTION */}
      <section className="relative pt-24 pb-20 overflow-hidden bg-gradient-to-b from-intigizi-green-light/30 to-white">
        <div className="container mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center space-x-2 bg-white border border-intigizi-green-light rounded-full px-4 py-1.5 mb-8 shadow-sm">
            <span className="text-sm font-semibold text-intigizi-green-dark tracking-wide uppercase">
              Program Akses Modal
            </span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
            Akselerasi Pertumbuhan{" "}
            <span className="text-intigizi-green">Dapur Anda</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed mb-10">
            Dapatkan dukungan finansial yang Anda butuhkan untuk berkembang,
            berinovasi, dan melayani lebih banyak penerima manfaat melalui
            ekosistem IntiGizi.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="btn-primary px-8 py-3.5 text-lg shadow-lg shadow-intigizi-green/20"
            >
              Ajukan Pendanaan
            </Link>
            <Link
              to="/funding"
              className="px-8 py-3.5 text-lg font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2"
            >
              <PiggyBank size={20} className="text-intigizi-orange" />
              Lihat Proyek Aktif
            </Link>
          </div>
        </div>

        {/* Background Elements */}
        <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-intigizi-green/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-intigizi-orange/10 rounded-full blur-3xl -z-10"></div>
      </section>

      {/* 2. WHY GIZINOW */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Mengapa Mencari Modal di IntiGizi?
            </h2>
            <p className="text-gray-600 text-lg">
              Platform kami menghubungkan dapur potensial dengan investor yang
              peduli pada dampak sosial dan keberlanjutan.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <FeatureCard
              icon={<Rocket className="text-white" />}
              color="bg-intigizi-orange"
              title="Ekspansi Operasional"
              description="Tingkatkan kapasitas produksi, perbarui peralatan, dan perluas jangkauan dapur Anda untuk melayani lebih banyak penerima manfaat."
            />
            <FeatureCard
              icon={<Briefcase className="text-white" />}
              color="bg-intigizi-green"
              title="Peningkatan Profesionalisme"
              description="Dengan dukungan modal, standarisasi dapur Anda sesuai dengan standar industri tertinggi untuk kualitas dan efisiensi."
            />
            <FeatureCard
              icon={<Users className="text-white" />}
              color="bg-intigizi-green-dark"
              title="Dampak Sosial Luas"
              description="Jangkau lebih banyak komunitas dan berikan kontribusi positif yang lebih besar dengan operasional yang lebih kuat dan stabil."
            />
            <FeatureCard
              icon={<ShieldCheck className="text-white" />}
              color="bg-purple-500"
              title="Kredibilitas Tinggi"
              description="Dukungan dari program IntiGizi meningkatkan kredibilitas usaha Anda di mata investor dan mitra potensial lainnya."
            />
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS */}
      <section className="py-24 bg-gray-50 relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-block bg-white px-4 py-1 rounded-full text-intigizi-orange font-bold text-sm mb-4 shadow-sm">
              SIMPLE PROCESS
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Alur Pengajuan Dana
            </h2>
            <p className="text-gray-600 text-lg">
              Kami merancang proses yang transparan dan efisien agar Anda bisa
              fokus pada pengembangan bisnis.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 relative">
            {/* Connecting Line Desktop */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -z-10 -translate-y-1/2"></div>

            <ProcessStep
              stepNumber="1"
              icon={<Send size={20} />}
              title="Daftar & Isi Form"
              description="Buat akun sebagai 'Calon Mitra' dan lengkapi profil serta proposal pengajuan dana Anda."
            />
            <ProcessStep
              stepNumber="2"
              icon={<FileCheck size={20} />}
              title="Verifikasi & Publikasi"
              description="Tim kami memvalidasi data Anda. Jika lolos, proyek akan diterbitkan untuk menarik investor."
            />
            <ProcessStep
              stepNumber="3"
              icon={<Award size={20} />}
              title="Pendanaan Cair"
              description="Setelah target dana tercapai, dana dicairkan dan Anda siap mengeksekusi rencana bisnis."
            />
          </div>
        </div>
      </section>

      {/* 4. REQUIREMENTS */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
              <img
                src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1632&q=80"
                alt="Meeting"
                className="rounded-3xl shadow-2xl object-cover h-[500px] w-full"
              />
            </div>
            <div className="lg:w-1/2">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Persyaratan Dasar
              </h2>
              <p className="text-gray-600 mb-8 text-lg">
                Sebelum mengajukan, pastikan Anda memenuhi kriteria berikut
                untuk mempercepat proses verifikasi.
              </p>

              <ul className="space-y-6">
                <RequirementItem
                  title="Akun Calon Mitra"
                  desc="Wajib mendaftar sebagai Calon Mitra di platform IntiGizi."
                />
                <RequirementItem
                  title="Legalitas Usaha"
                  desc="Memiliki dokumen badan usaha (PT/CV) atau identitas perorangan yang valid."
                />
                <RequirementItem
                  title="Rencana Bisnis Jelas"
                  desc="Proposal penggunaan dana yang terperinci dan proyeksi dampak yang terukur."
                />
                <RequirementItem
                  title="Komitmen Integritas"
                  desc="Bersedia mengikuti standar pelaporan dan transparansi IntiGizi."
                />
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CTA */}
      <section className="py-20 bg-intigizi-green-dark text-white text-center">
        <div className="container mx-auto px-6 max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
            Jangan Tunda Pertumbuhan Dapur Anda.
          </h2>
          <p className="text-xl text-white/80 mb-10">
            Bergabunglah dengan ekosistem yang mendukung visi Anda untuk
            menyediakan pangan berkualitas.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/register"
              className="bg-white text-intigizi-green-dark px-10 py-4 rounded-xl font-bold text-lg shadow-xl hover:bg-gray-100 transition-all transform hover:-translate-y-1"
            >
              Daftar Calon Mitra
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

const RequirementItem = ({ title, desc }) => (
  <div className="flex gap-4">
    <div className="bg-intigizi-green-light min-w-[32px] h-8 w-8 rounded-full flex items-center justify-center text-intigizi-green-dark mt-1">
      <CheckCircle size={18} />
    </div>
    <div>
      <h4 className="font-bold text-gray-900 text-lg">{title}</h4>
      <p className="text-gray-600">{desc}</p>
    </div>
  </div>
);

export default InfoPermodalanPage;
