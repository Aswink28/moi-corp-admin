/**
 * Centralised environment configuration.
 * Loads .env once and exposes a typed config object.
 */
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') })

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '6010', 10),

  // Set HTTPS_ENABLED=true only when the API is actually served over TLS
  // (e.g. behind an HTTPS reverse proxy / a real cert). When false (default),
  // HTTPS-only security headers (HSTS, CSP upgrade-insecure-requests, COOP)
  // are turned off so the API + self-hosted Swagger UI work over plain HTTP
  // on a LAN IP. See app.js.
  httpsEnabled: process.env.HTTPS_ENABLED === 'true',

  db: {
    connectionString: process.env.DATABASE_URL || undefined,
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432', 10),
    database: process.env.PGDATABASE || 'company_admin_db',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'insecure-dev-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '12h',
  },

  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5180')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  // Lender Portal API — a separate external consumer of company data, secured
  // by a shared API key (header `x-lender-api-key`), independent of the Super
  // Admin JWT. Defaults to a dev key (override with LENDER_API_KEY in prod),
  // matching the existing dev-default convention used for JWT_SECRET.
  lender: {
    apiKey: process.env.LENDER_API_KEY || 'dev-lender-key',
  },

  // Moi-Corp Product (TravelDesk) integration — auto-provision companies + admins
  // into the Product DB via its internal provisioning API.
  product: {
    apiUrl: process.env.PRODUCT_API_URL || 'http://localhost:5015',
    provisioningSecret: process.env.PRODUCT_PROVISIONING_SECRET || '',
    // Timeout for live analytics fetches from Product (ms).
    analyticsTimeoutMs: parseInt(process.env.PRODUCT_ANALYTICS_TIMEOUT_MS || '8000', 10),
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
