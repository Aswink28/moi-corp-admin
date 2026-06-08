/**
 * Seed the portal users for the 3-level approval workflow:
 *   - Super Admin (final approval + activation)
 *   - Maker       (creates & submits onboarding requests)
 *   - Checker     (reviews & verifies submissions)
 *
 * Idempotent — updates name/password/role if the email already exists.
 *
 * Usage: npm run seed
 */
const bcrypt = require('bcryptjs')
const { pool } = require('../config/db')
const config = require('../config/env')

;(async () => {
  try {
    const users = config.seedUsers || [config.seed && { ...config.seed, role: 'super_admin' }]
    const printed = []
    for (const u of users) {
      if (!u || !u.email) continue
      const hash = await bcrypt.hash(u.password, 10)
      const { rows } = await pool.query(
        `INSERT INTO super_admins (name, email, password_hash, role, is_active)
         VALUES ($1, $2, $3, $4, TRUE)
         ON CONFLICT (email) DO UPDATE
           SET name = EXCLUDED.name,
               password_hash = EXCLUDED.password_hash,
               role = EXCLUDED.role,
               is_active = TRUE,
               updated_at = now()
         RETURNING email, role`,
        [u.name, u.email.toLowerCase(), hash, u.role]
      )
      printed.push({ ...rows[0], password: u.password })
    }

    console.log('[seed] portal users ready:')
    for (const p of printed) {
      console.log(`  • ${p.role.padEnd(12)} ${p.email}  (password: ${p.password})`)
    }
    await pool.end()
    process.exit(0)
  } catch (err) {
    console.error('[seed] failed ❌', err.message)
    process.exit(1)
  }
})()
