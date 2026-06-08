import { useEffect, useState } from 'react'
import {
  Box, Button, IconButton, Tooltip, TextField, MenuItem, Grid, Typography, Avatar, Stack,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded'
import BlockRoundedIcon from '@mui/icons-material/BlockRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded'
import { PageHeader, DataTable, FormDialog, ConfirmDialog, StatusBadge } from '../components/ui'
import { companiesApi } from '../api/endpoints'
import { fmtMoney } from '../utils/format'
import { errMsg } from '../api/client'
import { useToast } from '../context/ToastContext'

const EMPTY = { name: '', code: '', legal_name: '', industry: '', email: '', phone: '', city: '', country: 'India', address: '' }
const INDUSTRIES = ['IT Services', 'Consulting', 'Manufacturing', 'Finance', 'Healthcare', 'Other']

export default function Companies() {
  const { notify } = useToast()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialog, setDialog] = useState(null) // {mode, data}
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)

  async function load() {
    setLoading(true)
    try {
      setRows(await companiesApi.list())
    } catch (e) {
      notify(errMsg(e), 'error')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() /* eslint-disable-next-line */ }, [])

  const set = (k, v) => setDialog((d) => ({ ...d, data: { ...d.data, [k]: v } }))

  async function save() {
    setSaving(true)
    try {
      const { mode, data } = dialog
      if (mode === 'create') await companiesApi.create(data)
      else await companiesApi.update(data.id, data)
      setDialog(null)
      notify(`Company ${mode === 'create' ? 'created' : 'updated'} successfully`, 'success', { title: 'Done' })
      load()
    } catch (e) {
      notify(errMsg(e), 'error')
    } finally {
      setSaving(false)
    }
  }

  async function setStatus(id, status) {
    try {
      await companiesApi.setStatus(id, status)
      notify(`Company ${status}`, status === 'active' ? 'success' : 'warning')
      load()
    } catch (e) {
      notify(errMsg(e), 'error')
    }
  }

  async function remove() {
    setDeleting(true)
    try {
      await companiesApi.remove(confirm.id)
      setConfirm(null)
      notify('Company deleted', 'success')
      load()
    } catch (e) {
      notify(errMsg(e), 'error')
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    {
      key: 'name', header: 'Company', value: (r) => r.name,
      render: (r) => (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar variant="rounded" sx={{ bgcolor: (t) => alpha(t.palette.primary.main, 0.12), color: 'primary.main', width: 38, height: 38, fontWeight: 700 }}>
            {r.name?.charAt(0)?.toUpperCase()}
          </Avatar>
          <Box>
            <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{r.name}</Typography>
            <Typography variant="caption" color="text.secondary">{r.email || '—'}</Typography>
          </Box>
        </Stack>
      ),
    },
    { key: 'code', header: 'Code', render: (r) => <StatusBadge status="info" label={r.code} /> },
    { key: 'industry', header: 'Industry', render: (r) => r.industry || '—' },
    { key: 'admin_count', header: 'Admins', align: 'center', value: (r) => r.admin_count },
    { key: 'wallet_balance', header: 'Wallet', value: (r) => Number(r.wallet_balance || 0), render: (r) => fmtMoney(r.wallet_balance, r.wallet_currency) },
    { key: 'subscription', header: 'Plan', sortable: false, render: (r) => (r.subscription ? <StatusBadge status={r.subscription.plan} /> : '—') },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions', header: '', align: 'right', sortable: false, exportable: false,
      render: (r) => (
        <Box sx={{ whiteSpace: 'nowrap' }}>
          <Tooltip title="Edit"><IconButton size="small" onClick={() => setDialog({ mode: 'edit', data: { ...EMPTY, ...r } })}><EditRoundedIcon fontSize="small" /></IconButton></Tooltip>
          {r.status !== 'active' ? (
            <Tooltip title="Activate"><IconButton size="small" color="success" onClick={() => setStatus(r.id, 'active')}><CheckCircleRoundedIcon fontSize="small" /></IconButton></Tooltip>
          ) : (
            <Tooltip title="Suspend"><IconButton size="small" color="warning" onClick={() => setStatus(r.id, 'suspended')}><BlockRoundedIcon fontSize="small" /></IconButton></Tooltip>
          )}
          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setConfirm({ id: r.id, name: r.name })}><DeleteRoundedIcon fontSize="small" /></IconButton></Tooltip>
        </Box>
      ),
    },
  ]

  return (
    <Box>
      <PageHeader
        title="Companies"
        subtitle="Onboard and manage your client companies"
        actions={<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setDialog({ mode: 'create', data: { ...EMPTY } })}>Create Company</Button>}
      />

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        searchPlaceholder="Search companies by name, code, industry…"
        exportName="companies"
        empty={{
          icon: <BusinessRoundedIcon sx={{ fontSize: 42 }} />,
          title: 'No companies onboarded yet',
          description: 'Create your first client company to start managing admins, modules, billing and wallets.',
          action: <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setDialog({ mode: 'create', data: { ...EMPTY } })}>Create Company</Button>,
        }}
      />

      <FormDialog
        open={!!dialog}
        title={dialog?.mode === 'create' ? 'Create Company' : 'Edit Company'}
        subtitle="Wallet and default module settings are provisioned automatically."
        onClose={() => setDialog(null)}
        onSubmit={save}
        submitLabel={dialog?.mode === 'create' ? 'Create' : 'Save changes'}
        submitDisabled={!dialog?.data?.name || !dialog?.data?.code}
        loading={saving}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}><TextField label="Name" required fullWidth value={dialog?.data.name || ''} onChange={(e) => set('name', e.target.value)} /></Grid>
          <Grid item xs={12} sm={6}><TextField label="Code" required fullWidth value={dialog?.data.code || ''} onChange={(e) => set('code', e.target.value.toUpperCase())} helperText="e.g. TCS, INFY" /></Grid>
          <Grid item xs={12} sm={6}><TextField label="Legal Name" fullWidth value={dialog?.data.legal_name || ''} onChange={(e) => set('legal_name', e.target.value)} /></Grid>
          <Grid item xs={12} sm={6}>
            <TextField select label="Industry" fullWidth value={dialog?.data.industry || ''} onChange={(e) => set('industry', e.target.value)}>
              {INDUSTRIES.map((i) => <MenuItem key={i} value={i}>{i}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}><TextField label="Email" fullWidth value={dialog?.data.email || ''} onChange={(e) => set('email', e.target.value)} /></Grid>
          <Grid item xs={12} sm={6}><TextField label="Phone" fullWidth value={dialog?.data.phone || ''} onChange={(e) => set('phone', e.target.value)} /></Grid>
          <Grid item xs={12} sm={6}><TextField label="City" fullWidth value={dialog?.data.city || ''} onChange={(e) => set('city', e.target.value)} /></Grid>
          <Grid item xs={12} sm={6}><TextField label="Country" fullWidth value={dialog?.data.country || ''} onChange={(e) => set('country', e.target.value)} /></Grid>
          <Grid item xs={12}><TextField label="Address" fullWidth multiline rows={2} value={dialog?.data.address || ''} onChange={(e) => set('address', e.target.value)} /></Grid>
        </Grid>
      </FormDialog>

      <ConfirmDialog
        open={!!confirm}
        title="Delete company?"
        message={`This permanently deletes "${confirm?.name}" and all its admins, wallet, subscriptions and settings. This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={remove}
        onClose={() => setConfirm(null)}
      />
    </Box>
  )
}
