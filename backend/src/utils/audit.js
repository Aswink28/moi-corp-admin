const { pool } = require('../config/db')

/**
 * Record an audit log entry. Never throws — auditing must not break a request.
 * @param {object} req     express request (for actor + ip)
 * @param {object} entry   { action, entityType, entityId, details }
 */
async function audit(req, { action, entityType = null, entityId = null, details = null }) {
  try {
    const actor = req.user || {}
    await pool.query(
      `INSERT INTO audit_logs (actor_id, actor_email, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        actor.id || null,
        actor.email || null,
        action,
        entityType,
        entityId,
        details ? JSON.stringify(details) : null,
        req.ip || req.headers['x-forwarded-for'] || null,
      ]
    )
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[audit] failed to write log:', err.message)
  }
}

module.exports = { audit }
