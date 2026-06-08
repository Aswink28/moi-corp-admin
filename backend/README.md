# Company Onboarding Admin Portal — Backend

Independent Node.js + Express + PostgreSQL API for onboarding and managing
client companies (TCS, CTS, Infosys, Wipro, HCL, …). **Completely separate**
from the Travel Expense Management app — it uses its own database
`company_admin_db` and never touches `traveldesk_db`.

## Stack
- Node.js + Express
- PostgreSQL (`company_admin_db`)
- JWT auth (bcrypt password hashing)

## Quick start (local)
```bash
cd company-admin-backend
cp .env.example .env          # adjust PG* + JWT_SECRET
npm install
npm run db:setup              # creates the DB, applies schema.sql, seeds super admin
npm run dev                   # http://localhost:6010
```
Default seeded super admin:
`superadmin@company-admin.local` / `Admin@12345` (change via `.env`).

## Scripts
| Script | Purpose |
|---|---|
| `npm run migrate` | Create DB (if missing) + apply `src/db/schema.sql` |
| `npm run seed` | Seed/refresh the super admin |
| `npm run db:setup` | migrate + seed |
| `npm run dev` / `npm start` | Run the API |

## Modules / API (all under `/api`, JWT required except `/auth/login`)
- **Auth** — `POST /auth/login`, `GET /auth/me`, `POST /auth/change-password`
- **Dashboard** — `GET /dashboard/stats`
- **Companies** — `GET/POST /companies`, `GET/PUT/DELETE /companies/:id`, `PATCH /companies/:id/status`
- **Company Admins** — `GET/POST /company-admins`, `POST /company-admins/:id/reset-password`, `PATCH /company-admins/:id/active`, `DELETE /company-admins/:id`
- **Configuration** — `GET/PUT /settings/:companyId` (flight/hotel/train/bus/cab/expense/wallet toggles)
- **Subscriptions** — `GET/POST /subscriptions/company/:companyId`, `PATCH /subscriptions/:id/status`
- **Wallets** — `GET /wallets/company/:companyId`, `GET .../transactions`, `POST .../transaction` (allocate/credit/debit)
- **Audit Logs** — `GET /audit-logs`

## Database schema
`super_admins`, `companies`, `company_admins`, `company_subscriptions`,
`company_wallets`, `company_wallet_transactions`, `company_settings`, `audit_logs`.
See `src/db/schema.sql`.
