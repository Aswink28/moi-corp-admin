/**
 * Multer upload middleware (disk storage).
 * Stores images under UPLOAD_DIR (env) or '<backend>/uploads', creating the dir if missing.
 * Filename = `<timestamp>-<original>`. Images only, 2 MB limit.
 */
const fs = require('fs')
const path = require('path')
const multer = require('multer')

const { HttpError } = require('./error')

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'uploads')

// Ensure the upload directory exists.
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const ALLOWED_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/svg+xml',
  'image/webp',
  'image/gif',
])

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^\w.\-]+/g, '_')
    cb(null, `${Date.now()}-${safe}`)
  },
})

function fileFilter(req, file, cb) {
  if (ALLOWED_MIME.has(file.mimetype)) return cb(null, true)
  cb(new HttpError(400, 'Unsupported image type'))
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
})

module.exports = { upload, UPLOAD_DIR }
