import React, { useState, useEffect, useCallback, useMemo } from 'react';
import apiClient from '@/services/api';
import { useNotification } from '@/context/NotificationContext';
import { Plus, Search, Edit, Trash2, Loader2, X, BookOpen, Tag, ChevronDown } from 'lucide-react';
import Pagination from '@/components/Pagination.jsx';

const ITEMS_PER_PAGE = 15;

const EMPTY_FORM = {
  id: null,
  food_code: '',
  name: '',
  group: '',
  calories: '',
  protein: '',
  fat: '',
  carbohydrates: '',
  fiber: '',
  bdd_percentage: '1.00',
  estimated_price: '',
};

function formatCurrency(val) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);
}

function MasterIngredientsPage() {
  const { showNotification } = useNotification();
  const [items, setItems] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Form Modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  // Delete Modal
  const [deletingItem, setDeletingItem] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/superadmin_manage_master_ingredients.php');
      setItems(Array.isArray(res.data.items) ? res.data.items : []);
      setGroups(Array.isArray(res.data.groups) ? res.data.groups : []);
    } catch (err) {
      showNotification('Gagal memuat data pustaka bahan baku.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = useMemo(() => {
    return items.filter(item => {
      const matchSearch = !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.food_code || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchGroup = !groupFilter || item.group === groupFilter;
      return matchSearch && matchGroup;
    });
  }, [items, searchQuery, groupFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const openCreate = () => {
    setFormData(EMPTY_FORM);
    setFormError('');
    setIsFormOpen(true);
  };

  const openEdit = (item) => {
    setFormData({
      id: item.id,
      food_code: item.food_code || '',
      name: item.name,
      group: item.group || '',
      calories: item.calories ?? '',
      protein: item.protein ?? '',
      fat: item.fat ?? '',
      carbohydrates: item.carbohydrates ?? '',
      fiber: item.fiber ?? '',
      bdd_percentage: item.bdd_percentage ?? '1.00',
      estimated_price: item.estimated_price ?? '',
    });
    setFormError('');
    setIsFormOpen(true);
  };

  const handleFormChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const payload = {
        ...formData,
        bdd_percentage: parseFloat(formData.bdd_percentage) > 1
          ? parseFloat(formData.bdd_percentage) / 100
          : parseFloat(formData.bdd_percentage),
      };
      const res = await apiClient.post('/superadmin_manage_master_ingredients.php', payload);
      showNotification(res.data.message, 'success');
      setIsFormOpen(false);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Terjadi kesalahan saat menyimpan.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/superadmin_manage_master_ingredients.php?id=${deletingItem.id}`);
      showNotification(`Bahan baku '${deletingItem.name}' berhasil dihapus.`, 'success');
      setDeletingItem(null);
      fetchData();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Gagal menghapus.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const InputField = ({ label, name, type = 'text', step, hint }) => (
    <div>
      <label className="block text-xs font-bold text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={formData[name]}
        onChange={handleFormChange}
        step={step}
        className="input-style w-full text-sm py-1.5"
        placeholder={hint}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-gray-800">Pustaka Bahan Baku Master</h1>
          <p className="text-xs text-gray-400 font-semibold mt-0.5">
            Kelola data referensi bahan baku, nilai gizi, BDD%, dan harga estimasi nasional.
            Data ini digunakan sebagai acuan sinkronisasi harga dapur.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="btn-primary flex items-center gap-2 shrink-0"
        >
          <Plus size={18} />
          Tambah Bahan Baku
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-150 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Cari nama atau kode pangan..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="input-style w-full pl-9 text-sm py-2"
          />
        </div>
        <div className="relative">
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
          <select
            value={groupFilter}
            onChange={e => { setGroupFilter(e.target.value); setCurrentPage(1); }}
            className="input-style text-sm py-2 pr-8 appearance-none min-w-[180px]"
          >
            <option value="">Semua Kelompok</option>
            {groups.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 font-semibold shrink-0">
          <BookOpen size={14} />
          <span>{filtered.length} bahan baku</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-150 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-green-600" size={32} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[11px] text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 font-bold">Kode</th>
                  <th className="px-5 py-3 font-bold">Nama Bahan Baku</th>
                  <th className="px-5 py-3 font-bold">Kelompok</th>
                  <th className="px-5 py-3 font-bold text-center">Kalori</th>
                  <th className="px-5 py-3 font-bold text-center">Protein</th>
                  <th className="px-5 py-3 font-bold text-center">BDD%</th>
                  <th className="px-5 py-3 font-bold text-right">Harga Estimasi</th>
                  <th className="px-5 py-3 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-12 text-gray-400 italic">
                      {searchQuery || groupFilter ? 'Bahan baku tidak ditemukan.' : 'Belum ada data pustaka bahan baku.'}
                    </td>
                  </tr>
                ) : paginated.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3 text-xs font-mono text-gray-400">{item.food_code || '-'}</td>
                    <td className="px-5 py-3 font-semibold text-gray-800">{item.name}</td>
                    <td className="px-5 py-3">
                      {item.group ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                          <Tag size={9} />{item.group}
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3 text-center text-xs text-gray-600">{parseFloat(item.calories || 0).toFixed(0)} kcal</td>
                    <td className="px-5 py-3 text-center text-xs text-gray-600">{parseFloat(item.protein || 0).toFixed(1)} g</td>
                    <td className="px-5 py-3 text-center text-xs text-gray-600">
                      {parseFloat(item.bdd_percentage || 1) <= 1
                        ? (parseFloat(item.bdd_percentage) * 100).toFixed(0)
                        : parseFloat(item.bdd_percentage).toFixed(0)}%
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-green-700">{formatCurrency(item.estimated_price)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => setDeletingItem(item)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {/* FORM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-black text-gray-800">
                {formData.id ? 'Edit Bahan Baku Master' : 'Tambah Bahan Baku Master'}
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="overflow-y-auto flex-1">
              <div className="px-6 py-5 space-y-5">

                {/* Identitas */}
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">Identitas</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <InputField label="Kode Pangan" name="food_code" hint="Contoh: B.1.1" />
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-gray-600 mb-1">Nama Bahan Baku <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleFormChange}
                        required
                        className="input-style w-full text-sm py-1.5"
                        placeholder="Contoh: Beras Putih"
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs font-bold text-gray-600 mb-1">Kelompok Pangan</label>
                    <input
                      type="text"
                      name="group"
                      value={formData.group}
                      onChange={handleFormChange}
                      list="group-list"
                      className="input-style w-full text-sm py-1.5"
                      placeholder="Contoh: Serealia, Sayuran, Daging..."
                    />
                    <datalist id="group-list">
                      {groups.map(g => <option key={g} value={g} />)}
                    </datalist>
                  </div>
                </div>

                {/* Nilai Gizi per 100g */}
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">Nilai Gizi (per 100g)</p>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <InputField label="Kalori (kcal)" name="calories" type="number" step="0.01" hint="0" />
                    <InputField label="Protein (g)" name="protein" type="number" step="0.01" hint="0" />
                    <InputField label="Lemak (g)" name="fat" type="number" step="0.01" hint="0" />
                    <InputField label="Karbohidrat (g)" name="carbohydrates" type="number" step="0.01" hint="0" />
                    <InputField label="Serat (g)" name="fiber" type="number" step="0.01" hint="0" />
                  </div>
                </div>

                {/* BDD & Harga */}
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">BDD & Harga Referensi</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">BDD% (Bagian yang Dapat Dimakan)</label>
                      <div className="relative">
                        <input
                          type="number"
                          name="bdd_percentage"
                          value={formData.bdd_percentage}
                          onChange={handleFormChange}
                          step="0.01"
                          min="0"
                          max="1"
                          className="input-style w-full text-sm py-1.5 pr-8"
                          placeholder="Contoh: 0.85"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">
                          {parseFloat(formData.bdd_percentage || 0) <= 1
                            ? `${(parseFloat(formData.bdd_percentage || 0) * 100).toFixed(0)}%`
                            : `${parseFloat(formData.bdd_percentage || 0).toFixed(0)}%`}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">Masukkan nilai 0–1 (misal: 0.85 = 85%)</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Harga Estimasi Nasional (Rp/Kg)</label>
                      <input
                        type="number"
                        name="estimated_price"
                        value={formData.estimated_price}
                        onChange={handleFormChange}
                        min="0"
                        step="100"
                        className="input-style w-full text-sm py-1.5"
                        placeholder="Contoh: 15000"
                      />
                      <p className="text-[10px] text-gray-400 mt-1">Digunakan saat dapur klik "Sync Harga Master"</p>
                    </div>
                  </div>
                </div>

                {formError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-xl px-4 py-3">
                    {formError}
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm">
                  Batal
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                  {saving ? <Loader2 size={15} className="animate-spin" /> : null}
                  {saving ? 'Menyimpan...' : (formData.id ? 'Simpan Perubahan' : 'Tambah Bahan Baku')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="text-red-500" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-800">Hapus Bahan Baku Master?</h3>
              <p className="text-sm text-gray-500 mt-1">
                "<strong>{deletingItem.name}</strong>" akan dihapus permanen dari pustaka.
                Bahan baku yang sudah diimpor ke dapur tidak akan terpengaruh.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button onClick={() => setDeletingItem(null)} className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm">
                Batal
              </button>
              <button onClick={handleDelete} disabled={deleting} className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm flex items-center gap-2">
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MasterIngredientsPage;
