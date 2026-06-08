const express = require('express')
const ctrl = require('../controllers/onboarding.controller')
const h = require('../utils/asyncHandler')
const { upload } = require('../middleware/upload')

const router = express.Router()

router.get('/meta', h(ctrl.meta))
router.get('/generate-code', h(ctrl.generateCode))
router.get('/check-code', h(ctrl.checkCode))
router.post('/generate-password', h(ctrl.generatePassword))
router.post('/logo', upload.single('logo'), h(ctrl.uploadLogo))

router.post('/drafts', h(ctrl.createDraft))
router.get('/drafts', h(ctrl.listDrafts))
router.get('/drafts/:id', h(ctrl.getDraft))
router.put('/drafts/:id', h(ctrl.updateDraft))
router.delete('/drafts/:id', h(ctrl.deleteDraft))

router.post('/companies', h(ctrl.createCompany))

router.get('/invoices/:id', h(ctrl.getInvoice))
router.get('/invoices/:id/html', h(ctrl.getInvoiceHtml))

module.exports = router
