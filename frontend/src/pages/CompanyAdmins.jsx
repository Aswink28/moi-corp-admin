import { useEffect, useState } from 'react'
import {
  Box, Button, IconButton, Tooltip, Switch, Grid, TextField, Typography, Avatar, Stack, Chip,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import LockResetRoundedIcon from '@mui/icons-material/LockResetRounded'
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded'
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded'
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded'
import { PageHeader, DataTable, FormDialog, ConfirmDialog } from '../components/ui'
import CompanyPicker from '../components/CompanyPicker'
import { companyAdminsApi } from '../api/endpoints'
import { fmtDateTime } from '../utils/format'
import { errMsg } from '../api/client'
import { useToast } from '../context/ToastContext'

const EMPTY = { company_id: '', name: '', email: '', phone: '', password: '' }

export default function CompanyAdmins() {
  const { notify } = useToast()
  const [filterCompany, setFilterCompany] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialog, setDialog] = useState(null)
  const [saving, setSaving] = useState(false)
  const [credential, setCredential] = useState(null)
  const [confirm, setConfirm] = useState(null)

  async function load() {
    setLoading(true)
    try {
      setRows(await companyAdminsApi.list(filterCompany || undefined))
    } catch (e) {
      notify(errMsg(e), 'error')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() /* eslint-disable-next-line */ }, [filterCompany])

  const set = (k, v) => setDialog((d) => ({ ...d, data: { ...d.data, [k]: v } }))

  async function create() {
    setSaving(true)
    try {
      const res = await companyAdminsApi.create(dialog.data)
      setDialog(null)
      if (res.temporaryPassword) setCredential({ email: res.admin.email, temporaryPassword: res.temporaryPassword })
      else notify('Company admin created', 'success')
      load()
    } catch (e) {
      notify(errMsg(e), 'error')
    } finally {
      setSaving(false)
    }
  }

  async function reset(id) {
    try {
      const res = await companyAdminsApi.resetPassword(id)
      setCredential({ email: res.email, temporaryPassword: res.temporaryPassword })
    } catch (e) {
      notify(errMsg(e), 'error')
    }
  }

  async function toggle(a) {
    try {
      await companyAdminsApi.setActive(a.id, !a.is_active)
      notify(a.is_active ? 'Admin deactivated' : 'Admin activated', a.is_active ? 'warning' : 'success')
      load()
    } catch (e) {
      notify(errMsg(e), 'error')
    }
  }

  async function remove() {
    try {
      await companyAdminsApi.remove(confirm.id)
      setConfirm(null)
      notify('Company admin deleted', 'success')
      load()
    } catch (e) {
      notify(errMsg(e), 'error')
    }
  }

  const columns = [
    {
      key: 'name', header: 'Admin', value: (r) => r.name,
      render: (r) => (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ bgcolor: (t) => alpha(t.palette.secondary.main, 0.15), color: 'secondary.main', width: 38, height: 38, fontWeight: 700 }}>{r.name?.charAt(0)?.toUpperCase()}</Avatar>
          <Box>
            <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{r.name}</Typography>
            <Typography variant="caption" color="text.secondary">{r.email}</Typography>
          </Box>
        </Stack>
      ),
    },
    { key: 'company_name', header: 'Company', render: (r) => <span>{r.company_name} <Chip size="small" variant="outlined" label={r.company_code} sx={{ ml: 0.5 }} /></span> },
    { key: 'phone', header: 'Phone', render: (r) => r.phone || '—' },
    { key: 'last_login_at', header: 'Last Login', value: (r) => r.last_login_at || '', render: (r) => fmtDateTime(r.last_login_at) },
    { key: 'is_active', header: 'Active', align: 'center', value: (r) => (r.is_active ? 1 : 0), render: (r) => <Switch checked={r.is_active} onChange={() => toggle(r)} size="small" /> },
    {
      key: 'actions', header: '', align: 'right', sortable: false, exportable: false,
      render: (r) => (
        <Box sx={{ whiteSpace: 'nowrap' }}>
          <Tooltip title="Reset password"><IconButton size="small" onClick={() => reset(r.id)}><LockResetRoundedIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setConfirm({ id: r.id, name: r.name })}><DeleteRoundedIcon fontSize="small" /></IconButton></Tooltip>
        </Box>
      ),
    },
  ]

  return (
    <Box>
      <PageHeader
        title="Company Admins"
        subtitle="Manage the admin users for each client company"
        actions={
          <Stack direction="row" spacing={1.5}>
            <CompanyPicker value={filterCompany} onChange={(id) => setFilterCompany(id)} label="Filter by company" />
            <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setDialog({ data: { ...EMPTY, company_id: filterCompany } })}>Create Admin</Button>
          </Stack>
        }
      />

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        searchPlaceholder="Search admins by name or email…"
        exportName="company-admins"
        empty={{
          icon: <AdminPanelSettingsRoundedIcon sx={{ fontSize: 42 }} />,
          title: 'No company admins yet',
          description: 'Create an admin to give a client company access to manage their own users.',
          action: <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setDialog({ data: { ...EMPTY, company_id: filterCompany } })}>Create Admin</Button>,
        }}
      />

      <FormDialog
        open={!!dialog}
        title="Create Company Admin"
        subtitle="Leave the password blank to auto-generate a secure temporary password."
        onClose={() => setDialog(null)}
        onSubmit={create}
        submitLabel="Create"
        submitDisabled={!dialog?.data?.company_id || !dialog?.data?.name || !dialog?.data?.email}
        loading={saving}
      >
        <Grid container spacing={2}>
          <Grid item xs={12}><CompanyPicker value={dialog?.data.company_id} onChange={(id) => set('company_id', id)} label="Company" sx={{ width: '100%' }} /></Grid>
          <Grid item xs={12} sm={6}><TextField label="Name" required fullWidth value={dialog?.data.name || ''} onChange={(e) => set('name', e.target.value)} /></Grid>
          <Grid item xs={12} sm={6}><TextField label="Email" required fullWidth value={dialog?.data.email || ''} onChange={(e) => set('email', e.target.value)} /></Grid>
          <Grid item xs={12} sm={6}><TextField label="Phone" fullWidth value={dialog?.data.phone || ''} onChange={(e) => set('phone', e.target.value)} /></Grid>
          <Grid item xs={12} sm={6}><TextField label="Password (optional)" fullWidth value={dialog?.data.password || ''} onChange={(e) => set('password', e.target.value)} helperText="Min 8 chars, or auto-generate" /></Grid>
        </Grid>
      </FormDialog>

      <FormDialog open={!!credential} title="Temporary Password" subtitle="Shown only once — share it securely with the admin." onClose={() => setCredential(null)}>
        <Box sx={{ bgcolor: (t) => alpha(t.palette.primary.main, 0.06), p: 2, borderRadius: 2, fontFamily: 'monospace' }}>
          <Typography variant="body2" sx={{ mb: 0.5 }}>Email: <strong>{credential?.email}</strong></Typography>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="body2">Password: <strong>{credential?.temporaryPassword}</strong></Typography>
            <Tooltip title="Copy password">
              <IconButton size="small" onClick={() => { navigator.clipboard?.writeText(credential.temporaryPassword); notify('Password copied', 'info') }}>
                <ContentCopyRoundedIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
        <Box sx={{ textAlign: 'right', mt: 2 }}>
          <Button variant="contained" onClick={() => setCredential(null)}>Done</Button>
        </Box>
      </FormDialog>

      <ConfirmDialog
        open={!!confirm}
        title="Delete company admin?"
        message={`This removes "${confirm?.name}" and revokes their access. This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={remove}
        onClose={() => setConfirm(null)}
      />
    </Box>
  )
}
