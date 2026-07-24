import React, { useState, useEffect } from 'react';

// Formulir untuk menambah atau mengedit proposal.

function ProposalForm({ proposal, onSave, onCancel, loading }) {
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    target_recipients: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (proposal) {
      setFormData({
        start_date: proposal.start_date || '',
        end_date: proposal.end_date || '',
        target_recipients: proposal.target_recipients || ''
      });
    } else {
      setFormData({ start_date: '', end_date: '', target_recipients: '' });
    }
  }, [proposal]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (new Date(formData.end_date) < new Date(formData.start_date)) {
        setError('Tanggal akhir tidak boleh sebelum tanggal mulai.');
        return;
    }
    setError('');
    try {
      await onSave({ ...formData, id: proposal?.id });
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan data.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">Tanggal Mulai</label>
          <input type="date" name="start_date" id="start_date" value={formData.start_date} onChange={handleChange} className="input-style" required />
        </div>
        <div>
          <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">Tanggal Akhir</label>
          <input type="date" name="end_date" id="end_date" value={formData.end_date} onChange={handleChange} className="input-style" required />
        </div>
      </div>
      <div className="mb-6">
        <label htmlFor="target_recipients" className="block text-sm font-medium text-gray-700">Target Penerima / Hari</label>
        <input type="number" name="target_recipients" id="target_recipients" value={formData.target_recipients} onChange={handleChange} className="input-style" placeholder="Jumlah porsi" required />
      </div>
      
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      
      <div className="flex justify-end space-x-3">
        <button type="button" onClick={onCancel} className="btn-secondary">Batal</button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>
    </form>
  );
}

export default ProposalForm;
