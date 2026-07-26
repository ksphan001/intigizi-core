import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '@/services/api';
import PageHeader from '@/components/PageHeader.jsx';
import { Search, Loader2, Plus, Star, Calendar, ArrowLeft, CheckCircle, MapPin, Truck, Phone } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';

function MarketplaceSuppliersPage() {
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [connectingId, setConnectingId] = useState(null);

  // Detail & Reviews accordion state
  const [expandedSupplierId, setExpandedSupplierId] = useState(null);
  const [supplierDetails, setSupplierDetails] = useState({}); // Stores catalog + reviews for each supplier ID
  const [detailsLoading, setDetailsLoading] = useState({});

  const fetchSuppliers = async (searchVal = '') => {
    setLoading(true);
    try {
      const url = `http://intigizi-supplier-api.test/app/marketplace_suppliers.php?search=${encodeURIComponent(searchVal)}`;
      const res = await fetch(url);
      const data = await res.json();
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Gagal mengambil data dari Sentra IntiGizi", err);
      showNotification("Gagal mengambil daftar supplier dari Sentra IntiGizi.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers('');
  }, []);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    fetchSuppliers(e.target.value);
  };

  const handleConnectSupplier = async (marketplaceId) => {
    setConnectingId(marketplaceId);
    try {
      const response = await apiClient.post('/sync_marketplace_supplier.php', { marketplace_id: marketplaceId });
      showNotification(response.data.message || "Berhasil menghubungkan supplier!", "success");
      // Go back to the suppliers page
      navigate('/app/suppliers');
    } catch (err) {
      showNotification(err.response?.data?.message || "Gagal menghubungkan supplier dari Sentra IntiGizi.", "error");
    } finally {
      setConnectingId(null);
    }
  };

  const toggleExpandSupplier = async (supplierId) => {
    if (expandedSupplierId === supplierId) {
      setExpandedSupplierId(null);
      return;
    }

    setExpandedSupplierId(supplierId);

    // If details are not loaded yet, fetch them
    if (!supplierDetails[supplierId]) {
      setDetailsLoading(prev => ({ ...prev, [supplierId]: true }));
      try {
        const url = `http://intigizi-supplier-api.test/app/marketplace_suppliers.php?id=${supplierId}`;
        const res = await fetch(url);
        const data = await res.json();
        setSupplierDetails(prev => ({ ...prev, [supplierId]: data }));
      } catch (err) {
        console.error("Gagal memuat detail supplier", err);
        showNotification("Gagal memuat ulasan dan rincian katalog supplier.", "error");
      } finally {
        setDetailsLoading(prev => ({ ...prev, [supplierId]: false }));
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link to="/app/suppliers" className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-gray-800 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-gray-805">Supplier Sentra IntiGizi</h1>
          <p className="text-xs text-gray-400 font-semibold mt-0.5">Cari, tinjau rating ulasan, dan hubungkan supplier dari Sentra IntiGizi ke dapur Anda</p>
        </div>
      </div>

      <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-sm space-y-4">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Cari nama supplier atau nama bahan baku (misal: Melon, Sayur, Daging)..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="input-style w-full pl-10 text-sm py-2.5"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-green-600" size={32} />
          </div>
        ) : suppliers.length === 0 ? (
          <div className="text-center py-20 text-gray-400 italic font-semibold">
            Tidak ada supplier yang tersedia saat ini di Sentra IntiGizi.
          </div>
        ) : (
          <div className="space-y-4">
            {suppliers.map((sup) => (
              <div key={sup.id} className="border border-gray-150 rounded-2xl overflow-hidden shadow-sm bg-white hover:border-gray-300 transition-colors">
                {/* Header Info */}
                <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-extrabold text-gray-800">{sup.supplier_name}</h3>
                      {!!sup.is_verified && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                          Verified Sentra
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-gray-400" />
                        <span className="truncate max-w-[280px]">{sup.address || '-'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Truck size={14} className="text-gray-400" />
                        <span>Radius: {sup.coverage_radius_km || 15} km</span>
                      </div>
                      {sup.phone_number && (
                        <div className="flex items-center gap-1.5">
                          <Phone size={14} className="text-gray-400" />
                          <span>PIC: {sup.contact_person} ({sup.phone_number})</span>
                        </div>
                      )}
                    </div>

                    {/* Stats (Rating, SLA, Process Time) */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-55 border border-gray-200 text-gray-650">
                        ⭐️ {parseFloat(sup.average_rating || 0).toFixed(2)} ({sup.review_count} Ulasan)
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 border border-emerald-150 text-emerald-700">
                        SLA Pengiriman: {parseFloat(sup.sla_score || 100).toFixed(1)}%
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 border border-blue-150 text-blue-700">
                        Proses Kemas: {parseFloat(sup.avg_process_time_hours || 0).toFixed(1)} jam
                      </span>
                    </div>

                    {/* Available matched ingredients snippet */}
                    {sup.matching_ingredients && sup.matching_ingredients.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-dashed border-gray-150">
                        {sup.matching_ingredients.slice(0, 5).map((ing, idx) => (
                          <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded bg-gray-50 text-gray-600 text-[10px] font-bold border border-gray-150">
                            {ing.ingredient_name}
                          </span>
                        ))}
                        {sup.matching_ingredients.length > 5 && (
                          <span className="text-[10px] text-gray-400 font-bold self-center">+{sup.matching_ingredients.length - 5} bahan lainnya</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-2 shrink-0 md:self-center">
                    <button
                      onClick={() => toggleExpandSupplier(sup.id)}
                      className="btn-secondary text-xs font-bold py-2 px-4 whitespace-nowrap cursor-pointer"
                    >
                      {expandedSupplierId === sup.id ? 'Tutup Detail' : 'Detail & Ulasan'}
                    </button>
                    <button
                      onClick={() => handleConnectSupplier(sup.id)}
                      disabled={connectingId === sup.id}
                      className="btn-primary text-xs font-bold py-2 px-4 flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer shadow-lg shadow-green-600/10"
                    >
                      {connectingId === sup.id ? (
                        <Loader2 className="animate-spin" size={14} />
                      ) : (
                        <>
                          <Plus size={14} />
                          <span>Hubungkan ke Dapur</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Accordion Expand Area (Reviews and Catalog Details) */}
                {expandedSupplierId === sup.id && (
                  <div className="border-t border-gray-150 bg-gray-50/50 p-6 space-y-6">
                    {detailsLoading[sup.id] ? (
                      <div className="flex justify-center items-center py-10">
                        <Loader2 className="animate-spin text-green-600" size={24} />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Column 1: Catalog Details */}
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider">Katalog Produk Supplier</h4>
                            <p className="text-[9px] text-gray-400 font-semibold mt-0.5">Daftar bahan makanan yang dipasok oleh supplier ini</p>
                          </div>
                          
                          <div className="bg-white border border-gray-150 rounded-xl overflow-hidden shadow-inner max-h-[300px] overflow-y-auto divide-y divide-gray-100">
                            {supplierDetails[sup.id]?.catalog?.length === 0 ? (
                              <p className="p-4 text-center text-xs text-gray-450 italic font-semibold">Belum ada katalog produk di Sentra IntiGizi.</p>
                            ) : (
                              supplierDetails[sup.id]?.catalog?.map((item) => (
                                <div key={item.id} className="p-3.5 flex justify-between items-center text-xs">
                                  <div>
                                    <span className="font-extrabold text-gray-800 block">{item.ingredient_name}</span>
                                    <span className="text-[10px] text-gray-400 font-bold">Kapasitas Harian: {item.daily_capacity.toLocaleString('id-ID')} {item.unit_symbol}</span>
                                  </div>
                                  <span className="font-black text-green-700 bg-green-50 border border-green-150 px-2.5 py-1 rounded-lg">
                                    Rp {item.base_price.toLocaleString('id-ID')}/{item.unit_symbol}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Column 2: Reviews & Comments */}
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider">Ulasan Dapur Mitra</h4>
                            <p className="text-[9px] text-gray-400 font-semibold mt-0.5">Feedback tertulis dari pengelola dapur gizi lainnya</p>
                          </div>

                          <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar">
                            {!supplierDetails[sup.id]?.reviews || supplierDetails[sup.id]?.reviews?.length === 0 ? (
                              <div className="bg-white border border-gray-150 rounded-xl p-6 text-center text-xs text-gray-400 italic font-semibold">
                                Belum ada ulasan tertulis dari dapur mitra.
                              </div>
                            ) : (
                              supplierDetails[sup.id]?.reviews?.map((rev, idx) => (
                                <div key={idx} className="bg-white border border-gray-150 p-4 rounded-xl shadow-sm hover:shadow transition-shadow">
                                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 mb-2">
                                    <div className="flex items-center gap-2">
                                      <span className="font-extrabold text-xs text-gray-800">{rev.kitchen_name}</span>
                                      <div className="flex items-center text-amber-500 gap-0.5">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                          <Star 
                                            key={i} 
                                            size={10} 
                                            className={i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} 
                                          />
                                        ))}
                                      </div>
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                                      <Calendar size={10} />
                                      {new Date(rev.created_at).toLocaleDateString('id-ID')}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-650 leading-relaxed italic bg-gray-50/50 p-2.5 rounded-lg border border-gray-100/50 font-semibold">
                                    "{rev.comment || 'Hanya memberikan rating bintang.'}"
                                  </p>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MarketplaceSuppliersPage;
