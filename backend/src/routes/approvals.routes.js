const express = require('express')
const ctrl = require('../controllers/approvals.controller')
const h = require('../utils/asyncHandler')
const { authorize } = require('../middleware/auth')

const router = express.Router()

const CHECKER = authorize('checker', 'super_admin', 'admin')
const SUPER = authorize('super_admin', 'admin')

// Read — any authenticated portal user (maker sees their own via the service).
router.get('/queue', h(ctrl.queue))
router.get('/:id', h(ctrl.getWorkflow))
router.get('/:id/history', h(ctrl.history))

// Checker stage
router.post('/:id/start-review', CHECKER, h(ctrl.startReview))
router.post('/:id/checker-approve', CHECKER, h(ctrl.checkerApprove))
router.post('/:id/request-changes', CHECKER, h(ctrl.requestChanges))
router.post('/:id/checker-reject', CHECKER, h(ctrl.checkerReject))

// Super Admin stage
router.post('/:id/activate', SUPER, h(ctrl.activate))
router.post('/:id/reject', SUPER, h(ctrl.reject))
router.post('/:id/suspend', SUPER, h(ctrl.suspend))
router.post('/:id/reactivate', SUPER, h(ctrl.reactivate))
router.post('/:id/reprovision', SUPER, h(ctrl.reprovision))  // retry Product provisioning

module.exports = router
