const express = require('express')
const ctrl = require('../controllers/dashboard.controller')
const h = require('../utils/asyncHandler')

const router = express.Router()

router.get('/stats', h(ctrl.stats))

module.exports = router
