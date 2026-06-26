# Company Admin Portal — Deployment Guide

Deployment-ready build for the **Company Admin Portal**, packaged the same way
as the Moi-Corp (TravelDesk) project: a bundled **backend dist** and a static
**frontend dist**, each driven by a **single `.env`** with no hardcoded values.

| Tier | Ships as | Configure via | Rebuild to change config? |
|------|----------|---------------|---------------------------|
| Backend | `backend/dist/` (bundled `index.js` + `.env` + `start.cmd`) | `backend/dist/.env` (runtime) | No |
| Frontend | `frontend/dist/` (static site) | `frontend/.env` (`VITE_API_BASE_URL`, build time) | Yes (or use `/api` + proxy) |

---

## 1. Backend (`backend/dist/`)

The backend is a single bundled `index.js`. Everything is read from the `.env`
sitting next to it — edit that file on the server, then launch:

```bat
cd backend\dist
REM edit .env for this environment (DB, JWT_SECRET, CORS_ORIGINS, LENDER_API_KEY, PRODUCT_*)
start.cmd          REM runs: set NODE_ENV=production & node index.js
```

- The server **fails fast** if a required variable is missing (DB connection,
  `JWT_SECRET`, `CORS_ORIGINS`, `LENDER_API_KEY`, `PRODUCT_API_URL`,
  `PRODUCT_PROVISIONING_SECRET`) — it never boots on a built-in default.
- Point at the DB with the discrete `PG*` vars **or** a single `DATABASE_URL`
  (which overrides the `PG*` vars when set).
- `CORS_ORIGINS` must include the deployed frontend origin.
- First deploy only — initialise the database from the project (non-bundled)
  source: `npm run db:setup` (migrate + seed).

## 2. Frontend (`frontend/dist/`)

A static site (Vite build). Serve it with any static web server (nginx, IIS, …).
The API base URL is baked from `frontend/.env` (`VITE_API_BASE_URL`) at build:

- `VITE_API_BASE_URL=/api` (default) → calls the backend **same-origin**; have
  the web server reverse-proxy `/api` to the backend. No per-host change needed.
- `VITE_API_BASE_URL=http://host:6010/api` → calls a backend on another host
  (add that frontend origin to the backend's `CORS_ORIGINS`). Rebuild to change.

---

## How "no hardcoded values" is guaranteed

- **Backend:** every host, port, credential, secret and URL is read from `.env`
  via `src/config/env.js`. Required values have no fallback; only non-secret
  tuning knobs (timeouts, pool size, token TTL) carry documented defaults.
- **Frontend:** the API base URL (and the asset origin derived from it) comes
  from `VITE_API_BASE_URL` in `.env`. No environment-specific value is written
  into the source.

## Rebuilding

```bash
# Backend bundle  → backend/dist/
cd backend && npm install && npm run build

# Frontend static → frontend/dist/
cd frontend && npm install && npm run build
```
