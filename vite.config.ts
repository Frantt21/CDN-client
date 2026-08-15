import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// La API corre en https://localhost:7057 (perfil "https" de launchSettings.json).
// Si la levantás en otro puerto: VITE_API_TARGET=https://localhost:5220 npm run dev
const apiTarget = process.env.VITE_API_TARGET ?? 'https://localhost:7057'

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
    },
  },
})
