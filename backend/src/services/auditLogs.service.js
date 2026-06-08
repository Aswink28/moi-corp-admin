const { pool } = require('../config/db')

async function list({ action = '', entityType = '', limit = 200 } = {}) {
  const where = []
  const params = []
  if (action) {
    params.push(`%${action.toLowerCase()}%`)
    where.push(`LOWER(action) LIKE $${params.length}`)
  }
  if (entityType) {
    params.push(entityType)
    where.push(`entity_type = $${params.length}`)
  }
  params.push(Math.min(Number(limit) || 200, 1000))
  const sql = `
    SELECT * FROM audit_logs
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY created_at DESC
    LIMIT $${params.length}`
  const { rows } = await pool.query(sql, params)
  return rows
}

module.exports = { list }
