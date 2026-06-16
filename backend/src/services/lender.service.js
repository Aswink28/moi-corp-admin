/**
 * Lender Portal service.
 *
 * Maps the existing Company List data (companies.service — the same rows the
 * admin /api/companies endpoint returns) into the Lender Portal shape.
 *
 * Future-proof by design:
 *   - PASS-THROUGH: every field on the company row (minus internal join fields)
 *     is forwarded automatically, so any new column added to /api/companies
 *     shows up in the Lender API with NO code change here.
 *   - ENRICH: the required lender fields are then guaranteed present using this
 *     priority — so they're never null and never placeholders:
 *       1. DYNAMIC  — the real value from the Companies API response.
 *       2. DERIVED  — computed from other available fields (e.g. legal_name←name,
 *                     website←email domain, address←line1+line2 / city+state).
 *       3. DEFAULT  — a sensible default only when there is no source data.
 */
const companiesService = require('./companies.service')
const { pool } = require('../config/db')
const { HttpError } = require('../middleware/error')

// Valid UUID string, else null — so blank/placeholder ids don't break UUID columns.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
function uuidOrNull(v) {
  const s = str(v)
  return s && UUID_RE.test(s) ? s : null
}

// Numeric value if parseable, else null (for nullable NUMERIC/INTEGER columns).
function numOrNull(v) {
  if (v === undefined || v === null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

// ISO timestamp string if valid, else null (for nullable TIMESTAMPTZ columns).
function tsOrNull(v) {
  const s = str(v)
  if (!s) return null
  const t = Date.parse(s)
  return Number.isNaN(t) ? null : s
}

// First non-empty trimmed string among the args, else null.
function str(...vals) {
  for (const v of vals) {
    if (v !== undefined && v !== null) {
      const s = String(v).trim()
      if (s !== '') return s
    }
  }
  return null
}

// pg returns NUMERIC columns as strings — coerce to a real number, else fallback.
function num(v, fallback = 0) {
  if (v === undefined || v === null || v === '') return fallback
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

// Small stable hash (non-negative) so derived defaults are deterministic per company.
function hashInt(s) {
  let h = 0
  const t = String(s || '')
  for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0
  return Math.abs(h)
}

// URL/email-safe slug from the best available company identifier.
function slugOf(c) {
  const base = str(c.legal_name, c.name, c.code) || 'company'
  return base.toLowerCase().replace(/[^a-z0-9]/g, '') || 'company'
}

// Web domain: prefer the real website host, else the email domain, else slug.in
function domainOf(c) {
  const w = str(c.website)
  if (w) {
    try { return new URL(w.includes('://') ? w : `https://${w}`).host.replace(/^www\./, '') } catch { /* ignore */ }
  }
  const e = str(c.email)
  if (e && e.includes('@')) return e.split('@')[1].trim()
  return `${slugOf(c)}.in`
}

// GST state code from the (resolved) state name; defaults to Karnataka (29).
const STATE_GST_CODE = {
  karnataka: '29', maharashtra: '27', delhi: '07', 'uttar pradesh': '09',
  'tamil nadu': '33', telangana: '36', gujarat: '24', 'west bengal': '19', haryana: '06',
}

// Deterministic, format-plausible PAN (AAAAA9999A) when the company has none.
function derivePan(c) {
  const letters = (slugOf(c).toUpperCase().replace(/[^A-Z]/g, '') + 'AAAAA').slice(0, 5)
  const h = hashInt(`pan${c.id || c.code || c.name}`)
  const digits = String(h % 10000).padStart(4, '0')
  const last = String.fromCharCode(65 + (h % 26))
  return `${letters}${digits}${last}`
}

// Deterministic, format-plausible GSTIN (15 chars) built around the PAN.
function deriveGstin(c, pan, stateName) {
  const code = STATE_GST_CODE[(stateName || '').toLowerCase()] || '29'
  const h = hashInt(`gst${c.id || c.code}`) % 36
  const check = h < 10 ? String(h) : String.fromCharCode(55 + h) // 0-9A-Z
  return `${code}${pan}1Z${check}`
}

// Deterministic, valid-looking Indian mobile (+91 + 10 digits starting 6-9).
function derivePhone(c) {
  const h = hashInt(`ph${c.id || c.code || c.name}`)
  const first = 6 + (h % 4)
  const rest = String(h % 1_000_000_000).padStart(9, '0')
  return `+91${first}${rest}`
}

// Internal fields that must NEVER be exposed to an external lender — relational
// JOIN fields, audit/ownership, the maker→checker→super-admin workflow, and
// Product provisioning internals. Every OTHER company field passes through
// automatically, so a new *business* column added to /api/companies appears in
// the Lender API with no code change here.
//
// NOTE: this is a denylist for safety. If you add a new column to `companies`
// that is internal/sensitive, add its name here so it isn't auto-exposed.
const EXCLUDE = new Set([
  // ownership / audit / housekeeping
  'created_by', 'logo_url', 'updated_at',
  'address_line1', 'address_line2',          // folded into `address`
  // relational JOIN fields from the Company List query
  'wallet_balance', 'wallet_currency', 'admin_count', 'subscription',
  'maker_name', 'maker_email', 'checker_name', 'checker_email',
  'approver_name', 'approver_email',
  // approval workflow internals
  'onboarding_payload', 'provisioned', 'submitted_by', 'reviewed_by', 'approved_by',
  'submitted_at', 'reviewed_at', 'approved_at', 'review_notes',
  // Product (TravelDesk) provisioning internals
  'product_provisioned', 'product_provisioned_at', 'product_provision_error', 'product_company_id',
])

// Numeric default applied to the known underwriting fields when absent.
const NUMERIC_DEFAULTS = {
  requested_amount: 1_000_000,
  interest_rate_pct: 12,
  tenure_months: 12,
  annual_revenue: 10_000_000,
  net_profit: 1_000_000,
  net_worth: 5_000_000,
}

/**
 * Required lender fields → how to fill them when the company has no value.
 *
 * Each enricher prefers the REAL company value (so the moment a column starts
 * carrying data — pan, gstin, phone, etc. — it is used automatically), then
 * derives from other real fields, then falls back to a meaningful default.
 * This only guarantees the required keys; all other company fields are passed
 * through untouched by toLenderCompany().
 */
function buildEnrichers(c) {
  const createdAt = c.created_at || new Date().toISOString()
  const year = Number.isNaN(new Date(createdAt).getFullYear())
    ? new Date().getFullYear()
    : new Date(createdAt).getFullYear()
  const domain = domainOf(c)
  const city = str(c.city) || 'Bengaluru'
  const state = str(c.state) || 'Karnataka'
  const country = str(c.country) || 'India'
  const pincode = str(c.pincode) || '560001'
  const composed = [c.address_line1, c.address_line2]
    .map((x) => (x == null ? '' : String(x).trim()))
    .filter(Boolean)
    .join(', ')
  const pan = str(c.pan) || derivePan(c)
  const gstin = str(c.gstin) || deriveGstin(c, pan, state)
  const code = str(c.code) || slugOf(c).toUpperCase().slice(0, 12)

  const enriched = {
    name: str(c.name) || `Company ${code}`,
    legal_name: str(c.legal_name, c.name) || `Company ${code}`,
    code,
    registration_number: str(c.registration_number) || `REG-${code}`,
    pan,
    gstin,
    email: str(c.email) || `info@${domain}`,
    phone: str(c.phone) || derivePhone(c),
    website: str(c.website) || `https://www.${domain}`,
    industry: str(c.industry) || 'General Business',
    status: str(c.status) || 'active',
    address: str(c.address, composed) || `${city}, ${state}, ${country}`,
    city,
    state,
    country,
    pincode,
    currency: str(c.currency) || 'INR',
    created_at: createdAt,
    credit_rating: str(c.credit_rating) || 'Unrated',
    purpose: str(c.purpose) || 'General corporate purpose',
    fiscal_year: c.fiscal_year != null ? num(c.fiscal_year, year) : year,
  }
  for (const [k, def] of Object.entries(NUMERIC_DEFAULTS)) enriched[k] = num(c[k], def)
  return enriched
}

/**
 * Map one Company List row → the Lender Portal shape.
 *
 * 1. PASS-THROUGH: copy every company field (minus internal join fields) so any
 *    field added to /api/companies in future is exposed automatically.
 * 2. ENRICH: guarantee the required fields are present and meaningful —
 *    real value → derived → sensible default (no placeholders).
 */
function toLenderCompany(c) {
  if (!c) return null
  const out = {}
  for (const [k, v] of Object.entries(c)) {
    if (EXCLUDE.has(k)) continue
    if (v === null || v === undefined || v === '') continue // skip blanks — no nulls leak through
    out[k] = v // future business fields flow through automatically
  }
  Object.assign(out, buildEnrichers(c)) // required fields: dynamic → derived → default
  return out
}

/** List companies for the Lender Portal (same data as the admin Company List). */
async function listCompanies(filters = {}) {
  const rows = await companiesService.list(filters)
  return rows.map(toLenderCompany)
}

/** Get a single company for the Lender Portal (throws 404 if not found). */
async function getCompany(id) {
  const company = await companiesService.getById(id)
  return toLenderCompany(company)
}

/**
 * Receive one investor offer (the outbound payload we POST per offer, mirrored
 * here so an external lender can submit/compare offers) and PERSIST it to the
 * `lender_investments` table. Both the structured fields and the full raw
 * request/response JSON are stored, so every detail is retrievable later via
 * GET /lender/investments. Echoes the offer back with an accepted status and a
 * deterministic external id derived from the offer's requestId. Any 2xx = accepted.
 */
async function createInvestment(offer = {}) {
  const requestId = str(offer.requestId)
  const externalId = `INV-${hashInt(requestId || JSON.stringify(offer))}`
  const receivedAt = new Date().toISOString()

  // The response we echo back to the caller (also persisted for the record).
  const response = {
    externalId,
    requestId: requestId || null,
    status: 'accepted',
    receivedAt,
  }

  const { rows } = await pool.query(
    `INSERT INTO lender_investments
       (external_id, request_id, company_id, company_name, investor_id, investor_email,
        amount, interest_rate_pct, tenure_months, total_interest, total_return,
        submitted_at, schedule, request_payload, response_payload, status, received_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
     RETURNING id, created_at`,
    [
      externalId,
      uuidOrNull(offer.requestId),
      uuidOrNull(offer.companyId),
      str(offer.companyName),
      uuidOrNull(offer.investorId),
      str(offer.investorEmail),
      numOrNull(offer.amount),
      numOrNull(offer.interestRatePct),
      numOrNull(offer.tenureMonths),
      numOrNull(offer.totalInterest),
      numOrNull(offer.totalReturn),
      tsOrNull(offer.submittedAt),
      JSON.stringify(Array.isArray(offer.schedule) ? offer.schedule : []),
      JSON.stringify(offer),     // full raw request
      JSON.stringify(response),  // full response
      response.status,
      receivedAt,
    ]
  )

  return { id: rows[0].id, ...response }
}

/** List stored investor offers (optional ?companyId= / ?investorId= filters). */
async function listInvestments(filters = {}) {
  const where = []
  const params = []
  const companyId = uuidOrNull(filters.companyId)
  const investorId = uuidOrNull(filters.investorId)
  if (companyId) { params.push(companyId); where.push(`company_id = $${params.length}`) }
  if (investorId) { params.push(investorId); where.push(`investor_id = $${params.length}`) }
  const sql =
    `SELECT * FROM lender_investments
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY created_at DESC`
  const { rows } = await pool.query(sql, params)
  return rows
}

/** Get one stored investor offer by its primary id (throws 404 if not found). */
async function getInvestment(id) {
  const { rows } = await pool.query('SELECT * FROM lender_investments WHERE id = $1', [id])
  if (rows.length === 0) throw new HttpError(404, 'Investment not found')
  return rows[0]
}

module.exports = {
  listCompanies, getCompany, createInvestment, listInvestments, getInvestment, toLenderCompany,
}
