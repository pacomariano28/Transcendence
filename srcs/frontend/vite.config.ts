import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    // strictPort: true, // Fails if port 5173 is already in use, preventing silent port shifts
    hmr: {
      protocol: 'wss',     // Force secure WebSockets to match Nginx's HTTPS
      clientPort: 8443, // Forces the browser to connect to this specific port for HWebSockets
    },
    watch: {
      usePolling: true, // Uses polling instead of native file system events to avoid false triggers
    }
  },
})
