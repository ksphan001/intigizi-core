import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import apiClient from '@/services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserSession = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const response = await apiClient.get('/get_user_session.php');
        setUser(response.data);
      } catch (error) {
        // Jika gagal (misal token tidak valid di backend), hapus token
        console.error("Gagal mengambil sesi user", error);
        localStorage.removeItem('authToken');
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUserSession();
  }, [fetchUserSession]);

  const [selectedSppgId, setSelectedSppgIdState] = useState(() => {
    return localStorage.getItem('selectedSppgId') || 'all';
  });

  const setSelectedSppgId = useCallback((id) => {
    setSelectedSppgIdState(id);
    localStorage.setItem('selectedSppgId', id);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('selectedSppgId');
    window.location.href = '/login';
  }, []);


  const value = { user, loading, logout, refreshUser: fetchUserSession, selectedSppgId, setSelectedSppgId };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};
