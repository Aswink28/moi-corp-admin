const { verify } = require('../utils/jwt')
const { pool } = require('../config/db')

/**
 * Require a valid Super Admin JWT. Attaches req.user = { id, email, role, name }.
 */
async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    if (!header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Missing bearer token' })
    }
    const decoded = verify(header.slice(7))
    const { rows } = await pool.query(
      'SELECT id, name, email, role, is_active FROM super_admins WHERE id = $1',
      [decoded.id]
    )
    if (!rows.length || !rows[0].is_active) {
      return res.status(401).json({ success: false, message: 'Account not found or inactive' })
    }
    req.user = rows[0]
    next()
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: err.name === 'TokenExpiredError' ? 'Session expired' : 'Invalid token',
    })
  }
}

/** Restrict a route to specific portal roles. */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }
    next()
  }
}

module.exports = { authenticate, authorize }
