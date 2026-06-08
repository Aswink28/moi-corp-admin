const { pool } = require('../config/db')
const { HttpError } = require('../middleware/error')

const MODULES = [
  'flight_enabled', 'hotel_enabled', 'train_enabled', 'bus_enabled',
  'cab_enabled', 'expense_enabled', 'wallet_enabled',
]

async function get(companyId) {
  let { rows } = await pool.query('SELECT * FROM company_settings WHERE company_id = $1', [companyId])
  if (!rows.length) {
    // Lazily create defaults if the company exists
    const c = await pool.query('SELECT id FROM companies WHERE id = $1', [companyId])
    if (!c.rows.length) throw new HttpError(404, 'Company not found')
    rows = (await pool.query(
      'INSERT INTO company_settings (company_id) VALUES ($1) RETURNING *',
      [companyId]
    )).rows
  }
  return rows[0]
}

async function update(companyId, data, actorId) {
  await get(companyId) // ensure row exists
  const set = []
  const params = []
  for (const m of MODULES) {
    if (data[m] !== undefined) {
      params.push(!!data[m])
      set.push(`${m} = $${params.length}`)
    }
  }
  if (!set.length) return get(companyId)
  params.push(actorId)
  set.push(`updated_by = $${params.length}`)
  params.push(companyId)
  const { rows } = await pool.query(
    `UPDATE company_settings SET ${set.join(', ')}, updated_at = now() WHERE company_id = $${params.length} RETURNING *`,
    params
  )
  return rows[0]
}

module.exports = { get, update, MODULES }
