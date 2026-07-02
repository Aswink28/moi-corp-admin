import { useEffect, useMemo, useState } from 'react'
import {
  Box, Card, Grid, Stack, Typography, Button, TextField, MenuItem, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip,
} from '@mui/material'
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import BlockRoundedIcon from '@mui/icons-material/BlockRounded'
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded'
import { PageHeader, DataTable, StatusBadge, EmptyState } from '../components/ui'
import { eMoneyApi } from '../api/endpoints'
import { fmtMoney, fmtDateTime } from '../utils/format'
import { errMsg } from '../api/client'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'info_requested', label: 'Info Requested' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')

export default function EMoneyApproval() {
  const { notify } = useToast()
  const { user } = useAuth()
  const canAct = ['super_admin', 'admin'].includes(user?.role)

  const [companies, setCompanies] = useState([])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ company_id: '', status: '', from: '', to: '' })
  const [selected, setSelected] = useState(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState('')

  useEffect(() => { eMoneyApi.companies().then(setCompanies).catch(() => {}) }, [])

  async function load() {
    setLoading(true)
    try {
      setRows(await eMoneyApi.loadRequests(filters))
    } catch (e) {
      notify(errMsg(e), 'error')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [filters.company_id, filters.status, filters.from, filters.to]) // eslint-disable-line react-hooks/exhaustive-deps

  const summary = useMemo(() => ({
    pending: rows.filter((r) => r.status === 'pending_approval').length,
    info: rows.filter((r) => r.status === 'info_requested').length,
    approved: rows.filter((r) => r.status === 'approved').length,
    rejected: rows.filter((r) => r.status === 'rejected').length,
  }), [rows])

  async function act(kind) {
    if (!selected) return
    if ((kind === 'reject' || kind === 'request-info') && !note.trim()) {
      return notify(kind === 'reject' ? 'A rejection reason is required' : 'An information request note is required', 'warning')
    }
    setBusy(kind)
    try {
      if (kind === 'approve') await eMoneyApi.approve(selected.id)
      else if (kind === 'reject') await eMoneyApi.reject(selected.id, note.trim())
      else if (kind === 'request-info') await eMoneyApi.requestInfo(selected.id, note.trim())
      notify(
        kind === 'approve' ? 'Load request approved — wallet credited'
          : kind === 'reject' ? 'Load request rejected' : 'Additional information requested',
        'success',
      )
      setSelected(null); setNote('')
      load()
    } catch (e) {
      notify(errMsg(e), 'error')
    } finally {
      setBusy('')
    }
  }

  const columns = [
    { key: 'reference_no', header: 'Reference', render: (r) => <Typography sx={{ fontWeight: 700 }}>{r.reference_no}</Typography> },
    { key: 'company_name', header: 'Company', render: (r) => r.company_name || '—' },
    { key: 'requested_amount', header: 'Amount', align: 'right', value: (r) => Number(r.requested_amount), render: (r) => <Typography sx={{ fontWeight: 700 }}>{fmtMoney(r.requested_amount)}</Typography> },
    { key: 'payment_mode', header: 'Mode', render: (r) => r.payment_mode },
    { key: 'transaction_reference', header: 'Txn Ref', render: (r) => r.transaction_reference },
    { key: 'payment_date', header: 'Paid On', render: (r) => fmtDate(r.payment_date) },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'actions', header: '', align: 'right', render: (r) => (
      <Button size="small" variant="outlined" onClick={() => { setSelected(r); setNote('') }}>Review</Button>
    ) },
  ]

  const isOpen = selected && ['pending_approval', 'info_requested'].includes(selected.status)

  return (
    <Box>
      <PageHeader title="E-Money Approval" subtitle="Review and approve company wallet Load Money Requests" />

      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        {[
          { label: 'Pending Approval', value: summary.pending, color: 'warning.main' },
          { label: 'Info Requested', value: summary.info, color: 'info.main' },
          { label: 'Approved', value: summary.approved, color: 'success.main' },
          { label: 'Rejected', value: summary.rejected, color: 'error.main' },
        ].map((s) => (
          <Grid item xs={6} md={3} key={s.label}>
            <Card sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">{s.label}</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: s.color }}>{s.value}</Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ p: 2, mb: 2.5 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4} md={3}>
            <TextField select fullWidth size="small" label="Company" value={filters.company_id}
              onChange={(e) => setFilters({ ...filters, company_id: e.target.value })}>
              <MenuItem value="">All companies</MenuItem>
              {companies.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <TextField select fullWidth size="small" label="Status" value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              {STATUS_OPTIONS.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6} sm={2} md={2}>
            <TextField type="date" fullWidth size="small" label="From" InputLabelProps={{ shrink: true }}
              value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
          </Grid>
          <Grid item xs={6} sm={2} md={2}>
            <TextField type="date" fullWidth size="small" label="To" InputLabelProps={{ shrink: true }}
              value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button fullWidth variant="text" onClick={() => setFilters({ company_id: '', status: '', from: '', to: '' })}>Clear</Button>
          </Grid>
        </Grid>
      </Card>

      <DataTable columns={columns} rows={rows} loading={loading}
        searchPlaceholder="Search load requests…" exportName="emoney-load-requests"
        empty={{ icon: <PaymentsRoundedIcon sx={{ fontSize: 42 }} />, title: 'No load requests', description: 'Company wallet load requests will appear here for review.' }} />

      {/* Review / action dialog */}
      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        {selected && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PaymentsRoundedIcon color="primary" />
              Load Request {selected.reference_no}
              <Box sx={{ ml: 'auto' }}><StatusBadge status={selected.status} /></Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={1.5}>
                {[
                  ['Company', selected.company_name],
                  ['Requested Amount', fmtMoney(selected.requested_amount)],
                  ['Payment Mode', selected.payment_mode],
                  ['Transaction Reference', selected.transaction_reference],
                  ['Payment Date', fmtDate(selected.payment_date)],
                  ['Current Wallet Balance', selected.wallet_balance != null ? fmtMoney(selected.wallet_balance) : '—'],
                  ['Requested By', selected.requested_by_name || '—'],
                  ['Submitted', fmtDateTime(selected.created_at)],
                ].map(([k, v]) => (
                  <Grid item xs={6} key={k}>
                    <Typography variant="caption" color="text.secondary">{k}</Typography>
                    <Typography sx={{ fontWeight: 600 }}>{v}</Typography>
                  </Grid>
                ))}
                {selected.remarks && (
                  <Grid item xs={12}><Typography variant="caption" color="text.secondary">Remarks</Typography><Typography>{selected.remarks}</Typography></Grid>
                )}
                {selected.info_request_note && (
                  <Grid item xs={12}><Chip size="small" color="info" label="Info requested" sx={{ mr: 1 }} /><Typography component="span">{selected.info_request_note}</Typography></Grid>
                )}
                {selected.info_response && (
                  <Grid item xs={12}><Typography variant="caption" color="text.secondary">Company response</Typography><Typography>{selected.info_response}</Typography></Grid>
                )}
                {selected.status === 'rejected' && selected.rejection_reason && (
                  <Grid item xs={12}><Typography variant="caption" color="error">Rejection reason</Typography><Typography>{selected.rejection_reason}</Typography></Grid>
                )}
                {(selected.reviewed_by_ref || selected.reviewed_at) && (
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="caption" color="text.secondary">
                      Last actioned by {selected.reviewed_by_ref || '—'} · {selected.reviewed_at ? fmtDateTime(selected.reviewed_at) : '—'}
                    </Typography>
                  </Grid>
                )}
              </Grid>

              {isOpen && canAct && (
                <TextField fullWidth multiline minRows={2} sx={{ mt: 2 }}
                  label="Reason / note (required to reject or request info)"
                  value={note} onChange={(e) => setNote(e.target.value)} />
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button onClick={() => setSelected(null)}>Close</Button>
              {isOpen && canAct && (
                <>
                  <Button startIcon={<HelpOutlineRoundedIcon />} color="info" disabled={!!busy}
                    onClick={() => act('request-info')}>Request Info</Button>
                  <Button startIcon={<BlockRoundedIcon />} color="error" disabled={!!busy}
                    onClick={() => act('reject')}>Reject</Button>
                  <Button startIcon={<CheckCircleRoundedIcon />} variant="contained" color="success" disabled={!!busy}
                    onClick={() => act('approve')}>{busy === 'approve' ? 'Approving…' : 'Approve & Credit'}</Button>
                </>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {!loading && rows.length === 0 && companies.length === 0 && (
        <Card sx={{ mt: 2 }}><EmptyState icon={<PaymentsRoundedIcon sx={{ fontSize: 42 }} />} title="Nothing to review" description="No company wallet load requests found." /></Card>
      )}
    </Box>
  )
}
