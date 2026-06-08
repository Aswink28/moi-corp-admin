# Company Onboarding Admin Portal — Frontend

React + Vite + Material UI super-admin portal for onboarding/managing client
companies. **Independent** from the Travel Expense app frontend (runs on its
own port `5180`).

## Quick start (local)
```bash
cd company-admin-frontend
cp .env.example .env          # optional; defaults to the Vite proxy
npm install
npm run dev                   # http://localhost:5180
```
The dev server proxies `/api` → `http://localhost:6010` (the company-admin
backend), so start the backend first.

## Pages
Dashboard · Companies · Company Admins · Configuration (module toggles) ·
Subscriptions · Wallets · Audit Logs — all behind a Super Admin login.

## Build
```bash
npm run build   # outputs dist/
```

## Env
`VITE_API_BASE_URL` — backend API base URL. Leave empty to use the dev proxy.
