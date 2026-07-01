// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/ai-developer-projects/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [],
        },
      },
    },
  },
  preview: {
    port: 4173,
    open: true,
  },
});