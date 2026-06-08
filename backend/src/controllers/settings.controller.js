const service = require('../services/settings.service')
const { audit } = require('../utils/audit')

async function get(req, res) {
  const data = await service.get(req.params.companyId)
  res.json({ success: true, data })
}

async function update(req, res) {
  const data = await service.update(req.params.companyId, req.body, req.user.id)
  await audit(req, { action: 'settings.update', entityType: 'company', entityId: req.params.companyId, details: req.body })
  res.json({ success: true, data })
}

module.exports = { get, update }
