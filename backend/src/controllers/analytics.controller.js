const service = require('../services/analytics.service')

// GET /analytics/company/:id  → full 360° analytics for one company
async function companyAnalytics(req, res) {
  const data = await service.companyAnalytics(req.params.id)
  res.json({ success: true, data })
}

module.exports = { companyAnalytics }
