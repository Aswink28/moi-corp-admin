/**
 * Centralised environment configuration.
 * Loads .env once and exposes a typed config object.
 *
 * Every value is environment-driven. Connection details and secrets are
 * REQUIRED — the process fails fast at startup if any is missing, so the app
 * is never silently booted with an insecure built-in default. Configure a new
 * environment by editing `.env` only (see `.env.example`); no code changes.
 */
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') })

// Required env var — throws a clear error at boot if unset/empty.
function required(name) {
  const v = process.env[name]
  if (v === undefined || v === '') {
    throw new Error(
      `[config] Missing required environment variable: ${name}. ` +
      `Set it in .env (see .env.example).`
    )
  }
  return v
}
// Optional env var with a NON-SECRET operational default (timeouts, flags, etc.).
const optional = (name, fallback) => {
  const v = process.env[name]
  return v === undefined || v === '' ? fallback : v
}

// DB can be configured either by a single DATABASE_URL or discrete PG* vars.
const usingConnString = !!(process.env.DATABASE_URL && process.env.DATABASE_URL.trim())

const config = {
  env: optional('NODE_ENV', 'development'),
  port: parseInt(required('PORT'), 10),

  // Set HTTPS_ENABLED=true only when the API is actually served over TLS
  // (e.g. behind an HTTPS reverse proxy / a real cert). When false (default),
  // HTTPS-only security headers (HSTS, CSP upgrade-insecure-requests, COOP)
  // are turned off so the API + self-hosted Swagger UI work over plain HTTP
  // on a LAN IP. See app.js.
  httpsEnabled: process.env.HTTPS_ENABLED === 'true',

  db: usingConnString
    ? {
        connectionString: process.env.DATABASE_URL.trim(),
        poolMax: parseInt(optional('DB_POOL_MAX', '10'), 10),
        idleTimeoutMs: parseInt(optional('DB_IDLE_TIMEOUT_MS', '30000'), 10),
      }
    : {
        connectionString: undefined,
        host: required('PGHOST'),
        port: parseInt(required('PGPORT'), 10),
        database: required('PGDATABASE'),
        user: required('PGUSER'),
        password: required('PGPASSWORD'),
        poolMax: parseInt(optional('DB_POOL_MAX', '10'), 10),
        idleTimeoutMs: parseInt(optional('DB_IDLE_TIMEOUT_MS', '30000'), 10),
      },

  jwt: {
    secret: required('JWT_SECRET'),
    expiresIn: optional('JWT_EXPIRES_IN', '12h'),
  },

  corsOrigins: required('CORS_ORIGINS')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  // Lender Portal API — a separate external consumer of company data, secured
  // by a shared API key (header `x-lender-api-key`), independent of the Super
  // Admin JWT. Required: no built-in key, so it must be set per environment.
  lender: {
    apiKey: required('LENDER_API_KEY'),
  },

  // Moi-Corp Product (TravelDesk) integration — auto-provision companies + admins
  // into the Product DB via its internal provisioning API.
  product: {
    apiUrl: required('PRODUCT_API_URL'),
    provisioningSecret: required('PRODUCT_PROVISIONING_SECRET'),
    // Timeout for live analytics fetches from Product (ms).
    analyticsTimeoutMs: parseInt(optional('PRODUCT_ANALYTICS_TIMEOUT_MS', '8000'), 10),
  },

  seed: {
    name: process.env.SEED_SUPERADMIN_NAME || 'Super Admin',
    email: process.env.SEED_SUPERADMIN_EMAIL || 'superadmin@company-admin.local',
    password: process.env.SEED_SUPERADMIN_PASSWORD || 'Admin@12345',
  },

  // Demo accounts for the 3-level approval workflow. Passwords are overridable
  // via env; defaults are fine for local/dev. Each is printed by `npm run seed`.
  seedUsers: [
    {
      name: process.env.SEED_SUPERADMIN_NAME || 'Super Admin',
      email: process.env.SEED_SUPERADMIN_EMAIL || 'superadmin@company-admin.local',
      password: process.env.SEED_SUPERADMIN_PASSWORD || 'Admin@12345',
      role: 'super_admin',
    },
    {
      name: process.env.SEED_MAKER_NAME || 'Maker User',
      email: process.env.SEED_MAKER_EMAIL || 'maker@company-admin.local',
      password: process.env.SEED_MAKER_PASSWORD || 'Maker@12345',
      role: 'maker',
    },
    {
      name: process.env.SEED_CHECKER_NAME || 'Checker User',
      email: process.env.SEED_CHECKER_EMAIL || 'checker@company-admin.local',
      password: process.env.SEED_CHECKER_PASSWORD || 'Checker@12345',
      role: 'checker',
    },
  ],
}

module.exports = config
