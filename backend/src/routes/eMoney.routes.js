const express = require('express')
const ctrl = require('../controllers/eMoney.controller')
const { authorize } = require('../middleware/auth')
const h = require('../utils/asyncHandler')

const router = express.Router()

// Only the Platform Super User may action company wallet load requests.
const SUPER = authorize('super_admin', 'admin')

router.get('/companies', h(ctrl.companies))
router.get('/wallets', h(ctrl.wallets))
router.get('/load-requests', h(ctrl.loadRequests))
router.get('/load-requests/:id', h(ctrl.loadRequest))
router.post('/load-requests/:id/approve', SUPER, h(ctrl.approve))
router.post('/load-requests/:id/reject', SUPER, h(ctrl.reject))
router.post('/load-requests/:id/request-info', SUPER, h(ctrl.requestInfo))

module.exports = router
