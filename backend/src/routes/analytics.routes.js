const express = require('express')
const ctrl = require('../controllers/analytics.controller')
const h = require('../utils/asyncHandler')
const { authorize } = require('../middleware/auth')

const router = express.Router()

// Company Analytics is a Super Admin–only workspace.
router.use(authorize('super_admin', 'admin'))
router.get('/company/:id', h(ctrl.companyAnalytics))

module.exports = router
