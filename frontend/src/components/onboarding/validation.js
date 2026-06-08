// Client-side mirror of the server's onboarding validation (ONBOARDING_CONTRACT §C).
// Errors are keyed by the SAME dot-paths used by setField / step components (§E.2).

// ── Regexes (EXACT — mirror backend utils/validators.js §B.1) ────────────────
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// India mobile: 10 digits starting 6-9. Also accept an optional country code
// with leading '+' and up to 15 total digits (E.164-ish).
const MOBILE_IN_RE = /^[6-9]\d{9}$/
const MOBILE_INTL_RE = /^\+\d{8,15}$/

export function isGstin(s) {
  return typeof s === 'string' && GSTIN_RE.test(s.trim().toUpperCase())
}
export function isPan(s) {
  return typeof s === 'string' && PAN_RE.test(s.trim().toUpperCase())
}
export function isEmail(s) {
  return typeof s === 'string' && EMAIL_RE.test(s.trim())
}
export function isMobile(s) {
  if (typeof s !== 'string') return false
  const v = s.trim()
  return MOBILE_IN_RE.test(v) || MOBILE_INTL_RE.test(v)
}

// ── Step 5 computed amounts (§E.3 — exact formula, round each to 2 decimals) ──
function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100
}

export function computeAmounts(subscription) {
  const s = subscription || {}
  const base_amount = round2(s.subscription_amount)
  const discount_amount = round2(base_amount * ((Number(s.discount_percentage) || 0) / 100))
  const taxable = round2(base_amount - discount_amount)
  const tax_amount = round2(taxable * ((Number(s.tax_percentage) || 0) / 100))
  const total_amount = round2(taxable + tax_amount)
  return { base_amount, discount_amount, taxable, tax_amount, total_amount }
}

const PLAN_TIERS = ['trial', 'basic', 'professional', 'enterprise']
const BILLING_CYCLES = ['monthly', 'quarterly', 'half_yearly', 'annual']

function nonEmpty(v) {
  return typeof v === 'string' ? v.trim() !== '' : v != null && v !== ''
}

// Canonical 10-step wizard order (matches CompanyOnboarding.jsx STEPS):
// 0 Company, 1 Address, 2 Contact, 3 Admin, 4 Modules, 5 Subscription,
// 6 Billing, 7 Wallet, 8 Branding, 9 Review. (The Approval step was removed
// from onboarding; the validated steps 0-7 are unaffected.)
//
// validateStep returns a map { [dotPath]: message } for the given step.
// Only rules that can be checked on the client are applied here; DB-uniqueness
// rules (§C #3, #11, #13) are enforced server-side.
export function validateStep(stepIndex, data) {
  const errors = {}
  const d = data || {}
  const company = d.company || {}
  const contact = d.contact || {}
  const admin = d.admin || {}
  const subscription = d.subscription || {}
  const billing = d.billing || {}

  switch (stepIndex) {
    // ── Step 0: Company Profile ──────────────────────────────────────────────
    case 0: {
      if (!nonEmpty(company.name)) errors['company.name'] = 'Company name is required'
      if (!nonEmpty(company.code)) errors['company.code'] = 'Company code is required'
      if (nonEmpty(company.gstin) && !isGstin(company.gstin))
        errors['company.gstin'] = 'GSTIN must be a valid 15-character GSTIN'
      if (nonEmpty(company.pan) && !isPan(company.pan))
        errors['company.pan'] = 'PAN must be a valid 10-character PAN (e.g. ABCDE1234F)'
      if (nonEmpty(company.email) && !isEmail(company.email))
        errors['company.email'] = 'Enter a valid email address'
      break
    }

    // ── Step 1: Address ──────────────────────────────────────────────────────
    case 1:
      break

    // ── Step 2: Contact ──────────────────────────────────────────────────────
    case 2: {
      if (nonEmpty(contact.email) && !isEmail(contact.email))
        errors['contact.email'] = 'Enter a valid email address'
      if (nonEmpty(contact.mobile) && !isMobile(contact.mobile))
        errors['contact.mobile'] = 'Enter a valid mobile number'
      break
    }

    // ── Step 3: Admin Account ────────────────────────────────────────────────
    case 3: {
      if (!nonEmpty(admin.name)) errors['admin.name'] = 'Admin name is required'
      if (!nonEmpty(admin.email) || !isEmail(admin.email))
        errors['admin.email'] = 'Enter a valid admin email address'
      if (!nonEmpty(admin.username)) errors['admin.username'] = 'Admin username is required'
      if (nonEmpty(admin.phone) && !isMobile(admin.phone))
        errors['admin.phone'] = 'Enter a valid mobile number'
      break
    }

    // ── Step 4: Modules ──────────────────────────────────────────────────────
    case 4:
      break

    // ── Step 5: Subscription ─────────────────────────────────────────────────
    case 5: {
      if (!PLAN_TIERS.includes(subscription.plan_tier))
        errors['subscription.plan_tier'] = 'Select a valid plan tier'
      if (!BILLING_CYCLES.includes(subscription.billing_cycle))
        errors['subscription.billing_cycle'] = 'Select a valid billing cycle'
      if (!(Number(subscription.subscription_amount) > 0))
        errors['subscription.subscription_amount'] = 'Subscription amount must be greater than 0'
      if (!(Number(subscription.licensed_users) > 0))
        errors['subscription.licensed_users'] = 'Licensed users must be greater than 0'
      if (nonEmpty(subscription.contract_start_date) && nonEmpty(subscription.contract_end_date)) {
        const start = new Date(subscription.contract_start_date)
        const end = new Date(subscription.contract_end_date)
        if (!(end > start))
          errors['subscription.contract_end_date'] = 'Contract end date must be after the start date'
      }
      break
    }

    // ── Step 6: Billing ──────────────────────────────────────────────────────
    case 6: {
      if (nonEmpty(billing.billing_email) && !isEmail(billing.billing_email))
        errors['billing.billing_email'] = 'Enter a valid email address'
      if (nonEmpty(billing.gstin) && !isGstin(billing.gstin))
        errors['billing.gstin'] = 'GSTIN must be a valid 15-character GSTIN'
      if (nonEmpty(billing.pan) && !isPan(billing.pan))
        errors['billing.pan'] = 'PAN must be a valid 10-character PAN (e.g. ABCDE1234F)'
      break
    }

    // ── Steps 7 (Wallet), 8 (Approval), 9 (Branding), 10 (Review) ────────────
    default:
      break
  }

  return errors
}
