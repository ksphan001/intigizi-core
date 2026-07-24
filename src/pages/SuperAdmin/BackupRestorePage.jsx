import React, { useState, useEffect, useRef } from "react";
import apiClient from "@/services/api";
import PageHeader from "@/components/PageHeader.jsx";
import ConfirmationModal from "@/components/ConfirmationModal.jsx";
import { 
  Database, Download, Upload, AlertTriangle, Loader2, 
  CheckCircle2, FileText, Trash2, RefreshCw, Layers 
} from "lucide-react";
import { useNotification } from "@/context/NotificationContext.jsx";

function BackupRestorePage() {
  const [backups, setBackups] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [dummyLoading, setDummyLoading] = useState(false);
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  
  // Modals
  const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  
  const [targetBackup, setTargetBackup] = useState(null); // File yang akan di-restore atau di-delete
  const [confirmInputText, setConfirmInputText] = useState("");
  
  const fileInputRef = useRef(null);
  const { showNotification } = useNotification();

  const fetchBackups = async () => {
    try {
      setListLoading(true);
      const response = await apiClient.get("/superadmin_list_backups.php");
      setBackups(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      showNotification("Gagal memuat daftar cadangan dari server.", "error");
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleCreateBackup = async () => {
    try {
      setBackupLoading(true);
      showNotification("Sedang membuat cadangan database baru...", "info");

      const response = await apiClient.post("/superadmin_backup_db.php");
      showNotification(response.data.message || "Cadangan berhasil dibuat di server!", "success");
      fetchBackups(); // Refresh daftar cadangan
    } catch (err) {
      showNotification("Gagal mencadangkan database.", "error");
    } finally {
      setBackupLoading(false);
    }
  };

  const handleGenerateDummy = async () => {
    if (!window.confirm("Apakah Anda yakin ingin menghasilkan data demo baru? Seluruh data operasional & transaksi saat ini akan dihapus dan diganti.")) {
      return;
    }
    try {
      setDummyLoading(true);
      showNotification("Sedang memproses pembuatan data demo di server...", "info");
      const response = await apiClient.post("/superadmin_generate_dummy.php");
      showNotification(response.data.message || "Data demo berhasil dihasilkan!", "success");
      fetchBackups();
    } catch (err) {
      showNotification(err.response?.data?.message || "Gagal menghasilkan data demo.", "error");
    } finally {
      setDummyLoading(false);
    }
  };

  const handleDownload = async (filename) => {
    try {
      showNotification(`Mengunduh ${filename}...`, "info");

      const response = await apiClient.get("/superadmin_download_backup.php", {
        params: { filename },
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/octet-stream" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showNotification("Unduhan selesai!", "success");
    } catch (err) {
      showNotification("Gagal mengunduh berkas cadangan.", "error");
    }
  };

  const handleRestoreRequest = (backup, isManual = false) => {
    setTargetBackup(isManual ? { isManual: true, file: backup } : backup);
    setIsRestoreConfirmOpen(true);
  };

  const handleConfirmRestore = async () => {
    if (confirmInputText !== "PULIHKAN") {
      showNotification("Teks konfirmasi salah. Harap ketik 'PULIHKAN'.", "error");
      return;
    }

    setIsRestoreConfirmOpen(false);
    setConfirmInputText("");

    try {
      setRestoreLoading(true);
      showNotification("Sedang memulihkan database. Harap tunggu...", "info");

      if (targetBackup.isManual) {
        // Pemulihan dari berkas unggahan manual
        const formData = new FormData();
        formData.append("backup_file", targetBackup.file);

        const response = await apiClient.post("/superadmin_restore_db.php", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        showNotification(response.data.message || "Database berhasil dipulihkan!", "success");
        setSelectedFile(null);
      } else {
        // Pemulihan dari berkas yang tersimpan di server
        const response = await apiClient.post("/superadmin_restore_db.php", {
          filename: targetBackup.filename,
        });
        showNotification(response.data.message || "Database berhasil dipulihkan!", "success");
      }
    } catch (err) {
      showNotification(err.response?.data?.message || "Gagal memulihkan database.", "error");
    } finally {
      setRestoreLoading(false);
      setTargetBackup(null);
    }
  };

  const handleDeleteRequest = (backup) => {
    setTargetBackup(backup);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!targetBackup) return;
    setIsDeleteConfirmOpen(false);

    try {
      setDeleteLoading(true);
      showNotification(`Menghapus ${targetBackup.filename}...`, "info");

      const response = await apiClient.post("/superadmin_delete_backup.php", {
        filename: targetBackup.filename,
      });

      showNotification(response.data.message || "Cadangan berhasil dihapus.", "success");
      fetchBackups();
    } catch (err) {
      showNotification("Gagal menghapus cadangan dari server.", "error");
    } finally {
      setDeleteLoading(false);
      setTargetBackup(null);
    }
  };

  // Drag & drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file) => {
    if (file.name.endsWith(".sql")) {
      setSelectedFile(file);
    } else {
      showNotification("Harap unggah berkas berformat .sql!", "error");
    }
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <PageHeader title="Backup & Restore Data" />
        <div className="flex items-center space-x-3">
          <button
            onClick={handleGenerateDummy}
            disabled={dummyLoading}
            className="btn-secondary flex items-center space-x-2 py-2 px-4 shadow-sm border border-gray-200 disabled:opacity-50"
          >
            {dummyLoading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <RefreshCw size={16} />
            )}
            <span>{dummyLoading ? "Sedang Membuat Demo..." : "Buat Data Demo"}</span>
          </button>
          <button
            onClick={handleCreateBackup}
            disabled={backupLoading}
            className="btn-primary flex items-center space-x-2 py-2 px-4 shadow-md disabled:opacity-50"
          >
            {backupLoading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Database size={16} />
            )}
            <span>{backupLoading ? "Sedang Membuat Cadangan..." : "Buat Backup Baru"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TABEL LIST BACKUPS DI SERVER */}
        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 lg:col-span-2 flex flex-col justify-between min-h-[400px]">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-green-50 text-intigizi-green rounded-xl">
                  <Layers size={22} />
                </div>
                <h2 className="text-lg font-bold text-gray-800">Daftar Cadangan di Server</h2>
              </div>
              <button
                onClick={fetchBackups}
                disabled={listLoading}
                className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                title="Refresh Daftar"
              >
                <RefreshCw className={listLoading ? "animate-spin" : ""} size={18} />
              </button>
            </div>

            {listLoading && backups.length === 0 ? (
              <div className="flex justify-center items-center py-16">
                <Loader2 className="animate-spin text-intigizi-green" size={32} />
              </div>
            ) : backups.length === 0 ? (
              <div className="text-center py-16 text-gray-500 space-y-2">
                <Database size={40} className="mx-auto text-gray-300" />
                <p className="text-sm font-semibold">Belum ada file backup di server.</p>
                <p className="text-xs">Klik "Buat Backup Baru" di kanan atas untuk mencadangkan database.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-600">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50/50">
                    <tr>
                      <th className="px-4 py-3">Nama Berkas</th>
                      <th className="px-4 py-3">Ukuran</th>
                      <th className="px-4 py-3">Tanggal Dibuat</th>
                      <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backups.map((item) => (
                      <tr key={item.filename} className="border-b hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-800 truncate max-w-[200px]" title={item.filename}>
                          {item.filename}
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-gray-500">
                          {formatSize(item.size)}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {formatDate(item.created_at)}
                        </td>
                        <td className="px-4 py-3 text-right flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleDownload(item.filename)}
                            className="px-2 py-1 text-xs font-semibold text-intigizi-green bg-green-50 hover:bg-green-100 rounded-lg flex items-center space-x-1 transition-colors"
                            title="Unduh Berkas ke Komputer"
                          >
                            <Download size={12} />
                            <span>Unduh</span>
                          </button>
                          <button
                            onClick={() => handleRestoreRequest(item)}
                            className="px-2 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center space-x-1 transition-colors"
                            title="Restore Basis Data dari Berkas Ini"
                          >
                            <RefreshCw size={12} />
                            <span>Restore</span>
                          </button>
                          <button
                            onClick={() => handleDeleteRequest(item)}
                            className="px-2 py-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg flex items-center space-x-1 transition-colors"
                            title="Hapus Berkas Cadangan"
                          >
                            <Trash2 size={12} />
                            <span>Hapus</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* DRAG & DROP UNTUK UNGGAH MANUAL */}
        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 flex flex-col justify-between h-[400px]">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2.5 bg-red-50 text-red-500 rounded-xl">
                <Upload size={22} />
              </div>
              <h2 className="text-lg font-bold text-gray-800">Restore Manual (.sql)</h2>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed mb-6">
              Punya file cadangan eksternal dari komputer Anda? Silakan seret dan lepas file tersebut di bawah ini untuk mengunggah dan memulihkan data sistem secara instan.
            </p>

            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 h-40 flex flex-col items-center justify-center ${
                dragActive ? "border-intigizi-green bg-green-50/20" : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".sql"
                className="hidden"
              />
              {selectedFile ? (
                <div className="flex flex-col items-center justify-center space-y-2 text-intigizi-green font-medium">
                  <FileText size={32} />
                  <span className="truncate max-w-[180px] text-sm">{selectedFile.name}</span>
                </div>
              ) : (
                <div className="text-gray-400 space-y-2">
                  <Upload size={24} className="mx-auto" />
                  <p className="text-xs font-semibold">Tarik & lepas file SQL di sini</p>
                  <p className="text-[10px]">atau klik untuk memilih berkas</p>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => handleRestoreRequest(selectedFile, true)}
            disabled={restoreLoading || !selectedFile}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {restoreLoading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Upload size={16} />
            )}
            <span>{restoreLoading ? "Sedang Memulihkan..." : "Unggah & Pulihkan"}</span>
          </button>
        </div>
      </div>

      {/* MODAL KONFIRMASI RESTORE */}
      <ConfirmationModal
        isOpen={isRestoreConfirmOpen}
        onClose={() => {
          setIsRestoreConfirmOpen(false);
          setConfirmInputText("");
        }}
        onConfirm={handleConfirmRestore}
        title="Peringatan Bahaya: Pemulihan Basis Data"
        confirmText="Ya, Pulihkan Sekarang"
        confirmColor="bg-red-600 hover:bg-red-700"
      >
        <div className="space-y-4">
          <div className="p-3 bg-red-50 text-red-700 rounded-xl flex items-start space-x-3">
            <AlertTriangle className="flex-shrink-0 mt-0.5" size={20} />
            <p className="text-xs font-semibold leading-relaxed">
              Tindakan ini sangat berisiko. Seluruh database saat ini akan dihapus dan ditimpa dengan data dari berkas cadangan <strong>"{targetBackup?.isManual ? targetBackup.file.name : targetBackup?.filename}"</strong>. Tindakan ini tidak dapat dibatalkan!
            </p>
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-700">
              Ketik kata kunci <span className="text-red-600">"PULIHKAN"</span> di bawah ini untuk mengonfirmasi tindakan Anda:
            </label>
            <input
              type="text"
              value={confirmInputText}
              onChange={(e) => setConfirmInputText(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-600 text-sm font-semibold"
              placeholder="Ketik PULIHKAN"
            />
          </div>
        </div>
      </ConfirmationModal>

      {/* MODAL KONFIRMASI HAPUS BACKUP */}
      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setTargetBackup(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Konfirmasi Hapus Cadangan"
        confirmText="Ya, Hapus File"
        confirmColor="bg-red-600 hover:bg-red-700"
        loading={deleteLoading}
        message={`Apakah Anda yakin ingin menghapus berkas cadangan "${targetBackup?.filename}" dari disk server? File yang dihapus tidak dapat dipulihkan kembali.`}
      />
    </div>
  );
}

export default BackupRestorePage;
