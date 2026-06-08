const { pool, withTransaction } = require('../config/db')
const { HttpError } = require('../middleware/error')

const PLAN_DAYS = { trial: 14, monthly: 30, quarterly: 90, yearly: 365 }

function computeEndDate(plan, startDate) {
  const days = PLAN_DAYS[plan]
  const d = new Date(startDate)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

async function listByCompany(companyId) {
  const { rows } = await pool.query(
    'SELECT * FROM company_subscriptions WHERE company_id = $1 ORDER BY created_at DESC',
    [companyId]
  )
  return rows
}

async function current(companyId) {
  const { rows } = await pool.query(
    `SELECT * FROM company_subscriptions WHERE company_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [companyId]
  )
  return rows[0] || null
}

async function create(companyId, data, actorId) {
  if (!PLAN_DAYS[data.plan]) throw new HttpError(400, 'plan must be trial, monthly, quarterly or yearly')
  const company = await pool.query('SELECT id FROM companies WHERE id = $1', [companyId])
  if (!company.rows.length) throw new HttpError(404, 'Company not found')

  const startDate = data.start_date || new Date().toISOString().slice(0, 10)
  const endDate = data.end_date || computeEndDate(data.plan, startDate)

  return withTransaction(async (client) => {
    // Expire any currently-active subscription before activating the new one.
    await client.query(
      `UPDATE company_subscriptions SET status = 'expired', updated_at = now()
       WHERE company_id = $1 AND status = 'active'`,
      [companyId]
    )
    const { rows } = await client.query(
      `INSERT INTO company_subscriptions (company_id, plan, status, amount, currency, start_date, end_date, created_by)
       VALUES ($1,$2,'active',$3,$4,$5,$6,$7) RETURNING *`,
      [companyId, data.plan, data.amount || 0, data.currency || 'INR', startDate, endDate, actorId]
    )
    return rows[0]
  })
}

async function setStatus(id, status) {
  if (!['active', 'expired', 'cancelled'].includes(status)) throw new HttpError(400, 'Invalid status')
  const { rows } = await pool.query(
    `UPDATE company_subscriptions SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
    [status, id]
  )
  if (!rows.length) throw new HttpError(404, 'Subscription not found')
  return rows[0]
}

module.exports = { listByCompany, current, create, setStatus }
