import React, { useState, useEffect, useCallback, useMemo } from 'react';
import apiClient from '@/services/api';
import PageHeader from '@/components/PageHeader.jsx';
import Modal from '@/components/Modal.jsx';
import SupplierForm from '@/components/SupplierForm.jsx';
import ConfirmationModal from '@/components/ConfirmationModal.jsx';
import Pagination from '@/components/Pagination.jsx';
import { Edit, Trash2, Search, BookOpen, Truck, Loader2, Plus, MessageCircle } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';
import SearchableSelect from '@/components/SearchableSelect.jsx';

const ITEMS_PER_PAGE = 10;

function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [deletingSupplierId, setDeletingSupplierId] = useState(null);

  // States for Supplier Catalog Modal
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [catalogSupplier, setCatalogSupplier] = useState(null);
  const [catalogItems, setCatalogItems] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  
  const [allIngredients, setAllIngredients] = useState([]);
  const [selectedIngToAdd, setSelectedIngToAdd] = useState('');

  // Marketplace Integration States
  const [isMarketplaceModalOpen, setIsMarketplaceModalOpen] = useState(false);
  const [marketplaceSuppliers, setMarketplaceSuppliers] = useState([]);
  const [marketplaceLoading, setMarketplaceLoading] = useState(false);
  const [marketplaceSearch, setMarketplaceSearch] = useState('');
  const [connectingId, setConnectingId] = useState(null);

  const { showNotification } = useNotification();

  const fetchMarketplaceSuppliers = async (searchVal = '') => {
    setMarketplaceLoading(true);
    try {
      const url = `http://intigizi-supplier-api.test/app/marketplace_suppliers.php?search=${encodeURIComponent(searchVal)}`;
      const res = await fetch(url);
      const data = await res.json();
      setMarketplaceSuppliers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Gagal mengambil data dari Marketplace", err);
      showNotification("Gagal mengambil daftar supplier dari Marketplace.", "error");
    } finally {
      setMarketplaceLoading(false);
    }
  };

  const openMarketplaceModal = () => {
    setIsMarketplaceModalOpen(true);
    setMarketplaceSearch('');
    fetchMarketplaceSuppliers('');
  };

  const handleConnectSupplier = async (marketplaceId) => {
    setConnectingId(marketplaceId);
    try {
      const response = await apiClient.post('/sync_marketplace_supplier.php', { marketplace_id: marketplaceId });
      showNotification(response.data.message || "Berhasil menghubungkan supplier!", "success");
      fetchSuppliers();
      setIsMarketplaceModalOpen(false);
    } catch (err) {
      showNotification(err.response?.data?.message || "Gagal menghubungkan supplier dari Marketplace.", "error");
    } finally {
      setConnectingId(null);
    }
  };

  const getWhatsAppLink = (phone) => {
    if (!phone) return '';
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.slice(1);
    } else if (cleaned.startsWith('8')) {
      cleaned = '62' + cleaned;
    }
    return `https://wa.me/${cleaned}`;
  };

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/suppliers_get.php');
      setSuppliers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError('Gagal memuat data supplier.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const filteredSuppliers = useMemo(() => {
    if (!searchQuery) {
      return suppliers;
    }
    return suppliers.filter(supplier =>
      supplier.supplier_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [suppliers, searchQuery]);

  const totalPages = Math.ceil(filteredSuppliers.length / ITEMS_PER_PAGE);
  const paginatedSuppliers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSuppliers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, filteredSuppliers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const openAddModal = () => {
    setEditingSupplier(null);
    setIsModalOpen(true);
  };

  const openEditModal = (supplier) => {
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const openDeleteConfirm = (id) => {
    setDeletingSupplierId(id);
    setIsConfirmModalOpen(true);
  };

  const handleSave = async (supplierData) => {
    const endpoint = supplierData.id ? '/suppliers_update.php' : '/suppliers_create.php';
    await apiClient.post(endpoint, supplierData);
    setIsModalOpen(false);
    fetchSuppliers();
  };

  const handleDelete = async () => {
    await apiClient.post('/suppliers_delete.php', { id: deletingSupplierId });
    setIsConfirmModalOpen(false);
    setDeletingSupplierId(null);
    fetchSuppliers();
  };

  // Catalog CRUD handlers
  const openCatalogModal = async (supplier) => {
    setCatalogSupplier(supplier);
    setIsCatalogModalOpen(true);
    setCatalogLoading(true);
    setError('');
    setSelectedIngToAdd('');
    try {
      const response = await apiClient.get(`/supplier_ingredients_manage.php?supplier_id=${supplier.id}`);
      const data = Array.isArray(response.data) ? response.data : [];
      setAllIngredients(data);
      setCatalogItems(data.filter(item => item.is_supplied === 1));
    } catch (err) {
      setError("Gagal memuat katalog bahan baku supplier.");
    } finally {
      setCatalogLoading(false);
    }
  };

  const handleCatalogItemChange = (index, field, value) => {
    const updated = [...catalogItems];
    updated[index][field] = value;
    setCatalogItems(updated);
  };

  const handleAddIngredientToCatalog = () => {
    if (!selectedIngToAdd) return;
    const target = allIngredients.find(ai => ai.ingredient_id.toString() === selectedIngToAdd.toString());
    if (target) {
      setCatalogItems(prev => [
        ...prev,
        {
          ...target,
          is_supplied: 1,
          base_price: target.base_price || 0,
          daily_capacity: target.daily_capacity || 0
        }
      ]);
      setSelectedIngToAdd('');
    }
  };

  const handleRemoveFromCatalog = (index) => {
    const updated = [...catalogItems];
    updated.splice(index, 1);
    setCatalogItems(updated);
  };

  const handleSaveCatalog = async (e) => {
    e.preventDefault();
    setCatalogLoading(true);
    setError('');
    try {
      await apiClient.post('/supplier_ingredients_manage.php', {
        action: 'save',
        supplier_id: catalogSupplier.id,
        items: catalogItems
      });
      setIsCatalogModalOpen(false);
      if (showNotification) {
        showNotification('Katalog supplier berhasil disimpan.', 'success');
      } else {
        alert('Katalog supplier berhasil disimpan.');
      }
    } catch (err) {
      setError("Gagal menyimpan katalog bahan baku supplier.");
    } finally {
      setCatalogLoading(false);
    }
  };

  // Filter out ingredients that are already in the catalog
  const availableIngredients = useMemo(() => {
    return allIngredients.filter(ai => 
      !catalogItems.some(ci => ci.ingredient_id === ai.ingredient_id)
    );
  }, [allIngredients, catalogItems]);

  const ingredientOptions = useMemo(() => {
    return availableIngredients.map(ing => ({
      value: ing.ingredient_id,
      label: ing.ingredient_name
    }));
  }, [availableIngredients]);

  if (error && !isCatalogModalOpen) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div>
      <PageHeader
        title="Manajemen Supplier"
      />
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-6">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Cari nama supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-style w-full pl-10"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={openAddModal}
              className="btn-primary flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <Plus size={18} />
              <span>Tambah Manual</span>
            </button>
            <button
              onClick={openMarketplaceModal}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 rounded-xl text-sm font-bold transition-all whitespace-nowrap shadow-sm"
            >
              <Plus size={18} />
              <span>Hubungkan Marketplace</span>
            </button>
          </div>
        </div>

        {loading ? <p>Memuat data...</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3">Nama Supplier</th>
                  <th scope="col" className="px-6 py-3">Cakupan Layanan</th>
                  <th scope="col" className="px-6 py-3">Kontak Person</th>
                  <th scope="col" className="px-6 py-3">User Terhubung</th>
                  <th scope="col" className="px-6 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSuppliers.length > 0 ? paginatedSuppliers.map((item) => (
                  <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                    <th scope="row" className="px-6 py-4 font-medium text-gray-900">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold">{item.supplier_name}</span>
                        {item.marketplace_id ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            B2B Marketplace
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                            Manual
                          </span>
                        )}
                        {!!item.is_verified && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-green-50 text-green-700 border border-green-200">
                            Verified
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 font-normal">{item.address}</div>
                    </th>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-700">
                        <Truck size={14} className="text-gray-400" />
                        <span>Radius: <strong>{item.coverage_radius_km || 15} km</strong></span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {(!item.coverage_area_desc || item.coverage_area_desc === '0') ? 'Semua Wilayah' : item.coverage_area_desc}
                      </div>
                      {item.latitude && item.longitude && (
                        <div className="text-[10px] text-gray-400 font-mono mt-1">
                          GPS: {item.latitude}, {item.longitude}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-800">
                      <div className="flex items-center gap-1.5">
                        <span>{item.contact_person}</span>
                        {item.supplier_phone && (
                          <a
                            href={getWhatsAppLink(item.supplier_phone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 bg-green-100 hover:bg-green-200 text-green-600 rounded transition-colors"
                            title={`Hubungi ${item.contact_person} di WA: ${item.supplier_phone}`}
                          >
                            <MessageCircle size={13} />
                          </a>
                        )}
                      </div>
                      {item.supplier_phone && (
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">{item.supplier_phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs">{item.username}</td>
                    <td className="px-6 py-4 flex justify-end space-x-2 items-center">
                      <button 
                        onClick={() => openCatalogModal(item)} 
                        className="text-xs font-bold text-intigizi-green bg-green-50 hover:bg-green-100 border border-green-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                        title="Atur Katalog Bahan"
                      >
                        <BookOpen size={14} />
                        <span>Katalog</span>
                      </button>
                      {!item.marketplace_id ? (
                        <button onClick={() => openEditModal(item)} className="p-1.5 text-blue-600 hover:text-blue-800 border border-transparent hover:border-gray-200 rounded-lg transition-all" title="Edit Profil Supplier"><Edit size={16}/></button>
                      ) : (
                        <span className="p-1.5 text-gray-300 cursor-not-allowed" title="Profil Supplier Marketplace Terpusat (Tidak Dapat Diedit Dapur)"><Edit size={16}/></span>
                      )}
                      <button 
                        onClick={() => openDeleteConfirm(item.id)} 
                        className="p-1.5 text-red-600 hover:text-red-800 border border-transparent hover:border-gray-200 rounded-lg transition-all" 
                        title={item.marketplace_id ? "Putuskan Hubungan Marketplace" : "Hapus Supplier"}
                      >
                        <Trash2 size={16}/>
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="5" className="text-center py-4">
                    {searchQuery ? 'Supplier tidak ditemukan.' : 'Tidak ada data supplier.'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
        />
      </div>

      {/* MODAL EDIT/TAMBAH SUPPLIER */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingSupplier ? 'Edit Supplier' : 'Tambah Supplier'} size="lg">
        <SupplierForm 
          supplier={editingSupplier} 
          onSave={handleSave} 
          onCancel={() => setIsModalOpen(false)} 
        />
      </Modal>

      {/* MODAL ATUR KATALOG SUPPLIER */}
      <Modal 
        isOpen={isCatalogModalOpen} 
        onClose={() => setIsCatalogModalOpen(false)} 
        title={`Katalog Bahan Baku: ${catalogSupplier?.supplier_name}`}
        size="3xl"
      >
        {catalogLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin text-intigizi-green" /></div>
        ) : (
          <div className="space-y-4 min-h-[420px] flex flex-col">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            
             {/* Form Pilihan Bahan dengan Dropdown (Hanya untuk supplier manual) */}
             {!catalogSupplier?.marketplace_id && (
               <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex gap-3 items-end z-20 relative">
                 <div className="flex-grow">
                   <label className="block text-xs font-semibold text-gray-700 mb-1">Pilih Bahan Baku</label>
                   <SearchableSelect
                     options={ingredientOptions}
                     value={selectedIngToAdd}
                     onChange={(val) => setSelectedIngToAdd(val)}
                     placeholder="Ketik nama bahan untuk mencari..."
                   />
                 </div>
                 <button
                   type="button"
                   onClick={handleAddIngredientToCatalog}
                   disabled={!selectedIngToAdd}
                   className="px-4 py-2 bg-intigizi-green text-white font-semibold rounded-xl text-sm hover:bg-green-700 transition-colors h-[38px] flex items-center gap-1.5 disabled:opacity-50"
                 >
                   <Plus size={16} />
                   <span>Tambah</span>
                 </button>
               </div>
             )}

             <form onSubmit={handleSaveCatalog} className="space-y-4 flex-grow flex flex-col justify-between">
               <div className="max-h-64 overflow-y-auto border rounded-xl divide-y divide-gray-100 bg-white no-scrollbar flex-grow">
                 {catalogItems.length === 0 ? (
                   <p className="text-sm text-gray-400 text-center py-8 italic">Belum ada bahan baku di katalog supplier ini.</p>
                 ) : (
                   catalogItems.map((item, index) => (
                     <div key={item.ingredient_id} className="p-3 flex items-center justify-between gap-4 bg-white hover:bg-gray-50 transition-colors">
                       <div className="min-w-0 flex-1">
                         <p className="text-sm font-semibold text-gray-800 truncate">{item.ingredient_name}</p>
                         <p className="text-xs text-gray-400 font-normal">Satuan: {item.default_unit_symbol}</p>
                       </div>

                       <div className="flex gap-2.5 flex-shrink-0 items-end">
                         <div>
                           <label className="block text-[9px] font-bold text-gray-400 uppercase mb-0.5">Harga Dasar (Rp)</label>
                           <input 
                             type="number"
                             value={item.base_price}
                             onChange={(e) => handleCatalogItemChange(index, 'base_price', e.target.value)}
                             disabled={!!catalogSupplier?.marketplace_id}
                             className={`input-style text-xs py-1 px-2.5 w-24 ${catalogSupplier?.marketplace_id ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                             required
                             min="0"
                           />
                         </div>
                         <div>
                           <label className="block text-[9px] font-bold text-gray-400 uppercase mb-0.5">Kapasitas Harian</label>
                           <div className="relative">
                             <input 
                               type="number"
                               value={item.daily_capacity}
                               onChange={(e) => handleCatalogItemChange(index, 'daily_capacity', e.target.value)}
                               disabled={!!catalogSupplier?.marketplace_id}
                               className={`input-style text-xs py-1 pl-2 w-24 pr-6 ${catalogSupplier?.marketplace_id ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                               required
                               min="0"
                             />
                             <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-gray-400">{item.default_unit_symbol}</span>
                           </div>
                         </div>
                         {!catalogSupplier?.marketplace_id ? (
                           <button
                             type="button"
                             onClick={() => handleRemoveFromCatalog(index)}
                             className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                             title="Hapus dari Katalog"
                           >
                             <Trash2 size={15} />
                           </button>
                         ) : (
                           <span className="p-1.5 text-gray-300 cursor-not-allowed" title="Katalog Marketplace Terpusat (Tidak Dapat Dihapus Dapur)"><Trash2 size={15} /></span>
                         )}
                       </div>
                     </div>
                   ))
                 )}
               </div>

               <div className="pt-4 border-t flex justify-end space-x-2">
                 {catalogSupplier?.marketplace_id ? (
                   <button 
                     type="button" 
                     onClick={() => setIsCatalogModalOpen(false)}
                     className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition-colors"
                   >
                     Tutup (Mode Baca Saja)
                   </button>
                 ) : (
                   <>
                     <button 
                       type="button" 
                       onClick={() => setIsCatalogModalOpen(false)}
                       className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition-colors"
                     >
                       Batal
                     </button>
                     <button 
                       type="submit"
                       disabled={catalogLoading}
                       className="btn-primary"
                     >
                       {catalogLoading ? 'Menyimpan...' : 'Simpan Katalog'}
                     </button>
                   </>
                 )}
               </div>
             </form>
           </div>
        )}
      </Modal>

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleDelete}
        title="Konfirmasi Hapus"
        message="Apakah Anda yakin ingin menghapus supplier ini?"
      />

      <Modal
        isOpen={isMarketplaceModalOpen}
        onClose={() => setIsMarketplaceModalOpen(false)}
        title="Hubungkan Supplier Dari Marketplace B2B"
        size="3xl"
      >
        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Cari nama supplier atau nama bahan baku (misal: Melon, Sayur, Daging)..."
              value={marketplaceSearch}
              onChange={(e) => {
                setMarketplaceSearch(e.target.value);
                fetchMarketplaceSuppliers(e.target.value);
              }}
              className="input-style w-full pl-10 text-xs py-2"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          </div>

          <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-150 border border-gray-150 rounded-2xl no-scrollbar bg-white">
            {marketplaceLoading ? (
              <div className="p-8 text-center flex justify-center items-center gap-2 text-gray-500 text-xs">
                <Loader2 className="animate-spin text-green-600" size={16} />
                <span>Mencari di marketplace...</span>
              </div>
            ) : marketplaceSuppliers.length === 0 ? (
              <div className="p-8 text-center text-gray-400 italic text-xs">
                Tidak ada supplier ditemukan di Marketplace.
              </div>
            ) : (
              marketplaceSuppliers.map((item) => (
                <div key={item.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-gray-50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-gray-800 flex items-center gap-1.5 flex-wrap">
                      <span>{item.supplier_name}</span>
                      {!!item.is_verified && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-green-50 text-green-700 border border-green-200">
                          Verified
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">PIC: <span className="font-semibold text-gray-700">{item.contact_person}</span> | Telp: <span className="font-semibold text-gray-700">{item.phone_number}</span></p>
                    <p className="text-xs text-gray-400 truncate mt-1">Alamat: {item.address || '-'}</p>
                    
                    {/* List of matching/available ingredients from their catalog */}
                    {item.matching_ingredients && item.matching_ingredients.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-dashed border-gray-100">
                        {item.matching_ingredients.map((ing, idx) => (
                          <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded bg-gray-50 text-gray-650 text-[10px] font-bold border border-gray-150">
                            {ing.ingredient_name} (Rp {ing.base_price.toLocaleString('id-ID')}/{ing.unit_symbol})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleConnectSupplier(item.id)}
                    disabled={connectingId === item.id}
                    className="px-3.5 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 shrink-0 h-[32px] cursor-pointer"
                  >
                    {connectingId === item.id ? (
                      <Loader2 className="animate-spin" size={12} />
                    ) : (
                      'Hubungkan Pemasok'
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default SuppliersPage;
