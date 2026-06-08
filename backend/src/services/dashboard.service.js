const { pool } = require('../config/db')

async function stats() {
  const [companies, admins, wallets, subs, recent] = await Promise.all([
    pool.query(`SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'active')::int AS active,
        COUNT(*) FILTER (WHERE status = 'suspended')::int AS suspended,
        COUNT(*) FILTER (WHERE status = 'inactive')::int AS inactive
      FROM companies`),
    pool.query(`SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE is_active)::int AS active
      FROM company_admins`),
    pool.query(`SELECT COALESCE(SUM(balance),0)::numeric AS total_balance FROM company_wallets`),
    pool.query(`SELECT plan, COUNT(*)::int AS count
        FROM company_subscriptions WHERE status = 'active' GROUP BY plan`),
    pool.query(`SELECT id, name, code, status, created_at FROM companies ORDER BY created_at DESC LIMIT 5`),
  ])

  const subscriptionsByPlan = { trial: 0, monthly: 0, quarterly: 0, yearly: 0 }
  for (const r of subs.rows) subscriptionsByPlan[r.plan] = r.count

  return {
    companies: companies.rows[0],
    admins: admins.rows[0],
    walletTotalBalance: Number(wallets.rows[0].total_balance),
    subscriptionsByPlan,
    recentCompanies: recent.rows,
  }
}

module.exports = { stats }
