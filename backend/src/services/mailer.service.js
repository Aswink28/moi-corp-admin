/**
 * Mailer service.
 * Uses nodemailer SMTP transport when SMTP_HOST is set; otherwise a console
 * transport that logs the full rendered email (dev). Transporter is lazily created.
 */
const nodemailer = require('nodemailer')

let _transporter = null
let _transport = null // 'smtp' | 'console'

function getTransporter() {
  if (_transporter) return _transporter

  if (process.env.SMTP_HOST) {
    const port = parseInt(process.env.SMTP_PORT || '587', 10)
    _transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth:
        process.env.SMTP_USER || process.env.SMTP_PASS
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
    })
    _transport = 'smtp'
  } else {
    // Console transport — renders the message and logs it instead of sending.
    _transporter = nodemailer.createTransport({ jsonTransport: true })
    _transport = 'console'
  }

  return _transporter
}

function renderWelcomeHtml({ name, companyName, username, tempPassword, loginUrl }) {
  return `<!doctype html>
<html>
  <body style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;line-height:1.6">
    <h2 style="color:#4f46e5">Welcome to ${companyName}</h2>
    <p>Hi ${name},</p>
    <p>An administrator account has been created for you on the ${companyName} portal.</p>
    <table style="border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Username</td><td style="padding:4px 0"><strong>${username}</strong></td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Temporary password</td><td style="padding:4px 0"><strong>${tempPassword}</strong></td></tr>
    </table>
    <p>Please sign in and change your password on first login.</p>
    <p><a href="${loginUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">Sign in</a></p>
    <p style="color:#6b7280;font-size:12px;margin-top:24px">If the button does not work, open: ${loginUrl}</p>
  </body>
</html>`
}

function renderWelcomeText({ name, companyName, username, tempPassword, loginUrl }) {
  return [
    `Welcome to ${companyName}`,
    ``,
    `Hi ${name},`,
    ``,
    `An administrator account has been created for you on the ${companyName} portal.`,
    ``,
    `Username: ${username}`,
    `Temporary password: ${tempPassword}`,
    ``,
    `Please sign in and change your password on first login.`,
    `Sign in: ${loginUrl}`,
  ].join('\n')
}

/**
 * Send the welcome email to a newly-onboarded company admin.
 * Console transport in dev (logs the full rendered email); SMTP when env SMTP_HOST is set.
 * @param {object} p { to, name, companyName, username, tempPassword, loginUrl }
 * @returns {Promise<{ delivered: boolean, transport: 'smtp' | 'console' }>}
 */
async function sendWelcomeEmail({ to, name, companyName, username, tempPassword, loginUrl }) {
  const transporter = getTransporter()
  const transport = _transport

  const subject = `Welcome to ${companyName} — your admin account`
  const html = renderWelcomeHtml({ name, companyName, username, tempPassword, loginUrl })
  const text = renderWelcomeText({ name, companyName, username, tempPassword, loginUrl })
  const from = process.env.SMTP_FROM || 'no-reply@company-admin.local'

  const message = { from, to, subject, text, html }

  if (transport === 'console') {
    // eslint-disable-next-line no-console
    console.log(
      [
        '──────────── [mailer] welcome email (console transport) ────────────',
        `From:    ${from}`,
        `To:      ${to}`,
        `Subject: ${subject}`,
        '',
        text,
        '────────────────────────────────────────────────────────────────────',
      ].join('\n')
    )
    // Still run it through nodemailer's json transport so behaviour matches SMTP path.
    await transporter.sendMail(message)
    return { delivered: true, transport: 'console' }
  }

  await transporter.sendMail(message)
  return { delivered: true, transport: 'smtp' }
}

module.exports = { sendWelcomeEmail }
