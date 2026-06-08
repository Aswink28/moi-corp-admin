const service = require('../services/subscriptions.service')
const { audit } = require('../utils/audit')

async function listByCompany(req, res) {
  const data = await service.listByCompany(req.params.companyId)
  res.json({ success: true, data })
}

async function create(req, res) {
  const data = await service.create(req.params.companyId, req.body, req.user.id)
  await audit(req, { action: 'subscription.create', entityType: 'company', entityId: req.params.companyId, details: { plan: data.plan } })
  res.status(201).json({ success: true, data })
}

async function setStatus(req, res) {
  const data = await service.setStatus(req.params.id, req.body.status)
  await audit(req, { action: `subscription.${req.body.status}`, entityType: 'company_subscription', entityId: req.params.id })
  res.json({ success: true, data })
}

module.exports = { listByCompany, create, setStatus }
