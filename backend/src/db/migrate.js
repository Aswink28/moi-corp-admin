/**
 * Migration runner — creates the company_admin_db schema.
 *
 * It first ensures the target database exists (connecting to the default
 * "postgres" database to CREATE DATABASE if missing), then applies schema.sql.
 *
 * Usage: npm run migrate
 */
const fs = require('fs')
const path = require('path')
const { Client } = require('pg')
const config = require('../config/env')

async function ensureDatabaseExists() {
  if (config.db.connectionString) return // managed/cloud DB — assume it exists
  const admin = new Client({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: 'postgres',
  })
  await admin.connect()
  const { rows } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [
    config.db.database,
  ])
  if (rows.length === 0) {
    await admin.query(`CREATE DATABASE "${config.db.database}"`)
    console.log(`[migrate] created database "${config.db.database}"`)
  } else {
    console.log(`[migrate] database "${config.db.database}" already exists`)
  }
  await admin.end()
}

async function applySchema() {
  const { pool } = require('../config/db')
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')
  await pool.query(sql)
  console.log('[migrate] schema applied')
  await pool.end()
}

;(async () => {
  try {
    await ensureDatabaseExists()
    await applySchema()
    console.log('[migrate] done ✅')
    process.exit(0)
  } catch (err) {
    console.error('[migrate] failed ❌', err.message)
    process.exit(1)
  }
})()
