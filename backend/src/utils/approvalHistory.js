/**
 * Append a row to the company_approval_history audit trail.
 * `exec` may be the shared pool or a transaction client (both expose .query).
 */
async function recordHistory(exec, { companyId, action, fromStatus, toStatus, actor = {}, notes }) {
  await exec.query(
    `INSERT INTO company_approval_history
       (company_id, action, from_status, to_status, actor_id, actor_name, actor_email, actor_role, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      companyId,
      action,
      fromStatus || null,
      toStatus || null,
      actor.id || null,
      actor.name || null,
      actor.email || null,
      actor.role || null,
      notes || null,
    ]
  )
}

module.exports = { recordHistory }
