const service = require('../services/companies.service')
const { audit } = require('../utils/audit')

async function list(req, res) {
  const data = await service.list({ search: req.query.search, status: req.query.status })
  res.json({ success: true, data })
}

async function getById(req, res) {
  const data = await service.getById(req.params.id)
  res.json({ success: true, data })
}

async function create(req, res) {
  const data = await service.create(req.body, req.user.id)
  await audit(req, { action: 'company.create', entityType: 'company', entityId: data.id, details: { name: data.name, code: data.code } })
  res.status(201).json({ success: true, data })
}

async function update(req, res) {
  const data = await service.update(req.params.id, req.body)
  await audit(req, { action: 'company.update', entityType: 'company', entityId: data.id })
  res.json({ success: true, data })
}

async function setStatus(req, res) {
  const data = await service.setStatus(req.params.id, req.body.status)
  await audit(req, { action: `company.${req.body.status}`, entityType: 'company', entityId: data.id })
  res.json({ success: true, data })
}

async function remove(req, res) {
  await service.remove(req.params.id)
  await audit(req, { action: 'company.delete', entityType: 'company', entityId: req.params.id })
  res.json({ success: true, message: 'Company deleted' })
}

module.exports = { list, getById, create, update, setStatus, remove }
