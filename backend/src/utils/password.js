const bcrypt = require('bcryptjs')

const ROUNDS = 10

function hash(plain) {
  return bcrypt.hash(plain, ROUNDS)
}

function compare(plain, hashed) {
  return bcrypt.compare(plain, hashed)
}

/** Generate a random temporary password (used for resets). */
function randomPassword(len = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$'
  let out = ''
  // Math.random is fine for a temporary password the admin immediately shares.
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

module.exports = { hash, compare, randomPassword }
