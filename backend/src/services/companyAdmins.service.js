const { pool } = require('../config/db')
const password = require('../utils/password')
const { HttpError } = require('../middleware/error')

const SELECT = `
  SELECT ca.id, ca.company_id, ca.name, ca.email, ca.phone, ca.is_active,
         ca.last_login_at, ca.created_at, c.name AS company_name, c.code AS company_code
    FROM company_admins ca
    JOIN companies c ON c.id = ca.company_id
`

async function list({ companyId } = {}) {
  const params = []
  let where = ''
  if (companyId) {
    params.push(companyId)
    where = `WHERE ca.company_id = $1`
  }
  const { rows } = await pool.query(`${SELECT} ${where} ORDER BY ca.created_at DESC`, params)
  return rows
}

async function create(data, actorId) {
  if (!data.company_id || !data.name || !data.email) {
    throw new HttpError(400, 'company_id, name and email are required')
  }
  const company = await pool.query('SELECT id FROM companies WHERE id = $1', [data.company_id])
  if (!company.rows.length) throw new HttpError(404, 'Company not found')

  const plain = data.password && data.password.length >= 8 ? data.password : password.randomPassword()
  const hash = await password.hash(plain)
  const { rows } = await pool.query(
    `INSERT INTO company_admins (company_id, name, email, password_hash, phone, created_by)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING id, company_id, name, email, phone, is_active, created_at`,
    [data.company_id, data.name, String(data.email).toLowerCase(), hash, data.phone || null, actorId]
  )
  // Return the generated password ONCE so the super admin can share it.
  return { admin: rows[0], temporaryPassword: data.password ? undefined : plain }
}

async function resetPassword(id) {
  const plain = password.randomPassword()
  const hash = await password.hash(plain)
  const { rows } = await pool.query(
    `UPDATE company_admins SET password_hash = $1, updated_at = now() WHERE id = $2 RETURNING id, email`,
    [hash, id]
  )
  if (!rows.length) throw new HttpError(404, 'Company admin not found')
  return { id: rows[0].id, email: rows[0].email, temporaryPassword: plain }
}

async function setActive(id, isActive) {
  const { rows } = await pool.query(
    `UPDATE company_admins SET is_active = $1, updated_at = now() WHERE id = $2
     RETURNING id, name, email, is_active`,
    [!!isActive, id]
  )
  if (!rows.length) throw new HttpError(404, 'Company admin not found')
  return rows[0]
}

async function remove(id) {
  const { rowCount } = await pool.query('DELETE FROM company_admins WHERE id = $1', [id])
  if (!rowCount) throw new HttpError(404, 'Company admin not found')
  return { deleted: true }
}

module.exports = { list, create, resetPassword, setActive, remove }
