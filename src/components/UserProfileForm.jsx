import React, { useState, useEffect } from 'react';

function UserProfileForm({ profile, onSave, loading }) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    str_number: '',
    str_expiry: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        password: '',
        str_number: profile.str_number || '',
        str_expiry: profile.str_expiry || ''
      });
    }
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Username</label>
        <p className="mt-1 text-gray-500 bg-gray-100 p-2 rounded-md">{profile.username}</p>
      </div>
      <div className="mb-4">
        <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
        <input type="text" name="full_name" id="full_name" value={formData.full_name} onChange={handleChange} className="input-style" required />
      </div>
      <div className="mb-4">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
        <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className="input-style" required />
      </div>
      
      {Number(profile.role_id) === 1 && (
        <>
          <div className="mb-4">
            <label htmlFor="str_number" className="block text-sm font-medium text-gray-700">Nomor STR (Surat Tanda Registrasi)</label>
            <input type="text" name="str_number" id="str_number" value={formData.str_number} onChange={handleChange} className="input-style" required placeholder="Contoh: 12345-67890" />
          </div>
          <div className="mb-4">
            <label htmlFor="str_expiry" className="block text-sm font-medium text-gray-700">Masa Berlaku STR</label>
            <input type="date" name="str_expiry" id="str_expiry" value={formData.str_expiry} onChange={handleChange} className="input-style" required />
          </div>
        </>
      )}

      <div className="mb-6">
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password Baru</label>
        <input type="password" name="password" id="password" value={formData.password} onChange={handleChange} className="input-style" placeholder="Kosongkan jika tidak ingin diubah" />
      </div>
      <div className="flex justify-end">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>
    </form>
  );
}

export default UserProfileForm;
