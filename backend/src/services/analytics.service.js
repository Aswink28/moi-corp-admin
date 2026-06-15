/**
 * Company Analytics (360° view) for the Super Admin dashboard.
 *
 * ALL operational analytics (employees, bookings, travel, expenses, wallet spend,
 * approvals, recent activity) are fetched LIVE from the Moi-Corp Product system
 * via its internal analytics API. There is NO mock/dummy data.
 *
 * This service is responsible only for:
 *   1. Company profile / subscription / billing / credit — sourced from THIS
 *      (Admin) DB, which is the system of record for those.
 *   2. Merging the Product's live operational data into the response shape the
 *      frontend already consumes (so charts/KPIs are unchanged).
 *   3. Computing a health score from the real numbers.
 *
 * If Product is unreachable we return the real billing/profile data with the
 * operational sections empty and `productUnavailable: true` — never fabricated
 * values.
 */
const { pool } = require('../config/db')
const { HttpError } = require('../middleware/error')
const productAnalytics = require('./productAnalytics.service')

const num = (v) => (v === null || v === undefined ? 0 : Number(v))

// 12-month axis with the same label format Product uses ("Jan '25").
function monthsAxis(n = 12) {
  const out = []
  const d = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1)
    const label = m.toLocaleString('en-US', { month: 'short' }) + " '" + String(m.getFullYear()).slice(2)
    out.push({ y: m.getFullYear(), mo: m.getMonth(), label })
  }
  return out
}

// Empty operational sections used only when Product is unreachable (never mock).
function emptyOperational() {
  const months = monthsAxis().map((m) => m.label)
  return {
    employee: { total: 0, active: 0, inactive: 0, addedThisMonth: 0, byDepartment: [], byLocation: [], topTravelling: [], mostActive: [], growthTrend: months.map((month) => ({ month, employees: 0 })) },
    booking: { flight: 0, hotel: 0, train: 0, bus: 0, approved: 0, pending: 0, rejected: 0, cancelled: 0, ticketed: 0, total: 0, totalValue: 0, monthlyTrend: months.map((month) => ({ month, bookings: 0 })), valueTrend: months.map((month) => ({ month, value: 0 })), typeDistribution: [], statusDistribution: [], topDepartments: [], topEmployees: [] },
    travel: { mostTravelledRoute: null, mostTravelledDestination: null, domesticTrips: 0, internationalTrips: 0, businessTrips: 0, avgTripCost: 0, topDestinations: [], frequencyTrend: months.map((month) => ({ month, trips: 0 })), routes: [] },
    expense: { totalClaims: 0, approvedClaims: 0, rejectedClaims: 0, pendingClaims: 0, totalClaimAmount: 0, totalApprovedAmount: 0, reimbursementAmount: 0, monthlyTrend: months.map((month) => ({ month, amount: 0 })), categoryBreakdown: [], departmentAnalysis: [], employeeAnalysis: [] },
    approval: { pending: 0, approved: 0, rejected: 0, avgApprovalHours: 0, trend: months.map((month) => ({ month, approved: 0, rejected: 0 })), statusDistribution: [] },
    financial: { walletBalance: 0, budgetAllocated: 0, budgetSpent: 0, utilizationPct: 0, spendByCategory: [], spendTrend: months.map((month) => ({ month, spent: 0, loaded: 0 })) },
    department: { total: 0, byEmployees: [], byBookings: [], byExpenses: [], byTravelSpend: [], table: [] },
    recentActivity: { employees: [], bookings: [], claims: [], policy: [] },
    meta: { departments: [], locations: [], expenseCategories: [] },
    kpis: { totalEmployees: 0, activeEmployees: 0, totalBookings: 0, totalBookingValue: 0, totalExpenseClaims: 0, totalClaimAmount: 0, walletSpent: 0, avgMonthlySpend: 0 },
  }
}

// Health score computed entirely from REAL numbers. Each factor is 0–100;
// factors that can't be derived (no data) are simply omitted from the average.
function computeHealth(prod, billing) {
  const factors = []
  const push = (label, score) => factors.push({ label, score: Math.max(0, Math.min(100, Math.round(score))) })

  if (prod.employee.total > 0) push('Employee Activity', (prod.employee.active / prod.employee.total) * 100)
  if (prod.employee.total > 0) push('Booking Engagement', Math.min(100, (prod.booking.total / prod.employee.total) * 20))
  if (prod.expense.totalClaims > 0) push('Expense Processing', (prod.expense.approvedClaims / prod.expense.totalClaims) * 100)
  if (prod.approval.approved + prod.approval.rejected > 0) push('Approval Throughput', Math.max(0, 100 - prod.approval.avgApprovalHours * 2))
  if (prod.financial.budgetAllocated > 0) push('Budget Utilization', prod.financial.utilizationPct)
  const billed = billing.totalRevenue
  if (billed > 0) push('Payment Timeliness', 100 - (billing.outstandingAmount / billed) * 100)

  const score = factors.length ? Math.round(factors.reduce((a, f) => a + f.score, 0) / factors.length) : 0
  const band = score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 55 ? 'Average' : factors.length ? 'Needs Attention' : 'No Data'
  return { score, band, factors }
}

/** Build the full 360° analytics payload for one company. */
async function companyAnalytics(companyId) {
  // ── 1. Company profile + billing/subscription/credit (THIS DB — real) ──────
  const { rows } = await pool.query(
    `SELECT c.*, sa.name AS approver_name
       FROM companies c
       LEFT JOIN super_admins sa ON sa.id = c.approved_by
      WHERE c.id = $1`,
    [companyId]
  )
  if (!rows.length) throw new HttpError(404, 'Company not found')
  const company = rows[0]

  const [adminCount, sub, wallet, invoices, invTrend] = await Promise.all([
    pool.query('SELECT COUNT(*)::int AS n FROM company_admins WHERE company_id = $1', [companyId]),
    pool.query(`SELECT * FROM company_subscriptions WHERE company_id = $1 ORDER BY created_at DESC LIMIT 1`, [companyId]),
    pool.query('SELECT * FROM company_wallets WHERE company_id = $1', [companyId]),
    pool.query(
      `SELECT COUNT(*)::int AS count,
              COALESCE(SUM(total_amount),0)::numeric AS revenue,
              COALESCE(SUM(total_amount) FILTER (WHERE status <> 'paid'),0)::numeric AS outstanding_amount,
              COUNT(*) FILTER (WHERE status <> 'paid')::int AS outstanding_invoices,
              MAX(issued_at) AS last_issued
         FROM company_invoices WHERE company_id = $1`,
      [companyId]
    ),
    pool.query(
      `SELECT date_trunc('month', issued_at)::date AS m,
              COALESCE(SUM(total_amount),0)::numeric AS billed,
              COALESCE(SUM(total_amount) FILTER (WHERE status = 'paid'),0)::numeric AS collected
         FROM company_invoices WHERE company_id = $1
        GROUP BY 1`,
      [companyId]
    ),
  ])

  const subscription = sub.rows[0] || {}
  const walletRow = wallet.rows[0] || {}
  const inv = invoices.rows[0] || {}

  const subscriptionValue = subscription.total_amount ? Number(subscription.total_amount) : 0
  const invoiceRevenue = num(inv.revenue)
  const outstandingAmount = num(inv.outstanding_amount)
  const amountCollected = Math.max(0, invoiceRevenue - outstandingAmount)
  const creditLimit = walletRow.credit_limit ? Number(walletRow.credit_limit) : 0
  const creditUsed = walletRow.credit_used ? Number(walletRow.credit_used) : 0
  const availableCredit = Math.max(0, creditLimit - creditUsed)
  const creditUtilization = creditLimit ? Math.round((creditUsed / creditLimit) * 100) : 0

  // Real monthly billing/collection trends on a stable 12-month axis.
  const trendMap = {}
  for (const r of invTrend.rows) {
    const d = new Date(r.m)
    trendMap[`${d.getFullYear()}-${d.getMonth()}`] = { billed: num(r.billed), collected: num(r.collected) }
  }
  const axis = monthsAxis()
  const revenueTrend = axis.map((m) => ({ month: m.label, revenue: trendMap[`${m.y}-${m.mo}`]?.billed || 0 }))
  const collectionTrend = axis.map((m) => ({ month: m.label, collected: trendMap[`${m.y}-${m.mo}`]?.collected || 0 }))
  const outstandingTrend = axis.map((m, i) => ({ month: m.label, outstanding: Math.max(0, revenueTrend[i].revenue - collectionTrend[i].collected) }))

  // ── 2. Live operational analytics from Product ─────────────────────────────
  let prod = emptyOperational()
  let productUnavailable = false
  let productError = null
  try {
    prod = await productAnalytics.companyAnalytics(companyId)
  } catch (e) {
    productUnavailable = true
    productError = e.message
  }

  // ── 3. Merge into the frontend response shape ──────────────────────────────
  const billing = {
    subscriptionFee: subscriptionValue,
    lastPaymentDate: inv.last_issued || null,
    nextBillingDate: subscription.end_date || null,
    paymentStatus: outstandingAmount > 0 ? 'Partially Paid' : invoiceRevenue > 0 ? 'Paid' : 'No Invoices',
    overdueAmount: outstandingAmount,
    outstandingInvoices: num(inv.outstanding_invoices),
    totalRevenue: invoiceRevenue,
    outstandingAmount,
    billingTrend: revenueTrend.map((r) => ({ month: r.month, billed: r.revenue })),
    collectionTrend,
  }

  const financial = {
    // Platform revenue (subscription/invoices) — real, from this DB.
    subscriptionRevenue: invoiceRevenue,
    // Per-booking fees are not tracked in Product → reported as 0, never faked.
    serviceFeeRevenue: 0, convenienceFeeRevenue: 0, markupRevenue: 0,
    totalRevenue: invoiceRevenue,
    outstandingAmount,
    amountCollected,
    creditUtilization,
    revenueTrend,
    revenueBreakdown: [{ name: 'Subscription', value: invoiceRevenue }],
    collectionTrend,
    outstandingTrend,
    // Real wallet money-movement from Product.
    walletBalance: prod.financial.walletBalance,
    budgetAllocated: prod.financial.budgetAllocated,
    budgetSpent: prod.financial.budgetSpent,
    utilizationPct: prod.financial.utilizationPct,
    spendByCategory: prod.financial.spendByCategory,
    spendTrend: prod.financial.spendTrend,
  }

  const health = computeHealth(prod, billing)

  const summary = {
    id: company.id,
    name: company.name,
    code: company.code,
    logo_url: company.logo_url,
    industry: company.industry,
    status: company.status,
    subscriptionPlan: subscription.plan_tier || subscription.plan || '—',
    onboardingDate: company.approved_at || company.created_at,
    renewalDate: subscription.end_date || null,
    accountManager: company.approver_name || 'Unassigned',
    adminCount: adminCount.rows[0].n,
    totalEmployees: prod.employee.total,
    activeEmployees: prod.employee.active,
    totalDepartments: prod.department.total,
    currency: company.currency || 'INR',
  }

  const kpis = {
    totalEmployees: prod.kpis.totalEmployees,
    activeEmployees: prod.kpis.activeEmployees,
    totalBookings: prod.kpis.totalBookings,
    totalBookingValue: prod.kpis.totalBookingValue,
    totalExpenseClaims: prod.kpis.totalExpenseClaims,
    totalClaimAmount: prod.kpis.totalClaimAmount,
    totalRevenue: invoiceRevenue,
    outstandingAmount,
    creditLimit,
    availableCredit,
    subscriptionValue,
    avgMonthlySpend: prod.kpis.avgMonthlySpend,
  }

  return {
    summary,
    kpis,
    employee: prod.employee,
    booking: prod.booking,
    travel: prod.travel,
    expense: prod.expense,
    financial,
    department: prod.department,
    policy: prod.policy,
    approval: prod.approval,
    health,
    recentActivity: prod.recentActivity,
    meta: prod.meta,
    billing,
    generatedAt: new Date().toISOString(),
    dataSources: {
      // Operational analytics are live from Product; profile/billing from Admin DB.
      product: ['employee', 'booking', 'travel', 'expense', 'approval', 'financial.wallet', 'recentActivity'],
      admin: ['summary', 'billing', 'financial.revenue', 'kpis.credit', 'kpis.subscription'],
      untracked: ['policy'], // not captured by the Product system yet
    },
    isMock: false,
    productUnavailable,
    productError,
  }
}

module.exports = { companyAnalytics }
