import { useEffect, useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Box, Grid, Typography, Stack,
  Button, TextField, Divider, IconButton, Avatar, CircularProgress, Tooltip,
  FormControlLabel, Checkbox, Chip, Link, useMediaQuery,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import RocketLaunchRoundedIcon from '@mui/icons-material/RocketLaunchRounded'
import EditNoteRoundedIcon from '@mui/icons-material/EditNoteRounded'
import BlockRoundedIcon from '@mui/icons-material/BlockRounded'
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded'
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded'
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded'
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded'
import ContactPhoneRoundedIcon from '@mui/icons-material/ContactPhoneRounded'
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded'
import CardMembershipRoundedIcon from '@mui/icons-material/CardMembershipRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded'
import PaletteRoundedIcon from '@mui/icons-material/PaletteRounded'
import ExtensionRoundedIcon from '@mui/icons-material/ExtensionRounded'
import { StatusBadge } from './ui'
import WorkflowTracker from './WorkflowTracker'
import { approvalsApi } from '../api/endpoints'
import { errMsg, assetBase } from '../api/client'
import { useToast } from '../context/ToastContext'
import { fmtMoney, fmtDate, fmtDateTime } from '../utils/format'
import { actionLabel } from '../constants/workflow'

// Resolve a backend-served upload path (/uploads/..) against the API origin.
function resolveUrl(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${assetBase}${url.startsWith('/') ? '' : '/'}${url}`
}

const blank = (v) => v === null || v === undefined || (typeof v === 'string' && v.trim() === '')
const yn = (v) => (v ? 'Yes' : 'No')

function Row({ label, children }) {
  return (
    <Box sx={{ display: 'flex', gap: 1, py: 0.4, alignItems: 'baseline' }}>
      <Typography sx={{ width: 130, flexShrink: 0, color: 'text.secondary', fontSize: 12.5, fontWeight: 600 }}>{label}</Typography>
      <Typography sx={{ fontSize: 13.5, fontWeight: 500, wordBreak: 'break-word' }}>{children}</Typography>
    </Box>
  )
}

function Section({ icon, title, rows, children }) {
  const theme = useTheme()
  const visible = (rows || []).filter((r) => r.always || !blank(r.value))
  if (!visible.length && !children) return null
  return (
    <Box sx={{ p: 1.75, borderRadius: 2, border: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <Box sx={{ color: 'primary.main', display: 'grid', placeItems: 'center', '& svg': { fontSize: 18 } }}>{icon}</Box>
        <Typography sx={{ fontWeight: 700, fontSize: 13.5 }}>{title}</Typography>
      </Stack>
      {visible.map((r) => (
        <Row key={r.label} label={r.label}>{blank(r.value) ? '—' : r.value}</Row>
      ))}
      {children}
    </Box>
  )
}

function Field({ label, children }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, fontSize: 10.5 }}>
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 600, fontSize: 13.5 }}>{children || '—'}</Typography>
    </Box>
  )
}

export default function CompanyWorkflowDialog({ companyId, role, open, onClose, onChanged }) {
  const { notify } = useToast()
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'))
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState('')
  const [sendEmail, setSendEmail] = useState(false)

  useEffect(() => {
    if (!open || !companyId) return
    setLoading(true)
    setNotes('')
    approvalsApi
      .get(companyId)
      .then(setData)
      .catch((e) => notify(errMsg(e), 'error'))
      .finally(() => setLoading(false))
  }, [open, companyId]) // eslint-disable-line

  async function run(key, fn, successMsg) {
    setBusy(key)
    try {
      await fn()
      notify(successMsg, 'success', { title: 'Done' })
      onChanged?.()
      onClose?.()
    } catch (e) {
      notify(errMsg(e), 'error')
    } finally {
      setBusy('')
    }
  }

  const status = data?.status
  const isChecker = role === 'checker' || role === 'super_admin' || role === 'admin'
  const isSuper = role === 'super_admin' || role === 'admin'
  const inCheckerStage = ['submitted', 'under_checker_review'].includes(status)
  const inSuperStage = ['checker_approved', 'pending_super_admin_approval'].includes(status)

  const actions = []
  if (data) {
    if (isChecker && inCheckerStage) {
      actions.push(
        { key: 'capprove', label: 'Approve', color: 'success', icon: <CheckCircleRoundedIcon />, fn: () => approvalsApi.checkerApprove(companyId, notes), msg: 'Approved — sent to Super Admin' },
        { key: 'changes', label: 'Request Changes', color: 'warning', icon: <EditNoteRoundedIcon />, fn: () => approvalsApi.requestChanges(companyId, notes), msg: 'Changes requested', needNotes: true },
        { key: 'creject', label: 'Reject', color: 'error', icon: <BlockRoundedIcon />, fn: () => approvalsApi.checkerReject(companyId, notes), msg: 'Request rejected', needNotes: true }
      )
    }
    if (isSuper && inSuperStage) {
      actions.push(
        { key: 'activate', label: 'Approve & Activate', color: 'success', icon: <RocketLaunchRoundedIcon />, fn: () => approvalsApi.activate(companyId, sendEmail), msg: 'Company activated 🎉' },
        { key: 'sreject', label: 'Reject', color: 'error', icon: <BlockRoundedIcon />, fn: () => approvalsApi.reject(companyId, notes), msg: 'Request rejected', needNotes: true }
      )
    }
    if (isSuper && status === 'active') {
      actions.push({ key: 'suspend', label: 'Suspend', color: 'warning', icon: <BlockRoundedIcon />, fn: () => approvalsApi.suspend(companyId, notes), msg: 'Company suspended' })
    }
    if (isSuper && status === 'suspended') {
      actions.push({ key: 'reactivate', label: 'Reactivate', color: 'success', icon: <ReplayRoundedIcon />, fn: () => approvalsApi.reactivate(companyId, notes), msg: 'Company reactivated' })
    }
    // Re-provision into Moi-Corp Product — offered once a company is active,
    // especially useful when the automatic provisioning at activation failed.
    if (isSuper && status === 'active' && !data.product_provisioned) {
      actions.push({ key: 'reprovision', label: 'Re-Provision to Product', color: 'info', icon: <ReplayRoundedIcon />, fn: () => approvalsApi.reprovision(companyId), msg: 'Re-provisioned to Moi-Corp Product' })
    }
  }

  // ── Build the "submitted information" sections from the stored payload ───────
  const p = data?.onboarding_payload || {}
  const c = p.company || {}
  const a = p.address || {}
  const ct = p.contact || {}
  const ad = p.admin || {}
  const sub = p.subscription || {}
  const bill = p.billing || {}
  const wal = p.wallet || {}
  const br = p.branding || {}
  const enabledModules = (p.modules || []).filter((m) => m.enabled)
  const logoUrl = resolveUrl(br.logo_url || data?.logo_url)
  const hasPayload = !!data?.onboarding_payload

  // Moi-Corp Product provisioning status — surfaced once the company is activated.
  const showProvisioning = ['active', 'suspended', 'inactive'].includes(status) || data?.product_provisioned || data?.product_provision_error
  const provisioningSection = showProvisioning ? {
    icon: <RocketLaunchRoundedIcon />, title: 'Moi-Corp Product Provisioning', rows: [
      { label: 'Status', value: data?.product_provisioned ? '✅ Provisioned' : (data?.product_provision_error ? '❌ Failed' : '⏳ Not provisioned') },
      { label: 'Provisioned At', value: data?.product_provisioned_at ? new Date(data.product_provisioned_at).toLocaleString() : null },
      { label: 'Product Company ID', value: data?.product_company_id },
      { label: 'Last Error', value: data?.product_provision_error },
    ],
  } : null

  const sections = [
    ...(provisioningSection ? [provisioningSection] : []),
    {
      icon: <BusinessRoundedIcon />, title: 'Company', rows: [
        { label: 'Legal Name', value: c.legal_name }, { label: 'Industry', value: c.industry },
        { label: 'GSTIN', value: c.gstin }, { label: 'PAN', value: c.pan },
        { label: 'Reg. Number', value: c.registration_number }, { label: 'Website', value: c.website },
        { label: 'Email', value: c.email }, { label: 'Phone', value: c.phone },
        { label: 'Currency', value: c.currency }, { label: 'Timezone', value: c.timezone },
        { label: 'Description', value: c.description },
      ],
    },
    {
      icon: <PlaceRoundedIcon />, title: 'Address', rows: [
        { label: 'Address 1', value: a.address_line1 }, { label: 'Address 2', value: a.address_line2 },
        { label: 'City', value: a.city }, { label: 'State', value: a.state },
        { label: 'Pincode', value: a.pincode }, { label: 'Country', value: a.country },
      ],
    },
    {
      icon: <ContactPhoneRoundedIcon />, title: 'Primary Contact', rows: [
        { label: 'Name', value: ct.contact_name }, { label: 'Designation', value: ct.designation },
        { label: 'Email', value: ct.email }, { label: 'Mobile', value: ct.mobile },
        { label: 'Alt. Phone', value: ct.alternate_phone }, { label: 'Department', value: ct.department },
      ],
    },
    {
      icon: <AdminPanelSettingsRoundedIcon />, title: 'Admin Account', rows: [
        { label: 'Name', value: ad.name }, { label: 'Employee ID', value: ad.employee_id },
        { label: 'Email', value: ad.email }, { label: 'Username', value: ad.username },
        { label: 'Phone', value: ad.phone }, { label: 'Role', value: ad.role },
      ],
    },
    {
      icon: <CardMembershipRoundedIcon />, title: 'Subscription', rows: [
        { label: 'Plan Tier', value: sub.plan_tier }, { label: 'Billing Cycle', value: sub.billing_cycle },
        { label: 'Licensed Users', value: sub.licensed_users },
        { label: 'Amount', value: blank(sub.subscription_amount) ? null : fmtMoney(sub.subscription_amount, sub.currency || c.currency) },
        { label: 'Discount %', value: sub.discount_percentage }, { label: 'Tax %', value: sub.tax_percentage },
        { label: 'Auto Renewal', value: yn(sub.auto_renewal), always: true },
        { label: 'Start', value: sub.contract_start_date && fmtDate(sub.contract_start_date) },
        { label: 'End', value: sub.contract_end_date && fmtDate(sub.contract_end_date) },
      ],
    },
    {
      icon: <ReceiptLongRoundedIcon />, title: 'Billing', rows: [
        { label: 'Contact', value: bill.billing_contact_name }, { label: 'Email', value: bill.billing_email },
        { label: 'Mobile', value: bill.billing_mobile }, { label: 'Address', value: bill.billing_address },
        { label: 'GSTIN', value: bill.gstin }, { label: 'PAN', value: bill.pan },
        { label: 'PO Number', value: bill.po_number }, { label: 'Vendor Code', value: bill.vendor_code },
      ],
    },
    {
      icon: <AccountBalanceWalletRoundedIcon />, title: 'Wallet', rows: [
        { label: 'Enabled', value: yn(wal.wallet_enabled), always: true },
        { label: 'Initial Balance', value: blank(wal.initial_balance) ? null : fmtMoney(wal.initial_balance) },
        { label: 'Credit Limit', value: blank(wal.credit_limit) ? null : fmtMoney(wal.credit_limit) },
        { label: 'Low Balance', value: blank(wal.low_balance_threshold) ? null : fmtMoney(wal.low_balance_threshold) },
        { label: 'Auto Recharge', value: yn(wal.auto_recharge_enabled), always: true },
      ],
    },
    {
      icon: <PaletteRoundedIcon />, title: 'Branding', rows: [
        { label: 'Primary Color', value: br.primary_color }, { label: 'Secondary Color', value: br.secondary_color },
        { label: 'Email Domain', value: br.email_domain },
      ],
    },
  ]

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth fullScreen={fullScreen} PaperProps={{ sx: { borderRadius: fullScreen ? 0 : 3, height: fullScreen ? '100%' : '92vh' } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pr: 6 }}>
        <Avatar variant="rounded" src={logoUrl || undefined} sx={{ bgcolor: (t) => alpha(t.palette.primary.main, 0.12), color: 'primary.main', fontWeight: 700 }}>
          {!logoUrl && (data?.name?.charAt(0)?.toUpperCase() || 'C')}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, lineHeight: 1.15 }}>{data?.name || 'Company'}</Typography>
          <Typography variant="caption" color="text.secondary">{data?.code} · Onboarding review</Typography>
        </Box>
        {status && <StatusBadge status={status} />}
        <IconButton onClick={onClose} sx={{ position: 'absolute', top: 12, right: 12 }}><CloseRoundedIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        {loading || !data ? (
          <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}><CircularProgress /></Box>
        ) : (
          <Box>
            <Box sx={{ px: 3, pt: 2.5, pb: 1.5 }}><WorkflowTracker status={status} /></Box>
            <Divider />
            <Grid container>
              {/* LEFT — submitted information + documents */}
              <Grid item xs={12} md={7} sx={{ p: 2.5, borderRight: { md: `1px solid ${theme.palette.divider}` } }}>
                <Typography sx={{ fontWeight: 800, mb: 1.5 }}>Submitted Information</Typography>
                {!hasPayload && (
                  <Typography variant="body2" color="text.secondary">
                    No detailed submission stored for this company (it was created directly, not via the onboarding wizard).
                  </Typography>
                )}
                {hasPayload && (
                  <Stack spacing={1.5}>
                    {sections.map((s) => <Section key={s.title} icon={s.icon} title={s.title} rows={s.rows} />)}

                    {/* Modules */}
                    <Section icon={<ExtensionRoundedIcon />} title="Modules">
                      {enabledModules.length ? (
                        <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1} sx={{ mt: 0.5 }}>
                          {enabledModules.map((m) => (
                            <Chip key={m.module_key} size="small" label={`${m.module_key}${Number(m.price) ? ` · ${fmtMoney(m.price)}` : ''}`} sx={{ textTransform: 'capitalize', fontWeight: 600 }} />
                          ))}
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary">No modules enabled.</Typography>
                      )}
                    </Section>

                    {/* Uploaded documents */}
                    <Section icon={<DescriptionRoundedIcon />} title="Uploaded Documents">
                      {logoUrl ? (
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 0.5 }}>
                          <Avatar variant="rounded" src={logoUrl} sx={{ width: 56, height: 56, border: `1px solid ${theme.palette.divider}` }} />
                          <Box>
                            <Typography sx={{ fontWeight: 600, fontSize: 13.5 }}>Company Logo</Typography>
                            <Link href={logoUrl} target="_blank" rel="noopener noreferrer" sx={{ fontSize: 12.5 }}>View / download</Link>
                          </Box>
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary">No documents uploaded.</Typography>
                      )}
                    </Section>
                  </Stack>
                )}
              </Grid>

              {/* RIGHT — record summary, comments, history, audit */}
              <Grid item xs={12} md={5} sx={{ p: 2.5 }}>
                <Stack spacing={2.5}>
                  {/* Record summary */}
                  <Box>
                    <Typography sx={{ fontWeight: 800, mb: 1.5 }}>Record</Typography>
                    <Grid container spacing={1.5}>
                      <Grid item xs={6}><Field label="Company Code">{data.code}</Field></Grid>
                      <Grid item xs={6}><Field label="Status"><StatusBadge status={status} /></Field></Grid>
                      <Grid item xs={6}><Field label="Submitted By">{data.maker_name}</Field></Grid>
                      <Grid item xs={6}><Field label="Reviewed By">{data.checker_name}</Field></Grid>
                      <Grid item xs={6}><Field label="Approved By">{data.approver_name}</Field></Grid>
                      <Grid item xs={6}><Field label="Submission Date">{fmtDate(data.submitted_at)}</Field></Grid>
                      <Grid item xs={6}><Field label="Approval Date">{fmtDate(data.approved_at)}</Field></Grid>
                      <Grid item xs={6}><Field label="Last Updated">{fmtDate(data.updated_at)}</Field></Grid>
                    </Grid>
                  </Box>

                  {/* Approval comments */}
                  {actions.length > 0 && (
                    <Box>
                      <Typography sx={{ fontWeight: 800, mb: 1 }}>Approval Comments</Typography>
                      <TextField
                        fullWidth multiline rows={2} value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add a reason or remarks for this decision (shared in history)…"
                      />
                      {isSuper && inSuperStage && (
                        <FormControlLabel
                          sx={{ mt: 0.5 }}
                          control={<Checkbox size="small" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} />}
                          label={<Typography variant="body2">Send welcome email with credentials to the company admin</Typography>}
                        />
                      )}
                    </Box>
                  )}

                  {data.review_notes && (
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: (t) => alpha(t.palette.warning.main, 0.1) }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'warning.main' }}>Latest note</Typography>
                      <Typography variant="body2">{data.review_notes}</Typography>
                    </Box>
                  )}

                  {/* Review history */}
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                      <FactCheckRoundedIcon fontSize="small" color="action" />
                      <Typography sx={{ fontWeight: 800 }}>Review History</Typography>
                    </Stack>
                    {(!data.history || data.history.length === 0) && <Typography variant="body2" color="text.secondary">No history yet.</Typography>}
                    <Stack spacing={0}>
                      {(data.history || []).map((h, i) => (
                        <Box key={h.id} sx={{ display: 'flex', gap: 1.5, pb: 2 }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Box sx={{ width: 11, height: 11, borderRadius: '50%', bgcolor: 'primary.main', mt: 0.5, flexShrink: 0 }} />
                            {i < data.history.length - 1 && <Box sx={{ width: 2, flex: 1, bgcolor: 'divider', mt: 0.5 }} />}
                          </Box>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 600, fontSize: 13.5 }}>{actionLabel(h.action)}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {h.actor_name || 'system'}{h.actor_role ? ` · ${h.actor_role}` : ''} · {fmtDateTime(h.created_at)}
                            </Typography>
                            {h.notes && <Typography variant="body2" sx={{ mt: 0.25 }}>{h.notes}</Typography>}
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                  </Box>

                  {/* Audit trail */}
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                      <HistoryRoundedIcon fontSize="small" color="action" />
                      <Typography sx={{ fontWeight: 800 }}>Audit Trail</Typography>
                    </Stack>
                    {(!data.audit || data.audit.length === 0) && <Typography variant="body2" color="text.secondary">No audit entries.</Typography>}
                    <Stack spacing={0}>
                      {(data.audit || []).map((a2, i) => (
                        <Box key={a2.id} sx={{ display: 'flex', gap: 1.5, py: 1, borderBottom: i < data.audit.length - 1 ? 1 : 0, borderColor: 'divider' }}>
                          <Box sx={{ mt: 0.6, width: 7, height: 7, borderRadius: '50%', bgcolor: 'text.disabled', flexShrink: 0 }} />
                          <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{a2.action}</Typography>
                            <Typography variant="caption" color="text.secondary">{a2.actor_email || 'system'} · {fmtDateTime(a2.created_at)}</Typography>
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                </Stack>
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, flexWrap: 'wrap', gap: 1 }}>
        <Button onClick={onClose} color="inherit">Close</Button>
        <Box sx={{ flex: 1 }} />
        {actions.map((act) => (
          <Tooltip key={act.key} title={act.needNotes && !notes.trim() ? 'Please add a comment first' : ''}>
            <span>
              <Button
                variant="contained" color={act.color}
                startIcon={busy === act.key ? <CircularProgress size={16} color="inherit" /> : act.icon}
                disabled={!!busy || (act.needNotes && !notes.trim())}
                onClick={() => run(act.key, act.fn, act.msg)}
              >
                {act.label}
              </Button>
            </span>
          </Tooltip>
        ))}
      </DialogActions>
    </Dialog>
  )
}
