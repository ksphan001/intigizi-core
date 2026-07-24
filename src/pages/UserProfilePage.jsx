import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/services/api';
import PageHeader from '@/components/PageHeader.jsx';
import UserProfileForm from '@/components/UserProfileForm.jsx';

function UserProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/users_get_profile.php');
      setProfile(response.data);
    } catch (err) {
      setError('Gagal memuat data profil.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async (profileData) => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await apiClient.post('/users_update_profile.php', profileData);
      setSuccess(response.data.message);
      fetchProfile(); 
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan profil.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <p>Memuat profil...</p>;
  if (error && !profile) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div>
      {/* DIPERBARUI: PageHeader sekarang dipanggil tanpa properti tombol */}
      <PageHeader title="Profil Saya" />
      
      <div className="bg-white p-6 rounded-xl shadow-md max-w-2xl mx-auto">
        {success && <div className="mb-4 p-3 text-sm text-green-800 bg-green-100 rounded-lg">{success}</div>}
        {error && <div className="mb-4 p-3 text-sm text-red-800 bg-red-100 rounded-lg">{error}</div>}
        
        {profile && (
          <UserProfileForm
            profile={profile}
            onSave={handleSave}
            loading={actionLoading}
          />
        )}
      </div>
    </div>
  );
}

export default UserProfilePage;
