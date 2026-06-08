/** Wrap an async controller so thrown errors reach the error handler. */
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
