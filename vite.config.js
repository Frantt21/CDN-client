import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// La API corre en http://localhost:5220 (perfil "http" de launchSettings.json).
const apiTarget = process.env.VITE_API_TARGET ?? 'http://localhost:5220'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
        // El certificado de desarrollo es autofirmado
        secure: false,
      },
      // SignalR: requiere upgrade a WebSocket (ws: true)
      '/hubs': {
        target: apiTarget,
        changeOrigin: true,
        ws: true,
        secure: false,
      },
    },
  },
})
