import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path"; // Import modul 'path' dari Node.js

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Tambahkan bagian 'resolve' untuk membuat path alias
  resolve: {
    alias: {
      // Mendefinisikan alias '@' agar selalu merujuk ke folder '/src'
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
