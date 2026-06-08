const express = require('express')
const ctrl = require('../controllers/auth.controller')
const h = require('../utils/asyncHandler')
const { authenticate } = require('../middleware/auth')

const router = express.Router()

router.post('/login', h(ctrl.login))
router.get('/me', authenticate, h(ctrl.me))
router.post('/change-password', authenticate, h(ctrl.changePassword))

module.exports = router
