/**
 * Derive a company code from the name: uppercase, alphanumerics only, max 12 chars.
 * e.g. "Tata Consultancy Services" -> "TATACONSULT"
 */
function companyCodeFromName(name) {
  return String(name || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 12)
}

/**
 * Unique invoice number, e.g. "INV-2026-3F9A1C".
 * Format: INV-<4-digit-year>-<6 uppercase hex chars>.
 * Runs in normal Node runtime; may use Date and Math.random / crypto freely.
 */
function invoiceNumber() {
  const year = new Date().getFullYear()
  let hex = ''
  for (let i = 0; i < 6; i++) {
    hex += Math.floor(Math.random() * 16).toString(16)
  }
  return `INV-${year}-${hex.toUpperCase()}`
}

module.exports = { companyCodeFromName, invoiceNumber }
