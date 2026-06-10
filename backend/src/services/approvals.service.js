/**
 * 3-Level Approval Workflow state machine (Maker → Checker → Super Admin).
 *
 *   draft → submitted → under_checker_review → (checker)
 *     ├─ request_changes → changes_requested → (maker resubmit) → submitted
 *     ├─ reject          → rejected
 *     └─ checker_approve → pending_super_admin_approval → (super admin)
 *           ├─ reject   → rejected
 *           └─ activate → active  (provisioning happens in onboarding.service)
 *   active ⇄ suspended  (super admin suspend / reactivate)
 *
 * Provisioning (admin account, wallet, invoice, final code) is deferred to the
 * Super Admin activation step — see onboarding.service.activateCompany.
 */
const { pool, withTransaction } = require('../config/db')
const { HttpError } = require('../middleware/error')
const { recordHistory } = require('../utils/approvalHistory')

const CHECKER_QUEUE = ['submitted', 'under_checker_review']
const SUPER_ADMIN_QUEUE = ['checker_approved', 'pending_super_admin_approval']

// Joins maker/checker/super-admin display names onto each company row.
const WORKFLOW_SELECT = `
  SELECT c.id, c.name, c.code, c.status, c.industry, c.email, c.review_notes,
         c.created_by, c.submitted_by, c.reviewed_by, c.approved_by, c.provisioned,
         c.product_provisioned, c.product_provisioned_at, c.product_provision_error, c.product_company_id,
         c.submitted_at, c.reviewed_at, c.approved_at, c.created_at, c.updated_at,
         mk.name AS maker_name,    mk.email AS maker_email,
         ck.name AS checker_name,  ck.email AS checker_email,
         sa.name AS approver_name, sa.email AS approver_email,
         (SELECT total_amount FROM company_subscriptions s
            WHERE s.company_id = c.id ORDER BY s.created_at DESC LIMIT 1) AS subscription_amount
    FROM companies c
    LEFT JOIN super_admins mk ON mk.id = c.submitted_by
    LEFT JOIN super_admins ck ON ck.id = c.reviewed_by
    LEFT JOIN super_admins sa ON sa.id = c.approved_by
`

/** Role-scoped work queue. Makers see their own records; checkers/super admins see their stage. */
async function listQueue(user, { all = false } = {}) {
  const params = []
  let where = ''
  if (user.role === 'maker') {
    params.push(user.id)
    where = `WHERE c.submitted_by = $1 OR c.created_by = $1`
  } else if (user.role === 'checker') {
    where = `WHERE c.status = ANY($1)`
    params.push(CHECKER_QUEUE)
  } else {
    // super_admin / admin
    if (!all) {
      where = `WHERE c.status = ANY($1)`
      params.push(SUPER_ADMIN_QUEUE)
    }
  }
  const { rows } = await pool.query(`${WORKFLOW_SELECT} ${where} ORDER BY c.updated_at DESC`, params)
  return rows
}

async function getHistory(companyId) {
  const { rows } = await pool.query(
    `SELECT * FROM company_approval_history WHERE company_id = $1 ORDER BY created_at ASC`,
    [companyId]
  )
  return rows
}

/**
 * Company workflow detail for the side-by-side review screen: the record (with
 * actor names), the FULL submitted onboarding payload, uploaded documents, the
 * approval history, and the entity's audit-log trail.
 */
async function getWorkflow(companyId) {
  const { rows } = await pool.query(`${WORKFLOW_SELECT} WHERE c.id = $1`, [companyId])
  if (!rows.length) throw new HttpError(404, 'Company not found')

  const [history, payloadRes, auditRes] = await Promise.all([
    getHistory(companyId),
    pool.query('SELECT onboarding_payload FROM companies WHERE id = $1', [companyId]),
    pool.query(
      `SELECT id, action, actor_email, details, ip_address, created_at
         FROM audit_logs
        WHERE entity_type = 'company' AND entity_id = $1
        ORDER BY created_at DESC
        LIMIT 100`,
      [companyId]
    ),
  ])

  return {
    ...rows[0],
    onboarding_payload: (payloadRes.rows[0] && payloadRes.rows[0].onboarding_payload) || null,
    history,
    audit: auditRes.rows,
  }
}

async function loadStatus(client, companyId) {
  const { rows } = await client.query('SELECT id, status FROM companies WHERE id = $1', [companyId])
  if (!rows.length) throw new HttpError(404, 'Company not found')
  return rows[0]
}

/**
 * Generic guarded transition: validates the current status, updates status (+
 * optional actor column/timestamp + notes) and appends an approval-history row.
 */
async function transition(companyId, user, { allowedFrom, toStatus, action, actorField, notes }) {
  return withTransaction(async (client) => {
    const c = await loadStatus(client, companyId)
    if (!allowedFrom.includes(c.status)) {
      throw new HttpError(409, `This action is not allowed while the company is "${c.status}".`)
    }
    const sets = ['status = $1', 'updated_at = now()']
    const params = [toStatus]
    if (actorField) {
      params.push(user.id)
      sets.push(`${actorField.idCol} = $${params.length}`)
      sets.push(`${actorField.atCol} = now()`)
    }
    if (notes != null && notes !== '') {
      params.push(notes)
      sets.push(`review_notes = $${params.length}`)
    }
    params.push(companyId)
    const { rows } = await client.query(
      `UPDATE companies SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    )
    await recordHistory(client, {
      companyId,
      action,
      fromStatus: c.status,
      toStatus,
      actor: user,
      notes,
    })
    return rows[0]
  })
}

const CHECKER = { idCol: 'reviewed_by', atCol: 'reviewed_at' }
const SUPER = { idCol: 'approved_by', atCol: 'approved_at' }

// ── Checker actions ──────────────────────────────────────────────────────────
const startReview = (id, user) =>
  transition(id, user, { allowedFrom: ['submitted'], toStatus: 'under_checker_review', action: 'start_review', actorField: CHECKER })

const checkerApprove = (id, user, notes) =>
  transition(id, user, { allowedFrom: CHECKER_QUEUE, toStatus: 'pending_super_admin_approval', action: 'checker_approve', actorField: CHECKER, notes })

const requestChanges = (id, user, notes) =>
  transition(id, user, { allowedFrom: CHECKER_QUEUE, toStatus: 'changes_requested', action: 'request_changes', actorField: CHECKER, notes })

const checkerReject = (id, user, notes) =>
  transition(id, user, { allowedFrom: CHECKER_QUEUE, toStatus: 'rejected', action: 'reject', actorField: CHECKER, notes })

// ── Super Admin actions (activation lives in onboarding.service) ──────────────
const superReject = (id, user, notes) =>
  transition(id, user, { allowedFrom: SUPER_ADMIN_QUEUE, toStatus: 'rejected', action: 'reject', actorField: SUPER, notes })

const suspend = (id, user, notes) =>
  transition(id, user, { allowedFrom: ['active'], toStatus: 'suspended', action: 'suspend', actorField: SUPER, notes })

const reactivate = (id, user, notes) =>
  transition(id, user, { allowedFrom: ['suspended'], toStatus: 'active', action: 'reactivate', actorField: SUPER, notes })

module.exports = {
  CHECKER_QUEUE,
  SUPER_ADMIN_QUEUE,
  listQueue,
  getHistory,
  getWorkflow,
  startReview,
  checkerApprove,
  requestChanges,
  checkerReject,
  superReject,
  suspend,
  reactivate,
}
