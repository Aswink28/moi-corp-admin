const express = require('express')
const ctrl = require('../controllers/companyAdmins.controller')
const h = require('../utils/asyncHandler')

const router = express.Router()

router.get('/', h(ctrl.list)) // ?companyId=
router.post('/', h(ctrl.create))
router.post('/:id/reset-password', h(ctrl.resetPassword))
router.patch('/:id/active', h(ctrl.setActive)) // { isActive: true|false }
router.delete('/:id', h(ctrl.remove))

module.exports = router
