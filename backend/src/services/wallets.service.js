const { pool, withTransaction } = require('../config/db')
const { HttpError } = require('../middleware/error')

async function getWallet(companyId) {
  let { rows } = await pool.query('SELECT * FROM company_wallets WHERE company_id = $1', [companyId])
  if (!rows.length) {
    const c = await pool.query('SELECT id FROM companies WHERE id = $1', [companyId])
    if (!c.rows.length) throw new HttpError(404, 'Company not found')
    rows = (await pool.query(
      `INSERT INTO company_wallets (company_id, balance, currency) VALUES ($1, 0, 'INR') RETURNING *`,
      [companyId]
    )).rows
  }
  return rows[0]
}

async function transactions(companyId, limit = 100) {
  const { rows } = await pool.query(
    `SELECT t.*, sa.name AS performed_by_name
       FROM company_wallet_transactions t
       LEFT JOIN super_admins sa ON sa.id = t.performed_by
      WHERE t.company_id = $1
      ORDER BY t.created_at DESC
      LIMIT $2`,
    [companyId, limit]
  )
  return rows
}

/**
 * Apply a wallet operation atomically.
 * type: 'allocate' (set/credit initial), 'credit' (add), 'debit' (deduct)
 */
async function operate(companyId, { type, amount, description }, actorId) {
  const amt = Number(amount)
  if (!['allocate', 'credit', 'debit'].includes(type)) throw new HttpError(400, 'Invalid transaction type')
  if (!(amt > 0)) throw new HttpError(400, 'Amount must be greater than 0')

  return withTransaction(async (client) => {
    const w = await client.query('SELECT * FROM company_wallets WHERE company_id = $1 FOR UPDATE', [companyId])
    let wallet = w.rows[0]
    if (!wallet) {
      const created = await client.query(
        `INSERT INTO company_wallets (company_id, balance, currency) VALUES ($1, 0, 'INR') RETURNING *`,
        [companyId]
      )
      wallet = created.rows[0]
    }
    const current = Number(wallet.balance)
    const delta = type === 'debit' ? -amt : amt
    const newBalance = current + delta
    if (newBalance < 0) throw new HttpError(400, 'Insufficient wallet balance')

    await client.query(
      'UPDATE company_wallets SET balance = $1, updated_at = now() WHERE id = $2',
      [newBalance, wallet.id]
    )
    const { rows } = await client.query(
      `INSERT INTO company_wallet_transactions (company_id, wallet_id, type, amount, balance_after, description, performed_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [companyId, wallet.id, type, amt, newBalance, description || null, actorId]
    )
    return { wallet: { ...wallet, balance: newBalance }, transaction: rows[0] }
  })
}

module.exports = { getWallet, transactions, operate }
