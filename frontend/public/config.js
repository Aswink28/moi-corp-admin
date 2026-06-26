/* ════════════════════════════════════════════════════════════════════════
 * Company Admin Portal — FRONTEND RUNTIME CONFIGURATION
 * ════════════════════════════════════════════════════════════════════════
 * This file is the frontend's ".env". It is loaded by the browser at runtime
 * and is NOT bundled into the app, so you can edit it on the server AFTER the
 * build and just refresh the page — no rebuild, no code changes.
 *
 * Update the values below for each deployment environment.
 * ──────────────────────────────────────────────────────────────────────── */
window.__APP_CONFIG__ = {
  // Base URL of the company-admin backend API (MUST include the /api suffix).
  //   Same-origin behind a reverse proxy ....  "/api"
  //   Backend on a LAN host .................  "http://192.168.x.x:6010/api"
  //   Backend behind HTTPS ..................  "https://admin-api.example.com/api"
  API_BASE_URL: "/api",
}
