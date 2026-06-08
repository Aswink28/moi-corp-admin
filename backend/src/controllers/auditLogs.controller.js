const service = require('../services/auditLogs.service')

async function list(req, res) {
  const data = await service.list({
    action: req.query.action,
    entityType: req.query.entityType,
    limit: req.query.limit,
  })
  res.json({ success: true, data })
}

module.exports = { list }
