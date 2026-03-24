import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // Permite acceso desde fuera del contenedor
    port: 5173,       // Asegura que use el puerto correcto
  },
})
