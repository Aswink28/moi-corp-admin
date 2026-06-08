const express = require('express')
const { authenticate } = require('../middleware/auth')

const auth = require('./auth.routes')
const dashboard = require('./dashboard.routes')
const companies = require('./companies.routes')
const companyAdmins = require('./companyAdmins.routes')
const settings = require('./settings.routes')
const subscriptions = require('./subscriptions.routes')
const wallets = require('./wallets.routes')
const auditLogs = require('./auditLogs.routes')
const onboarding = require('./onboarding.routes')
const approvals = require('./approvals.routes')

const router = express.Router()

// Public
router.use('/auth', auth)

// Everything below requires a valid Super Admin token
router.use(authenticate)
router.use('/dashboard', dashboard)
router.use('/companies', companies)
router.use('/company-admins', companyAdmins)
router.use('/settings', settings)
router.use('/subscriptions', subscriptions)
router.use('/wallets', wallets)
router.use('/audit-logs', auditLogs)
router.use('/onboarding', onboarding)
router.use('/approvals', approvals)

module.exports = router
