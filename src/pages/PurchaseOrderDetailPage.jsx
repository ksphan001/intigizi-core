import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import apiClient from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useNotification } from "../context/NotificationContext.jsx";
import {
  ArrowLeft,
  Loader2,
  FileText,
  Wallet,
  CheckCircle,
  Info,
  Send,
  X as XIcon,
  Upload,
  Check,
  File,
  Star,
  Printer,
} from "lucide-react";
import Modal from "../components/Modal.jsx";
import ConfirmationModal from "../components/ConfirmationModal.jsx";
import FileViewerModal from "../components/FileViewerModal.jsx";
import VendorReviewForm from "../components/VendorReviewForm.jsx";

// --- PENJELASAN PERBAIKAN ---
// 1. Bagian "Ringkasan Proposal Terkait" yang berlebihan telah dihapus.
// 2. Dibuat Zona Dokumen: Sebuah bagian baru "Dokumen Terkait" ditambahkan. Tombol "Lihat Bukti Bayar" dan "Lihat Invoice"
//    sekarang muncul di sini untuk staf dapur, dan akan selalu terlihat jika dokumennya ada, terlepas dari status PO.
// 3. Tombol "Lihat Invoice" yang sebelumnya ada di dalam "Zona Aksi" telah dihapus untuk menghindari duplikasi.

const DetailItem = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-500">{label}</p>
    <p className="font-semibold text-gray-800">{value || "-"}</p>
  </div>
);

function PurchaseOrderDetailPage() {
  const { poId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const [po, setPo] = useState(null);
  const [poItems, setPoItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const [editableItems, setEditableItems] = useState([]);
  const [confirmAction, setConfirmAction] = useState({
    isOpen: false,
    type: null,
  });
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isViewerOpen, setViewerOpen] = useState({
    isOpen: false,
    path: "",
    title: "",
  });

  const [paymentProofFile, setPaymentProofFile] = useState(null);
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const isVendor = useMemo(() => user?.role_id === 5, [user]);

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [poRes, itemsRes] = await Promise.all([
        apiClient.get(`/purchase_orders_get.php?id=${poId}`),
        apiClient.get(`/purchase_order_items_get.php?po_id=${poId}`),
      ]);
      if (!poRes.data || poRes.data.length === 0)
        throw new Error("Purchase Order tidak ditemukan.");

      const poData = poRes.data[0];
      setPo(poData);
      setPoItems(itemsRes.data);

      if (poData.vendor_status === "Menunggu Konfirmasi" && isVendor) {
        setEditableItems(
          itemsRes.data.map((item) => ({
            ...item,
            vendor_price: item.price_per_unit || 0,
          })),
        );
      }
    } catch (err) {
      setError(err.message);
      showNotification(err.response?.data?.message || err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [poId, showNotification, isVendor]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handlePriceChange = (itemId, newPrice) =>
    setEditableItems((p) =>
      p.map((i) => (i.id === itemId ? { ...i, vendor_price: newPrice } : i)),
    );
  const totalVendorAmount = useMemo(
    () =>
      editableItems.reduce(
        (t, i) => t + parseFloat(i.quantity) * parseFloat(i.vendor_price || 0),
        0,
      ),
    [editableItems],
  );

  const openConfirm = (type) => setConfirmAction({ isOpen: true, type });
  const closeConfirm = () => setConfirmAction({ isOpen: false, type: null });

  const handleAction = async (action, payload, successMsg) => {
    setActionLoading(true);
    try {
      const response = await apiClient.post(
        action.endpoint,
        payload,
        action.config,
      );
      showNotification(successMsg, "success");
      await fetchDetails();
    } catch (err) {
      showNotification(
        err.response?.data?.message || `Gagal melakukan aksi.`,
        "error",
      );
    } finally {
      setActionLoading(false);
      closeConfirm();
    }
  };

  const handleSubmitPrices = () =>
    handleAction(
      { endpoint: "/vendor_manage_po.php" },
      {
        action: "submit_prices",
        po_id: poId,
        items: editableItems.map((i) => ({
          ingredient_id: i.ingredient_id,
          vendor_price: i.vendor_price,
        })),
      },
      "Penawaran harga berhasil dikirim.",
    );
  const handleRejectPO = () =>
    handleAction(
      { endpoint: "/vendor_manage_po.php" },
      { action: "reject", po_id: poId },
      "Pesanan telah ditolak.",
    );
  const handleApprovePrices = () =>
    handleAction(
      { endpoint: "/purchase_order_update_status.php" },
      { action: "approve_prices", po_id: poId },
      "Harga telah disetujui.",
    );
  const handleRejectPrices = () =>
    handleAction(
      { endpoint: "/purchase_order_update_status.php" },
      { action: "reject_prices", po_id: poId },
      "Penawaran harga ditolak.",
    );
  const handleCompleteOrder = () =>
    handleAction(
      { endpoint: "/purchase_order_update_status.php" },
      { action: "complete_order", po_id: poId },
      "Pesanan selesai dan stok diperbarui.",
    );

  const handleUpload = async (type) => {
    const file = type === "payment" ? paymentProofFile : invoiceFile;
    if (!file) {
      showNotification("Silakan pilih file terlebih dahulu.", "warning");
      return;
    }

    const formData = new FormData();
    formData.append("po_id", poId);
    const endpoint =
      type === "payment"
        ? "/purchase_order_update_status.php"
        : "/vendor_upload_invoice.php";
    const fieldName = type === "payment" ? "payment_proof" : "invoice";
    formData.append(fieldName, file);
    if (type === "payment") formData.append("action", "upload_payment_proof");

    setActionLoading(true);
    try {
      await apiClient.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          setUploadProgress(percentCompleted);
        },
      });
      showNotification(`File berhasil diunggah.`, "success");
      if (type === "payment") setPaymentProofFile(null);
      if (type === "invoice") setInvoiceFile(null);
      await fetchDetails();
    } catch (err) {
      showNotification(
        err.response?.data?.message || "Gagal mengunggah file.",
        "error",
      );
    } finally {
      setActionLoading(false);
      setUploadProgress(0);
    }
  };

  const handlePostReview = (reviewData) => {
    handleAction(
      { endpoint: "/vendor_review_create.php" },
      { po_id: poId, ...reviewData },
      "Ulasan berhasil dikirim.",
    );
    setIsReviewModalOpen(false);
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(value || 0);
  const formatDate = (dateString) =>
    dateString
      ? new Date(dateString).toLocaleString("id-ID", {
          dateStyle: "long",
          timeStyle: "short",
        })
      : "N/A";
  const getStatusBadge = (status) => {
    const styles = {
      Dikirim: "bg-blue-100 text-blue-800",
      "Menunggu Persetujuan Harga": "bg-yellow-100 text-yellow-800",
      "Siap Dibayar": "bg-purple-100 text-purple-800",
      "Pembayaran Terkirim": "bg-indigo-100 text-indigo-800",
      Selesai: "bg-green-100 text-green-800",
      "Ditolak Vendor": "bg-red-100 text-red-800",
    };
    return (
      <span
        className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status] || "bg-gray-100 text-gray-800"}`}
      >
        {status}
      </span>
    );
  };

  const getDeliveryStatusBadge = (deliveryStatus) => {
    if (!deliveryStatus) return null;
    const styles = {
      'pending': 'bg-amber-50 text-amber-800 border-amber-250',
      'processing': 'bg-blue-50 text-blue-800 border-blue-250',
      'shipped': 'bg-purple-50 text-purple-800 border-purple-250',
      'delivered': 'bg-green-50 text-green-800 border-green-250',
    };
    const labels = {
      'pending': 'Menunggu Pemasok',
      'processing': 'Diproses Pemasok',
      'shipped': 'Dalam Pengiriman',
      'delivered': 'Tiba di Tujuan',
    };
    return (
      <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${styles[deliveryStatus] || 'bg-gray-50 text-gray-850 border-gray-200'}`}>
        Status Pengiriman: {labels[deliveryStatus] || deliveryStatus}
      </span>
    );
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-intigizi-green" />
      </div>
    );
  if (error) return <div className="text-red-500 p-4 text-center">{error}</div>;
  if (!po) return null;

  const isActionable = isVendor && po.vendor_status === "Menunggu Konfirmasi";
  const isB2B = isVendor || (po.supplier_id && po.marketplace_id && po.supplier_name !== "Belum Ditentukan");
  const isNegotiating = isB2B && (po.status === "Menunggu Persetujuan Harga" || po.vendor_status === "Menunggu Konfirmasi");

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          body {
            background-color: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .shadow-md, .shadow-xl {
            box-shadow: none !important;
            border: 1px solid #e5e7eb !important;
          }
          /* Matikan margin atas/bawah browser default */
          @page {
            margin: 1.5cm;
          }
        }
      `}</style>

      <Link
        to={isVendor ? "/app/vendor/orders" : "/app/purchase-orders"}
        className="flex items-center text-gray-500 hover:text-gray-800 print:hidden"
      >
        <ArrowLeft size={20} className="mr-2" />
        Kembali ke Daftar Pesanan
      </Link>

      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{po.po_code}</h1>
            <p className="text-gray-500">
              Tanggal Dibuat: {formatDate(po.created_at)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {getStatusBadge(po.status)}
            {po.supplier_name && po.supplier_name !== "Belum Ditentukan" && getDeliveryStatusBadge(po.delivery_status)}
            <button
              onClick={() => window.print()}
              className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 print:hidden cursor-pointer"
            >
              <Printer size={14} />
              Cetak Bukti PO
            </button>
          </div>
        </div>
        <div className="border-t my-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <DetailItem label="Supplier" value={po.supplier_name} />
          <DetailItem
            label="Proposal Terkait"
            value={po.proposal_code || "Manual"}
          />
          <DetailItem label="Status Supplier" value={po.vendor_status} />
          <DetailItem
            label="Total Nilai PO"
            value={formatCurrency(
              isActionable ? totalVendorAmount : po.total_amount,
            )}
          />
        </div>
      </div>

      {/* --- ZONA DOKUMEN BARU (HANYA UNTUK DAPUR) --- */}
      {!isVendor && (po.payment_proof_path || po.invoice_path) && (
        <div className="bg-white p-6 rounded-xl shadow-md print:hidden">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Dokumen Terkait
          </h2>
          <div className="flex items-center space-x-4">
            {po.payment_proof_path && (
              <button
                onClick={() =>
                  setViewerOpen({
                    isOpen: true,
                    path: po.payment_proof_path,
                    title: "Bukti Pembayaran",
                  })
                }
                className="btn-secondary"
              >
                <FileText size={16} className="mr-2" /> Lihat Bukti Pembayaran
              </button>
            )}
            {po.invoice_path && (
              <button
                onClick={() =>
                  setViewerOpen({
                    isOpen: true,
                    path: po.invoice_path,
                    title: "Invoice",
                  })
                }
                className="btn-secondary"
              >
                <FileText size={16} className="mr-2" /> Lihat Invoice
              </button>
            )}
          </div>
        </div>
      )}

      {/* --- ZONA AKSI --- */}
      <div className="bg-white p-6 rounded-xl shadow-md print:hidden">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Aksi yang Tersedia
        </h2>
        <div className="p-4 bg-gray-50 rounded-lg">
          {/* Aksi untuk Supplier */}
          {isVendor && po.vendor_status === "Menunggu Konfirmasi" && (
            <div>
              <p className="text-sm font-semibold mb-2">
                Berikan penawaran harga Anda untuk setiap item di bawah.
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => openConfirm("reject")}
                  className="btn-secondary bg-red-100 text-red-700 hover:bg-red-200"
                >
                  <XIcon size={16} className="mr-2" />
                  Tolak Pesanan
                </button>
                <button
                  onClick={() => openConfirm("submit")}
                  className="btn-primary"
                >
                  <Send size={16} className="mr-2" />
                  Kirim Penawaran Harga
                </button>
              </div>
            </div>
          )}
          {isVendor && po.status === "Pembayaran Terkirim" && (
            <div>
              <p className="text-sm font-semibold mb-2">
                Dapur telah mengirim bukti pembayaran. Silakan unggah invoice
                Anda.
              </p>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  onChange={(e) => setInvoiceFile(e.target.files[0])}
                  className="input-style flex-grow"
                  accept=".pdf,image/*"
                />
                <button
                  onClick={() => handleUpload("invoice")}
                  disabled={actionLoading}
                  className="btn-primary w-48"
                >
                  <Upload size={16} className="mr-2" />
                  {actionLoading ? `Mengunggah...` : "Unggah Invoice"}
                </button>
              </div>
              {actionLoading && uploadProgress > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-intigizi-green h-2 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
              {po.payment_proof_path && (
                <button
                  onClick={() =>
                    setViewerOpen({
                      isOpen: true,
                      path: po.payment_proof_path,
                      title: "Bukti Pembayaran",
                    })
                  }
                  className="text-sm text-intigizi-green hover:underline mt-2"
                >
                  Lihat Bukti Pembayaran
                </button>
              )}
            </div>
          )}

          {/* Aksi untuk Dapur */}
          {!isVendor && po.status === "Menunggu Persetujuan Harga" && (
            <div>
              <p className="text-sm font-semibold mb-2">
                Supplier telah mengirimkan penawaran harga baru. Silakan tinjau
                dan berikan persetujuan.
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => openConfirm("reject_prices")}
                  className="btn-secondary bg-red-100 text-red-700 hover:bg-red-200"
                >
                  <XIcon size={16} className="mr-2" />
                  Tolak Harga
                </button>
                <button
                  onClick={() => openConfirm("approve_prices")}
                  className="btn-primary"
                >
                  <Check size={16} className="mr-2" />
                  Setujui Harga
                </button>
              </div>
            </div>
          )}
          {!isVendor && po.status === "Siap Dibayar" && (
            <div>
              <p className="text-sm font-semibold mb-2">
                PO siap untuk dibayar. Unggah bukti pembayaran setelah Anda
                melakukan transfer.
              </p>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  onChange={(e) => setPaymentProofFile(e.target.files[0])}
                  className="input-style flex-grow"
                  accept=".pdf,image/*"
                />
                <button
                  onClick={() => handleUpload("payment")}
                  disabled={actionLoading}
                  className="btn-primary w-56"
                >
                  <Upload size={16} className="mr-2" />
                  {actionLoading ? `Mengunggah...` : "Unggah Bukti Bayar"}
                </button>
              </div>
              {actionLoading && uploadProgress > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-intigizi-green h-2 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
            </div>
          )}
          {!isVendor &&
            po.status === "Pembayaran Terkirim" &&
            po.invoice_path && (
              <div>
                <p className="text-sm font-semibold mb-2">
                  Supplier telah mengirim invoice. Jika semua barang sudah
                  diterima, selesaikan pesanan ini.
                </p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => openConfirm("complete")}
                    className="btn-primary bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle size={16} className="mr-2" />
                    Selesaikan Pesanan
                  </button>
                </div>
              </div>
            )}
          {!isVendor &&
            po.status === "Selesai" &&
            po.has_been_reviewed == 0 && (
              <div>
                <p className="text-sm font-semibold mb-2">
                  Pesanan selesai. Berikan ulasan untuk membantu komunitas.
                </p>
                <button
                  onClick={() => setIsReviewModalOpen(true)}
                  className="btn-primary bg-yellow-500 hover:bg-yellow-600"
                >
                  <Star size={16} className="mr-2" />
                  Beri Ulasan
                </button>
              </div>
            )}

          {/* Pesan default jika tidak ada aksi */}
          {["Dikirim", "Diverifikasi", "Ditolak Supplier"].includes(
            po.status,
          ) && (
            <p className="text-sm text-gray-600">
              Menunggu aksi dari pihak lain. Silakan pantau status pesanan.
            </p>
          )}
          {isVendor &&
            ["Disetujui Dapur", "Invoice Terkirim"].includes(
              po.vendor_status,
            ) && (
              <p className="text-sm text-gray-600">
                Menunggu aksi dari pihak dapur.
              </p>
            )}
          {!isVendor &&
            po.status === "Pembayaran Terkirim" &&
            !po.invoice_path && (
              <p className="text-sm text-gray-600">
                Menunggu supplier mengunggah invoice.
              </p>
            )}
          {!isVendor &&
            po.status === "Selesai" &&
            po.has_been_reviewed == 1 && (
              <p className="text-sm text-green-700 flex items-center">
                <CheckCircle size={16} className="mr-2" />
                Terima kasih, Anda sudah memberikan ulasan untuk pesanan ini.
              </p>
            )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Rincian Item Pesanan
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Bahan</th>
                <th className="px-4 py-2 text-right">Kuantitas</th>
                {isNegotiating ? (
                  <>
                    <th className="px-4 py-2 text-right">Harga Satuan (Dapur)</th>
                    <th className="px-4 py-2 text-right">Harga Satuan (Vendor)</th>
                  </>
                ) : (
                  <th className="px-4 py-2 text-right">Harga Satuan</th>
                )}
                <th className="px-4 py-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(isVendor && po.vendor_status === "Menunggu Konfirmasi"
                ? editableItems
                : poItems
              ).map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {item.ingredient_name}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {parseFloat(item.quantity).toLocaleString("id-ID")}{" "}
                    {item.unit_symbol}
                  </td>
                  {isNegotiating ? (
                    <>
                      <td className="px-4 py-3 text-right text-gray-500">
                        {formatCurrency(item.price_per_unit)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isVendor && po.vendor_status === "Menunggu Konfirmasi" ? (
                          <input
                            type="number"
                            value={item.vendor_price}
                            onChange={(e) =>
                              handlePriceChange(item.id, e.target.value)
                            }
                            className="input-style max-w-[120px] text-right ml-auto"
                          />
                        ) : (
                          <span className="font-semibold text-intigizi-orange">
                            {item.vendor_price_per_unit
                              ? formatCurrency(item.vendor_price_per_unit)
                              : formatCurrency(item.price_per_unit)}
                          </span>
                        )}
                      </td>
                    </>
                  ) : (
                    <td className="px-4 py-3 text-right font-medium text-gray-700">
                      {formatCurrency(item.vendor_price_per_unit ?? item.price_per_unit)}
                    </td>
                  )}
                  <td className="px-4 py-3 text-right font-semibold">
                    {isVendor && po.vendor_status === "Menunggu Konfirmasi"
                      ? formatCurrency(
                          parseFloat(item.quantity) *
                            parseFloat(item.vendor_price || 0),
                        )
                      : formatCurrency(item.vendor_subtotal ?? item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 font-bold">
              <tr>
                <td colSpan={isNegotiating ? "4" : "3"} className="px-4 py-3 text-right">
                  TOTAL
                </td>
                <td className="px-4 py-3 text-right">
                  {formatCurrency(
                    isVendor && po.vendor_status === "Menunggu Konfirmasi"
                      ? totalVendorAmount
                      : po.total_amount,
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <ConfirmationModal
        isOpen={confirmAction.isOpen}
        onClose={closeConfirm}
        title="Konfirmasi Aksi"
        message={
          confirmAction.type === "submit"
            ? `Anda akan mengirimkan penawaran harga dengan total ${formatCurrency(totalVendorAmount)}. Lanjutkan?`
            : confirmAction.type === "reject"
              ? "Apakah Anda yakin ingin menolak pesanan ini?"
              : confirmAction.type === "approve_prices"
                ? "Setujui penawaran harga dari vendor?"
                : confirmAction.type === "reject_prices"
                  ? "Tolak penawaran harga dan minta vendor mengajukan ulang?"
                  : confirmAction.type === "complete"
                    ? "Konfirmasi bahwa semua barang telah diterima dan selesaikan pesanan ini? Aksi ini akan menambah stok gudang."
                    : ""
        }
        onConfirm={() => {
          if (confirmAction.type === "submit") handleSubmitPrices();
          else if (confirmAction.type === "reject") handleRejectPO();
          else if (confirmAction.type === "approve_prices")
            handleApprovePrices();
          else if (confirmAction.type === "reject_prices") handleRejectPrices();
          else if (confirmAction.type === "complete") handleCompleteOrder();
        }}
        loading={actionLoading}
      />

      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title={`Beri Ulasan untuk PO ${po.po_code}`}
      >
        <VendorReviewForm
          poCode={po.po_code}
          onSubmit={handlePostReview}
          onCancel={() => setIsReviewModalOpen(false)}
          loading={actionLoading}
        />
      </Modal>

      <FileViewerModal
        isOpen={isViewerOpen.isOpen}
        onClose={() => setViewerOpen({ isOpen: false, path: "", title: "" })}
        filePath={isViewerOpen.path}
        title={isViewerOpen.title}
      />
    </div>
  );
}

export default PurchaseOrderDetailPage;
