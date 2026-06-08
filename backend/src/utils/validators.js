const { HttpError } = require('../middleware/error')

// ── Regexes (EXACT) ─────────────────────────────────────────────────────────
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// India mobile: 10 digits starting 6-9. Also accept an optional country code
// with leading '+' and up to 15 total digits (E.164-ish).
const MOBILE_IN_RE = /^[6-9]\d{9}$/
const MOBILE_INTL_RE = /^\+\d{8,15}$/

function isGstin(s) {
  return typeof s === 'string' && GSTIN_RE.test(s.trim().toUpperCase())
}
function isPan(s) {
  return typeof s === 'string' && PAN_RE.test(s.trim().toUpperCase())
}
function isEmail(s) {
  return typeof s === 'string' && EMAIL_RE.test(s.trim())
}
function isMobile(s) {
  if (typeof s !== 'string') return false
  const v = s.trim()
  return MOBILE_IN_RE.test(v) || MOBILE_INTL_RE.test(v)
}

/** Treat null/undefined/empty-after-trim as "not provided". */
function isBlank(v) {
  return v === null || v === undefined || (typeof v === 'string' && v.trim() === '')
}

const PLAN_TIERS = ['trial', 'basic', 'professional', 'enterprise']
const BILLING_CYCLES = ['monthly', 'quarterly', 'half_yearly', 'annual']

/**
 * Validate the FULL onboarding payload (shape in §D.2).
 * Throws HttpError(400, msg) on the first failed rule (messages in §C).
 * Returns the payload unchanged on success.
 */
function assertOnboardingPayload(payload) {
  const p = payload || {}
  const company = p.company || {}
  const contact = p.contact || {}
  const admin = p.admin || {}
  const subscription = p.subscription || {}
  const billing = p.billing || {}

  // 1. Company name required (non-empty)
  if (isBlank(company.name)) throw new HttpError(400, 'Company name is required')

  // 2. Company code required
  if (isBlank(company.code)) throw new HttpError(400, 'Company code is required')

  // 4. GSTIN format (when provided)
  if (!isBlank(company.gstin) && !isGstin(company.gstin)) {
    throw new HttpError(400, 'GSTIN must be a valid 15-character GSTIN')
  }

  // 5. PAN format (when provided)
  if (!isBlank(company.pan) && !isPan(company.pan)) {
    throw new HttpError(400, 'PAN must be a valid 10-character PAN (e.g. ABCDE1234F)')
  }

  // 6. Company email format (when provided)
  if (!isBlank(company.email) && !isEmail(company.email)) {
    throw new HttpError(400, 'Enter a valid email address')
  }

  // 7. Contact email format (when provided)
  if (!isBlank(contact.email) && !isEmail(contact.email)) {
    throw new HttpError(400, 'Enter a valid email address')
  }

  // 8. Contact mobile format (when provided)
  if (!isBlank(contact.mobile) && !isMobile(contact.mobile)) {
    throw new HttpError(400, 'Enter a valid mobile number')
  }

  // 9. Admin name required
  if (isBlank(admin.name)) throw new HttpError(400, 'Admin name is required')

  // 10. Admin email required + format
  if (isBlank(admin.email) || !isEmail(admin.email)) {
    throw new HttpError(400, 'Enter a valid admin email address')
  }

  // 12. Admin username required
  if (isBlank(admin.username)) throw new HttpError(400, 'Admin username is required')

  // 14. Admin mobile format (when provided)
  if (!isBlank(admin.phone) && !isMobile(admin.phone)) {
    throw new HttpError(400, 'Enter a valid mobile number')
  }

  // 15. Plan tier valid
  if (!PLAN_TIERS.includes(subscription.plan_tier)) {
    throw new HttpError(400, 'Select a valid plan tier')
  }

  // 16. Billing cycle valid
  if (!BILLING_CYCLES.includes(subscription.billing_cycle)) {
    throw new HttpError(400, 'Select a valid billing cycle')
  }

  // 17. Subscription amount > 0
  if (!(Number(subscription.subscription_amount) > 0)) {
    throw new HttpError(400, 'Subscription amount must be greater than 0')
  }

  // 18. Licensed users > 0
  if (!(Number(subscription.licensed_users) > 0)) {
    throw new HttpError(400, 'Licensed users must be greater than 0')
  }

  // 19. Contract end after start
  if (!isBlank(subscription.contract_start_date) && !isBlank(subscription.contract_end_date)) {
    const start = new Date(subscription.contract_start_date)
    const end = new Date(subscription.contract_end_date)
    if (!(end > start)) {
      throw new HttpError(400, 'Contract end date must be after the start date')
    }
  }

  // 20. Billing email format (when provided)
  if (!isBlank(billing.billing_email) && !isEmail(billing.billing_email)) {
    throw new HttpError(400, 'Enter a valid email address')
  }

  // 21. Billing GSTIN format (when provided)
  if (!isBlank(billing.gstin) && !isGstin(billing.gstin)) {
    throw new HttpError(400, 'GSTIN must be a valid 15-character GSTIN')
  }

  // 22. Billing PAN format (when provided)
  if (!isBlank(billing.pan) && !isPan(billing.pan)) {
    throw new HttpError(400, 'PAN must be a valid 10-character PAN (e.g. ABCDE1234F)')
  }

  return payload
}

module.exports = {
  isGstin,
  isPan,
  isEmail,
  isMobile,
  assertOnboardingPayload,
  GSTIN_RE,
  PAN_RE,
  EMAIL_RE,
  MOBILE_IN_RE,
  MOBILE_INTL_RE,
}
