const express = require('express')
const ctrl = require('../controllers/companies.controller')
const h = require('../utils/asyncHandler')

const router = express.Router()

router.get('/', h(ctrl.list))
router.post('/', h(ctrl.create))
router.get('/:id', h(ctrl.getById))
router.put('/:id', h(ctrl.update))
router.patch('/:id/status', h(ctrl.setStatus)) // activate / suspend / inactivate
router.delete('/:id', h(ctrl.remove))

module.exports = router
