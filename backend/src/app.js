const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const swaggerUi = require('swagger-ui-express')

const config = require('./config/env')
const routes = require('./routes')
const lenderRoutes = require('./routes/lender.routes')
const openapiSpec = require('./docs/openapi')
const { notFound, errorHandler } = require('./middleware/error')
const { UPLOAD_DIR } = require('./middleware/upload')

const app = express()

// Helmet's defaults assume HTTPS. Over plain HTTP (internal LAN-IP access +
// self-hosted Swagger UI), HSTS and CSP's `upgrade-insecure-requests` make the
// browser rewrite asset URLs to https:// — which fails with no TLS. So:
//  - CSP is off (the API returns JSON; Swagger UI needs inline scripts anyway),
//  - HSTS / COOP / Origin-Agent-Cluster are enabled only when HTTPS_ENABLED.
// Run behind an HTTPS reverse proxy and set HTTPS_ENABLED=true to restore them.
app.use(
  helmet({
    contentSecurityPolicy: false,
    hsts: config.httpsEnabled,
    crossOriginOpenerPolicy: config.httpsEnabled,
    originAgentCluster: config.httpsEnabled,
  })
)

// CORS. The API also serves its own Swagger UI, which can be opened on any host
// the server is reachable by (localhost, 127.0.0.1, a LAN IP, or a domain). We
// allow:
//   - requests with no Origin (curl / server-to-server — CORS doesn't apply),
//   - same-origin requests (the docs page calling its own API, any host),
//   - explicitly whitelisted frontend origins (CORS_ORIGINS env).
app.use(
  cors((req, cb) => {
    const origin = req.header('Origin')
    let allowed = false
    if (!origin) {
      allowed = true
    } else if (config.corsOrigins.includes(origin)) {
      allowed = true
    } else {
      // same-origin: the Origin's host:port matches the host this request came in on
      try { allowed = new URL(origin).host === req.headers.host } catch { /* malformed origin */ }
    }
    cb(
      allowed ? null : new Error(`Origin ${origin} not allowed by CORS`),
      { origin: allowed, credentials: true }
    )
  })
)
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))
if (config.env !== 'test') app.use(morgan('dev'))

// Static-serve uploaded assets (logos, etc.)
app.use('/uploads', express.static(UPLOAD_DIR))

// Basic rate limit on auth to slow brute force
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 50 }))

app.get('/health', (req, res) => res.json({ success: true, service: 'company-admin-backend', ts: Date.now() }))

// ── API docs (Swagger UI) ──────────────────────────────────────────────────
// Public, read-only documentation. (CSP is already disabled globally above,
// which is what Swagger UI's inline bootstrap script needs.)
app.get('/api-docs.json', (req, res) => res.json(openapiSpec))
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(openapiSpec, {
    explorer: true,
    customSiteTitle: 'Company Admin API — Docs',
    swaggerOptions: { persistAuthorization: true },
  })
)

// Lender Portal API — mounted before the Super-Admin-gated /api router so it
// uses its own API-key auth (see lender.routes.js), not the portal JWT.
app.use('/api/lender', lenderRoutes)

app.use('/api', routes)

app.use(notFound)
app.use(errorHandler)

module.exports = app
