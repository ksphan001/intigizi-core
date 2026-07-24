import axios from 'axios';
import { API_BASE_URL } from '../config';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor untuk REQUEST (menambahkan token)
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// DIPERBARUI: Interceptor untuk RESPONSE (menangani error 401 dengan lebih cerdas)
apiClient.interceptors.response.use(
  (response) => {
    // Jika response sukses, langsung kembalikan
    return response;
  },
  (error) => {
    // Cek jika error adalah 401 Unauthorized
    if (error.response && error.response.status === 401) {
      
      // PERBAIKAN: Daftar halaman publik di mana pengguna tidak seharusnya
      // di-redirect paksa saat terjadi error 401.
      const publicAuthPaths = ['/login', '/register', '/forgot-password', '/reset-password'];

      // HANYA redirect jika pengguna TIDAK sedang berada di salah satu halaman publik tersebut.
      if (!publicAuthPaths.includes(window.location.pathname)) {
        // Hapus token yang tidak valid
        localStorage.removeItem('authToken');
        // Arahkan ke halaman login dan refresh
        window.location.href = '/login';
      }
    }
    // Kembalikan error agar bisa ditangani oleh komponen pemanggil (seperti LoginPage)
    return Promise.reject(error);
  }
);


export default apiClient;
