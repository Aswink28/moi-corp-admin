/** 404 handler. */
function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.path}` })
}

/** Central error handler. Maps known errors to clean responses. */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500
  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error('[error]', err.stack || err.message)
  }
  // Postgres unique-violation → 409
  if (err.code === '23505') {
    return res.status(409).json({ success: false, message: 'A record with that value already exists' })
  }
  res.status(status).json({
    success: false,
    message: err.expose || status < 500 ? err.message : 'Internal server error',
  })
}

/** Helper to throw HTTP errors from services/controllers. */
class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
    this.expose = true
  }
}

module.exports = { notFound, errorHandler, HttpError }
