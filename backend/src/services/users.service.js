/**
 * User Management (super_admins) — Super-Admin-only CRUD with per-user screen
 * access. Users created here can log into the Admin Portal; their `screens`
 * array controls which Admin-Portal screens they can reach.
 */
const { pool } = require('../config/db')
const password = require('../utils/password')
const { HttpError } = require('../middleware/error')
const { SCREEN_KEYS } = require('../config/screens')

const ROLES = ['super_admin', 'admin', 'maker', 'checker']
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const SELECT = `
  SELECT id, name, email, mobile_number, username, role, is_active, screens,
         last_login_at, created_at, updated_at
    FROM super_admins
`

const cleanScreens = (arr) =>
  [...new Set((Array.isArray(arr) ? arr : []).map(String))].filter((s) => SCREEN_KEYS.includes(s))

// Validate the shared field set. `partial` = true for updates (only check provided).
function validate(data, { partial = false } = {}) {
  const out = {}
  const need = (cond, msg) => { if (!cond) throw new HttpError(400, msg) }

  if (!partial || data.name !== undefined) {
    out.name = String(data.name || '').trim()
    need(out.name.length >= 2, 'Name is required (min 2 characters)')
  }
  if (!partial || data.email !== undefined) {
    out.email = String(data.email || '').trim().toLowerCase()
    need(EMAIL_RE.test(out.email), 'A valid email address is required')
  }
  if (!partial || data.mobile_number !== undefined) {
    out.mobile_number = String(data.mobile_number || '').trim()
    need(/^\d{10}$/.test(out.mobile_number), 'Mobile number must be exactly 10 digits')
  }
  if (!partial || data.username !== undefined) {
    out.username = String(data.username || '').trim()
    need(/^[a-zA-Z0-9._-]{3,}$/.test(out.username), 'Username must be at least 3 characters (letters, numbers, . _ -)')
  }
  if (!partial || data.role !== undefined) {
    out.role = String(data.role || '').trim()
    need(ROLES.includes(out.role), `Role must be one of: ${ROLES.join(', ')}`)
  }
  if (!partial || data.is_active !== undefined) out.is_active = data.is_active === undefined ? true : !!data.is_active
  if (!partial || data.screens !== undefined) out.screens = cleanScreens(data.screens)
  if (data.password !== undefined && data.password !== '') {
    need(String(data.password).length >= 8, 'Password must be at least 8 characters')
    out.password = String(data.password)
  }
  return out
}

async function assertUnique(field, value, exceptId) {
  const { rows } = await pool.query(
    `SELECT 1 FROM super_admins WHERE ${field} = $1 ${exceptId ? 'AND id <> $2' : ''} LIMIT 1`,
    exceptId ? [value, exceptId] : [value])
  if (rows.length) throw new HttpError(409, `That ${field === 'mobile_number' ? 'mobile number' : field} is already in use`)
}

// Never strand the portal without an active Super Admin.
async function assertNotLastSuperAdmin(id, { nextRole, nextActive } = {}) {
  const { rows } = await pool.query('SELECT role, is_active FROM super_admins WHERE id = $1', [id])
  if (!rows.length) throw new HttpError(404, 'User not found')
  const cur = rows[0]
  const losing = cur.role === 'super_admin' && cur.is_active && ((nextActive === false) || (nextRole && nextRole !== 'super_admin'))
  if (!losing) return
  const { rows: c } = await pool.query(
    `SELECT COUNT(*)::int n FROM super_admins WHERE role = 'super_admin' AND is_active = TRUE AND id <> $1`, [id])
  if (c[0].n === 0) throw new HttpError(409, 'This is the last active Super Admin — assign another before changing this user.')
}

async function list() {
  const { rows } = await pool.query(`${SELECT} ORDER BY is_active DESC, created_at DESC`)
  return rows
}

async function get(id) {
  const { rows } = await pool.query(`${SELECT} WHERE id = $1`, [id])
  if (!rows.length) throw new HttpError(404, 'User not found')
  return rows[0]
}

async function create(data) {
  const v = validate(data)
  if (!v.password) throw new HttpError(400, 'Password is required')
  await assertUnique('email', v.email)
  await assertUnique('username', v.username)
  await assertUnique('mobile_number', v.mobile_number)
  const hash = await password.hash(v.password)
  const { rows } = await pool.query(
    `INSERT INTO super_admins (name, email, mobile_number, username, role, is_active, screens, password_hash)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING id, name, email, mobile_number, username, role, is_active, screens, created_at`,
    [v.name, v.email, v.mobile_number, v.username, v.role, v.is_active, v.screens || [], hash])
  return rows[0]
}

async function update(id, data) {
  const v = validate(data, { partial: true })
  if (v.email !== undefined) await assertUnique('email', v.email, id)
  if (v.username !== undefined) await assertUnique('username', v.username, id)
  if (v.mobile_number !== undefined) await assertUnique('mobile_number', v.mobile_number, id)
  if (v.role !== undefined) await assertNotLastSuperAdmin(id, { nextRole: v.role })
  if (v.is_active === false) await assertNotLastSuperAdmin(id, { nextActive: false })

  const sets = [], vals = []; let i = 1
  for (const col of ['name', 'email', 'mobile_number', 'username', 'role', 'is_active', 'screens']) {
    if (v[col] !== undefined) { sets.push(`${col} = $${i++}`); vals.push(v[col]) }
  }
  if (v.password) { sets.push(`password_hash = $${i++}`); vals.push(await password.hash(v.password)) }
  if (!sets.length) throw new HttpError(400, 'No fields to update')
  sets.push('updated_at = now()'); vals.push(id)
  const { rows } = await pool.query(
    `UPDATE super_admins SET ${sets.join(', ')} WHERE id = $${i}
     RETURNING id, name, email, mobile_number, username, role, is_active, screens, updated_at`, vals)
  if (!rows.length) throw new HttpError(404, 'User not found')
  return rows[0]
}

async function setActive(id, isActive) {
  if (isActive === false) await assertNotLastSuperAdmin(id, { nextActive: false })
  const { rows } = await pool.query(
    `UPDATE super_admins SET is_active = $1, updated_at = now() WHERE id = $2
     RETURNING id, name, email, role, is_active`, [!!isActive, id])
  if (!rows.length) throw new HttpError(404, 'User not found')
  return rows[0]
}

async function remove(id) {
  await assertNotLastSuperAdmin(id, { nextActive: false })
  const { rowCount } = await pool.query('DELETE FROM super_admins WHERE id = $1', [id])
  if (!rowCount) throw new HttpError(404, 'User not found')
  return { deleted: true }
}

module.exports = { list, get, create, update, setActive, remove }
