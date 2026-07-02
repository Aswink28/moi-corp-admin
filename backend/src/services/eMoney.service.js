/**
 * E-Money Approval service.
 *
 * Company wallet funds live in the Moi-Corp Product DB (the single source of
 * funds for bookings). This service is a thin, secure proxy over the Product
 * backend's internal E-Money API (shared-secret). The Platform Super User uses
 * it to review + approve/reject/request-info on company wallet Load Requests.
 */
const { call } = require('./productProvisioning.service')

const qs = (params = {}) => {
  const s = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') s.append(k, v) })
  const str = s.toString()
  return str ? `?${str}` : ''
}

async function listLoadRequests(filters = {}) {
  const { data } = await call('GET', `/api/internal/emoney/load-requests${qs(filters)}`)
  return data || []
}

async function getLoadRequest(id) {
  const { data } = await call('GET', `/api/internal/emoney/load-requests/${id}`)
  return data
}

async function listWallets() {
  const { data } = await call('GET', '/api/internal/emoney/wallets')
  return data || []
}

async function listCompanies() {
  const { data } = await call('GET', '/api/internal/emoney/companies')
  return data || []
}

async function approve(id, reviewer) {
  const { data } = await call('POST', `/api/internal/emoney/load-requests/${id}/approve`, { reviewer })
  return data
}

async function reject(id, reviewer, reason) {
  const { data } = await call('POST', `/api/internal/emoney/load-requests/${id}/reject`, { reviewer, reason })
  return data
}

async function requestInfo(id, reviewer, note) {
  const { data } = await call('POST', `/api/internal/emoney/load-requests/${id}/request-info`, { reviewer, note })
  return data
}

module.exports = { listLoadRequests, getLoadRequest, listWallets, listCompanies, approve, reject, requestInfo }
