import React from "react";
import PageHeader from "@/components/PageHeader";
import { Target, Zap, BarChart, HeartHandshake } from "lucide-react";

// Halaman "Tentang Kami" yang sudah disesuaikan dengan branding HIPMI Dapur MBG
function AboutUsPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-6">
      <PageHeader title="Tentang Program" />
      <p className="text-center text-gray-600 -mt-4 mb-12 max-w-3xl mx-auto">
        Kami adalah inisiatif strategis IntiGizi untuk membangun ekosistem
        pangan nasional yang tangguh, efisien, dan berdampak sosial.
      </p>

      <div className="bg-white p-8 rounded-xl shadow-lg mb-12">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center mb-4">
              <Target className="w-12 h-12 text-intigizi-green mr-4" />
              <div>
                <h2 className="text-3xl font-bold text-gray-800">
                  Visi & Misi Program
                </h2>
                <p className="text-gray-500">
                  Memberdayakan Setiap Dapur Profesional.
                </p>
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              <b>Visi kami</b> adalah menjadi sistem operasi terdepan untuk
              setiap dapur komersial, katering, dan layanan gizi, mengubah cara
              mereka merencanakan, memasak, dan melayani.
            </p>
            <p className="text-gray-600">
              <b>Misi kami</b> adalah menyediakan platform digital yang intuitif
              dan terintegrasi untuk menyederhanakan operasional dapur,
              mengoptimalkan biaya, dan menempatkan kualitas gizi sebagai
              prioritas utama.
            </p>
          </div>
          <div className="flex justify-center items-center">
            <img
              src="https://intigizi.taskora.id/uploads/satgasmbg.jpeg"
              alt="Tim IntiGizi"
              className="rounded-lg shadow-md"
            />
          </div>
        </div>

        <div className="border-t my-8"></div>

        <h3 className="font-semibold text-xl text-center mb-6 text-gray-700">
          Nilai-Nilai Inti Program
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <InfoCard
            icon={<Zap className="text-intigizi-green" />}
            title="Efisiensi Berbasis Data"
            description="Mengubah tebakan menjadi keputusan. Dari manajemen stok hingga perencanaan menu, setiap fitur dirancang untuk mengurangi pemborosan dan meningkatkan efisiensi."
          />
          <InfoCard
            icon={<BarChart className="text-intigizi-green" />}
            title="Fokus Pada Gizi"
            description="Kami percaya makanan berkualitas dimulai dari gizi yang terukur. Platform kami memudahkan Anda melacak dan menganalisis nilai gizi dari setiap bahan hingga menu jadi."
          />
          <InfoCard
            icon={<HeartHandshake className="text-intigizi-green" />}
            title="Kemitraan & Pertumbuhan"
            description="Kami bukan hanya penyedia software, tapi mitra pertumbuhan Anda. Kami menyediakan alat, Anda yang menciptakan mahakarya kuliner."
          />
        </div>
      </div>
    </div>
  );
}

const InfoCard = ({ icon, title, description }) => (
  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-start hover:shadow-md transition-shadow">
    <div className="flex-shrink-0 mr-4 mt-1 bg-white p-2 rounded-full shadow-sm">
      {React.cloneElement(icon, { size: 24 })}
    </div>
    <div>
      <h4 className="font-semibold text-gray-800">{title}</h4>
      <p className="text-sm text-gray-600 mt-1">{description}</p>
    </div>
  </div>
);

export default AboutUsPage;
