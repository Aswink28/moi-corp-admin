const express = require('express')
const ctrl = require('../controllers/settings.controller')
const h = require('../utils/asyncHandler')

const router = express.Router()

router.get('/:companyId', h(ctrl.get))
router.put('/:companyId', h(ctrl.update))

module.exports = router
