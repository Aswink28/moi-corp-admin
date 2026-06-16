const service = require('../services/users.service')
const { SCREENS } = require('../config/screens')
const { audit } = require('../utils/audit')

async function screens(req, res) {
  res.json({ success: true, data: SCREENS })
}
async function list(req, res) {
  res.json({ success: true, data: await service.list() })
}
async function get(req, res) {
  res.json({ success: true, data: await service.get(req.params.id) })
}
async function create(req, res) {
  const data = await service.create(req.body)
  await audit(req, { action: 'user.create', entityType: 'super_admin', entityId: data.id, details: { email: data.email, role: data.role } })
  res.status(201).json({ success: true, data })
}
async function update(req, res) {
  const data = await service.update(req.params.id, req.body)
  await audit(req, { action: 'user.update', entityType: 'super_admin', entityId: req.params.id, details: { changed: Object.keys(req.body) } })
  res.json({ success: true, data })
}
async function setActive(req, res) {
  const data = await service.setActive(req.params.id, req.body.isActive)
  await audit(req, { action: data.is_active ? 'user.activate' : 'user.deactivate', entityType: 'super_admin', entityId: req.params.id })
  res.json({ success: true, data })
}
async function remove(req, res) {
  await service.remove(req.params.id)
  await audit(req, { action: 'user.delete', entityType: 'super_admin', entityId: req.params.id })
  res.json({ success: true, message: 'User deleted' })
}

module.exports = { screens, list, get, create, update, setActive, remove }
