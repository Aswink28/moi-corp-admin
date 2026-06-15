const service = require('../services/lender.service')

async function listCompanies(req, res) {
  const data = await service.listCompanies({ search: req.query.search, status: req.query.status })
  res.json({ success: true, count: data.length, data })
}

async function getCompany(req, res) {
  const data = await service.getCompany(req.params.id)
  res.json({ success: true, data })
}

module.exports = { listCompanies, getCompany }
