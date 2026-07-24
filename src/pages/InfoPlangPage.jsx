import React from "react";
import PageHeader from "@/components/PageHeader";
import { Award, Shield, Star, Annoyed } from "lucide-react";

function InfoPlangPage() {
  return (
    <div className="bg-gray-50">
      <div className="container mx-auto max-w-5xl px-4 py-6">
        <PageHeader title="Sertifikasi Mitra IntiGizi" />
        <p className="text-center text-gray-600 -mt-4 mb-12 max-w-3xl mx-auto">
          Sebagai bagian dari standardisasi dan identitas program, setiap Mitra
          Dapur yang terverifikasi akan mendapatkan lencana dan sertifikat
          digital resmi IntiGizi.
        </p>

        <div className="bg-white p-8 rounded-xl shadow-lg">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="flex justify-center items-center">
              <img
                src="/intigizi-logo.png"
                alt="Logo intiGizi"
                className="rounded-lg max-w-xs w-full"
              />
            </div>
            <div>
              <div className="flex items-center mb-4">
                <Award className="w-12 h-12 text-solusimbg-gold mr-4" />
                <div>
                  <h2 className="text-3xl font-bold text-gray-800">
                    Lencana Mitra Terverifikasi
                  </h2>
                  <p className="text-gray-500">
                    Identitas & Kebanggaan Digital Anda.
                  </p>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                Sertifikat ini bukan sekadar penanda, melainkan simbol komitmen,
                kualitas, dan kepercayaan. Ini menandakan bahwa dapur Anda
                adalah bagian resmi dari jaringan IntiGizi yang terpercaya dan
                berstandar.
              </p>
              <div className="bg-green-50 border-l-4 border-green-500 text-green-800 p-4 rounded-r-lg">
                <div className="flex">
                  <div className="py-1">
                    <Shield className="h-6 w-6 text-green-500 mr-4" />
                  </div>
                  <div>
                    <p className="font-bold">Keaslian Terjamin</p>
                    <p className="text-sm">
                      Setiap mitra terverifikasi akan mendapatkan lencana
                      digital yang dapat ditampilkan di profil publik dan materi
                      promosi Anda untuk meningkatkan kepercayaan.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t my-8"></div>

          <h3 className="font-semibold text-xl text-center mb-6 text-gray-700">
            Manfaat Sertifikasi IntiGizi
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoCard
              icon={<Shield className="text-intigizi-green" />}
              title="Meningkatkan Kepercayaan"
              description="Menunjukkan kepada publik bahwa dapur Anda telah terverifikasi dan beroperasi sesuai standar yang ditetapkan oleh IntiGizi."
            />
            <InfoCard
              icon={<Star className="text-intigizi-green" />}
              title="Standardisasi & Kualitas"
              description="Menjadi penanda bahwa operasional dapur Anda mengikuti praktik terbaik (SOP) untuk efisiensi dan kualitas gizi."
            />
          </div>
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

export default InfoPlangPage;
