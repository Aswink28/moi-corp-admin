/**
 * Seed an initial Super Admin so the portal can be logged into.
 * Idempotent — updates the password if the seed email already exists.
 *
 * Usage: npm run seed
 */
const bcrypt = require('bcryptjs')
const { pool } = require('../config/db')
const config = require('../config/env')

;(async () => {
  try {
    const { name, email, password } = config.seed
    const hash = await bcrypt.hash(password, 10)
    const { rows } = await pool.query(
      `INSERT INTO super_admins (name, email, password_hash, role, is_active)
       VALUES ($1, $2, $3, 'super_admin', TRUE)
       ON CONFLICT (email) DO UPDATE
         SET name = EXCLUDED.name,
             password_hash = EXCLUDED.password_hash,
             is_active = TRUE,
             updated_at = now()
       RETURNING id, email`,
      [name, email.toLowerCase(), hash]
    )
    console.log('[seed] super admin ready:', rows[0].email)
    console.log('[seed] password:', password)
    await pool.end()
    process.exit(0)
  } catch (err) {
    console.error('[seed] failed ❌', err.message)
    process.exit(1)
  }
})()
