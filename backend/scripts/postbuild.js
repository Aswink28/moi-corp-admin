// ─────────────────────────────────────────────────────────────────────────
// Post-build packaging step (runs after `ncc build`).
//
// Produces a self-contained, PORTABLE dist/ folder for the server:
//   dist/
//     index.js        ← bundled app (no hardcoded env values)
//     .env            ← the single env file — edit its values on the server
//     start.cmd       ← launcher: runs the app with NODE_ENV=production
//     DEPLOYMENT.md   ← deploy instructions
//
// Single-file model: there is ONE env file, `.env`. The build ships a copy of
// the project's `.env`; the deployment team edits its values on the server
// (DB, JWT, CORS, secrets). No per-environment files, no rebuild.
// ─────────────────────────────────────────────────────────────────────────
const fs   = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const dist = path.join(root, 'dist')

if (!fs.existsSync(dist)) {
  console.error('[postbuild] dist/ not found — run the ncc build first.')
  process.exit(1)
}

// 1. Strip stray logs / legacy or example env files that ncc may leave in dist.
for (const f of fs.readdirSync(dist)) {
  const isLog    = f.endsWith('.log') || f === 'logs'
  const isLegacy = f === '.env.example' || f === '.env.production' || f === '.env.local'
  if (isLog || isLegacy) {
    fs.rmSync(path.join(dist, f), { recursive: true, force: true })
  }
}

// 2. Copy the single `.env` into dist (edit its values on the server).
const envFile = path.join(root, '.env')
if (fs.existsSync(envFile)) {
  fs.copyFileSync(envFile, path.join(dist, '.env'))
  console.log('[postbuild] bundled .env')
} else {
  console.warn('[postbuild] WARNING: .env missing — not bundled')
}

// 3. Generate the Windows launcher (runs the bundled app in production mode).
const launcher = `@echo off
REM Launch the Company Admin Portal backend.
REM Edit .env (next to this file) for all configuration.
setlocal
cd /d "%~dp0"
set NODE_ENV=production
node index.js
`
fs.writeFileSync(path.join(dist, 'start.cmd'), launcher)
console.log('[postbuild] wrote start.cmd')

// 4. Copy the deployment guide.
const deployDoc = path.join(root, 'DEPLOYMENT.md')
if (fs.existsSync(deployDoc)) {
  fs.copyFileSync(deployDoc, path.join(dist, 'DEPLOYMENT.md'))
  console.log('[postbuild] bundled DEPLOYMENT.md')
}

console.log('[postbuild] portable dist/ ready.')
