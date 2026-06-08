const service = require('../services/companyAdmins.service')
const { audit } = require('../utils/audit')

async function list(req, res) {
  const data = await service.list({ companyId: req.query.companyId })
  res.json({ success: true, data })
}

async function create(req, res) {
  const data = await service.create(req.body, req.user.id)
  await audit(req, { action: 'company_admin.create', entityType: 'company_admin', entityId: data.admin.id, details: { companyId: data.admin.company_id } })
  res.status(201).json({ success: true, data })
}

async function resetPassword(req, res) {
  const data = await service.resetPassword(req.params.id)
  await audit(req, { action: 'company_admin.reset_password', entityType: 'company_admin', entityId: req.params.id })
  res.json({ success: true, data })
}

async function setActive(req, res) {
  const data = await service.setActive(req.params.id, req.body.isActive)
  await audit(req, { action: data.is_active ? 'company_admin.activate' : 'company_admin.deactivate', entityType: 'company_admin', entityId: data.id })
  res.json({ success: true, data })
}

async function remove(req, res) {
  await service.remove(req.params.id)
  await audit(req, { action: 'company_admin.delete', entityType: 'company_admin', entityId: req.params.id })
  res.json({ success: true, message: 'Company admin deleted' })
}

module.exports = { list, create, resetPassword, setActive, remove }
