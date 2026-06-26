import { useMemo } from 'react'
import {
  Card, Grid, Typography, Stack, Box, Divider, Chip, Avatar,
  FormControlLabel, Checkbox,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded'
import { assetBase } from '../../api/client'

const PLAN_LABELS = {
  trial: 'Trial', basic: 'Basic', professional: 'Professional', enterprise: 'Enterprise',
  monthly: 'Monthly', quarterly: 'Quarterly', half_yearly: 'Half-Yearly', annual: 'Annual',
  none: 'None', single: 'Single Level', multi: 'Multi Level',
}

const CURRENCY_SYMBOLS = { INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'AED', SGD: 'S$' }

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100
const money = (n, currency = 'INR') => {
  const symbol = CURRENCY_SYMBOLS[currency] || '₹'
  return `${symbol} ${round2(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
const label = (v) => PLAN_LABELS[v] || (v ? String(v) : '—')
const show = (v) => (v === 0 ? '0' : v ? String(v) : '—')

// Resolve a backend-served upload path (e.g. /uploads/logos/x.png) against the API origin.
function resolveLogoUrl(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${assetBase}${url.startsWith('/') ? '' : '/'}${url}`
}

function SectionCard({ title, subtitle, children }) {
  return (
    <Card sx={{ p: 2.5 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: subtitle ? 0.25 : 1.5 }}>{title}</Typography>
      {subtitle && (
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>{subtitle}</Typography>
      )}
      {children}
    </Card>
  )
}

function Field({ label: lbl, value, full }) {
  return (
    <Grid item xs={12} sm={full ? 12 : 6}>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: 0.2, display: 'block' }}>
        {lbl}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-word' }}>
        {value === undefined || value === null || value === '' ? '—' : value}
      </Typography>
    </Grid>
  )
}

export default function Step11Review({ data, setField, errors, meta, confirmed, onConfirmChange }) {
  const company = data?.company || {}
  const address = data?.address || {}
  const contact = data?.contact || {}
  const admin = data?.admin || {}
  const sub = data?.subscription || {}
  const billing = data?.billing || {}
  const wallet = data?.wallet || {}
  const approval = data?.approval || {}
  const branding = data?.branding || {}
  const modules = Array.isArray(data?.modules) ? data.modules : []

  const currency = sub.currency || company.currency || 'INR'
  const moduleLabels = useMemo(() => {
    const map = {}
    ;(meta?.modules || []).forEach((m) => { map[m.key] = m.label })
    return map
  }, [meta])

  // §E.3 computed amounts — mirror the server formula exactly.
  const { baseAmount, discountAmount, taxAmount, totalAmount } = useMemo(() => {
    const base = round2(sub.subscription_amount)
    const discount = round2(base * ((Number(sub.discount_percentage) || 0) / 100))
    const taxable = round2(base - discount)
    const tax = round2(taxable * ((Number(sub.tax_percentage) || 0) / 100))
    const total = round2(taxable + tax)
    return { baseAmount: base, discountAmount: discount, taxAmount: tax, totalAmount: total }
  }, [sub.subscription_amount, sub.discount_percentage, sub.tax_percentage])

  const enabledModules = modules.filter((m) => m?.enabled)
  const maskedPassword = admin.temp_password ? '•'.repeat(Math.min(admin.temp_password.length, 12)) : '—'
  const logoPreview = resolveLogoUrl(branding.logo_url)

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.25 }}>Review &amp; Submit</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Review every section below before creating the company. You can go back to any step to make changes.
        </Typography>
      </Box>

      <SectionCard title="Company Details">
        <Grid container spacing={2}>
          <Field label="Company Name" value={company.name} />
          <Field label="Company Code" value={company.code} />
          <Field label="Legal Entity Name" value={company.legal_name} />
          <Field label="Industry" value={company.industry} />
          <Field label="Registration Number" value={company.registration_number} />
          <Field label="GSTIN" value={company.gstin} />
          <Field label="PAN" value={company.pan} />
          <Field label="Website" value={company.website} />
          <Field label="Company Email" value={company.email} />
          <Field label="Company Phone" value={company.phone} />
          <Field label="Timezone" value={company.timezone} />
          <Field label="Currency" value={company.currency} />
          {company.description && <Field label="Description" value={company.description} full />}
          <Field
            label="Address"
            full
            value={[address.address_line1, address.address_line2, address.city, address.state, address.pincode, address.country]
              .filter(Boolean).join(', ') || '—'}
          />
        </Grid>
      </SectionCard>

      <SectionCard title="Contact Information">
        <Grid container spacing={2}>
          <Field label="Contact Name" value={contact.contact_name} />
          <Field label="Designation" value={contact.designation} />
          <Field label="Email" value={contact.email} />
          <Field label="Mobile" value={contact.mobile} />
          <Field label="Alternate Phone" value={contact.alternate_phone} />
          <Field label="Department" value={contact.department} />
        </Grid>
      </SectionCard>

      <SectionCard title="Admin Account">
        <Grid container spacing={2}>
          <Field label="Admin Name" value={admin.name} />
          <Field label="Employee ID" value={admin.employee_id} />
          <Field label="Email" value={admin.email} />
          <Field label="Username" value={admin.username} />
          <Field label="Mobile" value={admin.phone} />
          <Field label="Role" value={admin.role} />
          <Field label="Temporary Password" value={maskedPassword} />
          <Field label="Force Password Reset" value={admin.force_password_reset ? 'Yes' : 'No'} />
        </Grid>
      </SectionCard>

      <SectionCard title="Subscription">
        <Grid container spacing={2}>
          <Field label="Plan Tier" value={label(sub.plan_tier)} />
          <Field label="Billing Cycle" value={label(sub.billing_cycle)} />
          <Field label="Licensed Users" value={show(sub.licensed_users)} />
          <Field label="Auto Renewal" value={sub.auto_renewal ? 'Yes' : 'No'} />
          <Field label="Contract Start" value={sub.contract_start_date} />
          <Field label="Contract End" value={sub.contract_end_date} />
          <Field label="Tax Percentage" value={sub.tax_percentage != null && sub.tax_percentage !== '' ? `${Number(sub.tax_percentage)}%` : '—'} />
          <Field label="Discount Percentage" value={sub.discount_percentage != null && sub.discount_percentage !== '' ? `${Number(sub.discount_percentage)}%` : '—'} />
        </Grid>

        <Box
          sx={{
            mt: 2, p: 2, borderRadius: 2,
            border: (t) => `1px solid ${alpha(t.palette.primary.main, 0.2)}`,
            bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
          }}
        >
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: 0.2 }}>
            ORDER SUMMARY
          </Typography>
          <Stack spacing={1} sx={{ mt: 1 }}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>Base Amount</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{money(baseAmount, currency)}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Discount{Number(sub.discount_percentage) ? ` (${Number(sub.discount_percentage)}%)` : ''}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>- {money(discountAmount, currency)}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Tax{Number(sub.tax_percentage) ? ` (${Number(sub.tax_percentage)}%)` : ''}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{money(taxAmount, currency)}</Typography>
            </Stack>
            <Divider />
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Total Amount</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>{money(totalAmount, currency)}</Typography>
            </Stack>
          </Stack>
        </Box>
      </SectionCard>

      <SectionCard title="Billing">
        <Grid container spacing={2}>
          <Field label="Billing Contact Name" value={billing.billing_contact_name} />
          <Field label="Billing Email" value={billing.billing_email} />
          <Field label="Billing Mobile" value={billing.billing_mobile} />
          <Field label="PO Number" value={billing.po_number} />
          <Field label="GSTIN" value={billing.gstin} />
          <Field label="PAN" value={billing.pan} />
          <Field label="Vendor Code" value={billing.vendor_code} />
          <Field label="Billing Address" value={billing.billing_address} full />
        </Grid>
      </SectionCard>

      <SectionCard title="Wallet">
        <Grid container spacing={2}>
          <Field label="Wallet Enabled" value={wallet.wallet_enabled !== false ? 'Yes' : 'No'} />
          <Field label="Initial Balance" value={money(wallet.initial_balance, currency)} />
          <Field label="Credit Limit" value={money(wallet.credit_limit, currency)} />
          <Field label="Low Balance Threshold" value={money(wallet.low_balance_threshold, currency)} />
          <Field label="Auto Recharge" value={wallet.auto_recharge_enabled ? 'Yes' : 'No'} />
        </Grid>
      </SectionCard>

      <SectionCard title="Enabled Modules">
        {enabledModules.length ? (
          <Stack direction="row" useFlexGap flexWrap="wrap" spacing={1}>
            {enabledModules.map((m) => (
              <Chip
                key={m.module_key}
                label={`${moduleLabels[m.module_key] || m.module_key}${Number(m.price) ? ` · ${money(m.price, currency)}` : ''}`}
                sx={{
                  fontWeight: 600,
                  bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
                  color: 'primary.main',
                }}
              />
            ))}
          </Stack>
        ) : (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>No modules enabled.</Typography>
        )}
      </SectionCard>

      <SectionCard title="Approval">
        <Grid container spacing={2}>
          <Field label="Approval Required" value={approval.approval_required ? 'Yes' : 'No'} />
          <Field label="Approval Type" value={label(approval.approval_type)} />
          <Field label="Approval Levels" value={Array.isArray(approval.levels) ? show(approval.levels.length) : '—'} />
        </Grid>
      </SectionCard>

      <SectionCard title="Branding">
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm="auto">
            <Avatar
              src={logoPreview || undefined}
              variant="rounded"
              sx={{
                width: 64, height: 64,
                bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
                color: 'primary.main',
              }}
            >
              {!logoPreview && <BusinessRoundedIcon />}
            </Avatar>
          </Grid>
          <Field label="Primary Color" value={branding.primary_color} />
          <Field label="Secondary Color" value={branding.secondary_color} />
          <Field label="Email Domain" value={branding.email_domain} />
        </Grid>
      </SectionCard>

      <Box
        sx={{
          p: 2, borderRadius: 2,
          border: (t) => `1px solid ${errors?.confirmed ? t.palette.error.main : alpha(t.palette.primary.main, 0.2)}`,
          bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
        }}
      >
        <FormControlLabel
          control={(
            <Checkbox
              checked={!!confirmed}
              onChange={(e) => onConfirmChange?.(e.target.checked)}
            />
          )}
          label={<Typography variant="body2" sx={{ fontWeight: 600 }}>I confirm all information is correct.</Typography>}
        />
        {errors?.confirmed && (
          <Typography variant="caption" sx={{ display: 'block', color: 'error.main', ml: 4 }}>
            {errors.confirmed}
          </Typography>
        )}
      </Box>
    </Stack>
  )
}
