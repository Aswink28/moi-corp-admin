const approvals = require('../services/approvals.service')
const onboarding = require('../services/onboarding.service')
const mailer = require('../services/mailer.service')
const { audit } = require('../utils/audit')

// GET /approvals/queue?all=true
async function queue(req, res) {
  const data = await approvals.listQueue(req.user, { all: req.query.all === 'true' })
  res.json({ success: true, data })
}

// GET /approvals/:id  → company workflow record + full history
async function getWorkflow(req, res) {
  const data = await approvals.getWorkflow(req.params.id)
  res.json({ success: true, data })
}

// GET /approvals/:id/history
async function history(req, res) {
  const data = await approvals.getHistory(req.params.id)
  res.json({ success: true, data })
}

// Helper: run a transition, audit it, return the updated row.
function action(serviceFn, auditAction) {
  return async (req, res) => {
    const company = await serviceFn(req.params.id, req.user, req.body.notes)
    await audit(req, {
      action: auditAction,
      entityType: 'company',
      entityId: company.id,
      details: { status: company.status, notes: req.body.notes || null },
    })
    res.json({ success: true, data: company })
  }
}

// ── Checker actions ──────────────────────────────────────────────────────────
const startReview = action((id, user) => approvals.startReview(id, user), 'company.start_review')
const checkerApprove = action((id, user, n) => approvals.checkerApprove(id, user, n), 'company.checker_approve')
const requestChanges = action((id, user, n) => approvals.requestChanges(id, user, n), 'company.request_changes')
const checkerReject = action((id, user, n) => approvals.checkerReject(id, user, n), 'company.checker_reject')

// ── Super Admin actions ──────────────────────────────────────────────────────
const reject = action((id, user, n) => approvals.superReject(id, user, n), 'company.reject')
const suspend = action((id, user, n) => approvals.suspend(id, user, n), 'company.suspend')
const reactivate = action((id, user, n) => approvals.reactivate(id, user, n), 'company.reactivate')

// POST /approvals/:id/activate?sendWelcomeEmail=true|false  (Super Admin)
async function activate(req, res) {
  const data = await onboarding.activateCompany(req.params.id, req.user, {
    sendWelcomeEmail: req.query.sendWelcomeEmail !== 'false',
  })
  await audit(req, {
    action: 'company.activate',
    entityType: 'company',
    entityId: data.company.id,
    details: { name: data.company.name, code: data.company.code },
  })

  let email = null
  if (req.query.sendWelcomeEmail !== 'false') {
    try {
      email = await mailer.sendWelcomeEmail({
        to: data.admin.email,
        name: data.admin.name,
        companyName: data.company.name,
        username: data.admin.username,
        tempPassword: data.admin.temp_password,
        loginUrl: process.env.COMPANY_APP_URL || '',
      })
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[approvals] welcome email failed:', err.message)
      email = { delivered: false, transport: 'console' }
    }
  }

  res.json({ success: true, data: { ...data, email, emailDelivered: email ? email.delivered : false } })
}

module.exports = {
  queue,
  getWorkflow,
  history,
  startReview,
  checkerApprove,
  requestChanges,
  checkerReject,
  reject,
  suspend,
  reactivate,
  activate,
}
