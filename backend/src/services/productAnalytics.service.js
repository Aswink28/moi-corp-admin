/**
 * Moi-Corp Product (TravelDesk) analytics client.
 *
 * Fetches LIVE operational analytics from the Product backend's internal
 * analytics API (secured by the shared secret, not a user JWT). Base URL and
 * secret are configurable via env (PRODUCT_API_URL / PRODUCT_PROVISIONING_SECRET).
 *
 * Resilience: if Product is unreachable or misconfigured we throw a typed error.
 * The caller decides how to degrade — we NEVER substitute mock/dummy data, so
 * the Admin portal only ever shows real numbers or an explicit "unavailable".
 */
const config = require('../config/env')

const BASE = () => config.product.apiUrl.replace(/\/+$/, '')
const SECRET = () => config.product.provisioningSecret
const TIMEOUT = () => config.product.analyticsTimeoutMs

function ensureConfigured() {
  if (!SECRET()) {
    const err = new Error('Product analytics is not configured (PRODUCT_PROVISIONING_SECRET unset)')
    err.code = 'NOT_CONFIGURED'
    throw err
  }
}

async function get(path) {
  ensureConfigured()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT())
  let res
  try {
    res = await fetch(`${BASE()}${path}`, {
      method: 'GET',
      headers: { 'x-provisioning-secret': SECRET() },
      signal: controller.signal,
    })
  } catch (e) {
    const err = new Error(
      e.name === 'AbortError'
        ? `Product analytics timed out after ${TIMEOUT()}ms`
        : `Could not reach Product at ${BASE()}: ${e.message}`
    )
    err.code = 'PRODUCT_UNREACHABLE'
    throw err
  } finally {
    clearTimeout(timer)
  }

  let json = null
  try { json = await res.json() } catch (_) { /* non-JSON */ }
  if (!res.ok || (json && json.success === false)) {
    const err = new Error((json && json.message) || `Product analytics responded ${res.status}`)
    err.code = res.status === 401 ? 'BAD_SECRET' : 'PRODUCT_ERROR'
    throw err
  }
  return (json && json.data) || {}
}

/** Full operational analytics for one company (employees, bookings, expenses, …). */
function companyAnalytics(companyId) {
  return get(`/api/internal/analytics/company/${encodeURIComponent(companyId)}`)
}

/** Cross-company headline metrics for the Super Admin dashboard. */
function overview() {
  return get('/api/internal/analytics/overview')
}

module.exports = { companyAnalytics, overview }
