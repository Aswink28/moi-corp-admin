const express = require('express')
const ctrl = require('../controllers/users.controller')
const h = require('../utils/asyncHandler')

const router = express.Router()

router.get('/screens', h(ctrl.screens))   // master list of assignable screens
router.get('/', h(ctrl.list))
router.post('/', h(ctrl.create))
router.get('/:id', h(ctrl.get))
router.patch('/:id/active', h(ctrl.setActive)) // { isActive }
router.patch('/:id', h(ctrl.update))
router.delete('/:id', h(ctrl.remove))

module.exports = router
