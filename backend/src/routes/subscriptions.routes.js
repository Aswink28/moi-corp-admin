const express = require('express')
const ctrl = require('../controllers/subscriptions.controller')
const h = require('../utils/asyncHandler')

const router = express.Router()

router.get('/company/:companyId', h(ctrl.listByCompany))
router.post('/company/:companyId', h(ctrl.create))
router.patch('/:id/status', h(ctrl.setStatus))

module.exports = router
