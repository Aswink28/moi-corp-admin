const service = require('../services/auth.service')
const { audit } = require('../utils/audit')

async function login(req, res) {
  const result = await service.login(req.body.email, req.body.password)
  req.user = result.user // so audit captures the actor
  await audit(req, { action: 'auth.login', entityType: 'super_admin', entityId: result.user.id })
  res.json({ success: true, data: result })
}

async function me(req, res) {
  const data = await service.me(req.user.id)
  res.json({ success: true, data })
}

async function changePassword(req, res) {
  await service.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword)
  await audit(req, { action: 'auth.change_password', entityType: 'super_admin', entityId: req.user.id })
  res.json({ success: true, message: 'Password updated' })
}

module.exports = { login, me, changePassword }
