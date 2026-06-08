/**
 * PostgreSQL connection pool — dedicated to company_admin_db.
 * This is a SEPARATE database from the Travel Expense app (traveldesk_db).
 */
const { Pool } = require('pg')
const config = require('./env')

const pool = config.db.connectionString
  ? new Pool({ connectionString: config.db.connectionString })
  : new Pool({
      host: config.db.host,
      port: config.db.port,
      database: config.db.database,
      user: config.db.user,
      password: config.db.password,
      max: 10,
      idleTimeoutMillis: 30000,
    })

pool.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('[db] unexpected idle client error', err.message)
})

/** Convenience query helper. */
function query(text, params) {
  return pool.query(text, params)
}

/** Run a function inside a transaction (auto BEGIN/COMMIT/ROLLBACK). */
async function withTransaction(fn) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

module.exports = { pool, query, withTransaction }
