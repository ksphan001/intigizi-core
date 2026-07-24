import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/services/api";
import { Building2 } from "lucide-react";

function SppgSwitcher() {
  const { user, selectedSppgId, setSelectedSppgId } = useAuth();
  const [sppgs, setSppgs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && Number(user.role_id) === 4) { // 4 = Yayasan
      const fetchSppgs = async () => {
        setLoading(true);
        try {
          const response = await apiClient.get("/yayasan_get_sppgs.php");
          if (Array.isArray(response.data)) {
            setSppgs(response.data);
          }
        } catch (error) {
          console.error("Gagal mengambil daftar SPPG", error);
        } finally {
          setLoading(false);
        }
      };
      fetchSppgs();
    }
  }, [user]);

  if (!user || Number(user.role_id) !== 4) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 shadow-sm">
      <Building2 size={16} className="text-intigizi-green" />
      <span className="text-xs font-semibold text-gray-500 hidden md:inline">Unit SPPG:</span>
      <select
        value={selectedSppgId}
        onChange={(e) => setSelectedSppgId(e.target.value)}
        disabled={loading}
        className="bg-transparent border-none text-sm font-semibold text-gray-700 focus:outline-none cursor-pointer pr-4"
      >
        <option value="all">Semua Unit (Konsolidasi)</option>
        {sppgs.map((sppg) => (
          <option key={sppg.id} value={sppg.id}>
            {sppg.name} {!sppg.is_active && "(Non-aktif)"}
          </option>
        ))}
      </select>
    </div>
  );
}

export default SppgSwitcher;
