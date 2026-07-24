import React, { useState, useEffect, useCallback, useMemo } from 'react';
import apiClient from '@/services/api';
import PageHeader from '@/components/PageHeader.jsx';
import Modal from '@/components/Modal.jsx';
import SupplierForm from '@/components/SupplierForm.jsx';
import ConfirmationModal from '@/components/ConfirmationModal.jsx';
import Pagination from '@/components/Pagination.jsx';
import { Edit, Trash2, Search, BookOpen, Truck, Loader2, Plus } from 'lucide-react';
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

  const { showNotification } = useNotification();

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
        buttonText="Tambah Supplier"
        onButtonClick={openAddModal}
      />
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-4 relative">
          <input
            type="text"
            placeholder="Cari nama supplier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-style w-full pl-10"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
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
                      <div>{item.supplier_name}</div>
                      <div className="text-xs text-gray-400 font-normal">{item.address}</div>
                    </th>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-700">
                        <Truck size={14} className="text-gray-400" />
                        <span>Radius: <strong>{item.coverage_radius_km || 15} km</strong></span>
                      </div>
                      <div className="text-xs text-gray-400">{item.coverage_area_desc || 'Semua Wilayah'}</div>
                      {item.latitude && item.longitude && (
                        <div className="text-[10px] text-gray-400 font-mono mt-1">
                          GPS: {item.latitude}, {item.longitude}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs">{item.contact_person}</td>
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
                      <button onClick={() => openEditModal(item)} className="p-1.5 text-blue-600 hover:text-blue-800 border border-transparent hover:border-gray-200 rounded-lg transition-all"><Edit size={16}/></button>
                      <button onClick={() => openDeleteConfirm(item.id)} className="p-1.5 text-red-600 hover:text-red-800 border border-transparent hover:border-gray-200 rounded-lg transition-all"><Trash2 size={16}/></button>
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
          <div className="space-y-4">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            
            {/* Form Pilihan Bahan dengan Dropdown */}
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

            <form onSubmit={handleSaveCatalog} className="space-y-4">
              <div className="max-h-80 overflow-y-auto border rounded-xl divide-y divide-gray-100 bg-white no-scrollbar">
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
                            className="input-style text-xs py-1 px-2.5 w-24"
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
                              className="input-style text-xs py-1 pl-2 w-24 pr-6"
                              required
                              min="0"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-gray-400">{item.default_unit_symbol}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFromCatalog(index)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                          title="Hapus dari Katalog"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-4 border-t flex justify-end space-x-2">
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
    </div>
  );
}

export default SuppliersPage;
