const { pool, withTransaction } = require('../config/db')
const { HttpError } = require('../middleware/error')
const password = require('../utils/password')
const validators = require('../utils/validators')
const codegen = require('../utils/codegen')
const invoiceService = require('./invoice.service')
const { recordHistory } = require('../utils/approvalHistory')

// ── Reference data (mirrors §D.3 of the onboarding contract) ────────────────
const PLAN_TIERS = ['trial', 'basic', 'professional', 'enterprise']
const BILLING_CYCLES = ['monthly', 'quarterly', 'half_yearly', 'annual']
const APPROVAL_TYPES = ['none', 'single', 'multi']
const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD']
const INDUSTRIES = ['IT Services', 'Consulting', 'Manufacturing', 'Finance', 'Healthcare', 'Other']
const TIMEZONES = ['Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'America/New_York', 'Europe/London', 'UTC']
const COUNTRIES = ['India', 'United States', 'United Kingdom', 'Singapore', 'United Arab Emirates']

// Canonical module order + labels (§D.3 / §E.3).
const MODULES = [
  { key: 'flight', label: 'Flight' },
  { key: 'hotel', label: 'Hotel' },
  { key: 'train', label: 'Train' },
  { key: 'bus', label: 'Bus' },
  { key: 'cab', label: 'Cab' },
  { key: 'expense', label: 'Expense' },
  { key: 'wallet', label: 'Wallet' },
  { key: 'approval', label: 'Approval' },
  { key: 'reports', label: 'Reports' },
]
const MODULE_KEYS = MODULES.map((m) => m.key)

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Map the new billing_cycle to the legacy company_subscriptions.plan value (§A.3). */
function planFromBillingCycle(cycle) {
  switch (cycle) {
    case 'monthly':
      return 'monthly'
    case 'quarterly':
      return 'quarterly'
    case 'half_yearly':
      return 'quarterly'
    case 'annual':
      return 'yearly'
    default:
      return 'trial'
  }
}

/** Round to 2 decimals, returned as a Number. */
function money(n) {
  return Math.round((Number(n) || 0) * 100) / 100
}

/** Compute base/discount/tax/total amounts per the §E.3 formula. */
function computeAmounts(subscription = {}) {
  const base = money(subscription.subscription_amount)
  const discountPct = Number(subscription.discount_percentage) || 0
  const taxPct = Number(subscription.tax_percentage) || 0
  const discount = money(base * (discountPct / 100))
  const taxable = money(base - discount)
  const tax = money(taxable * (taxPct / 100))
  const total = money(taxable + tax)
  return { base_amount: base, discount_amount: discount, tax_amount: tax, total_amount: total }
}

/** Normalise the modules array into the 9 canonical keys, preserving enabled/price. */
function normalizeModules(modules) {
  const byKey = new Map()
  for (const m of Array.isArray(modules) ? modules : []) {
    if (m && m.module_key) byKey.set(m.module_key, m)
  }
  return MODULE_KEYS.map((key) => {
    const m = byKey.get(key) || {}
    return { module_key: key, enabled: !!m.enabled, price: money(m.price) }
  })
}

// ── Code generation / availability ───────────────────────────────────────────

async function generateCode(name) {
  if (!name || !String(name).trim()) throw new HttpError(400, 'Company name is required')
  const code = codegen.companyCodeFromName(name)
  const { rows } = await pool.query('SELECT 1 FROM companies WHERE code = $1', [code])
  return { code, available: rows.length === 0 }
}

async function checkCode(code) {
  if (!code || !String(code).trim()) throw new HttpError(400, 'Company code is required')
  const normalized = String(code).trim().toUpperCase()
  const { rows } = await pool.query('SELECT 1 FROM companies WHERE code = $1', [normalized])
  return { code: normalized, available: rows.length === 0 }
}

/** Generate a temp password (§D.1.1 #4). Returns { password }. */
function generatePassword(length) {
  const len = Number(length) > 0 ? Number(length) : 12
  return { password: password.randomPassword(len) }
}

// ── Wizard reference data ─────────────────────────────────────────────────────

function meta() {
  return {
    plan_tiers: [...PLAN_TIERS],
    billing_cycles: [...BILLING_CYCLES],
    modules: MODULES.map((m) => ({ ...m })),
    approval_types: [...APPROVAL_TYPES],
    industries: [...INDUSTRIES],
    currencies: [...CURRENCIES],
    timezones: [...TIMEZONES],
    countries: [...COUNTRIES],
  }
}

// ── Draft CRUD (onboarding_drafts) ────────────────────────────────────────────

async function createDraft(body = {}, actorId) {
  const { rows } = await pool.query(
    `INSERT INTO onboarding_drafts (payload, current_step, status, created_by)
     VALUES ($1, $2, 'draft', $3)
     RETURNING *`,
    [body.payload || {}, Number(body.current_step) || 0, actorId]
  )
  return rows[0]
}

async function listDrafts(actorId) {
  const { rows } = await pool.query(
    `SELECT * FROM onboarding_drafts WHERE created_by = $1 ORDER BY created_at DESC`,
    [actorId]
  )
  return rows
}

async function getDraft(id, actorId) {
  const { rows } = await pool.query(
    `SELECT * FROM onboarding_drafts WHERE id = $1 AND created_by = $2`,
    [id, actorId]
  )
  if (!rows.length) throw new HttpError(404, 'Draft not found')
  return rows[0]
}

async function saveDraft(id, body = {}, actorId) {
  await getDraft(id, actorId) // 404 if missing / not owned
  const set = []
  const params = []
  if (body.payload !== undefined) {
    params.push(body.payload)
    set.push(`payload = $${params.length}`)
  }
  if (body.current_step !== undefined) {
    params.push(Number(body.current_step) || 0)
    set.push(`current_step = $${params.length}`)
  }
  if (body.status !== undefined) {
    if (!['draft', 'submitted'].includes(body.status)) throw new HttpError(400, 'Invalid draft status')
    params.push(body.status)
    set.push(`status = $${params.length}`)
  }
  if (!set.length) return getDraft(id, actorId)
  params.push(id, actorId)
  const { rows } = await pool.query(
    `UPDATE onboarding_drafts SET ${set.join(', ')}, updated_at = now()
      WHERE id = $${params.length - 1} AND created_by = $${params.length}
      RETURNING *`,
    params
  )
  return rows[0]
}

async function deleteDraft(id, actorId) {
  const { rowCount } = await pool.query(
    `DELETE FROM onboarding_drafts WHERE id = $1 AND created_by = $2`,
    [id, actorId]
  )
  if (!rowCount) throw new HttpError(404, 'Draft not found')
  return { deleted: true }
}

// ── Maker: submit a company onboarding request for approval ───────────────────

/**
 * Validate the wizard payload (§C) and create a LIGHTWEIGHT company record that
 * stores the full payload for later provisioning. No admin account / wallet /
 * invoice is created yet — that happens when the Super Admin activates.
 *
 * @returns {object} the created company row (status 'submitted')
 */
async function submitCompany(payload, user) {
  // 1. Shape + format validation (throws HttpError(400) on first failed rule).
  validators.assertOnboardingPayload(payload)

  const company = payload.company || {}
  const address = payload.address || {}
  const admin = payload.admin || {}
  const subscription = payload.subscription || {}
  const draftId = payload.draftId || payload.draft_id || null

  const code = String(company.code || codegen.companyCodeFromName(company.name)).trim().toUpperCase()
  const adminEmail = String(admin.email || '').trim().toLowerCase()
  const adminUsername = String(admin.username || '').trim()

  // 2. Uniqueness pre-checks for precise 409 messages.
  const codeExists = await pool.query('SELECT 1 FROM companies WHERE code = $1', [code])
  if (codeExists.rows.length) throw new HttpError(409, 'Company code already exists')
  const emailExists = await pool.query('SELECT 1 FROM company_admins WHERE LOWER(email) = $1', [adminEmail])
  if (emailExists.rows.length) throw new HttpError(409, 'An admin with this email already exists')
  const usernameExists = await pool.query('SELECT 1 FROM company_admins WHERE username = $1', [adminUsername])
  if (usernameExists.rows.length) throw new HttpError(409, 'This username is already taken')

  const currency = company.currency || subscription.currency || 'INR'

  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO companies
         (name, code, legal_name, registration_number, gstin, pan, industry, website,
          email, phone, description, address, address_line1, address_line2, city, state,
          pincode, country, timezone, currency, logo_url, status, onboarding_payload,
          submitted_by, submitted_at, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,
               'submitted',$22,$23, now(),$23)
       RETURNING *`,
      [
        company.name,
        code,
        company.legal_name || null,
        company.registration_number || null,
        company.gstin ? String(company.gstin).trim().toUpperCase() : null,
        company.pan ? String(company.pan).trim().toUpperCase() : null,
        company.industry || null,
        company.website || null,
        company.email ? String(company.email).trim() : null,
        company.phone || null,
        company.description || null,
        null,
        address.address_line1 || null,
        address.address_line2 || null,
        address.city || null,
        address.state || null,
        address.pincode || null,
        address.country || 'India',
        company.timezone || 'Asia/Kolkata',
        currency,
        (payload.branding && payload.branding.logo_url) || null,
        JSON.stringify(payload),
        user.id,
      ]
    )
    const companyRow = rows[0]

    if (draftId) {
      await client.query(
        `UPDATE onboarding_drafts SET status = 'submitted', company_id = $1, updated_at = now()
          WHERE id = $2 AND created_by = $3`,
        [companyRow.id, draftId, user.id]
      )
    }

    await recordHistory(client, {
      companyId: companyRow.id,
      action: 'submit',
      fromStatus: 'draft',
      toStatus: 'submitted',
      actor: user,
      notes: 'Onboarding request submitted for review',
    })

    return companyRow
  })
}

/**
 * Maker re-submits a record that the Checker returned for changes. Updates the
 * stored payload + profile fields and moves it back to 'submitted'.
 */
async function resubmitCompany(companyId, payload, user) {
  validators.assertOnboardingPayload(payload)
  const { rows: existing } = await pool.query(
    'SELECT id, status, submitted_by, created_by FROM companies WHERE id = $1',
    [companyId]
  )
  if (!existing.length) throw new HttpError(404, 'Company not found')
  const cur = existing[0]
  if (cur.status !== 'changes_requested') {
    throw new HttpError(409, `Only records awaiting changes can be resubmitted (current: "${cur.status}").`)
  }
  const company = payload.company || {}
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `UPDATE companies
          SET name = $1, legal_name = $2, industry = $3, email = $4,
              onboarding_payload = $5, status = 'submitted', updated_at = now()
        WHERE id = $6
        RETURNING *`,
      [
        company.name,
        company.legal_name || null,
        company.industry || null,
        company.email ? String(company.email).trim() : null,
        JSON.stringify(payload),
        companyId,
      ]
    )
    await recordHistory(client, {
      companyId,
      action: 'resubmit',
      fromStatus: 'changes_requested',
      toStatus: 'submitted',
      actor: user,
      notes: 'Resubmitted after requested changes',
    })
    return rows[0]
  })
}

// ── Super Admin: activate (provision everything) ──────────────────────────────

/**
 * Insert all child records (admin, subscription, wallet, settings, modules,
 * approval, billing, branding, invoice) for an already-existing company row.
 * Returns the created rows plus the one-time temp password.
 */
async function provisionChildren(client, companyRow, payload, actorId) {
  const companyId = companyRow.id
  const contact = payload.contact || {}
  const admin = payload.admin || {}
  const subscription = payload.subscription || {}
  const billing = payload.billing || {}
  const wallet = payload.wallet || {}
  const approval = payload.approval || {}
  const branding = payload.branding || {}
  const modules = normalizeModules(payload.modules)

  const adminEmail = String(admin.email || '').trim().toLowerCase()
  const adminUsername = String(admin.username || '').trim()

  const tempPassword =
    admin.temp_password && String(admin.temp_password).length >= 8
      ? String(admin.temp_password)
      : password.randomPassword(12)
  const passwordHash = await password.hash(tempPassword)

  const currency = companyRow.currency || subscription.currency || 'INR'
  const amounts = computeAmounts(subscription)
  const billingCycle = subscription.billing_cycle || null
  const legacyPlan = planFromBillingCycle(billingCycle)
  const planTier = subscription.plan_tier || null
  const licensedUsers = Number(subscription.licensed_users) || null
  const taxPct = subscription.tax_percentage == null ? null : Number(subscription.tax_percentage)
  const discountPct = subscription.discount_percentage == null ? null : Number(subscription.discount_percentage)
  const startDate = subscription.contract_start_date || new Date().toISOString().slice(0, 10)
  const endDate = subscription.contract_end_date || null

  // ── company_contacts ──────────────────────────────────────────────────────
  let contactRow = null
  if (contact.contact_name || contact.email || contact.mobile) {
    const { rows } = await client.query(
      `INSERT INTO company_contacts
         (company_id, contact_name, designation, email, mobile, alternate_phone, department, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        companyId,
        contact.contact_name || null,
        contact.designation || null,
        contact.email ? String(contact.email).trim() : null,
        contact.mobile || null,
        contact.alternate_phone || null,
        contact.department || null,
        actorId,
      ]
    )
    contactRow = rows[0]
  }

  // ── company_admins ────────────────────────────────────────────────────────
  const { rows: adminRows } = await client.query(
    `INSERT INTO company_admins
       (company_id, name, email, password_hash, phone, employee_id, username, role,
        force_password_reset, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING id, company_id, name, email, username, role, phone, employee_id,
               force_password_reset, is_active, created_at`,
    [
      companyId,
      admin.name,
      adminEmail,
      passwordHash,
      admin.phone || null,
      admin.employee_id || null,
      adminUsername,
      admin.role || 'company_admin',
      admin.force_password_reset === false ? false : true,
      actorId,
    ]
  )
  const adminRow = adminRows[0]

  // ── company_subscriptions ─────────────────────────────────────────────────
  const { rows: subRows } = await client.query(
    `INSERT INTO company_subscriptions
       (company_id, plan, status, amount, currency, start_date, end_date,
        plan_tier, billing_cycle, licensed_users, base_amount, tax_percentage,
        discount_percentage, tax_amount, total_amount, auto_renewal, created_by)
     VALUES ($1,$2,'active',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
    [
      companyId, legacyPlan, amounts.total_amount, currency, startDate, endDate,
      planTier, billingCycle, licensedUsers, amounts.base_amount, taxPct,
      discountPct, amounts.tax_amount, amounts.total_amount, !!subscription.auto_renewal, actorId,
    ]
  )
  const subscriptionRow = subRows[0]

  // ── company_wallets ───────────────────────────────────────────────────────
  const initialBalance = money(wallet.initial_balance)
  const { rows: walletRows } = await client.query(
    `INSERT INTO company_wallets
       (company_id, balance, currency, wallet_enabled, credit_limit,
        low_balance_threshold, auto_recharge_enabled)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [
      companyId, initialBalance, currency,
      wallet.wallet_enabled === false ? false : true,
      money(wallet.credit_limit), money(wallet.low_balance_threshold), !!wallet.auto_recharge_enabled,
    ]
  )
  const walletRow = walletRows[0]

  if (initialBalance > 0) {
    await client.query(
      `INSERT INTO company_wallet_transactions
         (company_id, wallet_id, type, amount, balance_after, description, performed_by)
       VALUES ($1,$2,'allocate',$3,$4,$5,$6)`,
      [companyId, walletRow.id, initialBalance, initialBalance, 'Initial wallet allocation (onboarding)', actorId]
    )
  }

  // ── company_settings ──────────────────────────────────────────────────────
  const moduleEnabled = (key) => modules.find((m) => m.module_key === key)?.enabled || false
  const { rows: settingsRows } = await client.query(
    `INSERT INTO company_settings
       (company_id, flight_enabled, hotel_enabled, train_enabled, bus_enabled,
        cab_enabled, expense_enabled, wallet_enabled, approval_enabled, reports_enabled, updated_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [
      companyId,
      moduleEnabled('flight'), moduleEnabled('hotel'), moduleEnabled('train'), moduleEnabled('bus'),
      moduleEnabled('cab'), moduleEnabled('expense'), moduleEnabled('wallet'),
      !!approval.approval_required, moduleEnabled('reports'), actorId,
    ]
  )
  const settingsRow = settingsRows[0]

  // ── company_modules ───────────────────────────────────────────────────────
  const moduleRows = []
  for (const m of modules) {
    const { rows } = await client.query(
      `INSERT INTO company_modules (company_id, module_key, enabled, price, created_by)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [companyId, m.module_key, m.enabled, m.price, actorId]
    )
    moduleRows.push(rows[0])
  }

  // ── company_approval_workflow ─────────────────────────────────────────────
  const { rows: approvalRows } = await client.query(
    `INSERT INTO company_approval_workflow
       (company_id, approval_required, approval_type, levels, created_by)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [
      companyId, !!approval.approval_required, approval.approval_type || 'none',
      JSON.stringify(Array.isArray(approval.levels) ? approval.levels : []), actorId,
    ]
  )
  const approvalRow = approvalRows[0]

  // ── company_billing_info ──────────────────────────────────────────────────
  const { rows: billingRows } = await client.query(
    `INSERT INTO company_billing_info
       (company_id, billing_contact_name, billing_email, billing_mobile, billing_address,
        gstin, pan, po_number, vendor_code, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [
      companyId,
      billing.billing_contact_name || null,
      billing.billing_email ? String(billing.billing_email).trim() : null,
      billing.billing_mobile || null,
      billing.billing_address || null,
      billing.gstin ? String(billing.gstin).trim().toUpperCase() : null,
      billing.pan ? String(billing.pan).trim().toUpperCase() : null,
      billing.po_number || null,
      billing.vendor_code || null,
      actorId,
    ]
  )
  const billingRow = billingRows[0]

  // ── company_branding ──────────────────────────────────────────────────────
  const { rows: brandingRows } = await client.query(
    `INSERT INTO company_branding
       (company_id, primary_color, secondary_color, email_domain, logo_url, created_by)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [
      companyId, branding.primary_color || null, branding.secondary_color || null,
      branding.email_domain || null, branding.logo_url || null, actorId,
    ]
  )
  const brandingRow = brandingRows[0]

  // ── company_invoices ──────────────────────────────────────────────────────
  const invoiceRecord = invoiceService.buildInvoiceRecord({ subscription: subscriptionRow, company: companyRow })
  const { rows: invoiceRows } = await client.query(
    `INSERT INTO company_invoices
       (company_id, invoice_number, subscription_id, base_amount, tax_amount,
        discount_amount, total_amount, currency, status, due_date, line_items,
        issued_at, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,COALESCE($9,'issued'),$10,$11,COALESCE($12, now()),$13)
     RETURNING *`,
    [
      companyId, invoiceRecord.invoice_number, subscriptionRow.id,
      money(invoiceRecord.base_amount), money(invoiceRecord.tax_amount),
      money(invoiceRecord.discount_amount), money(invoiceRecord.total_amount),
      invoiceRecord.currency || currency, invoiceRecord.status || null,
      invoiceRecord.due_date || null, JSON.stringify(invoiceRecord.line_items || []),
      invoiceRecord.issued_at || null, actorId,
    ]
  )
  const invoiceRow = invoiceRows[0]

  return {
    contact: contactRow,
    admin: adminRow,
    subscription: subscriptionRow,
    wallet: walletRow,
    settings: settingsRow,
    modules: moduleRows,
    approval: approvalRow,
    billing: billingRow,
    branding: brandingRow,
    invoice: invoiceRow,
    tempPassword,
  }
}

/**
 * Super Admin final approval + activation. Reads the payload stored at submit
 * time, provisions everything, generates/locks the company code, flips status to
 * 'active' and records the approval-history entry — all in one transaction.
 *
 * @returns the full provisioning result (incl. admin.temp_password) + welcome data.
 */
async function activateCompany(companyId, user, { sendWelcomeEmail } = {}) {
  const { rows } = await pool.query('SELECT * FROM companies WHERE id = $1', [companyId])
  if (!rows.length) throw new HttpError(404, 'Company not found')
  const companyRow = rows[0]

  if (!['checker_approved', 'pending_super_admin_approval'].includes(companyRow.status)) {
    throw new HttpError(409, `Company must be checker-approved before activation (current: "${companyRow.status}").`)
  }
  if (companyRow.provisioned) throw new HttpError(409, 'Company has already been activated')

  const payload = companyRow.onboarding_payload
  if (!payload || typeof payload !== 'object') {
    throw new HttpError(400, 'No onboarding payload stored for this company')
  }

  const admin = payload.admin || {}
  const adminEmail = String(admin.email || '').trim().toLowerCase()
  const adminUsername = String(admin.username || '').trim()

  // Re-check admin uniqueness at activation time (other companies may have taken them since submit).
  const emailExists = await pool.query('SELECT 1 FROM company_admins WHERE LOWER(email) = $1', [adminEmail])
  if (emailExists.rows.length) throw new HttpError(409, 'An admin with this email already exists')
  const usernameExists = await pool.query('SELECT 1 FROM company_admins WHERE username = $1', [adminUsername])
  if (usernameExists.rows.length) throw new HttpError(409, 'This username is already taken')

  // The Super Admin "generates" the final company code — keep the proposed one if present, else derive.
  const finalCode = String(companyRow.code || codegen.companyCodeFromName(companyRow.name)).trim().toUpperCase()

  const result = await withTransaction(async (client) => {
    const provisioned = await provisionChildren(client, companyRow, payload, user.id)

    const { rows: updated } = await client.query(
      `UPDATE companies
          SET status = 'active', code = $1, provisioned = TRUE,
              approved_by = $2, approved_at = now(), updated_at = now()
        WHERE id = $3
        RETURNING *`,
      [finalCode, user.id, companyId]
    )

    await recordHistory(client, {
      companyId,
      action: 'activate',
      fromStatus: companyRow.status,
      toStatus: 'active',
      actor: user,
      notes: 'Final approval — company activated and provisioned',
    })

    return { company: updated[0], ...provisioned }
  })

  return {
    company: result.company,
    contact: result.contact,
    admin: {
      id: result.admin.id,
      company_id: result.admin.company_id,
      name: result.admin.name,
      email: result.admin.email,
      username: result.admin.username,
      role: result.admin.role,
      temp_password: result.tempPassword,
      force_password_reset: result.admin.force_password_reset,
    },
    subscription: result.subscription,
    wallet: result.wallet,
    settings: result.settings,
    modules: result.modules,
    approval: result.approval,
    billing: result.billing,
    branding: result.branding,
    invoice: result.invoice,
    welcome: {
      to: result.admin.email,
      name: result.admin.name,
      companyName: result.company.name,
      username: result.admin.username,
      tempPassword: result.tempPassword,
      sendWelcomeEmail: sendWelcomeEmail !== false,
    },
  }
}

// ── Invoice fetch / render ────────────────────────────────────────────────────

const INVOICE_SELECT = `
  SELECT i.*,
         c.name AS company_name,
         c.code AS company_code
    FROM company_invoices i
    JOIN companies c ON c.id = i.company_id
`

async function getInvoice(id) {
  const { rows } = await pool.query(`${INVOICE_SELECT} WHERE i.id = $1`, [id])
  if (!rows.length) throw new HttpError(404, 'Invoice not found')
  return rows[0]
}

async function getInvoiceHtml(id) {
  const { rows } = await pool.query(
    `SELECT row_to_json(i) AS invoice, row_to_json(c) AS company
       FROM company_invoices i
       JOIN companies c ON c.id = i.company_id
      WHERE i.id = $1`,
    [id]
  )
  if (!rows.length) throw new HttpError(404, 'Invoice not found')
  return invoiceService.renderInvoiceHtml(rows[0].invoice, rows[0].company)
}

module.exports = {
  generateCode,
  checkCode,
  generatePassword,
  meta,
  getMeta: meta,
  createDraft,
  listDrafts,
  getDraft,
  saveDraft,
  updateDraft: saveDraft,
  deleteDraft,
  submitCompany,
  resubmitCompany,
  activateCompany,
  getInvoice,
  getInvoiceHtml,
}
