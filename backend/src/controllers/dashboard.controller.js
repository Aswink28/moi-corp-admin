const service = require('../services/dashboard.service')

async function stats(req, res) {
  const data = await service.stats(req.user)
  res.json({ success: true, data })
}

module.exports = { stats }
