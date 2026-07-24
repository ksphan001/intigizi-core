import React from "react";
import Modal from "./Modal";
import { Loader2, AlertTriangle } from "lucide-react";

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  children,
  confirmText = "Konfirmasi",
  cancelText = "Batal",
  loading = false,
  // PERUBAHAN: Warna default diubah ke intigizi-green
  confirmColor = "bg-intigizi-green hover:bg-opacity-90",
  icon = <AlertTriangle size={16} className="mr-2" />,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p className="text-gray-600 mb-6">{message}</p>
      {children}
      <div className="flex justify-end space-x-4">
        <button onClick={onClose} disabled={loading} className="btn-secondary">
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          // PERUBAHAN: Pastikan tombol menggunakan btn-primary jika warnanya adalah default
          className={`btn-primary ${confirmColor === "bg-intigizi-green hover:bg-opacity-90" ? "" : confirmColor} flex items-center`}
        >
          {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : icon}
          {loading ? "Memproses..." : confirmText}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
