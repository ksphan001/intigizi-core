import React from 'react';
import { Link } from 'react-router-dom';
import apiClient from '@/services/api';

function NotificationDropdown({ notifications, onClose, onRefresh }) {

  const handleMarkAsRead = async (notifId) => {
    try {
      await apiClient.post('/notifications_mark_read.php', { notif_id: notifId });
      onRefresh(); // Refresh daftar notifikasi setelah ditandai
    } catch (err) {
      console.error("Gagal menandai notifikasi", err);
    }
  };

  const timeSince = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " tahun lalu";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " bulan lalu";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " hari lalu";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " jam lalu";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " menit lalu";
    return "Baru saja";
  };

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border z-50">
      <div className="p-4 font-semibold border-b">Notifikasi</div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.length > 0 ? (
          notifications.map(notif => (
            <Link
              key={notif.id}
              to={notif.link || '#'}
              onClick={() => {
                if (!notif.is_read) handleMarkAsRead(notif.id);
                onClose();
              }}
              className={`block p-4 hover:bg-gray-50 border-b ${!notif.is_read ? 'bg-green-50' : ''}`}
            >
              <p className={`font-semibold text-sm ${!notif.is_read ? 'text-gray-800' : 'text-gray-500'}`}>{notif.title}</p>
              <p className={`text-sm ${!notif.is_read ? 'text-gray-600' : 'text-gray-400'}`}>{notif.message}</p>
              <p className="text-xs text-gray-400 mt-1">{timeSince(notif.created_at)}</p>
            </Link>
          ))
        ) : (
          <p className="p-4 text-sm text-gray-500 text-center">Tidak ada notifikasi baru.</p>
        )}
      </div>
    </div>
  );
}

export default NotificationDropdown;
