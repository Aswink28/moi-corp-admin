const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')

const config = require('./config/env')
const routes = require('./routes')
const { notFound, errorHandler } = require('./middleware/error')
const { UPLOAD_DIR } = require('./middleware/upload')

const app = express()

app.use(helmet())
app.use(
  cors({
    origin: (origin, cb) => {
      // allow same-origin / curl (no origin) and whitelisted frontends
      if (!origin || config.corsOrigins.includes(origin)) return cb(null, true)
      cb(new Error(`Origin ${origin} not allowed by CORS`))
    },
    credentials: true,
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

app.use('/api', routes)

app.use(notFound)
app.use(errorHandler)

module.exports = app
