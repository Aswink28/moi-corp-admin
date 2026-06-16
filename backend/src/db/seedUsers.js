/**
 * Seed sample Admin-Portal users for the User Management module.
 * Idempotent (ON CONFLICT email). All share the same test password.
 *
 * Usage: node src/db/seedUsers.js   (or: npm run seed:users)
 */
const bcrypt = require('bcryptjs')
const { pool } = require('../config/db')

const PASSWORD = 'User@12345'

const USERS = [
  { name: 'Priya Nair',    email: 'priya.nair@moicorp.local',    mobile: '9810000001', username: 'priya.nair',    role: 'admin',   screens: ['dashboard', 'company-analytics', 'companies', 'company-onboarding', 'company-admins', 'configuration', 'subscriptions', 'wallets', 'audit-logs'] },
  { name: 'Rahul Verma',   email: 'rahul.verma@moicorp.local',   mobile: '9810000002', username: 'rahul.verma',   role: 'maker',   screens: ['dashboard', 'company-onboarding', 'approvals'] },
  { name: 'Anita Desai',   email: 'anita.desai@moicorp.local',   mobile: '9810000003', username: 'anita.desai',   role: 'checker', screens: ['dashboard', 'approvals', 'companies'] },
  { name: 'Vikram Singh',  email: 'vikram.singh@moicorp.local',  mobile: '9810000004', username: 'vikram.singh',  role: 'admin',   screens: ['dashboard', 'company-analytics', 'subscriptions', 'wallets'] },
  { name: 'Meena Iyer',    email: 'meena.iyer@moicorp.local',    mobile: '9810000005', username: 'meena.iyer',    role: 'maker',   screens: ['dashboard', 'company-onboarding'] },
  { name: 'Karthik Rao',   email: 'karthik.rao@moicorp.local',   mobile: '9810000006', username: 'karthik.rao',   role: 'checker', screens: ['dashboard', 'audit-logs'] },
]

;(async () => {
  try {
    const hash = await bcrypt.hash(PASSWORD, 10)
    for (const u of USERS) {
      await pool.query(
        `INSERT INTO super_admins (name, email, mobile_number, username, role, is_active, screens, password_hash)
         VALUES ($1,$2,$3,$4,$5,TRUE,$6,$7)
         ON CONFLICT (email) DO UPDATE
           SET name = EXCLUDED.name, mobile_number = EXCLUDED.mobile_number, username = EXCLUDED.username,
               role = EXCLUDED.role, screens = EXCLUDED.screens, is_active = TRUE, updated_at = now()`,
        [u.name, u.email, u.mobile, u.username, u.role, u.screens, hash])
    }
    console.log(`[seed:users] ${USERS.length} sample users ready (password: ${PASSWORD}):`)
    for (const u of USERS) console.log(`  • ${u.role.padEnd(8)} ${u.email.padEnd(34)} screens: ${u.screens.length}`)
    await pool.end()
    process.exit(0)
  } catch (err) {
    console.error('[seed:users] failed ❌', err.message)
    process.exit(1)
  }
})()
