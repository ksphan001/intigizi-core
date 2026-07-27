import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import apiClient from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useNotification } from "../context/NotificationContext.jsx";
import {
  ArrowLeft,
  Trash2,
  Send,
  Check,
  X as XIcon,
  FileText,
  CookingPot,
  CheckCircle,
  Loader2,
  CalendarOff,
  Eye,
  Users,
  BarChart3,
  Wallet,
  CalendarDays,
  Droplets,
  Wheat,
  Beef,
  Flame,
  Edit,
  UserCheck,
  Leaf,
  Printer,
} from "lucide-react";
import Modal from "../components/Modal.jsx";
import ConfirmationModal from "../components/ConfirmationModal.jsx";
import ProposalCalculation from "../components/ProposalCalculation.jsx";
import ProposalForm from "../components/ProposalForm.jsx";

// --- PENJELASAN PERBAIKAN ---
// File ini ditulis ulang untuk memperbaiki bug di mana 'proposalId' menjadi 'undefined'.
// 1. `fetchDetails` sekarang memiliki guard clause yang lebih kuat untuk memeriksa `id` yang tidak valid.
// 2. Semua pemanggilan `fetchDetails` kini secara eksplisit meneruskan `proposalId` dari `useParams`.

const ROLES = {
  KEPALA_DAPUR: 2,
  AKUNTAN: 3,
  YAYASAN: 4,
  ADMINISTRATOR: 7,
};

const StatCard = ({ icon, title, value, loading }) => (
  <div className="bg-white p-4 rounded-xl shadow-md flex flex-col items-center text-center h-full">
    {/* PERUBAHAN: Warna ikon */}
    <div className="bg-green-50 p-3 rounded-full mb-3">{icon}</div>
    <p className="text-sm text-gray-500">{title}</p>
    {loading ? (
      <div className="h-7 w-24 bg-gray-200 rounded animate-pulse mt-1"></div>
    ) : (
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    )}
  </div>
);

const NutritionDetailCard = ({ menu, formatCurrency }) => {
  const NutritionItem = ({ icon, value, unit }) => (
    <div className="flex items-center text-xs">
      {React.cloneElement(icon, { size: 14, className: "mr-1.5" })}
      <span className="text-gray-600">
        {parseFloat(value || 0).toFixed(1)}
        {unit}
      </span>
    </div>
  );

  return (
    <div className="bg-white p-4 rounded-lg border flex flex-col">
      <h4 className="font-bold text-gray-800 mb-3">{menu.menu_name}</h4>
      <div className="space-y-3">
        {menu.details_per_category.map((detail) => (
          <div key={detail.category_id} className="border-t pt-2">
            <div className="flex justify-between items-center">
              {/* PERUBAHAN: Warna teks */}
              <p className="font-semibold text-sm text-intigizi-green-dark">
                {detail.category_name}
              </p>
              <p className="font-bold text-sm text-intigizi-orange">
                {formatCurrency(detail.hpp)}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-x-2 gap-y-1 mt-1">
              <NutritionItem
                icon={<Flame className="text-red-500" />}
                value={detail.nutrition.calories}
                unit="kcal"
              />
              <NutritionItem
                icon={<Beef className="text-blue-500" />}
                value={detail.nutrition.protein}
                unit="g"
              />
              <NutritionItem
                icon={<Leaf className="text-green-500" />}
                value={detail.nutrition.fiber}
                unit="g"
              />
              <NutritionItem
                icon={<Wheat className="text-yellow-500" />}
                value={detail.nutrition.carbohydrates}
                unit="g"
              />
              <NutritionItem
                icon={<Droplets className="text-orange-400" />}
                value={detail.nutrition.fat}
                unit="g"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const DetailModal = ({ isOpen, onClose, date, item, calculation }) => {
  if (!isOpen || !item) return null;
  const menuDetails = calculation?.menu_details?.find(
    (m) => m.menu_id === item.menu_id,
  );
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detail Menu: ${item.menu_name}`}
      size="lg"
    >
      <div className="space-y-4">
        <p className="text-center text-gray-600">
          Detail gizi dan HPP untuk tanggal {date}
        </p>
        {menuDetails ? (
          <div className="space-y-3">
            {menuDetails.details_per_category.map((detail) => (
              <div
                key={detail.category_id}
                className="p-4 bg-gray-50 rounded-lg border"
              >
                <div className="flex justify-between items-center mb-2">
                  {/* PERUBAHAN: Warna teks */}
                  <h4 className="font-bold text-intigizi-green-dark">
                    {detail.category_name}
                  </h4>
                  <p className="font-bold text-intigizi-orange">
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                    }).format(detail.hpp)}
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                  <p>
                    <strong>Kalori:</strong>{" "}
                    {parseFloat(detail.nutrition.calories).toFixed(1)} kcal
                  </p>
                  <p>
                    <strong>Protein:</strong>{" "}
                    {parseFloat(detail.nutrition.protein).toFixed(1)} g
                  </p>
                  <p>
                    <strong>Karbohidrat:</strong>{" "}
                    {parseFloat(detail.nutrition.carbohydrates).toFixed(1)} g
                  </p>
                  <p>
                    <strong>Lemak:</strong>{" "}
                    {parseFloat(detail.nutrition.fat).toFixed(1)} g
                  </p>
                  <p>
                    <strong>Serat:</strong>{" "}
                    {parseFloat(detail.nutrition.fiber).toFixed(1)} g
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">
            Data detail tidak tersedia.
          </p>
        )}
      </div>
      <div className="mt-6 flex justify-end">
        <button onClick={onClose} className="btn-secondary">
          Tutup
        </button>
      </div>
    </Modal>
  );
};

const PrintBudgetModal = ({ isOpen, onClose, calculation, schedule, proposal }) => {
  if (!isOpen || !calculation || !proposal) return null;

  // 1. Hitung jumlah hari penyajian untuk setiap menu_id
  const menuDaysCount = {};
  schedule.forEach(item => {
    if (item.menu_id && item.menu_id !== 1 && !item.is_holiday) {
      menuDaysCount[item.menu_id] = (menuDaysCount[item.menu_id] || 0) + 1;
    }
  });

  // 2. Mengambil data penerima manfaat (PM) dari data kalkulasi real-time titik distribusi
  const targetRecipients = calculation.beneficiary_counts || (proposal.target_recipients ? JSON.parse(proposal.target_recipients) : {});

  // Formatter uang
  const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

  const handlePrint = () => {
    window.print();
  };

  let grandTotal = 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cetak Laporan Rencana Anggaran Menu" size="4xl">
      <div className="space-y-6 print-container p-4" id="printable-budget-report">
        {/* Style khusus cetak */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-budget-report, #printable-budget-report * {
              visibility: visible;
            }
            #printable-budget-report {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .no-print {
              display: none !important;
            }
          }
        `}} />

        {/* Header Laporan */}
        <div className="text-center border-b pb-4">
          <h2 className="text-2xl font-bold text-gray-800">LAPORAN RENCANA ANGGARAN BIAYA MENU</h2>
          <p className="text-sm text-gray-500">Proposal Program: {proposal.proposal_code} — {proposal.title}</p>
          <p className="text-xs text-gray-400 mt-1">Periode: {proposal.start_date} s/d {proposal.end_date}</p>
        </div>

        <div className="space-y-8">
          {calculation.menu_details && calculation.menu_details.map((menu) => {
            const days = menuDaysCount[menu.menu_id] || 0;
            if (days === 0) return null; // Abaikan jika menu tidak pernah disajikan

            let menuTotal = 0;

            return (
              <div key={menu.menu_id} className="border rounded-xl p-4 bg-white shadow-sm page-break-inside-avoid">
                {/* Header Sub-Menu */}
                <div className="flex justify-between items-center border-b pb-2 mb-3 bg-gray-50 -mx-4 -mt-4 p-3 rounded-t-xl">
                  <h3 className="text-base font-bold text-gray-800 flex items-center">
                    <CookingPot size={18} className="mr-2 text-intigizi-green" />
                    {menu.menu_name}
                  </h3>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-intigizi-green-light text-intigizi-green-dark rounded-full">
                    Disajikan: {days} Hari
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 border text-xs">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-3 py-2 text-left font-bold text-gray-700 border">Kategori Sasaran / Bahan Baku</th>
                        <th className="px-3 py-2 text-right font-bold text-gray-700 border">Penerima (PM) / Porsi</th>
                        <th className="px-3 py-2 text-right font-bold text-gray-700 border">Food Cost / Porsi</th>
                        <th className="px-3 py-2 text-right font-bold text-gray-700 border">Harga Acuan Bahan</th>
                        <th className="px-3 py-2 text-right font-bold text-gray-700 border">Subtotal Biaya</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {menu.details_per_category.map((detail) => {
                        const pmCount = targetRecipients[detail.category_id] || 0;
                        if (pmCount <= 0) return null; // Abaikan kategori jika tidak ada penerima manfaat terdaftar (PM = 0)
                        
                        const hpp = detail.hpp || 0;
                        const subtotal = hpp * pmCount * days;
                        menuTotal += subtotal;
                        grandTotal += subtotal;

                        return (
                          <React.Fragment key={`${menu.menu_id}-${detail.category_id}`}>
                            {/* Baris Kategori Utama */}
                            <tr className="bg-gray-50/70 font-semibold text-gray-900">
                              <td className="px-3 py-2 border font-bold text-intigizi-green-dark">{detail.category_name}</td>
                              <td className="px-3 py-2 text-right border">{pmCount.toLocaleString('id-ID')} anak</td>
                              <td className="px-3 py-2 text-right text-intigizi-orange border">{formatCurrency(hpp)}</td>
                              <td className="px-3 py-2 text-right border">-</td>
                              <td className="px-3 py-2 text-right font-bold text-gray-900 border">{formatCurrency(subtotal)}</td>
                            </tr>
                            
                            {/* Baris Detail Bahan */}
                            {detail.ingredients_breakdown && detail.ingredients_breakdown.map((ing, ingIndex) => {
                              const total_ing_cost = ing.cost * pmCount * days;
                              return (
                                <tr key={`${menu.menu_id}-${detail.category_id}-ing-${ingIndex}`} className="text-[11px] text-gray-500 bg-white hover:bg-gray-50/50">
                                  <td className="px-5 py-1.5 border italic pl-8">
                                    ↳ {ing.ingredient_name}
                                  </td>
                                  <td className="px-3 py-1.5 text-right border">
                                    {ing.gross_weight_g} g <span className="text-[9px] text-gray-400 font-light">(kotor)</span>
                                  </td>
                                  <td className="px-3 py-1.5 text-right border">
                                    {formatCurrency(ing.cost)}
                                  </td>
                                  <td className="px-3 py-1.5 text-right border text-gray-600">
                                    {formatCurrency(ing.price_per_unit)} / {ing.unit_symbol || 'Kg'}
                                  </td>
                                  <td className="px-3 py-1.5 text-right border text-gray-600">
                                    {formatCurrency(total_ing_cost)}
                                  </td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50 font-bold">
                      <tr>
                        <td colSpan="4" className="px-3 py-2 text-right text-gray-700 border">TOTAL ANGGARAN MENU: {menu.menu_name}</td>
                        <td className="px-3 py-2 text-right text-gray-900 border">{formatCurrency(menuTotal)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            );
          })}

          {grandTotal === 0 && (
            <div className="text-center py-8 text-gray-500 italic border rounded-xl bg-gray-50">
              Jadwalkan menu di kalender terlebih dahulu untuk menghitung anggaran.
            </div>
          )}

          {grandTotal > 0 && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex justify-between items-center font-bold text-sm">
              <span className="text-green-800 text-base">TOTAL KESELURUHAN ANGGARAN MASAKAN</span>
              <span className="text-green-700 text-xl">{formatCurrency(grandTotal)}</span>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 no-print mt-6 border-t pt-4">
          <button onClick={onClose} className="btn-secondary">
            Tutup
          </button>
          <button onClick={handlePrint} className="btn-primary flex items-center">
            <Printer size={16} className="mr-2" /> Cetak Laporan (PDF)
          </button>
        </div>
      </div>
    </Modal>
  );
};

function ProposalDetailPage() {
  const { proposalId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const [proposal, setProposal] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [menus, setMenus] = useState([]);
  const [productionLogs, setProductionLogs] = useState([]);
  const [calculation, setCalculation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const [confirmAction, setConfirmAction] = useState({
    action: null,
    title: "",
    message: "",
  });
  const [selectedDates, setSelectedDates] = useState([]);
  const [viewingItem, setViewingItem] = useState(null);

  const fetchDetails = useCallback(
    async (id) => {
      // --- PERBAIKAN DI SINI: Guard clause yang lebih kuat ---
      if (!id || id === "undefined") {
        setError("ID Proposal tidak valid atau tidak ditemukan di URL.");
        setLoading(false);
        showNotification(
          "Gagal memuat detail: ID Proposal tidak valid.",
          "error",
        );
        return;
      }
      try {
        setLoading(true);
        const [proposalRes, scheduleRes, logsRes, calcRes, menusRes] =
          await Promise.all([
            apiClient.get(`/proposals_get.php?id=${id}`),
            apiClient.get(`/proposal_menus_get.php?proposal_id=${id}`),
            apiClient.get(`/production_logs_get.php?proposal_id=${id}`),
            apiClient.get(`/proposal_calculate.php?proposal_id=${id}`),
            apiClient.get("/menus_get.php"),
          ]);

        if (proposalRes.data.length === 0)
          throw new Error("Proposal tidak ditemukan.");

        setProposal(proposalRes.data[0]);
        setSchedule(scheduleRes.data);
        setProductionLogs(logsRes.data.map((log) => log.production_date));
        setCalculation(calcRes.data);
        setMenus(menusRes.data);
      } catch (err) {
        setError("Gagal memuat detail proposal.");
        showNotification(
          err.response?.data?.message || "Gagal memuat detail proposal.",
          "error",
        );
      } finally {
        setLoading(false);
      }
    },
    [showNotification],
  );

  useEffect(() => {
    fetchDetails(proposalId);
  }, [fetchDetails, proposalId]);

  const handleToggleDateSelection = (date) => {
    setSelectedDates((prev) =>
      prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date],
    );
  };

  const handleBulkMarkAsHoliday = async () => {
    if (selectedDates.length === 0) return;
    setActionLoading(true);
    try {
      await apiClient.post("/proposal_menus_add.php", {
        proposal_id: proposalId,
        menu_id: 1,
        serving_dates: selectedDates,
      });
      showNotification(
        `${selectedDates.length} tanggal telah ditandai sebagai hari libur.`,
        "success",
      );
      setSelectedDates([]);
      await fetchDetails(proposalId);
    } catch (err) {
      showNotification(
        err.response?.data?.message || "Gagal menandai hari libur.",
        "error",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleReduceStock = async (date) => {
    setActionLoading(true);
    try {
      await apiClient.post("/stock_reduce_for_production.php", {
        proposal_id: proposalId,
        production_date: date,
      });
      showNotification(
        "Stok berhasil dikurangi dan produksi telah dicatat.",
        "success",
      );
      await fetchDetails(proposalId);
    } catch (err) {
      setError(err.response?.data?.message || "Gagal mengurangi stok.");
      showNotification(
        err.response?.data?.message || "Gagal mengurangi stok.",
        "error",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    setActionLoading(true);
    try {
      const response = await apiClient.post("/proposal_update_status.php", {
        id: proposalId,
        status,
      });
      showNotification(response.data.message, "success");
      setIsConfirmModalOpen(false);
      await fetchDetails(proposalId);
    } catch (err) {
      setError(`Gagal mengubah status proposal.`);
      showNotification(
        err.response?.data?.message || "Gagal mengubah status.",
        "error",
      );
      setIsConfirmModalOpen(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateProposal = async (proposalData) => {
    setActionLoading(true);
    try {
      const response = await apiClient.post(
        "/proposals_update.php",
        proposalData,
      );
      showNotification(response.data.message, "success");
      setIsEditModalOpen(false);
      await fetchDetails(proposalId);
    } catch (err) {
      showNotification(
        err.response?.data?.message || "Gagal menyimpan proposal",
        "error",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartProcurement = () => {
    navigate(`/app/procurement/${proposalId}`);
  };

  const openConfirm = (action, title, message) => {
    setConfirmAction({ action, title, message });
    setIsConfirmModalOpen(true);
  };

  const handleOpenScheduler = () => {
    if (selectedDates.length > 0) {
      setIsScheduleModalOpen(true);
    }
  };

  const openDetailModal = (item) => {
    setViewingItem(item);
    setIsDetailModalOpen(true);
  };

  const handleSaveSchedule = async (menuId) => {
    setActionLoading(true);
    try {
      await apiClient.post("/proposal_menus_add.php", {
        proposal_id: proposalId,
        menu_id: menuId,
        serving_dates: selectedDates,
      });
      showNotification("Menu berhasil dijadwalkan.", "success");
      setIsScheduleModalOpen(false);
      setSelectedDates([]);
      await fetchDetails(proposalId);
    } catch (err) {
      showNotification(
        err.response?.data?.message || "Gagal menjadwalkan menu.",
        "error",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    setActionLoading(true);
    try {
      await apiClient.post("/proposal_menus_remove.php", { id: scheduleId });
      showNotification("Jadwal berhasil dihapus.", "success");
      await fetchDetails(proposalId);
    } catch (err) {
      showNotification(
        err.response?.data?.message || "Gagal menghapus jadwal.",
        "error",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const getDatesInRange = (startDate, endDate) => {
    const dates = [];
    let currentDate = new Date(startDate);
    currentDate.setUTCHours(0, 0, 0, 0);
    const stopDate = new Date(endDate);
    stopDate.setUTCHours(0, 0, 0, 0);

    while (currentDate <= stopDate) {
      dates.push(currentDate.toISOString().split("T")[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
  };

  const allDatesInProposal = useMemo(() => {
    if (!proposal) return [];
    return getDatesInRange(proposal.start_date, proposal.end_date);
  }, [proposal]);

  const isProposalScheduleComplete = useMemo(() => {
    if (!proposal || allDatesInProposal.length === 0) return false;
    return allDatesInProposal.every((date) =>
      schedule.some((s) => s.serving_date === date),
    );
  }, [proposal, schedule, allDatesInProposal]);

  const formatFullDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString + "T00:00:00Z").toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatShortDate = (dateString) => {
    if (!dateString) return { day: "", date: "" };
    const date = new Date(dateString + "T00:00:00Z");
    return {
      day: date.toLocaleDateString("id-ID", { weekday: "short" }),
      date: date.getDate(),
    };
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value || 0);

  // PERUBAHAN: Warna loader
  if (loading)
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="animate-spin text-intigizi-green" />
      </div>
    );
  if (error || !proposal)
    return <div className="text-red-500 p-4 text-center">{error}</div>;

  const canEditDraft =
    user &&
    (Number(user.role_id) === ROLES.KEPALA_DAPUR ||
      Number(user.role_id) === ROLES.ADMINISTRATOR);
  const canApprove =
    user &&
    (Number(user.role_id) === ROLES.YAYASAN || Number(user.role_id) === ROLES.ADMINISTRATOR);
  const canEditApproved =
    user &&
    [ROLES.KEPALA_DAPUR, ROLES.AKUNTAN, ROLES.ADMINISTRATOR].includes(
      Number(user.role_id),
    );
  const isEditable =
    canEditDraft ||
    (canEditApproved &&
      proposal.status === "Disetujui" &&
      !proposal.has_po_generated);

  const numberOfEffectiveDays = calculation?.effective_days_count || 0;
  const totalPortions =
    numberOfEffectiveDays * (proposal?.target_recipients || 0);

  return (
    <div className="space-y-6">
      <Link
        to="/app/proposals"
        className="flex items-center text-gray-500 hover:text-gray-800 mb-4"
      >
        <ArrowLeft size={20} className="mr-2" />
        Kembali ke Daftar Proposal
      </Link>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            {proposal.proposal_code}
          </h1>
          <p className="text-gray-500">
            Periode: {formatFullDate(proposal.start_date)} -{" "}
            {formatFullDate(proposal.end_date)}
          </p>
          {proposal.last_edited_by_name && (
            <p className="text-xs text-gray-500 mt-1 flex items-center">
              <UserCheck size={14} className="mr-1.5" />
              Terakhir diedit oleh: {proposal.last_edited_by_name}
            </p>
          )}
        </div>
        <div className="flex space-x-2">
          {proposal.status !== "Draft" && (
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="btn-secondary flex items-center"
            >
              <Printer size={16} className="mr-2" /> Cetak Anggaran Menu
            </button>
          )}
          {isEditable && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="btn-secondary flex items-center"
            >
              <Edit size={16} className="mr-2" /> Edit Proposal
            </button>
          )}
          {proposal.status === "Draft" && canEditDraft && (
            <div className="relative group">
              <button
                onClick={() =>
                  openConfirm(
                    "submit",
                    "Ajukan Proposal",
                    "Apakah Anda yakin ingin mengajukan proposal ini? Pastikan semua jadwal sudah terisi.",
                  )
                }
                className="btn-primary flex items-center"
                disabled={!isProposalScheduleComplete}
              >
                <Send size={16} className="mr-2" /> Ajukan
              </button>
              {!isProposalScheduleComplete && (
                <div className="absolute bottom-full mb-2 w-64 bg-gray-800 text-white text-xs rounded py-1 px-2 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Tombol akan aktif setelah semua tanggal diisi dengan menu atau
                  ditandai sebagai hari libur.
                </div>
              )}
            </div>
          )}
          {proposal.status === "Diajukan" && canApprove && (
            <>
              <button
                onClick={() =>
                  openConfirm(
                    "reject",
                    "Tolak Proposal",
                    "Apakah Anda yakin ingin menolak proposal ini?",
                  )
                }
                className="btn-secondary bg-red-500 text-white hover:bg-red-600 flex items-center"
              >
                <XIcon size={16} className="mr-2" /> Tolak
              </button>
              <button
                onClick={() =>
                  openConfirm(
                    "approve",
                    "Setujui Proposal",
                    "Apakah Anda yakin ingin menyetujui proposal ini?",
                  )
                }
                className="btn-primary flex items-center"
              >
                <Check size={16} className="mr-2" /> Setujui
              </button>
            </>
          )}

          {proposal.status === "Disetujui" &&
            (canEditDraft || canEditApproved) &&
            (proposal.has_po_generated ? (
              <button
                onClick={handleStartProcurement}
                className="btn-secondary flex items-center"
              >
                <Eye size={16} className="mr-2" /> Lihat Proses Pengadaan
              </button>
            ) : (
              // PERUBAHAN: Warna tombol diganti
              <button
                onClick={handleStartProcurement}
                className="btn-primary flex items-center"
              >
                <FileText size={16} className="mr-2" /> Mulai Proses Pengadaan
              </button>
            ))}
        </div>
      </div>

      {error && !loading && (
        <div className="text-red-500 p-4 mb-4 rounded-md bg-red-100">
          {error}
        </div>
      )}

      {proposal.status !== "Draft" && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Ringkasan Proposal
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* PERUBAHAN: Warna ikon */}
            <StatCard
              icon={<Users size={24} className="text-intigizi-green-dark" />}
              title="Target Porsi / Hari"
              value={proposal.target_recipients}
              loading={loading}
            />
            <StatCard
              icon={
                <CalendarDays size={24} className="text-intigizi-green-dark" />
              }
              title="Hari Produksi Efektif"
              value={numberOfEffectiveDays}
              loading={loading}
            />
            <StatCard
              icon={
                <CookingPot size={24} className="text-intigizi-green-dark" />
              }
              title="Total Porsi Dihasilkan"
              value={totalPortions.toLocaleString("id-ID")}
              loading={loading}
            />
            <StatCard
              icon={<Wallet size={24} className="text-intigizi-green-dark" />}
              title="Estimasi Anggaran"
              value={formatCurrency(calculation?.total_estimated_budget)}
              loading={loading}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Jadwal Menu Harian</h2>
            {proposal.status === "Draft" &&
              canEditDraft &&
              selectedDates.length > 0 && (
                <div className="flex space-x-2">
                  <button
                    onClick={handleOpenScheduler}
                    className="btn-primary text-sm px-3 py-1"
                  >
                    Jadwalkan ({selectedDates.length})
                  </button>
                  <button
                    onClick={handleBulkMarkAsHoliday}
                    className="btn-secondary text-sm px-3 py-1"
                  >
                    Tandai Libur ({selectedDates.length})
                  </button>
                </div>
              )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {allDatesInProposal.map((date) => {
              const scheduledItem = schedule.find(
                (s) => s.serving_date === date,
              );
              const isProduced = productionLogs.includes(date);
              const isHoliday = scheduledItem && scheduledItem.menu_id === 1;
              const isSelected = selectedDates.includes(date);
              const { day, date: dayNumber } = formatShortDate(date);

              return (
                // PERUBAHAN: Warna border/ring
                <div
                  key={date}
                  className={`border rounded-lg p-3 flex flex-col h-40 transition-all ${isSelected ? "border-intigizi-orange ring-2 ring-intigizi-orange" : isProduced ? "bg-green-50 border-green-200" : isHoliday ? "bg-gray-100 border-gray-200" : "bg-white"}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-gray-500">{day}</p>
                      <p className="font-bold text-lg">{dayNumber}</p>
                    </div>
                    {proposal.status === "Draft" && canEditDraft && (
                      // PERUBAHAN: Warna checkbox
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleDateSelection(date)}
                        className="form-checkbox h-4 w-4 text-intigizi-green rounded"
                      />
                    )}
                  </div>
                  <div
                    className="mt-2 flex-grow flex flex-col justify-center cursor-pointer"
                    onClick={() =>
                      scheduledItem &&
                      !isHoliday &&
                      openDetailModal({
                        date: formatFullDate(date),
                        ...scheduledItem,
                      })
                    }
                  >
                    {scheduledItem ? (
                      isHoliday ? (
                        <div className="text-center">
                          <CalendarOff
                            size={24}
                            className="mx-auto text-gray-400"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Hari Libur
                          </p>
                        </div>
                      ) : (
                        // PERUBAHAN: Warna teks menu
                        <div>
                          <p className="text-sm font-semibold text-intigizi-green-dark text-center">
                            {scheduledItem.menu_name}
                          </p>
                        </div>
                      )
                    ) : null}
                  </div>
                  <div className="mt-auto flex justify-end items-center h-6">
                    {isProduced && (
                      <CheckCircle
                        size={16}
                        className="text-green-500"
                        title="Produksi Selesai"
                      />
                    )}
                    {proposal.status === "Draft" &&
                      canEditDraft &&
                      scheduledItem && (
                        <button
                          onClick={() => handleDeleteSchedule(scheduledItem.id)}
                          disabled={actionLoading}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    {proposal.status === "Disetujui" &&
                      canEditDraft &&
                      scheduledItem &&
                      !isHoliday &&
                      !isProduced && (
                        <button
                          onClick={() => handleReduceStock(date)}
                          disabled={actionLoading}
                          className="btn-primary text-xs px-2 py-1"
                        >
                          <CookingPot size={12} className="mr-1" /> Catat
                        </button>
                      )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {proposal.status !== "Draft" && (
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
            {/* PERUBAHAN: Warna ikon */}
            <h3 className="font-semibold text-lg text-gray-800 mb-4 flex items-center">
              <BarChart3 size={20} className="mr-3 text-intigizi-green" />
              Rincian Gizi & HPP per Kategori Menu
            </h3>
            {loading ? (
              <div className="text-center">
                <Loader2 className="animate-spin" />
              </div>
            ) : (
              <div className="space-y-4 max-h-[calc(100vh-20rem)] overflow-y-auto pr-2">
                {calculation?.menu_details &&
                calculation.menu_details.length > 0 ? (
                  calculation.menu_details.map((menu) => (
                    <NutritionDetailCard
                      key={menu.menu_id}
                      menu={menu}
                      formatCurrency={formatCurrency}
                    />
                  ))
                ) : (
                  <p className="col-span-full text-center text-sm text-gray-500 py-4">
                    Informasi gizi dan HPP akan muncul di sini setelah menu
                    dijadwalkan.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {proposal.status !== "Draft" && (
        <div className="mt-6">
          <ProposalCalculation
            calculation={calculation}
            loading={loading}
            error={error}
          />
        </div>
      )}

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Proposal"
      >
        <ProposalForm
          proposal={proposal}
          onSave={handleUpdateProposal}
          onCancel={() => setIsEditModalOpen(false)}
          loading={actionLoading}
        />
      </Modal>

      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title={`Pilih Menu untuk ${selectedDates.length} Tanggal`}
      >
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {menus
            .filter((m) => m.id !== 1)
            .map((menu) => (
              <button
                key={menu.id}
                onClick={() => handleSaveSchedule(menu.id)}
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-colors"
              >
                {menu.menu_name}
              </button>
            ))}
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={() => {
          if (confirmAction.action === "submit") handleUpdateStatus("Diajukan");
          if (confirmAction.action === "approve")
            handleUpdateStatus("Disetujui");
          if (confirmAction.action === "reject") handleUpdateStatus("Ditolak");
        }}
        title={confirmAction.title}
        message={confirmAction.message}
        loading={actionLoading}
        confirmText={
          confirmAction.action === "submit"
            ? "Ya, Ajukan"
            : confirmAction.action === "approve"
              ? "Ya, Setujui"
              : "Ya, Tolak"
        }
        // PERUBAHAN: Warna tombol konfirmasi
        confirmColor={
          confirmAction.action === "reject"
            ? "bg-red-600 hover:bg-red-700"
            : "bg-intigizi-green hover:bg-intigizi-green-dark"
        }
      />

      <DetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        date={viewingItem?.date}
        item={viewingItem}
        calculation={calculation}
      />

      <PrintBudgetModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        calculation={calculation}
        schedule={schedule}
        proposal={proposal}
      />
    </div>
  );
}

export default ProposalDetailPage;
