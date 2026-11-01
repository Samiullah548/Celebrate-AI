import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },

  build: {
    // Raise the warning threshold a bit; we already split chunks below
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor bundle: React core
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Vendor bundle: charts
          'vendor-recharts': ['recharts'],
          // Vendor bundle: icons
          'vendor-icons': ['lucide-react'],
        },
      },
    },
  },
})
