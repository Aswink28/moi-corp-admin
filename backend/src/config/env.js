/**
 * Centralised environment configuration.
 * Loads .env once and exposes a typed config object.
 */
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') })

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '6010', 10),

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
