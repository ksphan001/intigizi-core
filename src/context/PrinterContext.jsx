import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import EscPosEncoder from "esc-pos-encoder";

const PrinterContext = createContext();

export const usePrinter = () => useContext(PrinterContext);

// Service ID standar untuk printer thermal Bluetooth (biasanya 18f0 atau custom UUID vendor)
// Kita gunakan acceptAllDevices: true untuk fleksibilitas maksimal, lalu filter services jika perlu
// Namun, Web Bluetooth API memerlukan services yang dideklarasikan di optionalServices untuk bisa diakses.
// UUID umum: '000018f0-0000-1000-8000-00805f9b34fb' (Service Printer)
const PRINTER_SERVICE_UUID = "000018f0-0000-1000-8000-00805f9b34fb";

export const PrinterProvider = ({ children }) => {
  const [device, setDevice] = useState(null);
  const [server, setServer] = useState(null);
  const [characteristic, setCharacteristic] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState("");
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    if (!navigator.bluetooth) {
      setIsSupported(false);
      console.warn("Web Bluetooth API is not supported in this browser.");
    }
  }, []);

  const connectPrinter = useCallback(async () => {
    setError("");
    try {
      if (!navigator.bluetooth)
        throw new Error("Bluetooth tidak didukung di browser ini.");

      console.log("Requesting Bluetooth Device...");
      const device = await navigator.bluetooth.requestDevice({
        // filters: [{ services: [PRINTER_SERVICE_UUID] }], // Filter ini kadang terlalu ketat
        acceptAllDevices: true,
        optionalServices: [
          PRINTER_SERVICE_UUID,
          "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
        ], // Tambahkan UUID lain jika perlu
      });

      console.log("Connecting to GATT Server...");
      const server = await device.gatt.connect();
      setServer(server);
      setDevice(device);

      device.addEventListener("gattserverdisconnected", onDisconnected);

      console.log("Getting Service...");
      // Coba ambil service printer standar
      let service;
      try {
        service = await server.getPrimaryService(PRINTER_SERVICE_UUID);
      } catch (e) {
        // Fallback atau coba service lain (beberapa printer cina pake UUID custom)
        // Ini catch-all sederhana, idealnya kita tau UUID nya
        const services = await server.getPrimaryServices();
        if (services.length > 0)
          service = services[0]; // Ambil yang pertama aja
        else throw new Error("Tidak dapat menemukan service printer.");
      }

      console.log("Getting Characteristic...");
      const characteristics = await service.getCharacteristics();
      // Cari characteristic yang bisa di Write
      const writeChar = characteristics.find(
        (c) => c.properties.write || c.properties.writeWithoutResponse,
      );

      if (!writeChar)
        throw new Error(
          "Tidak dapat menemukan characteristic untuk menulis data.",
        );

      setCharacteristic(writeChar);
      setIsConnected(true);
      console.log("Printer Connected!");
    } catch (err) {
      console.error("Connection Error:", err);
      setError(err.message || "Gagal terhubung ke printer");
      setIsConnected(false);
    }
  }, []);

  const onDisconnected = (event) => {
    const device = event.target;
    console.log(`Device ${device.name} is disconnected.`);
    setIsConnected(false);
    setCharacteristic(null);
    setServer(null);
  };

  const discord = useCallback(() => {
    if (device && device.gatt.connected) {
      device.gatt.disconnect();
    }
  }, [device]);

  const printData = useCallback(
    async (encodedData) => {
      if (!characteristic) {
        throw new Error("Printer belum terhubung");
      }
      try {
        // Web Bluetooth usually limits max bytes per write (around 512 bytes usually safe, check MTU)
        // But for simplicity, let's try writing standard chunks
        const chunkSize = 100; // Safe chunk size
        for (let i = 0; i < encodedData.length; i += chunkSize) {
          const chunk = encodedData.slice(i, i + chunkSize);
          await characteristic.writeValue(chunk);
        }
      } catch (err) {
        console.error("Print Error:", err);
        throw new Error("Gagal mencetak: " + err.message);
      }
    },
    [characteristic],
  );

  // Helper untuk print test
  const printTest = async () => {
    try {
      const encoder = new EscPosEncoder();
      const result = encoder
        .initialize()
        .text("Test Print IntiGizi\n")
        .text("Koneksi Berhasil!\n")
        .newline()
        .qrcode("https://intigizi.com")
        .newline()
        .cut()
        .encode();

      await printData(result);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  return (
    <PrinterContext.Provider
      value={{
        connectPrinter,
        disconnect: discord,
        printData,
        printTest,
        isConnected,
        isSupported,
        device,
        error,
      }}
    >
      {children}
    </PrinterContext.Provider>
  );
};
