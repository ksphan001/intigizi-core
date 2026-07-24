import React, { useState, useEffect, useCallback, useMemo } from 'react';
import apiClient from '@/services/api';
import PageHeader from '@/components/PageHeader';
import IngredientForm from '@/components/IngredientForm';
import Modal from '@/components/Modal';
import ConfirmationModal from '@/components/ConfirmationModal';
import { useNotification } from '@/context/NotificationContext';
import { Plus, Search, Loader2, Edit, Trash2, Library, RefreshCw } from 'lucide-react';
import Pagination from '@/components/Pagination';
import MasterIngredientModal from '@/components/MasterIngredientModal';

const ITEMS_PER_PAGE = 10; // Mengembalikan ke 10 karena datanya lebih sedikit

// PENJELASAN: Halaman ini dikembalikan ke versi sebelumnya yang menggunakan
// pagination dan pencarian di sisi klien (frontend) agar sesuai dengan API yang telah diperbaiki.

function IngredientsPage() {
    const [ingredients, setIngredients] = useState([]);
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
    const [syncing, setSyncing] = useState(false);
    
    const [editingIngredient, setEditingIngredient] = useState(null);
    const [deletingIngredientId, setDeletingIngredientId] = useState(null);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const { showNotification } = useNotification();

    const fetchIngredientsAndUnits = useCallback(async () => {
        try {
            setLoading(true);
            const [ingredientsRes, unitsRes] = await Promise.all([
                apiClient.get('/ingredients_get.php'),
                apiClient.get('/units_get.php')
            ]);
            setIngredients(Array.isArray(ingredientsRes.data) ? ingredientsRes.data : []);
            setUnits(Array.isArray(unitsRes.data) ? unitsRes.data : []);
        } catch (error) {
            showNotification('Gagal memuat data bahan baku.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    useEffect(() => {
        fetchIngredientsAndUnits();
    }, [fetchIngredientsAndUnits]);

    const handleOpenModal = (ingredient = null) => {
        setEditingIngredient(ingredient);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingIngredient(null);
    };

    const handleSave = async (ingredientData) => {
        try {
            const endpoint = editingIngredient ? '/ingredients_update.php' : '/ingredients_create.php';
            const response = await apiClient.post(endpoint, { ...ingredientData, id: editingIngredient?.id });
            showNotification(response.data.message, 'success');
            handleCloseModal();
            fetchIngredientsAndUnits();
        } catch (error) {
            showNotification(error.response?.data?.message || 'Terjadi kesalahan.', 'error');
            throw error;
        }
    };
    
    const handleImport = async (masterIds) => {
        try {
            const response = await apiClient.post('/master_ingredients_import.php', { master_ids: masterIds });
            showNotification(response.data.message, 'success');
            setIsMasterModalOpen(false);
            fetchIngredientsAndUnits();
        } catch (error) {
            showNotification(error.response?.data?.message || 'Gagal mengimpor bahan.', 'error');
        }
    };

    const handleSyncPrices = async () => {
        setSyncing(true);
        try {
            const response = await apiClient.post('/ingredients_sync_master.php');
            showNotification(response.data.message || 'Harga bahan baku berhasil diselaraskan.', 'success');
            fetchIngredientsAndUnits();
        } catch (error) {
            showNotification(error.response?.data?.message || 'Gagal menyelaraskan harga bahan baku.', 'error');
        } finally {
            setSyncing(false);
        }
    };

    const handleDeleteRequest = (id) => {
        setDeletingIngredientId(id);
        setIsConfirmModalOpen(true);
    };

    const confirmDelete = async () => {
        try {
            const response = await apiClient.post('/ingredients_delete.php', { id: deletingIngredientId });
            showNotification(response.data.message, 'success');
            fetchIngredientsAndUnits();
        } catch (error) {
            showNotification(error.response?.data?.message || 'Gagal menghapus.', 'error');
        } finally {
            setIsConfirmModalOpen(false);
            setDeletingIngredientId(null);
        }
    };
    
    const filteredIngredients = useMemo(() => {
        if (!searchQuery) return ingredients;
        return ingredients.filter(ing => ing.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [ingredients, searchQuery]);

    const totalPages = Math.ceil(filteredIngredients.length / ITEMS_PER_PAGE);
    const paginatedIngredients = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredIngredients.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [currentPage, filteredIngredients]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);


    const formatCurrency = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value || 0);

    return (
        <div>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <PageHeader title="Manajemen Bahan Baku" />
                <div className="flex space-x-2">
                    <button onClick={handleSyncPrices} disabled={syncing || loading} className="btn-secondary">
                        {syncing ? <Loader2 className="animate-spin mr-2" size={16} /> : <RefreshCw size={16} className="mr-2" />}
                        Sync Harga Master
                    </button>
                    <button onClick={() => setIsMasterModalOpen(true)} className="btn-secondary">
                        <Library size={16} className="mr-2" /> Tambah dari Pustaka
                    </button>
                    <button onClick={() => handleOpenModal()} className="btn-primary">
                        <Plus size={16} className="mr-2" /> Tambah Manual
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="mb-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Cari nama bahan baku..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input-style w-full pl-10"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    </div>
                </div>
                
                {loading ? <div className="text-center p-8"><Loader2 className="animate-spin" /></div> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Nama Bahan</th>
                                    <th scope="col" className="px-6 py-3">Harga Terakhir</th>
                                    <th scope="col" className="px-6 py-3">Satuan</th>
                                    <th scope="col" className="px-6 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedIngredients.map((item) => (
                                    <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                                        <th scope="row" className="px-6 py-4 font-medium text-gray-900">{item.name}</th>
                                        <td className="px-6 py-4">{formatCurrency(item.latest_price)}</td>
                                        <td className="px-6 py-4">{item.unit_symbol}</td>
                                        <td className="px-6 py-4 text-right flex items-center justify-end space-x-2">
                                            <button onClick={() => handleOpenModal(item)} className="p-1 text-blue-600 hover:text-blue-800" title="Edit"><Edit size={16}/></button>
                                            <button onClick={() => handleDeleteRequest(item.id)} className="p-1 text-red-600 hover:text-red-800" title="Hapus"><Trash2 size={16}/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingIngredient ? 'Edit Bahan Baku' : 'Tambah Bahan Baku'}>
                <IngredientForm
                    ingredient={editingIngredient}
                    units={units}
                    onSave={handleSave}
                    onCancel={handleCloseModal}
                />
            </Modal>
            
            <MasterIngredientModal 
                isOpen={isMasterModalOpen}
                onClose={() => setIsMasterModalOpen(false)}
                onImport={handleImport}
            />
            
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={confirmDelete}
                title="Konfirmasi Hapus"
                message="Apakah Anda yakin ingin menghapus bahan baku ini? Aksi ini tidak dapat dibatalkan."
            />
        </div>
    );
}

export default IngredientsPage;

