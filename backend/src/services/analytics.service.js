/**
 * Company Analytics (360° view) for the Super Admin dashboard.
 *
 * Real fields (company profile, subscription, wallet/credit, invoice revenue,
 * admin count, onboarding approvals) are sourced from this DB. Operational
 * analytics that live in the separate Travel & Expense portal (employees,
 * bookings, travel, expenses, departments, policy) are MOCKED here with
 * realistic, deterministic values until those APIs are integrated.
 *
 * Integration note: each section below is computed in its own helper. To wire a
 * real source later, replace that helper's body with a query/HTTP call — the
 * response shape (and therefore the whole frontend) stays identical.
 */
const { pool } = require('../config/db')
const { HttpError } = require('../middleware/error')

// ── Deterministic PRNG so a company's numbers stay stable across reloads ──────
function makeRng(seedStr) {
  let h = 2166136261 >>> 0
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return function next() {
    // xorshift32
    h ^= h << 13; h >>>= 0
    h ^= h >> 17
    h ^= h << 5; h >>>= 0
    return h / 4294967295
  }
}

const DEPARTMENTS = ['Engineering', 'Sales', 'Marketing', 'Finance', 'Operations', 'Human Resources', 'Legal', 'Procurement']
const LOCATIONS = ['Mumbai', 'Bengaluru', 'New Delhi', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata']
const DESTINATIONS = ['Mumbai', 'New Delhi', 'Bengaluru', 'Dubai', 'Singapore', 'London', 'New York', 'Hyderabad', 'Chennai', 'Goa']
const ROUTES = ['DEL → BOM', 'BLR → DEL', 'BOM → DXB', 'DEL → SIN', 'BLR → BOM', 'MAA → DEL', 'HYD → BLR', 'BOM → LON']
const EXPENSE_CATEGORIES = ['Airfare', 'Hotel', 'Meals', 'Local Transport', 'Misc', 'Telecom']
const FIRST = ['Aarav', 'Vivaan', 'Aditya', 'Priya', 'Ananya', 'Rohan', 'Ishaan', 'Diya', 'Kabir', 'Meera', 'Arjun', 'Sara', 'Vikram', 'Neha', 'Rahul', 'Pooja']
const LAST = ['Sharma', 'Patel', 'Reddy', 'Nair', 'Iyer', 'Gupta', 'Singh', 'Khan', 'Desai', 'Menon', 'Rao', 'Bose']
const POLICY_VIOLATIONS = ['Fare above cap', 'Out-of-policy hotel', 'Late booking', 'Non-preferred vendor', 'Missing receipt']

const INR = (n) => Math.round(n)

function lastMonths(n) {
  const out = []
  const d = new Date()
  d.setDate(1)
  for (let i = n - 1; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1)
    out.push(m.toLocaleString('en-US', { month: 'short' }) + " '" + String(m.getFullYear()).slice(2))
  }
  return out
}

function buildMock(company, anchors) {
  const rng = makeRng(company.id)
  const ri = (min, max) => Math.floor(min + rng() * (max - min + 1))
  const rf = (min, max) => min + rng() * (max - min)
  const pick = (arr) => arr[Math.floor(rng() * arr.length)]
  const months = lastMonths(12)

  // ── Employees (anchored to licensed users when available) ──────────────────
  const totalEmployees = Math.max(12, anchors.licensedUsers || ri(60, 1800))
  const activeEmployees = Math.round(totalEmployees * rf(0.82, 0.95))
  const inactiveEmployees = totalEmployees - activeEmployees
  const employeesThisMonth = ri(2, Math.max(3, Math.round(totalEmployees * 0.04)))
  const deptCount = ri(5, DEPARTMENTS.length)
  const depts = DEPARTMENTS.slice(0, deptCount)

  const splitInto = (total, keys) => {
    const weights = keys.map(() => rf(0.5, 1.5))
    const sum = weights.reduce((a, b) => a + b, 0)
    return keys.map((k, i) => ({ name: k, value: Math.max(1, Math.round((weights[i] / sum) * total)) }))
  }

  const employeesByDept = splitInto(totalEmployees, depts)
  const employeesByLocation = splitInto(totalEmployees, LOCATIONS.slice(0, ri(4, LOCATIONS.length)))

  const names = []
  for (let i = 0; i < 8; i++) names.push(`${pick(FIRST)} ${pick(LAST)}`)
  const topTravelling = names.slice(0, 5).map((n, i) => ({ name: n, department: pick(depts), trips: ri(8, 40) - i, spend: INR(rf(80000, 600000)) })).sort((a, b) => b.trips - a.trips)
  const mostActive = names.slice(3, 8).map((n) => ({ name: n, department: pick(depts), actions: ri(20, 220) })).sort((a, b) => b.actions - a.actions)

  let growthBase = Math.round(totalEmployees * rf(0.55, 0.7))
  const employeeGrowth = months.map((m) => {
    growthBase = Math.min(totalEmployees, growthBase + ri(0, Math.max(2, Math.round(totalEmployees * 0.05))))
    return { month: m, employees: growthBase }
  })
  employeeGrowth[employeeGrowth.length - 1].employees = totalEmployees

  // ── Bookings ───────────────────────────────────────────────────────────────
  const flight = ri(40, 900)
  const hotel = ri(30, 700)
  const train = ri(10, 300)
  const bus = ri(5, 150)
  const totalBookings = flight + hotel + train + bus
  const ticketed = Math.round(totalBookings * rf(0.6, 0.8))
  const approved = Math.round(totalBookings * rf(0.7, 0.85))
  const pendingBookings = Math.round(totalBookings * rf(0.04, 0.12))
  const rejected = Math.round(totalBookings * rf(0.03, 0.08))
  const cancelled = Math.max(0, totalBookings - approved - pendingBookings - rejected)
  const avgBookingValue = rf(6000, 24000)
  const totalBookingValue = INR(totalBookings * avgBookingValue)

  const bookingMonthly = months.map((m) => ({ month: m, bookings: ri(Math.round(totalBookings / 18), Math.round(totalBookings / 9)) }))
  const bookingValueTrend = bookingMonthly.map((b) => ({ month: b.month, value: INR(b.bookings * avgBookingValue * rf(0.85, 1.15)) }))
  const bookingTypeDist = [
    { name: 'Flight', value: flight }, { name: 'Hotel', value: hotel },
    { name: 'Train', value: train }, { name: 'Bus', value: bus },
  ]
  const bookingStatusDist = [
    { name: 'Approved', value: approved }, { name: 'Pending', value: pendingBookings },
    { name: 'Rejected', value: rejected }, { name: 'Cancelled', value: cancelled },
  ]
  const topBookingDepts = splitInto(totalBookings, depts).map((d) => ({ name: d.name, value: d.value })).sort((a, b) => b.value - a.value).slice(0, 6)
  const topBookingEmployees = names.slice(0, 6).map((n) => ({ name: n, value: ri(10, 80) })).sort((a, b) => b.value - a.value)

  // ── Travel ─────────────────────────────────────────────────────────────────
  const domesticTrips = Math.round(totalBookings * rf(0.6, 0.8))
  const internationalTrips = Math.max(0, totalBookings - domesticTrips - ri(0, 20))
  const businessTrips = Math.round(totalBookings * rf(0.7, 0.95))
  const topDestinations = splitInto(domesticTrips + internationalTrips, DESTINATIONS.slice(0, 8)).sort((a, b) => b.value - a.value)
  const travelFrequency = months.map((m) => ({ month: m, trips: ri(Math.round(totalBookings / 20), Math.round(totalBookings / 10)) }))
  const routeAnalysis = ROUTES.slice(0, 6).map((r) => ({ route: r, trips: ri(5, 60), spend: INR(rf(120000, 900000)) })).sort((a, b) => b.trips - a.trips)

  // ── Expenses ───────────────────────────────────────────────────────────────
  const totalClaims = ri(30, 800)
  const approvedClaims = Math.round(totalClaims * rf(0.6, 0.8))
  const pendingClaims = Math.round(totalClaims * rf(0.08, 0.18))
  const rejectedClaims = Math.max(0, totalClaims - approvedClaims - pendingClaims)
  const avgClaim = rf(3000, 18000)
  const totalClaimAmount = INR(totalClaims * avgClaim)
  const totalApprovedAmount = INR(approvedClaims * avgClaim * rf(0.9, 1.0))
  const reimbursementAmount = INR(totalApprovedAmount * rf(0.7, 0.95))
  const expenseMonthly = months.map((m) => ({ month: m, amount: INR(rf(totalClaimAmount / 18, totalClaimAmount / 9)) }))
  const expenseByCategory = splitInto(totalClaimAmount, EXPENSE_CATEGORIES).sort((a, b) => b.value - a.value)
  const expenseByDept = splitInto(totalClaimAmount, depts).sort((a, b) => b.value - a.value).slice(0, 6)
  const expenseByEmployee = names.slice(0, 6).map((n) => ({ name: n, value: INR(rf(20000, 300000)) })).sort((a, b) => b.value - a.value)

  // ── Financial (subscription revenue is real; fees are mocked) ──────────────
  const subscriptionRevenue = anchors.invoiceRevenue || INR(anchors.subscriptionValue || rf(100000, 1500000))
  const serviceFeeRevenue = INR(totalBookingValue * rf(0.01, 0.03))
  const convenienceFeeRevenue = INR(totalBookings * rf(80, 250))
  const markupRevenue = INR(totalBookingValue * rf(0.01, 0.025))
  const totalRevenue = subscriptionRevenue + serviceFeeRevenue + convenienceFeeRevenue + markupRevenue
  const amountCollected = INR(totalRevenue * rf(0.7, 0.95))
  const outstandingAmount = Math.max(0, totalRevenue - amountCollected)
  const creditLimit = anchors.creditLimit || INR(rf(200000, 3000000))
  const creditUsed = INR(creditLimit * rf(0.2, 0.85))
  const availableCredit = Math.max(0, creditLimit - creditUsed)
  const creditUtilization = creditLimit ? Math.round((creditUsed / creditLimit) * 100) : 0
  const avgMonthlySpend = INR((totalBookingValue + totalClaimAmount) / 12)

  let collected = 0
  const revenueTrend = months.map((m) => {
    const rev = INR(totalRevenue / 12 * rf(0.7, 1.3))
    return { month: m, revenue: rev }
  })
  const collectionTrend = revenueTrend.map((r) => {
    const c = INR(r.revenue * rf(0.6, 0.98)); collected += c
    return { month: r.month, collected: c }
  })
  const outstandingTrend = revenueTrend.map((r, i) => ({ month: r.month, outstanding: Math.max(0, r.revenue - collectionTrend[i].collected) }))
  const revenueBreakdown = [
    { name: 'Subscription', value: subscriptionRevenue },
    { name: 'Service Fee', value: serviceFeeRevenue },
    { name: 'Convenience Fee', value: convenienceFeeRevenue },
    { name: 'Markup', value: markupRevenue },
  ]

  // ── Departments ─────────────────────────────────────────────────────────────
  const deptTravelSpend = splitInto(totalBookingValue, depts).sort((a, b) => b.value - a.value)
  const departmentSpending = depts.map((d) => {
    const e = employeesByDept.find((x) => x.name === d)?.value || 0
    return { name: d, employees: e, bookings: ri(5, 120), expense: INR(rf(50000, 800000)), travelSpend: INR(rf(80000, 1200000)) }
  })

  // ── Policy ──────────────────────────────────────────────────────────────────
  const outOfPolicyBookings = Math.round(totalBookings * rf(0.03, 0.12))
  const policyViolations = outOfPolicyBookings + ri(0, 20)
  const rejectedPolicyRequests = Math.round(policyViolations * rf(0.3, 0.7))
  const compliancePct = Math.max(60, Math.round(100 - (outOfPolicyBookings / Math.max(1, totalBookings)) * 100))
  const complianceTrend = months.map((m) => ({ month: m, compliance: Math.min(100, Math.max(60, compliancePct + ri(-6, 6))) }))
  const violationCategories = POLICY_VIOLATIONS.map((c) => ({ name: c, value: ri(1, Math.max(2, Math.round(policyViolations / 2))) })).sort((a, b) => b.value - a.value)

  // ── Approvals (operational request approvals) ──────────────────────────────
  const apprApproved = Math.round((approved + approvedClaims) * rf(0.8, 1))
  const apprPending = pendingBookings + pendingClaims
  const apprRejected = rejected + rejectedClaims
  const avgApprovalHours = +rf(2, 36).toFixed(1)
  const approvalTrend = months.map((m) => ({ month: m, approved: ri(10, 120), rejected: ri(0, 20) }))
  const approvalStatusDist = [
    { name: 'Approved', value: apprApproved }, { name: 'Pending', value: apprPending }, { name: 'Rejected', value: apprRejected },
  ]

  // ── Health score ────────────────────────────────────────────────────────────
  const factors = [
    { label: 'Platform Usage', score: ri(55, 98) },
    { label: 'Employee Activity', score: Math.round((activeEmployees / totalEmployees) * 100) },
    { label: 'Booking Volume', score: ri(50, 97) },
    { label: 'Revenue Contribution', score: ri(45, 95) },
    { label: 'Payment Timeliness', score: Math.max(40, 100 - Math.round((outstandingAmount / Math.max(1, totalRevenue)) * 100)) },
    { label: 'Policy Compliance', score: compliancePct },
  ]
  const healthScore = Math.round(factors.reduce((a, f) => a + f.score, 0) / factors.length)
  const band = healthScore >= 85 ? 'Excellent' : healthScore >= 70 ? 'Good' : healthScore >= 55 ? 'Average' : 'Needs Attention'

  // ── Recent activity ──────────────────────────────────────────────────────────
  const daysAgo = (d) => { const x = new Date(); x.setDate(x.getDate() - d); return x.toISOString() }
  const recentEmployees = Array.from({ length: 5 }, (_, i) => ({ name: `${pick(FIRST)} ${pick(LAST)}`, department: pick(depts), date: daysAgo(i + 1) }))
  const recentBookings = Array.from({ length: 5 }, (_, i) => ({ type: pick(['Flight', 'Hotel', 'Train', 'Bus']), employee: `${pick(FIRST)} ${pick(LAST)}`, value: INR(rf(4000, 40000)), date: daysAgo(i) }))
  const recentClaims = Array.from({ length: 5 }, (_, i) => ({ category: pick(EXPENSE_CATEGORIES), employee: `${pick(FIRST)} ${pick(LAST)}`, amount: INR(rf(2000, 30000)), status: pick(['Approved', 'Pending', 'Rejected']), date: daysAgo(i) }))
  const recentPolicy = Array.from({ length: 4 }, (_, i) => ({ change: pick(['Updated hotel cap', 'Added approval level', 'Revised per-diem', 'Vendor preference change']), date: daysAgo(i * 2 + 1) }))

  return {
    kpis: {
      totalEmployees, activeEmployees, totalBookings, totalBookingValue,
      totalExpenseClaims: totalClaims, totalClaimAmount, totalRevenue, outstandingAmount,
      creditLimit, availableCredit, subscriptionValue: anchors.subscriptionValue || subscriptionRevenue, avgMonthlySpend,
    },
    employee: {
      total: totalEmployees, active: activeEmployees, inactive: inactiveEmployees, addedThisMonth: employeesThisMonth,
      byDepartment: employeesByDept, byLocation: employeesByLocation,
      topTravelling, mostActive, growthTrend: employeeGrowth,
    },
    booking: {
      flight, hotel, train, bus, approved, rejected, cancelled, pending: pendingBookings, ticketed,
      monthlyTrend: bookingMonthly, typeDistribution: bookingTypeDist, valueTrend: bookingValueTrend,
      statusDistribution: bookingStatusDist, topDepartments: topBookingDepts, topEmployees: topBookingEmployees,
    },
    travel: {
      mostTravelledRoute: routeAnalysis[0]?.route, mostTravelledDestination: topDestinations[0]?.name,
      domesticTrips, internationalTrips, businessTrips, avgTripCost: INR(avgBookingValue),
      topDestinations, frequencyTrend: travelFrequency, routes: routeAnalysis,
    },
    expense: {
      totalClaims, approvedClaims, rejectedClaims, pendingClaims,
      totalClaimAmount, totalApprovedAmount, reimbursementAmount,
      monthlyTrend: expenseMonthly, categoryBreakdown: expenseByCategory,
      departmentAnalysis: expenseByDept, employeeAnalysis: expenseByEmployee,
    },
    financial: {
      subscriptionRevenue, serviceFeeRevenue, convenienceFeeRevenue, markupRevenue,
      totalRevenue, outstandingAmount, amountCollected, creditUtilization,
      revenueTrend, revenueBreakdown, collectionTrend, outstandingTrend,
    },
    department: {
      total: depts.length, byEmployees: employeesByDept, byBookings: topBookingDepts,
      byExpenses: expenseByDept, byTravelSpend: deptTravelSpend, table: departmentSpending,
    },
    policy: {
      violations: policyViolations, outOfPolicyBookings, compliancePct: compliancePct, rejectedPolicyRequests,
      complianceTrend, violationCategories,
    },
    approval: {
      pending: apprPending, approved: apprApproved, rejected: apprRejected, avgApprovalHours,
      trend: approvalTrend, statusDistribution: approvalStatusDist,
    },
    health: { score: healthScore, band, factors },
    recentActivity: {
      employees: recentEmployees, bookings: recentBookings, claims: recentClaims, policy: recentPolicy,
    },
    meta: { departments: depts, locations: LOCATIONS, expenseCategories: EXPENSE_CATEGORIES },
  }
}

/** Build the full 360° analytics payload for one company. */
async function companyAnalytics(companyId) {
  const { rows } = await pool.query(
    `SELECT c.*, sa.name AS approver_name
       FROM companies c
       LEFT JOIN super_admins sa ON sa.id = c.approved_by
      WHERE c.id = $1`,
    [companyId]
  )
  if (!rows.length) throw new HttpError(404, 'Company not found')
  const company = rows[0]

  const [adminCount, sub, wallet, invoices] = await Promise.all([
    pool.query('SELECT COUNT(*)::int AS n FROM company_admins WHERE company_id = $1', [companyId]),
    pool.query(`SELECT * FROM company_subscriptions WHERE company_id = $1 ORDER BY created_at DESC LIMIT 1`, [companyId]),
    pool.query('SELECT * FROM company_wallets WHERE company_id = $1', [companyId]),
    pool.query(
      `SELECT COUNT(*)::int AS count,
              COALESCE(SUM(total_amount),0)::numeric AS revenue,
              COUNT(*) FILTER (WHERE status <> 'paid')::int AS outstanding_invoices,
              MAX(issued_at) AS last_issued
         FROM company_invoices WHERE company_id = $1`,
      [companyId]
    ),
  ])

  const subscription = sub.rows[0] || {}
  const walletRow = wallet.rows[0] || {}
  const inv = invoices.rows[0] || {}

  const anchors = {
    licensedUsers: subscription.licensed_users ? Number(subscription.licensed_users) : null,
    subscriptionValue: subscription.total_amount ? Number(subscription.total_amount) : null,
    invoiceRevenue: Number(inv.revenue) || 0,
    creditLimit: walletRow.credit_limit ? Number(walletRow.credit_limit) : null,
  }

  const mock = buildMock(company, anchors)

  // Onboarding renewal date = subscription end date.
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
    totalEmployees: mock.kpis.totalEmployees,
    activeEmployees: mock.kpis.activeEmployees,
    totalDepartments: mock.department.total,
    currency: company.currency || 'INR',
  }

  const billing = {
    subscriptionFee: anchors.subscriptionValue || 0,
    lastPaymentDate: inv.last_issued || null,
    nextBillingDate: subscription.end_date || null,
    paymentStatus: mock.financial.outstandingAmount > 0 ? 'Partially Paid' : 'Paid',
    overdueAmount: mock.financial.outstandingAmount,
    outstandingInvoices: Number(inv.outstanding_invoices) || 0,
    billingTrend: mock.financial.revenueTrend.map((r) => ({ month: r.month, billed: r.revenue })),
    collectionTrend: mock.financial.collectionTrend,
  }

  return {
    summary,
    ...mock,
    billing,
    generatedAt: new Date().toISOString(),
    // Flags so the UI can label which sections are real vs. awaiting integration.
    dataSources: {
      real: ['summary', 'financial.subscription', 'billing', 'kpis.credit', 'kpis.subscription'],
      mock: ['employee', 'booking', 'travel', 'expense', 'department', 'policy', 'approval', 'financial.fees', 'health', 'recentActivity'],
    },
    isMock: true,
  }
}

module.exports = { companyAnalytics }
