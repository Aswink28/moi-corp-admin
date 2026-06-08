const express = require('express')
const ctrl = require('../controllers/wallets.controller')
const h = require('../utils/asyncHandler')

const router = express.Router()

router.get('/company/:companyId', h(ctrl.getWallet))
router.get('/company/:companyId/transactions', h(ctrl.transactions))
// body: { type: 'allocate'|'credit'|'debit', amount, description }
router.post('/company/:companyId/transaction', h(ctrl.operate))

module.exports = router
