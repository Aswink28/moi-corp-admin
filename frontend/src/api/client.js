import axios from 'axios'

// API base URL — read from the single .env at build time (VITE_API_BASE_URL),
// defaulting to the relative '/api' (served same-origin behind a reverse proxy).
// Nothing here is hardcoded; change the value in .env, not in source.
export const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

// Server origin (the API base WITHOUT the trailing /api) — used to build absolute
// URLs for backend-served assets (logos, invoices). Empty string when baseURL is
// the relative '/api', which correctly yields same-origin asset URLs.
export const assetBase = baseURL.replace(/\/api\/?$/, '').replace(/\/$/, '')

const api = axios.create({ baseURL })

// Attach JWT from localStorage on every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ca_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On 401, clear the session and bounce to login.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401 && !err.config.url.includes('/auth/login')) {
      localStorage.removeItem('ca_token')
      localStorage.removeItem('ca_user')
      if (window.location.pathname !== '/login') window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

/** Extract a friendly error message from an axios error. */
export function errMsg(err, fallback = 'Something went wrong') {
  return err?.response?.data?.message || err?.message || fallback
}

export default api
