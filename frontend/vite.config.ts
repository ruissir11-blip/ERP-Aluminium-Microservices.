import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3004,
    proxy: {
      // ── HR microservice (port 5001) – must be declared BEFORE the generic rules ──
      '/api/v1/hr': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      // ── Main backend (port 3003) ──────────────────────────────────────────────
      '/api/v1': {
        target: 'http://localhost:3003',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:3003',
        changeOrigin: true,
      },
    },
  },
})
