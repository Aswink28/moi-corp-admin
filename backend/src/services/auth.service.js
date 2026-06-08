const { pool } = require('../config/db')
const password = require('../utils/password')
const { sign } = require('../utils/jwt')
const { HttpError } = require('../middleware/error')

async function login(email, plainPassword) {
  if (!email || !plainPassword) throw new HttpError(400, 'Email and password are required')
  const { rows } = await pool.query(
    'SELECT * FROM super_admins WHERE email = $1',
    [String(email).toLowerCase()]
  )
  const user = rows[0]
  if (!user || !user.is_active) throw new HttpError(401, 'Invalid credentials')
  const ok = await password.compare(plainPassword, user.password_hash)
  if (!ok) throw new HttpError(401, 'Invalid credentials')

  await pool.query('UPDATE super_admins SET last_login_at = now() WHERE id = $1', [user.id])
  const token = sign({ id: user.id, email: user.email, role: user.role })
  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  }
}

async function me(userId) {
  const { rows } = await pool.query(
    'SELECT id, name, email, role, last_login_at, created_at FROM super_admins WHERE id = $1',
    [userId]
  )
  if (!rows.length) throw new HttpError(404, 'User not found')
  return rows[0]
}

async function changePassword(userId, currentPw, newPw) {
  if (!newPw || newPw.length < 8) throw new HttpError(400, 'New password must be at least 8 characters')
  const { rows } = await pool.query('SELECT password_hash FROM super_admins WHERE id = $1', [userId])
  if (!rows.length) throw new HttpError(404, 'User not found')
  const ok = await password.compare(currentPw, rows[0].password_hash)
  if (!ok) throw new HttpError(400, 'Current password is incorrect')
  const hash = await password.hash(newPw)
  await pool.query('UPDATE super_admins SET password_hash = $1, updated_at = now() WHERE id = $2', [hash, userId])
  return { ok: true }
}

module.exports = { login, me, changePassword }
