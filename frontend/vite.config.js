import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Company Admin Portal frontend. Runs on its own port (5180) so it never
// collides with the Travel Expense app frontend (5173).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,
    proxy: {
      // Dev convenience: proxy /api to the company-admin backend.
      '/api': {
        target: 'http://localhost:6010',
        changeOrigin: true,
      },
    },
  },
})
