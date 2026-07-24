// src/config.js
// File ini menyimpan semua variabel global dan konfigurasi aplikasi.

// Ganti URL ini saat akan pindah ke server produksi.
// Cukup ubah di satu tempat ini, dan seluruh aplikasi akan mengikutinya.
const API_BASE_URL = import.meta.env.VITE_API_URL; // Contoh untuk development

// const API_BASE_URL = 'https://api.intigizi.com/app'; // Contoh untuk produksi

// URL untuk aset (gambar/file) yang berada di folder 'uploads' (sejajar dengan folder 'app')
// Menghapus '/app' dari akhir API_BASE_URL jika ada
const ASSET_BASE_URL = API_BASE_URL.replace(/\/app$/, "");

export { API_BASE_URL, ASSET_BASE_URL };
