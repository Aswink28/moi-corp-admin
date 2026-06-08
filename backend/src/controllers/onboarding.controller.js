const service = require('../services/onboarding.service')
const { audit } = require('../utils/audit')
const { HttpError } = require('../middleware/error')

// 1. GET /meta
async function meta(req, res) {
  const data = await service.getMeta()
  res.json({ success: true, data })
}

// 2. GET /generate-code?name=
async function generateCode(req, res) {
  const data = await service.generateCode(req.query.name)
  res.json({ success: true, data })
}

// 3. GET /check-code?code=
async function checkCode(req, res) {
  const data = await service.checkCode(req.query.code)
  res.json({ success: true, data })
}

// 4. POST /generate-password
async function generatePassword(req, res) {
  const data = await service.generatePassword(req.body.length)
  res.json({ success: true, data })
}

// 5. POST /logo (multipart field 'logo')
async function uploadLogo(req, res) {
  if (!req.file) throw new HttpError(400, 'A logo file is required')
  res.json({ success: true, data: { logo_url: '/uploads/' + req.file.filename } })
}

// 6. POST /drafts
async function createDraft(req, res) {
  const data = await service.createDraft(req.body, req.user.id)
  await audit(req, { action: 'onboarding.draft.create', entityType: 'onboarding_draft', entityId: data.id })
  res.status(201).json({ success: true, data })
}

// 7. GET /drafts
async function listDrafts(req, res) {
  const data = await service.listDrafts(req.user.id)
  res.json({ success: true, data })
}

// 8. GET /drafts/:id
async function getDraft(req, res) {
  const data = await service.getDraft(req.params.id, req.user.id)
  res.json({ success: true, data })
}

// 9. PUT /drafts/:id
async function updateDraft(req, res) {
  const data = await service.updateDraft(req.params.id, req.body, req.user.id)
  await audit(req, { action: 'onboarding.draft.update', entityType: 'onboarding_draft', entityId: data.id })
  res.json({ success: true, data })
}

// 10. DELETE /drafts/:id
async function deleteDraft(req, res) {
  await service.deleteDraft(req.params.id, req.user.id)
  await audit(req, { action: 'onboarding.draft.delete', entityType: 'onboarding_draft', entityId: req.params.id })
  res.json({ success: true, message: 'Draft deleted' })
}

// 11. POST /companies — Maker submits an onboarding request for approval.
// No provisioning / welcome email here; that happens at Super Admin activation.
async function createCompany(req, res) {
  const company = await service.submitCompany(req.body, req.user)
  await audit(req, {
    action: 'onboarding.company.submit',
    entityType: 'company',
    entityId: company.id,
    details: { name: company.name, code: company.code, status: company.status },
  })
  res.status(201).json({ success: true, data: { company } })
}

// 11b. PUT /companies/:id/resubmit — Maker resubmits after requested changes.
async function resubmitCompany(req, res) {
  const company = await service.resubmitCompany(req.params.id, req.body, req.user)
  await audit(req, {
    action: 'onboarding.company.resubmit',
    entityType: 'company',
    entityId: company.id,
    details: { name: company.name, code: company.code },
  })
  res.json({ success: true, data: { company } })
}

// 12. GET /invoices/:id
async function getInvoice(req, res) {
  const data = await service.getInvoice(req.params.id)
  res.json({ success: true, data })
}

// 13. GET /invoices/:id/html
async function getInvoiceHtml(req, res) {
  const html = await service.getInvoiceHtml(req.params.id)
  res.type('html').send(html)
}

module.exports = {
  meta,
  generateCode,
  checkCode,
  generatePassword,
  uploadLogo,
  createDraft,
  listDrafts,
  getDraft,
  updateDraft,
  deleteDraft,
  createCompany,
  resubmitCompany,
  getInvoice,
  getInvoiceHtml,
}
