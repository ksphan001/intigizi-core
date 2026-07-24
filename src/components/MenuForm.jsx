import React, { useState, useEffect } from 'react';

// Formulir untuk menambah atau mengedit nama menu.

function MenuForm({ menu, onSave, onCancel, loading }) {
  const [menuName, setMenuName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (menu) {
      setMenuName(menu.menu_name || '');
    } else {
      setMenuName('');
    }
  }, [menu]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSave({ id: menu?.id, menu_name: menuName });
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan data.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6">
        <label htmlFor="menu_name" className="block text-sm font-medium text-gray-700">Nama Menu</label>
        <input
          type="text"
          id="menu_name"
          value={menuName}
          onChange={(e) => setMenuName(e.target.value)}
          className="input-style"
          required
        />
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

export default MenuForm;
