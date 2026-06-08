const { pool, withTransaction } = require('../config/db')
const { HttpError } = require('../middleware/error')

const SELECT_LIST = `
  SELECT c.*,
         w.balance AS wallet_balance,
         w.currency AS wallet_currency,
         mk.name AS maker_name, mk.email AS maker_email,
         ck.name AS checker_name, ck.email AS checker_email,
         sa.name AS approver_name, sa.email AS approver_email,
         (SELECT COUNT(*)::int FROM company_admins ca WHERE ca.company_id = c.id) AS admin_count,
         (SELECT row_to_json(s) FROM (
            SELECT plan, status, end_date FROM company_subscriptions sub
            WHERE sub.company_id = c.id ORDER BY sub.created_at DESC LIMIT 1
         ) s) AS subscription
    FROM companies c
    LEFT JOIN company_wallets w ON w.company_id = c.id
    LEFT JOIN super_admins mk ON mk.id = c.submitted_by
    LEFT JOIN super_admins ck ON ck.id = c.reviewed_by
    LEFT JOIN super_admins sa ON sa.id = c.approved_by
`

async function list({ search = '', status = '' } = {}) {
  const where = []
  const params = []
  if (search) {
    params.push(`%${search.toLowerCase()}%`)
    where.push(`(LOWER(c.name) LIKE $${params.length} OR LOWER(c.code) LIKE $${params.length})`)
  }
  if (status) {
    params.push(status)
    where.push(`c.status = $${params.length}`)
  }
  const sql = `${SELECT_LIST} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY c.created_at DESC`
  const { rows } = await pool.query(sql, params)
  return rows
}

async function getById(id) {
  const { rows } = await pool.query(`${SELECT_LIST} WHERE c.id = $1`, [id])
  if (!rows.length) throw new HttpError(404, 'Company not found')
  return rows[0]
}

async function create(data, actorId) {
  if (!data.name || !data.code) throw new HttpError(400, 'Company name and code are required')
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO companies (name, code, legal_name, industry, email, phone, address, city, country, logo_url, status, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, COALESCE($11,'active'), $12)
       RETURNING *`,
      [
        data.name, String(data.code).toUpperCase(), data.legal_name || null, data.industry || null,
        data.email || null, data.phone || null, data.address || null, data.city || null,
        data.country || 'India', data.logo_url || null, data.status || 'active', actorId,
      ]
    )
    const company = rows[0]
    // Provision wallet + default module settings for the new company
    await client.query(
      `INSERT INTO company_wallets (company_id, balance, currency) VALUES ($1, 0, 'INR')`,
      [company.id]
    )
    await client.query(`INSERT INTO company_settings (company_id, updated_by) VALUES ($1, $2)`, [
      company.id, actorId,
    ])
    return company
  })
}

async function update(id, data) {
  await getById(id) // 404 if missing
  const fields = ['name', 'code', 'legal_name', 'industry', 'email', 'phone', 'address', 'city', 'country', 'logo_url']
  const set = []
  const params = []
  for (const f of fields) {
    if (data[f] !== undefined) {
      params.push(f === 'code' ? String(data[f]).toUpperCase() : data[f])
      set.push(`${f} = $${params.length}`)
    }
  }
  if (!set.length) return getById(id)
  params.push(id)
  const { rows } = await pool.query(
    `UPDATE companies SET ${set.join(', ')}, updated_at = now() WHERE id = $${params.length} RETURNING *`,
    params
  )
  return rows[0]
}

const COMPANY_STATUSES = [
  'draft', 'submitted', 'under_checker_review', 'changes_requested',
  'checker_approved', 'pending_super_admin_approval',
  'active', 'rejected', 'suspended', 'inactive',
]

async function setStatus(id, status) {
  if (!COMPANY_STATUSES.includes(status)) throw new HttpError(400, 'Invalid status')
  const { rows } = await pool.query(
    `UPDATE companies SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
    [status, id]
  )
  if (!rows.length) throw new HttpError(404, 'Company not found')
  return rows[0]
}

async function remove(id) {
  const { rowCount } = await pool.query('DELETE FROM companies WHERE id = $1', [id])
  if (!rowCount) throw new HttpError(404, 'Company not found')
  return { deleted: true }
}

module.exports = { list, getById, create, update, setStatus, remove }
