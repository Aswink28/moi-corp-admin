const express = require('express')
const ctrl = require('../controllers/lender.controller')
const h = require('../utils/asyncHandler')
const config = require('../config/env')

const router = express.Router()

// ── API-key guard ───────────────────────────────────────────────────────────
// The Lender Portal is an external consumer, independent of the Super Admin JWT
// used by the rest of /api. Authenticate with the shared key header:
//   x-lender-api-key: <LENDER_API_KEY>
router.use((req, res, next) => {
  if (!config.lender.apiKey) {
    return res.status(503).json({ success: false, message: 'Lender API not configured (LENDER_API_KEY unset)' })
  }
  if (req.headers['x-lender-api-key'] !== config.lender.apiKey) {
    return res.status(401).json({ success: false, message: 'Invalid or missing lender API key' })
  }
  next()
})

// GET /api/lender/companies          — list (optional ?search= &status=)
// GET /api/lender/companies/:id      — single company
router.get('/companies', h(ctrl.listCompanies))
router.get('/companies/:id', h(ctrl.getCompany))

// POST /api/lender/investments       — receive + store one investor offer
// GET  /api/lender/investments       — list stored offers (?companyId= &investorId=)
// GET  /api/lender/investments/:id    — single stored offer
router.post('/investments', h(ctrl.createInvestment))
router.get('/investments', h(ctrl.listInvestments))
router.get('/investments/:id', h(ctrl.getInvestment))

module.exports = router
