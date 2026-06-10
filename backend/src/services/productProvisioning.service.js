/**
 * Moi-Corp Product (TravelDesk) provisioning client.
 *
 * Talks to the Product backend's internal provisioning API to mirror a company
 * + its Company Admin into the Product DB when a company is activated here.
 * Uses the shared-secret header (not a user JWT). All calls are best-effort:
 * the caller decides what to do with failures — Admin activation must never be
 * blocked by Product being unavailable. Every Product handler is idempotent, so
 * retries / re-provisions are safe.
 */
const config = require('../config/env')

const BASE = () => config.product.apiUrl.replace(/\/+$/, '')
const SECRET = () => config.product.provisioningSecret

function ensureConfigured() {
  if (!SECRET()) {
    const err = new Error('Product provisioning is not configured (PRODUCT_PROVISIONING_SECRET unset)')
    err.code = 'NOT_CONFIGURED'
    throw err
  }
}

async function call(method, path, body) {
  ensureConfigured()
  let res
  try {
    res = await fetch(`${BASE()}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', 'x-provisioning-secret': SECRET() },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (e) {
    // Network-level failure (Product down / unreachable).
    throw new Error(`Could not reach Product at ${BASE()}: ${e.message}`)
  }
  let json = null
  try { json = await res.json() } catch (_) { /* non-JSON body */ }
  if (!res.ok || (json && json.success === false)) {
    const msg = (json && json.message) || `Product responded ${res.status}`
    throw new Error(msg)
  }
  return json || {}
}

/**
 * Provision (or re-provision) a company + Company Admin into Product.
 * @param {object} args
 * @param {object} args.company  - { id, name, code, status }
 * @param {object} args.admin    - { name, email, phone, employee_id, username }
 * @param {string} args.tempPassword - plaintext temp password (Product hashes it)
 * @param {object} [args.modules]    - { flight, hotel, train, bus, cab, expense, wallet, approval, reports }
 * @returns {Promise<{success, company_id, user_id}>}
 */
async function provisionToProduct({ company, admin, tempPassword, modules } = {}) {
  return call('POST', '/api/provisioning/company', {
    company: {
      id: company.id,
      name: company.name,
      code: company.code || null,
      status: company.status || 'active',
    },
    admin: {
      name: admin.name,
      email: admin.email,
      temp_password: tempPassword || undefined,
      phone: admin.phone || null,
      employee_id: admin.employee_id || null,
      username: admin.username || null,
    },
    modules: modules || {},
  })
}

/** Sync a company's lifecycle status into Product (suspend / reactivate / deactivate). */
async function syncStatus(productCompanyId, status) {
  return call('PATCH', `/api/provisioning/company/${productCompanyId}/status`, { status })
}

/** Push a new Company Admin temp password into Product (admin-initiated reset). */
async function resetPassword(productCompanyId, tempPassword, email) {
  return call('POST', `/api/provisioning/company/${productCompanyId}/reset-password`, {
    temp_password: tempPassword,
    email: email || undefined,
  })
}

/** Map the 9 onboarding module rows → the { key: enabled } shape Product expects. */
function modulesFromOnboarding(modules) {
  const out = {}
  for (const m of Array.isArray(modules) ? modules : []) {
    if (m && m.module_key) out[m.module_key] = !!m.enabled
  }
  return out
}

module.exports = { provisionToProduct, syncStatus, resetPassword, modulesFromOnboarding }
