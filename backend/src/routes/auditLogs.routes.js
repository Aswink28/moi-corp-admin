const express = require('express')
const ctrl = require('../controllers/auditLogs.controller')
const h = require('../utils/asyncHandler')

const router = express.Router()

router.get('/', h(ctrl.list)) // ?action=&entityType=&limit=

module.exports = router
