import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Company Admin Portal frontend. Runs on its own port (5180) so it never
// collides with the Travel Expense app frontend (5173).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Public subpath the app is served from (build time). All admin URLs live
  // under this prefix, e.g. /moi-corp-admin/companies. Must start AND end with
  // a slash. Driven by .env (VITE_BASE) so nothing is hardcoded in source.
  const base = env.VITE_BASE || '/moi-corp-admin/'

  return {
    base,
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
  }
})
