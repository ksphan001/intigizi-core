import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/services/api';
import PageHeader from '@/components/PageHeader';
import Modal from '@/components/Modal';
import ConfirmationModal from '@/components/ConfirmationModal';
import { Loader2, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';
import { API_BASE_URL } from '@/config';

// Form untuk mengunggah foto baru
const UploadForm = ({ onSave, onCancel, loading }) => {
    const [caption, setCaption] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [preview, setPreview] = useState(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!imageFile) {
            alert('Silakan pilih file gambar terlebih dahulu.');
            return;
        }
        const formData = new FormData();
        formData.append('action', 'add');
        formData.append('caption', caption);
        formData.append('image', imageFile);
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="image" className="block text-sm font-medium text-gray-700">Pilih Gambar</label>
                <input type="file" id="image" onChange={handleImageChange} accept="image/jpeg, image/png" className="input-style" required />
                {preview && <img src={preview} alt="Preview" className="mt-4 h-40 w-auto rounded-lg" />}
            </div>
            <div>
                <label htmlFor="caption" className="block text-sm font-medium text-gray-700">Keterangan (Opsional)</label>
                <input type="text" id="caption" value={caption} onChange={(e) => setCaption(e.target.value)} className="input-style" placeholder="Contoh: Penyerahan bantuan di Panti Asuhan..." />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="btn-secondary">Batal</button>
                <button type="submit" disabled={loading} className="btn-primary flex items-center">
                    {loading ? <Loader2 className="animate-spin mr-2" /> : <Upload className="mr-2" size={16} />}
                    Unggah Foto
                </button>
            </div>
        </form>
    );
};

// Halaman utama untuk manajemen galeri
function KitchenGalleryPage() {
    const [gallery, setGallery] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [deletingItem, setDeletingItem] = useState(null);

    const { showNotification } = useNotification();

    const fetchGallery = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/kitchen_gallery_manage.php');
            setGallery(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            setError('Gagal memuat data galeri.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchGallery();
    }, [fetchGallery]);

    const handleUpload = async (formData) => {
        setActionLoading(true);
        try {
            const response = await apiClient.post('/kitchen_gallery_manage.php', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            showNotification(response.data.message, 'success');
            setIsModalOpen(false);
            await fetchGallery();
        } catch (err) {
            showNotification(err.response?.data?.message || 'Gagal mengunggah foto.', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteRequest = (item) => {
        setDeletingItem(item);
        setIsConfirmModalOpen(true);
    };

    const handleDelete = async () => {
        if (!deletingItem) return;
        setActionLoading(true);
        try {
            const response = await apiClient.post('/kitchen_gallery_manage.php', { action: 'delete', id: deletingItem.id });
            showNotification(response.data.message, 'success');
            setIsConfirmModalOpen(false);
            await fetchGallery();
        } catch (err) {
            showNotification(err.response?.data?.message || 'Gagal menghapus foto.', 'error');
        } finally {
            setActionLoading(false);
            setDeletingItem(null);
        }
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    }

    if (error) {
        return <div className="text-red-500 bg-red-50 p-4 rounded-lg">{error}</div>;
    }

    return (
        <div>
            <PageHeader title="Manajemen Galeri Dapur" buttonText="Unggah Foto Baru" onButtonClick={() => setIsModalOpen(true)} />
            
            <div className="bg-white p-6 rounded-xl shadow-md">
                {gallery.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {gallery.map(item => (
                            <div key={item.id} className="border rounded-lg overflow-hidden group relative">
                                <img 
                                    src={`${API_BASE_URL.replace('/app', '')}${item.image_path}`} 
                                    alt={item.caption || 'Foto Galeri'} 
                                    className="h-48 w-full object-cover" 
                                />
                                {item.caption && <p className="text-xs p-2 text-gray-600 bg-gray-50">{item.caption}</p>}
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleDeleteRequest(item)} className="p-2 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 text-gray-500">
                        <ImageIcon size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-semibold">Galeri Anda Masih Kosong</h3>
                        <p className="mt-2">Klik tombol "Unggah Foto Baru" untuk mulai menambahkan foto kegiatan dapur Anda.</p>
                    </div>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Unggah Foto ke Galeri">
                <UploadForm onSave={handleUpload} onCancel={() => setIsModalOpen(false)} loading={actionLoading} />
            </Modal>
            
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleDelete}
                title="Konfirmasi Hapus"
                message="Apakah Anda yakin ingin menghapus foto ini dari galeri Anda?"
                loading={actionLoading}
            />
        </div>
    );
}

export default KitchenGalleryPage;
