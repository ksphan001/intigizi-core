import React, { useState, useEffect, useCallback, useMemo } from 'react';
import apiClient from '@/services/api';
import PageHeader from '@/components/PageHeader.jsx';
import Modal from '@/components/Modal.jsx';
import BeneficiaryForm from '@/components/BeneficiaryForm.jsx';
import ConfirmationModal from '@/components/ConfirmationModal.jsx';
import BeneficiaryDetailModal from '@/components/BeneficiaryDetailModal.jsx';
import BeneficiaryUploadModal from '@/components/BeneficiaryUploadModal.jsx'; // Impor modal upload
import Pagination from '@/components/Pagination.jsx';
import { Edit, Trash2, Search, Eye, Plus, Upload, Activity } from 'lucide-react'; // Impor ikon Upload
import { useNotification } from '@/context/NotificationContext.jsx';

const ITEMS_PER_PAGE = 10;

function BeneficiariesPage() {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false); // State untuk modal upload

  const [editingBeneficiary, setEditingBeneficiary] = useState(null);
  const [deletingBeneficiary, setDeletingBeneficiary] = useState(null);
  const [viewingBeneficiary, setViewingBeneficiary] = useState(null);
  
  const [activeTab, setActiveTab] = useState("database"); // "database" atau "attendance"
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  
  const [selectedPoint, setSelectedPoint] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBmiStatus, setSelectedBmiStatus] = useState("");
  const [distributionPoints, setDistributionPoints] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [pointsRes, categoriesRes] = await Promise.all([
          apiClient.get('/distribution_points_get.php'),
          apiClient.get('/beneficiary_categories_get.php')
        ]);
        setDistributionPoints(pointsRes.data || []);
        setCategories(categoriesRes.data || []);
      } catch (err) {
        console.error("Gagal memuat opsi filter database penerima manfaat.");
      }
    };
    fetchFilterOptions();
  }, []);
  
  const { showNotification } = useNotification();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/beneficiaries_manage.php');
      setBeneficiaries(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError('Gagal memuat data penerima manfaat.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchAttendance = useCallback(async (date) => {
    try {
      setAttendanceLoading(true);
      const response = await apiClient.get(`/beneficiary_attendance_get.php?date=${date}`);
      const map = {};
      if (Array.isArray(response.data)) {
        response.data.forEach((row) => {
          map[row.beneficiary_id] = row.status;
        });
      }
      setAttendanceMap(map);
    } catch (err) {
      showNotification("Gagal memuat data absensi harian.", "error");
    } finally {
      setAttendanceLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    if (activeTab === "attendance") {
      fetchAttendance(attendanceDate);
    }
  }, [activeTab, attendanceDate, fetchAttendance]);

  const handleSaveAttendance = async () => {
    setActionLoading(true);
    try {
      const list = beneficiaries.map((b) => ({
        beneficiary_id: b.id,
        status: attendanceMap[b.id] || "absent",
      }));
      await apiClient.post("/beneficiary_attendance_log.php", {
        served_date: attendanceDate,
        attendance_list: list,
      });
      showNotification("Absensi makan harian berhasil disimpan.", "success");
    } catch (err) {
      showNotification("Gagal menyimpan absensi makan harian.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredBeneficiaries = useMemo(() => {
    return beneficiaries.filter((b) => {
      const matchesSearch = !searchQuery || 
        b.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.nik_nisn && b.nik_nisn.includes(searchQuery));
      
      const matchesPoint = !selectedPoint || b.distribution_point_id.toString() === selectedPoint.toString();
      
      const matchesCategory = !selectedCategory || b.category_id.toString() === selectedCategory.toString();
      
      let bmiStatus = "Normal";
      const bmi = parseFloat(b.current_bmi);
      if (!b.current_bmi) bmiStatus = "Tidak Ada Data";
      else if (bmi < 17.0) bmiStatus = "Sangat Kurus";
      else if (bmi < 18.5) bmiStatus = "Kurus";
      else if (bmi < 25.0) bmiStatus = "Normal";
      else bmiStatus = "Obesitas";
      
      const matchesBmi = !selectedBmiStatus || bmiStatus === selectedBmiStatus;
      
      return matchesSearch && matchesPoint && matchesCategory && matchesBmi;
    });
  }, [beneficiaries, searchQuery, selectedPoint, selectedCategory, selectedBmiStatus]);

  const totalPages = Math.ceil(filteredBeneficiaries.length / ITEMS_PER_PAGE);
  const paginatedBeneficiaries = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBeneficiaries.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, filteredBeneficiaries]);

  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  const openAddModal = () => { setEditingBeneficiary(null); setIsFormModalOpen(true); };
  const openEditModal = (beneficiary) => { setEditingBeneficiary(beneficiary); setIsFormModalOpen(true); };
  const openDeleteConfirm = (beneficiary) => { setDeletingBeneficiary(beneficiary); setIsConfirmModalOpen(true); };
  
  const openDetailModal = (beneficiary) => { 
    setViewingBeneficiary(beneficiary); 
    setIsDetailModalOpen(true); 
  };

  const handleSave = async (data) => {
    setActionLoading(true);
    try {
      const payload = { ...data, action: data.id ? 'update' : 'create' };
      const response = await apiClient.post('/beneficiaries_manage.php', payload);
      showNotification(response.data.message, 'success');
      setIsFormModalOpen(false);
      await fetchData();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Gagal menyimpan data.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingBeneficiary) return;
    setActionLoading(true);
    try {
      const response = await apiClient.post('/beneficiaries_manage.php', { id: deletingBeneficiary.id, action: 'delete' });
      showNotification(response.data.message, 'success');
      setIsConfirmModalOpen(false);
      await fetchData();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Gagal menghapus data.', 'error');
    } finally {
      setActionLoading(false);
      setDeletingBeneficiary(null);
    }
  };
  
  // Fungsi untuk menangani refresh data setelah upload/update BMI
  const handleDataUpdate = () => {
    fetchData(); // Muat ulang semua data
    // Jika modal detail sedang terbuka, kita juga harus menutupnya
    // atau memperbarui data 'viewingBeneficiary'
    if(viewingBeneficiary) {
        // Optimis: tutup modal detail agar pengguna melihat data baru di tabel
        setIsDetailModalOpen(false);
        setViewingBeneficiary(null);
    }
  };

  const getBmiStatusColor = (bmi) => {
    if (!bmi) return 'text-gray-500';
    if (bmi < 18.5) return 'text-yellow-600';
    if (bmi < 24.9) return 'text-green-600';
    if (bmi < 29.9) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <PageHeader title="Database Penerima Manfaat" />
        {activeTab === "database" && (
          <div className="flex space-x-2">
            <button onClick={() => setIsUploadModalOpen(true)} className="btn-secondary">
              <Upload size={16} className="mr-2" /> Impor dari Excel
            </button>
            <button onClick={openAddModal} className="btn-primary">
              <Plus size={16} className="mr-2" /> Tambah Data
            </button>
          </div>
        )}
      </div>

      {/* TABS HEADER */}
      <div className="flex justify-between items-center border-b border-gray-200 mb-6 bg-white p-2 rounded-xl shadow-sm flex-wrap gap-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("database")}
            className={`py-2 px-5 text-sm font-semibold rounded-lg transition-all ${
              activeTab === "database"
                ? "bg-intigizi-green text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            Database Siswa / Penerima
          </button>
          <button
            onClick={() => setActiveTab("attendance")}
            className={`py-2 px-5 text-sm font-semibold rounded-lg transition-all ${
              activeTab === "attendance"
                ? "bg-intigizi-green text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            Absensi Makan Harian (BGN)
          </button>
        </div>

        {activeTab === "attendance" && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="input-style text-sm py-1 bg-white border-gray-300"
            />
            <button
              onClick={handleSaveAttendance}
              disabled={actionLoading}
              className="btn-primary py-1 px-4 text-sm"
            >
              {actionLoading ? "Menyimpan..." : "Simpan Absensi"}
            </button>
          </div>
        )}
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        {/* ROW PENCARIAN & FILTERING */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Cari nama atau NIK..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-style w-full pl-10 text-sm"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          </div>

          <div>
            <select
              value={selectedPoint}
              onChange={(e) => setSelectedPoint(e.target.value)}
              className="input-style w-full text-sm bg-white"
            >
              <option value="">-- Semua Titik Distribusi --</option>
              {distributionPoints.map((dp) => (
                <option key={dp.id} value={dp.id}>
                  {dp.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-style w-full text-sm bg-white"
            >
              <option value="">-- Semua Kategori Gizi --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedBmiStatus}
              onChange={(e) => setSelectedBmiStatus(e.target.value)}
              className="input-style w-full text-sm bg-white"
            >
              <option value="">-- Semua Status BMI --</option>
              <option value="Sangat Kurus">Sangat Kurus (BMI &lt; 17)</option>
              <option value="Kurus">Kurus (17 s.d 18.5)</option>
              <option value="Normal">Normal (18.5 s.d 25)</option>
              <option value="Obesitas">Obesitas (BMI &ge; 25)</option>
              <option value="Tidak Ada Data">Tidak Ada Data</option>
            </select>
          </div>
        </div>

        {activeTab === "database" ? (
          <>
            {loading ? <p>Memuat data...</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3">Nama Lengkap</th>
                      <th scope="col" className="px-6 py-3">NIK / NISN</th>
                      <th scope="col" className="px-6 py-3">Kategori</th>
                      <th scope="col" className="px-6 py-3">Titik Distribusi</th>
                      <th scope="col" className="px-6 py-3 text-right">BMI Terakhir</th>
                      <th scope="col" className="px-6 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedBeneficiaries.length > 0 ? paginatedBeneficiaries.map((item) => (
                      <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                        <th scope="row" className="px-6 py-4 font-medium text-gray-900">{item.full_name}</th>
                        <td className="px-6 py-4">{item.nik_nisn || '-'}</td>
                        <td className="px-6 py-4">{item.category_name || '-'}</td>
                        <td className="px-6 py-4">{item.distribution_point_name || '-'}</td>
                        <td className={`px-6 py-4 text-right font-bold ${getBmiStatusColor(item.current_bmi)}`}>
                            {item.current_bmi ? parseFloat(item.current_bmi).toFixed(1) : '-'}
                        </td>
                        <td className="px-6 py-4 flex justify-end space-x-2">
                          <button title="Lihat Detail & Riwayat BMI" onClick={() => openDetailModal(item)} className="p-1 text-gray-600 hover:text-gray-800"><Eye size={16}/></button>
                          <button title="Edit" onClick={() => openEditModal(item)} className="p-1 text-blue-600 hover:text-blue-800"><Edit size={16}/></button>
                          <button title="Hapus" onClick={() => openDeleteConfirm(item)} className="p-1 text-red-600 hover:text-red-800"><Trash2 size={16}/></button>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan="6" className="text-center py-4">{searchQuery ? 'Data tidak ditemukan.' : 'Belum ada data penerima manfaat.'}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </>
        ) : (
          <>
            {attendanceLoading ? <p>Memuat absensi harian...</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 w-16 text-center">Status Makan</th>
                      <th scope="col" className="px-6 py-3">Nama Lengkap</th>
                      <th scope="col" className="px-6 py-3">NIK / NISN</th>
                      <th scope="col" className="px-6 py-3">Sekolah / Titik Distribusi</th>
                      <th scope="col" className="px-6 py-3">Kategori Gizi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedBeneficiaries.length > 0 ? paginatedBeneficiaries.map((item) => (
                      <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={attendanceMap[item.id] === "served"}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              setAttendanceMap((prev) => ({
                                ...prev,
                                [item.id]: isChecked ? "served" : "absent",
                              }));
                            }}
                            className="w-5 h-5 rounded text-intigizi-green focus:ring-intigizi-green cursor-pointer"
                          />
                        </td>
                        <th scope="row" className="px-6 py-4 font-medium text-gray-900">{item.full_name}</th>
                        <td className="px-6 py-4">{item.nik_nisn || '-'}</td>
                        <td className="px-6 py-4">{item.distribution_point_name || '-'}</td>
                        <td className="px-6 py-4">{item.category_name || '-'}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="5" className="text-center py-4">{searchQuery ? 'Data tidak ditemukan.' : 'Belum ada data penerima manfaat.'}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </>
        )}
      </div>

      <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={editingBeneficiary ? 'Edit Penerima Manfaat' : 'Tambah Penerima Manfaat'}>
        <BeneficiaryForm 
          beneficiary={editingBeneficiary} 
          onSave={handleSave} 
          onCancel={() => setIsFormModalOpen(false)}
          loading={actionLoading}
        />
      </Modal>
      
      <BeneficiaryDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        beneficiary={viewingBeneficiary}
        onDataUpdate={handleDataUpdate} // Kirim callback
      />

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleDelete}
        title="Konfirmasi Hapus"
        message={`Apakah Anda yakin ingin menghapus data "${deletingBeneficiary?.full_name}"? Semua riwayat BMI juga akan terhapus.`}
        loading={actionLoading}
      />
      
      <BeneficiaryUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleDataUpdate} // Panggil refresh data saat upload sukses
      />
    </div>
  );
}

export default BeneficiariesPage;