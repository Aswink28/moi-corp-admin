const { pool } = require('../config/db')
const productAnalytics = require('./productAnalytics.service')

// Recent company records with maker/checker/approver names for dashboard lists.
const RECENT_SELECT = `
  SELECT c.id, c.name, c.code, c.status, c.created_at, c.updated_at,
         c.submitted_at, c.reviewed_at, c.approved_at,
         mk.name AS maker_name, ck.name AS checker_name, sa.name AS approver_name
    FROM companies c
    LEFT JOIN super_admins mk ON mk.id = c.submitted_by
    LEFT JOIN super_admins ck ON ck.id = c.reviewed_by
    LEFT JOIN super_admins sa ON sa.id = c.approved_by
`

async function makerStats(userId) {
  const [counts, recent] = await Promise.all([
    pool.query(
      `SELECT
         COUNT(*)::int AS total_created,
         COUNT(*) FILTER (WHERE status = 'draft')::int AS drafts,
         COUNT(*) FILTER (WHERE status = 'submitted')::int AS submitted,
         COUNT(*) FILTER (WHERE status IN ('under_checker_review','checker_approved','pending_super_admin_approval'))::int AS in_review,
         COUNT(*) FILTER (WHERE status = 'changes_requested')::int AS changes_requested,
         COUNT(*) FILTER (WHERE status = 'active')::int AS active,
         COUNT(*) FILTER (WHERE status = 'rejected')::int AS rejected
       FROM companies WHERE submitted_by = $1 OR created_by = $1`,
      [userId]
    ),
    pool.query(`${RECENT_SELECT} WHERE c.submitted_by = $1 OR c.created_by = $1 ORDER BY c.created_at DESC LIMIT 6`, [userId]),
  ])
  return { role: 'maker', ...counts.rows[0], recent: recent.rows }
}

async function checkerStats(userId) {
  const [counts, recent] = await Promise.all([
    pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status IN ('submitted','under_checker_review'))::int AS pending_reviews,
         COUNT(*) FILTER (WHERE status = 'submitted')::int AS awaiting_verification,
         COUNT(*) FILTER (WHERE reviewed_by = $1 AND status IN ('pending_super_admin_approval','checker_approved','active','suspended'))::int AS approved,
         COUNT(*) FILTER (WHERE reviewed_by = $1 AND status = 'rejected')::int AS rejected,
         COUNT(*) FILTER (WHERE reviewed_by = $1 AND status = 'changes_requested')::int AS changes_requested
       FROM companies`,
      [userId]
    ),
    pool.query(
      `SELECT h.*, c.name AS company_name, c.code AS company_code
         FROM company_approval_history h
         JOIN companies c ON c.id = h.company_id
        WHERE h.actor_id = $1
        ORDER BY h.created_at DESC LIMIT 8`,
      [userId]
    ),
  ])
  return { role: 'checker', ...counts.rows[0], recentActivity: recent.rows }
}

async function superAdminStats() {
  const [companies, revenue, onboarded, wallets, subs, recent, admins] = await Promise.all([
    pool.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE status = 'active')::int AS active,
         COUNT(*) FILTER (WHERE status = 'suspended')::int AS suspended,
         COUNT(*) FILTER (WHERE status = 'rejected')::int AS rejected,
         COUNT(*) FILTER (WHERE status IN ('checker_approved','pending_super_admin_approval'))::int AS pending_final
       FROM companies`
    ),
    pool.query(`SELECT COALESCE(SUM(total_amount),0)::numeric AS total_revenue FROM company_invoices`),
    pool.query(`SELECT COUNT(*)::int AS onboarded FROM companies WHERE status IN ('active','suspended')`),
    pool.query(`SELECT COALESCE(SUM(balance),0)::numeric AS total_balance FROM company_wallets`),
    pool.query(`SELECT plan, COUNT(*)::int AS count FROM company_subscriptions WHERE status = 'active' GROUP BY plan`),
    pool.query(`${RECENT_SELECT} ORDER BY c.updated_at DESC LIMIT 6`),
    pool.query(`SELECT COUNT(*)::int AS total FROM company_admins`),
  ])

  const subscriptionsByPlan = { trial: 0, monthly: 0, quarterly: 0, yearly: 0 }
  for (const r of subs.rows) subscriptionsByPlan[r.plan] = r.count

  // Live cross-company operational metrics from the Product system (real-time,
  // aggregated across all onboarded companies). Never blocks the dashboard:
  // if Product is unreachable the panel reports productUnavailable instead of
  // showing fabricated numbers.
  let product = null
  let productUnavailable = false
  try {
    product = await productAnalytics.overview()
  } catch (e) {
    productUnavailable = true
    product = { error: e.message }
  }

  return {
    role: 'super_admin',
    companies: companies.rows[0],
    pendingFinalApprovals: companies.rows[0].pending_final,
    activeCompanies: companies.rows[0].active,
    rejectedCompanies: companies.rows[0].rejected,
    suspendedCompanies: companies.rows[0].suspended,
    totalCompaniesOnboarded: onboarded.rows[0].onboarded,
    totalRevenue: Number(revenue.rows[0].total_revenue),
    walletTotalBalance: Number(wallets.rows[0].total_balance),
    admins: admins.rows[0],
    subscriptionsByPlan,
    recent: recent.rows,
    product,            // { totalEmployees, totalBookings, totalBookingValue, totalExpenseClaims, walletSpent, pendingApprovals, bookingTrend, spendTrend }
    productUnavailable,
  }
}

async function stats(user) {
  const role = user && user.role
  if (role === 'maker') return makerStats(user.id)
  if (role === 'checker') return checkerStats(user.id)
  return superAdminStats()
}

module.exports = { stats }
