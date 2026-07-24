import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import apiClient from "@/services/api";
import PageHeader from "@/components/PageHeader";
import ConfirmationModal from "@/components/ConfirmationModal";
import { useNotification } from "@/context/NotificationContext";
import { Loader2, Calendar, CookingPot, CheckCircle, Info } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import ProductionLabel from "@/components/ProductionLabel";
import { usePrinter } from "@/context/PrinterContext";
import EscPosEncoder from "esc-pos-encoder";

// Halaman baru untuk menampilkan Tugas Produksi Harian

const TaskCard = ({ task, onProduce, loading }) => {
  const isToday =
    new Date(task.serving_date + "T00:00:00").toDateString() ===
    new Date().toDateString();

  return (
    <div
      className={`bg-white rounded-xl shadow-md overflow-hidden transition-all hover:shadow-lg ${isToday ? "border-2 border-intigizi-orange" : ""}`}
    >
      <div
        className={`p-5 ${isToday ? "bg-intigizi-orange/10" : "bg-gray-50"}`}
      >
        <p
          className={`font-bold text-lg ${isToday ? "text-intigizi-orange" : "text-intigizi-green-dark"}`}
        >
          {task.menu_name}
        </p>
        <p className="text-sm text-gray-500">Proposal: {task.proposal_code}</p>
      </div>
      <div className="p-5">
        <div className="flex justify-between items-center text-center">
          <div>
            <p className="text-xs text-gray-500">Tanggal Produksi</p>
            <p className="font-semibold">
              {new Date(task.serving_date + "T00:00:00").toLocaleDateString(
                "id-ID",
                { weekday: "long", day: "numeric", month: "long" },
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Jumlah Porsi</p>
            <p className="font-bold text-2xl text-intigizi-green">
              {task.target_recipients.toLocaleString("id-ID")}
            </p>
          </div>
        </div>
        <button
          onClick={() => onProduce(task)}
          disabled={loading}
          className="btn-primary w-full mt-4 flex items-center justify-center disabled:bg-gray-400"
        >
          {loading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <>
              <CheckCircle size={16} className="mr-2" /> Catat Produksi &
              Kurangi Stok
            </>
          )}
        </button>
      </div>
    </div>
  );
};

function ProductionTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [bestBeforeTime, setBestBeforeTime] = useState("");
  const { showNotification } = useNotification();

  // Printer Context
  const { isConnected: isPrinterConnected, printData, device } = usePrinter();

  // Ref untuk komponen label yang akan diprint
  const componentRef = useRef();

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/production_tasks_get.php");
      setTasks(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError("Gagal memuat tugas produksi.");
      showNotification("Gagal memuat tugas produksi.", "error");
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Setup fungsi print menggunakan react-to-print (Fallback)
  const handleWindowPrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Label-Produksi-${selectedTask?.proposal_code || "MBG"}`,
  });

  const handleBluetoothPrint = async () => {
    try {
      const encoder = new EscPosEncoder();
      const dateStr = selectedTask.serving_date
        ? new Date(selectedTask.serving_date).toLocaleDateString("id-ID")
        : "-";
      const timeStr =
        new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }) + " WIB";
      // Enhanced QR Code Data - URL Generation
      // Base URL should be dynamic based on current window location or config
      const baseUrl = window.location.origin;
      const pid = selectedTask.proposal_code || selectedTask.proposal_id;
      const date = selectedTask.serving_date;

      // Full URL: https://[domain]/check-label?pid=...&date=...
      const barcodeValue = `${baseUrl}/check-label?pid=${pid}&date=${date}`;

      const data = encoder
        .initialize()
        .align("center")
        .bold(true)
        .line(selectedTask.menu_name || "Nama Menu")
        .bold(false)
        .line("--------------------------------")
        .align("left")
        .text("Tgl Produksi : " + dateStr + "\n")
        .text("Waktu        : " + timeStr + "\n")
        .text("Baik Sebelum : " + bestBeforeStr + " WIB\n")
        .text("Dapur        : IntiGizi Kitchen\n")
        .line("--------------------------------")
        .align("center")
        .qrcode(barcodeValue)
        .newline()
        .text(barcodeValue + "\n")
        .newline()
        .cut()
        .encode();

      await printData(data);
      showNotification(
        "Label berhasil dicetak ke printer Bluetooth",
        "success",
      );
    } catch (err) {
      console.error(err);
      showNotification(
        "Gagal mencetak ke Bluetooth, beralih ke print biasa.",
        "warning",
      );
      handleWindowPrint(); // Fallback
    }
  };

  const handleProduceRequest = (task) => {
    setSelectedTask(task);
    // Default best before: 4 jam dari sekarang
    const date = new Date();
    date.setHours(date.getHours() + 4);

    // Format YYYY-MM-DDTHH:mm untuk input datetime-local
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    setBestBeforeTime(`${year}-${month}-${day}T${hours}:${minutes}`);

    setIsConfirmModalOpen(true);
  };

  const handleConfirmProduce = async () => {
    if (!selectedTask) return;
    if (!bestBeforeTime) {
      showNotification('Mohon isi waktu "Baik Digunakan Sebelum".', "error");
      return;
    }

    setActionLoading(true);
    try {
      await apiClient.post("/stock_reduce_for_production.php", {
        proposal_id: selectedTask.proposal_id,
        production_date: selectedTask.serving_date,
        best_before: bestBeforeTime, // Kirim waktu best before
      });

      showNotification(
        "Stok berhasil dikurangi dan produksi telah dicatat.",
        "success",
      );

      // Trigger print logic based on connection
      if (isPrinterConnected) {
        await handleBluetoothPrint();
      } else {
        handleWindowPrint();
      }

      await fetchTasks(); // Refresh data
    } catch (err) {
      showNotification(
        err.response?.data?.message || "Gagal mencatat produksi.",
        "error",
      );
    } finally {
      setActionLoading(false);
      setIsConfirmModalOpen(false);
      // Jangan set selectedTask ke null segera agar print ref masih ada datanya saat dialog print muncul
      // Tapi karena modal tertutup, user tidak melihatnya.
      // Kita biarkan selectedTask tetap ada untuk render ProductionLabel yang hidden.
      // Reset selectedTask bisa dilakukan saat modal dibuka lagi atau kita biarkan saja.
    }
  };

  const { todayTasks, upcomingTasks } = useMemo(() => {
    const todayString = new Date().toDateString();
    const today = tasks.filter(
      (t) =>
        new Date(t.serving_date + "T00:00:00").toDateString() === todayString,
    );
    const upcoming = tasks.filter(
      (t) =>
        new Date(t.serving_date + "T00:00:00").toDateString() !== todayString,
    );
    return { todayTasks: today, upcomingTasks: upcoming };
  }, [tasks]);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin text-intigizi-green" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 bg-red-50 p-4 rounded-lg">{error}</div>;
  }

  return (
    <div>
      <PageHeader title="Tugas Produksi" />

      {tasks.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-white rounded-xl shadow-md">
          <CheckCircle size={48} className="mx-auto text-green-400 mb-4" />
          <h3 className="text-xl font-semibold">Semua Tugas Selesai!</h3>
          <p className="mt-2">Tidak ada jadwal produksi yang akan datang.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Tugas Hari Ini */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <Calendar size={24} className="mr-3 text-intigizi-orange" /> Tugas
              Hari Ini
            </h2>
            {todayTasks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {todayTasks.map((task) => (
                  <TaskCard
                    key={`${task.proposal_id}-${task.serving_date}`}
                    task={task}
                    onProduce={handleProduceRequest}
                    loading={
                      actionLoading &&
                      selectedTask?.proposal_id === task.proposal_id
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 bg-white rounded-xl shadow-sm">
                <Info size={32} className="mx-auto text-gray-300 mb-2" />
                <p>Tidak ada tugas produksi untuk hari ini.</p>
              </div>
            )}
          </div>

          {/* Tugas Mendatang */}
          {upcomingTasks.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <CookingPot size={24} className="mr-3 text-intigizi-green" />{" "}
                Tugas Mendatang
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingTasks.map((task) => (
                  <TaskCard
                    key={`${task.proposal_id}-${task.serving_date}`}
                    task={task}
                    onProduce={handleProduceRequest}
                    loading={
                      actionLoading &&
                      selectedTask?.proposal_id === task.proposal_id
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmProduce}
        title="Konfirmasi Produksi"
        message={`Anda akan mencatat produksi untuk menu "${selectedTask?.menu_name}" dan mengurangi stok bahan baku dari gudang. Aksi ini tidak dapat dibatalkan.`}
        loading={actionLoading}
        confirmText={
          isPrinterConnected ? "Catat & Print Bluetooth" : "Catat & Print IP"
        }
        confirmColor="bg-intigizi-green hover:bg-intigizi-green-dark"
      >
        <div className="mt-4 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Baik Digunakan Sebelum (Waktu Kadaluarsa)
          </label>
          <div className="relative">
            <input
              type="datetime-local"
              value={bestBeforeTime}
              onChange={(e) => setBestBeforeTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-intigizi-green"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Info ini akan dicetak pada label makanan. Pastikan tanggal dan
              waktu benar.
            </p>
          </div>
        </div>
        {isPrinterConnected && (
          <div className="mt-2 text-xs text-green-600 flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Printer Terhubung: {device?.name}
          </div>
        )}
      </ConfirmationModal>

      {/* Hidden Component for Printing */}
      <div style={{ display: "none" }}>
        <ProductionLabel
          ref={componentRef}
          task={selectedTask}
          productionDate={selectedTask?.serving_date}
          productionTime={new Date().toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          })}
          bestBeforeTime={bestBeforeTime}
          // Kitchen name hardcoded for now or fetch from user context if available
          kitchenName="Dapur IntiGizi"
          // Nutrition would need to come from task data if available, currently passing null or static if not
          nutrition={null}
        />
      </div>
    </div>
  );
}

export default ProductionTasksPage;
