const service = require('../services/eMoney.service')
const { audit } = require('../utils/audit')

const reviewerOf = (req) => req.user?.email || req.user?.name || 'Platform Super User'

async function loadRequests(req, res) {
  const { company_id, status, from, to, limit } = req.query
  const data = await service.listLoadRequests({ company_id, status, from, to, limit })
  res.json({ success: true, data })
}

async function loadRequest(req, res) {
  const data = await service.getLoadRequest(req.params.id)
  res.json({ success: true, data })
}

async function wallets(req, res) {
  res.json({ success: true, data: await service.listWallets() })
}

async function companies(req, res) {
  res.json({ success: true, data: await service.listCompanies() })
}

async function approve(req, res) {
  const data = await service.approve(req.params.id, reviewerOf(req))
  await audit(req, {
    action: 'emoney.load_request.approve',
    entityType: 'company_wallet_load_request',
    entityId: req.params.id,
    details: { reference_no: data?.reference_no, company: data?.company_name, amount: data?.requested_amount, wallet_balance: data?.wallet_balance },
  })
  res.json({ success: true, data })
}

async function reject(req, res) {
  const { reason } = req.body
  if (!reason || !String(reason).trim()) {
    return res.status(400).json({ success: false, message: 'A rejection reason is required' })
  }
  const data = await service.reject(req.params.id, reviewerOf(req), String(reason).trim())
  await audit(req, {
    action: 'emoney.load_request.reject',
    entityType: 'company_wallet_load_request',
    entityId: req.params.id,
    details: { reference_no: data?.reference_no, company: data?.company_name, reason: String(reason).trim() },
  })
  res.json({ success: true, data })
}

async function requestInfo(req, res) {
  const { note } = req.body
  if (!note || !String(note).trim()) {
    return res.status(400).json({ success: false, message: 'An information request note is required' })
  }
  const data = await service.requestInfo(req.params.id, reviewerOf(req), String(note).trim())
  await audit(req, {
    action: 'emoney.load_request.request_info',
    entityType: 'company_wallet_load_request',
    entityId: req.params.id,
    details: { reference_no: data?.reference_no, company: data?.company_name, note: String(note).trim() },
  })
  res.json({ success: true, data })
}

module.exports = { loadRequests, loadRequest, wallets, companies, approve, reject, requestInfo }
