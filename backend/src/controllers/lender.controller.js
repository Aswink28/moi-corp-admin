const service = require('../services/lender.service')

async function listCompanies(req, res) {
  const data = await service.listCompanies({ search: req.query.search, status: req.query.status })
  res.json({ success: true, count: data.length, data })
}

async function getCompany(req, res) {
  const data = await service.getCompany(req.params.id)
  res.json({ success: true, data })
}

async function createInvestment(req, res) {
  const data = await service.createInvestment(req.body)
  res.status(201).json({ success: true, data })
}

async function listInvestments(req, res) {
  const data = await service.listInvestments({
    companyCode: req.query.companyCode,
    investorCode: req.query.investorCode,
  })
  res.json({ success: true, count: data.length, data })
}

async function getInvestment(req, res) {
  const data = await service.getInvestment(req.params.id)
  res.json({ success: true, data })
}

module.exports = { listCompanies, getCompany, createInvestment, listInvestments, getInvestment }
