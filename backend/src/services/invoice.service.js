/**
 * Invoice service.
 * Builds a company_invoices record from a subscription + company, and renders an
 * invoice row to a standalone HTML document.
 */
const { invoiceNumber } = require('../utils/codegen')

/** Round to 2 decimals, coercing nullish/NaN to 0. */
function money(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return 0
  return Math.round((v + Number.EPSILON) * 100) / 100
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const CYCLE_LABELS = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  half_yearly: 'Half-yearly',
  annual: 'Annual',
}

/**
 * Build a record matching the company_invoices columns from a subscription + company.
 * Uses invoiceNumber() from codegen for invoice_number.
 * @param {object} args { subscription, company }
 * @returns {object} {
 *   company_id, invoice_number, subscription_id, base_amount, tax_amount,
 *   discount_amount, total_amount, currency, status, due_date, line_items, issued_at
 * }
 */
function buildInvoiceRecord({ subscription, company }) {
  const sub = subscription || {}
  const comp = company || {}

  // Compute amounts per the contract §E.3 formula (authoritative server-side).
  const base = money(sub.base_amount)
  const discountPct = Number(sub.discount_percentage) || 0
  const taxPct = Number(sub.tax_percentage) || 0

  const discountAmount = money(base * (discountPct / 100))
  const taxable = money(base - discountAmount)
  // Prefer explicit subscription values when present, else derive.
  const taxAmount =
    sub.tax_amount != null ? money(sub.tax_amount) : money(taxable * (taxPct / 100))
  const totalAmount =
    sub.total_amount != null ? money(sub.total_amount) : money(taxable + taxAmount)

  const currency = sub.currency || comp.currency || 'INR'

  const issuedAt = new Date()
  // Default due date: 15 days from issue.
  const due = new Date(issuedAt)
  due.setDate(due.getDate() + 15)

  const cycle = sub.billing_cycle || ''
  const lineDesc =
    `${sub.plan_tier ? sub.plan_tier[0].toUpperCase() + sub.plan_tier.slice(1) : 'Subscription'}` +
    `${cycle ? ` — ${CYCLE_LABELS[cycle] || cycle}` : ''}` +
    `${sub.licensed_users ? ` (${sub.licensed_users} user${sub.licensed_users > 1 ? 's' : ''})` : ''}`

  const lineItems = [
    {
      description: lineDesc,
      plan_tier: sub.plan_tier || null,
      billing_cycle: cycle || null,
      licensed_users: sub.licensed_users != null ? Number(sub.licensed_users) : null,
      quantity: 1,
      unit_amount: base,
      amount: base,
    },
  ]

  return {
    company_id: comp.id,
    invoice_number: invoiceNumber(),
    subscription_id: sub.id || null,
    base_amount: base,
    tax_amount: taxAmount,
    discount_amount: discountAmount,
    total_amount: totalAmount,
    currency,
    status: 'issued',
    due_date: due.toISOString().slice(0, 10),
    line_items: lineItems,
    issued_at: issuedAt.toISOString(),
  }
}

function fmtMoney(currency, amount) {
  return `${escapeHtml(currency || 'INR')} ${money(amount).toFixed(2)}`
}

function companyAddress(company) {
  const c = company || {}
  const parts = [
    c.address_line1,
    c.address_line2,
    c.city,
    c.state,
    c.pincode,
    c.country,
  ].filter(Boolean)
  return parts.map(escapeHtml).join(', ')
}

/**
 * Render an invoice row (a company_invoices row) + company into a standalone HTML string.
 * @param {object} invoiceRow  a company_invoices row
 * @param {object} company     the companies row
 * @returns {string} full HTML document
 */
function renderInvoiceHtml(invoiceRow, company) {
  const inv = invoiceRow || {}
  const comp = company || {}
  const currency = inv.currency || comp.currency || 'INR'

  let items = inv.line_items
  if (typeof items === 'string') {
    try {
      items = JSON.parse(items)
    } catch (_e) {
      items = []
    }
  }
  if (!Array.isArray(items)) items = []

  const issued = inv.issued_at ? new Date(inv.issued_at).toISOString().slice(0, 10) : ''
  const due = inv.due_date ? String(inv.due_date).slice(0, 10) : ''

  const rows = items
    .map(
      (it) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${escapeHtml(it.description || '')}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center">${escapeHtml(it.quantity != null ? it.quantity : 1)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right">${fmtMoney(currency, it.amount != null ? it.amount : it.unit_amount)}</td>
      </tr>`
    )
    .join('')

  const taxLine = `<tr>
        <td style="padding:6px 12px;text-align:right;color:#6b7280">Tax</td>
        <td style="padding:6px 12px;text-align:right">${fmtMoney(currency, inv.tax_amount)}</td>
      </tr>`
  const discountLine =
    money(inv.discount_amount) > 0
      ? `<tr>
        <td style="padding:6px 12px;text-align:right;color:#6b7280">Discount</td>
        <td style="padding:6px 12px;text-align:right">- ${fmtMoney(currency, inv.discount_amount)}</td>
      </tr>`
      : ''

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Invoice ${escapeHtml(inv.invoice_number || '')}</title>
</head>
<body style="margin:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#1f2937">
  <div style="max-width:760px;margin:24px auto;background:#fff;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden">
    <div style="padding:24px 32px;background:#4f46e5;color:#fff;display:flex;justify-content:space-between">
      <div>
        <h1 style="margin:0;font-size:22px">INVOICE</h1>
        <div style="opacity:.9;font-size:13px">#${escapeHtml(inv.invoice_number || '')}</div>
      </div>
      <div style="text-align:right;font-size:13px">
        <div>Issued: ${escapeHtml(issued)}</div>
        <div>Due: ${escapeHtml(due)}</div>
        <div>Status: ${escapeHtml(inv.status || '')}</div>
      </div>
    </div>

    <div style="padding:24px 32px">
      <h2 style="margin:0 0 4px;font-size:16px">${escapeHtml(comp.name || '')}</h2>
      <div style="color:#6b7280;font-size:13px">${companyAddress(comp)}</div>
      <div style="color:#6b7280;font-size:13px;margin-top:6px">
        ${comp.gstin ? `GSTIN: ${escapeHtml(comp.gstin)}` : ''}
        ${comp.gstin && comp.pan ? ' &middot; ' : ''}
        ${comp.pan ? `PAN: ${escapeHtml(comp.pan)}` : ''}
      </div>

      <table style="width:100%;border-collapse:collapse;margin-top:24px;font-size:14px">
        <thead>
          <tr style="background:#f9fafb">
            <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb">Description</th>
            <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e5e7eb">Qty</th>
            <th style="padding:8px 12px;text-align:right;border-bottom:2px solid #e5e7eb">Amount</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <table style="width:100%;max-width:320px;margin-left:auto;margin-top:16px;border-collapse:collapse;font-size:14px">
        <tr>
          <td style="padding:6px 12px;text-align:right;color:#6b7280">Subtotal</td>
          <td style="padding:6px 12px;text-align:right">${fmtMoney(currency, inv.base_amount)}</td>
        </tr>
        ${discountLine}
        ${taxLine}
        <tr>
          <td style="padding:10px 12px;text-align:right;font-weight:bold;border-top:2px solid #e5e7eb">Total</td>
          <td style="padding:10px 12px;text-align:right;font-weight:bold;border-top:2px solid #e5e7eb">${fmtMoney(currency, inv.total_amount)}</td>
        </tr>
      </table>
    </div>

    <div style="padding:16px 32px;background:#f9fafb;color:#9ca3af;font-size:12px;text-align:center">
      This is a system-generated invoice.
    </div>
  </div>
</body>
</html>`
}

module.exports = { buildInvoiceRecord, renderInvoiceHtml }
