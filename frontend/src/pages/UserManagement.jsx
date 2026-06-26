import { useEffect, useState } from 'react'
import {
  Box, Button, IconButton, Tooltip, Switch, Grid, TextField, MenuItem, Typography, Avatar, Stack, Chip,
  FormControlLabel, Checkbox, Divider, Alert,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded'
import GroupRoundedIcon from '@mui/icons-material/GroupRounded'
import { PageHeader, DataTable, FormDialog, ConfirmDialog, StatusBadge } from '../components/ui'
import { usersApi } from '../api/endpoints'
import { fmtDateTime } from '../utils/format'
import { errMsg } from '../api/client'
import { useToast } from '../context/ToastContext'

const ROLES = [
  { key: 'super_admin', label: 'Super Admin' },
  { key: 'admin', label: 'Admin' },
  { key: 'maker', label: 'Maker' },
  { key: 'checker', label: 'Checker' },
]
const roleLabel = (k) => ROLES.find((r) => r.key === k)?.label || k
const roleColor = { super_admin: 'primary', admin: 'secondary', maker: 'info', checker: 'warning' }
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const EMPTY = { name: '', email: '', mobile_number: '', username: '', password: '', role: 'maker', is_active: true, screens: [] }

export default function UserManagement() {
  const { notify } = useToast()
  const [rows, setRows] = useState([])
  const [allScreens, setAllScreens] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialog, setDialog] = useState(null)   // { mode, data }
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const [list, screens] = await Promise.all([usersApi.list(), usersApi.screens().catch(() => [])])
      setRows(list); setAllScreens(screens)
    } catch (e) { notify(errMsg(e), 'error') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, []) // eslint-disable-line

  const set = (k, v) => setDialog((d) => ({ ...d, data: { ...d.data, [k]: v } }))

  // Open Edit and auto-fetch the user's full record by id, so the form always
  // reflects the latest server state (mobile/username/screens) rather than a
  // possibly-stale list row. Opens instantly with the row data, then refreshes.
  async function openEdit(r) {
    const base = { id: r.id, name: r.name, email: r.email, mobile_number: r.mobile_number || '', username: r.username || '', password: '', role: r.role, is_active: r.is_active, screens: r.screens || [] }
    setDialog({ mode: 'edit', data: base })
    try {
      const u = await usersApi.get(r.id)
      setDialog((cur) => (cur?.mode === 'edit' && cur.data.id === r.id
        ? { ...cur, data: { ...cur.data, name: u.name ?? cur.data.name, email: u.email ?? cur.data.email, mobile_number: u.mobile_number || '', username: u.username || '', role: u.role ?? cur.data.role, is_active: u.is_active, screens: u.screens || [] } }
        : cur))
    } catch (e) { notify(errMsg(e), 'error') }
  }
  const toggleScreen = (key) => setDialog((d) => {
    const has = d.data.screens.includes(key)
    return { ...d, data: { ...d.data, screens: has ? d.data.screens.filter((s) => s !== key) : [...d.data.screens, key] } }
  })

  const isCreate = dialog?.mode === 'create'
  const d = dialog?.data

  function clientValidate() {
    if (!d.name || d.name.trim().length < 2) return 'Name is required (min 2 characters)'
    if (!EMAIL_RE.test(d.email || '')) return 'A valid email address is required'
    if (!/^\d{10}$/.test(d.mobile_number || '')) return 'Mobile number must be exactly 10 digits'
    if (!/^[a-zA-Z0-9._-]{3,}$/.test(d.username || '')) return 'Username must be at least 3 characters'
    if (!d.role) return 'Role is required'
    if (isCreate && (d.password || '').length < 8) return 'Password must be at least 8 characters'
    if (!isCreate && d.password && d.password.length < 8) return 'Password must be at least 8 characters'
    return null
  }

  async function save() {
    const err = clientValidate()
    if (err) return notify(err, 'warning')
    setSaving(true)
    try {
      const body = {
        name: d.name, email: d.email, mobile_number: d.mobile_number, username: d.username,
        role: d.role, is_active: d.is_active, screens: d.role === 'super_admin' ? [] : d.screens,
      }
      if (d.password) body.password = d.password
      if (isCreate) { await usersApi.create(body); notify('User created', 'success') }
      else { await usersApi.update(d.id, body); notify('User updated', 'success') }
      setDialog(null)
      load()
    } catch (e) { notify(errMsg(e), 'error') }
    finally { setSaving(false) }
  }

  async function toggle(u) {
    try { await usersApi.setActive(u.id, !u.is_active); notify(u.is_active ? 'User deactivated' : 'User activated', u.is_active ? 'warning' : 'success'); load() }
    catch (e) { notify(errMsg(e), 'error') }
  }

  async function remove() {
    try { await usersApi.remove(confirm.id); setConfirm(null); notify('User deleted', 'success'); load() }
    catch (e) { notify(errMsg(e), 'error') }
  }

  const columns = [
    {
      key: 'name', header: 'Name', value: (r) => r.name,
      render: (r) => (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ bgcolor: (t) => alpha(t.palette.primary.main, 0.15), color: 'primary.main', width: 38, height: 38, fontWeight: 700 }}>{r.name?.charAt(0)?.toUpperCase()}</Avatar>
          <Box><Typography sx={{ fontWeight: 600, fontSize: 14 }}>{r.name}</Typography><Typography variant="caption" color="text.secondary">{r.email}</Typography></Box>
        </Stack>
      ),
    },
    { key: 'mobile_number', header: 'Mobile', render: (r) => r.mobile_number || '—' },
    { key: 'username', header: 'Username', render: (r) => r.username || '—' },
    { key: 'role', header: 'Role', value: (r) => roleLabel(r.role), render: (r) => <Chip size="small" color={roleColor[r.role] || 'default'} label={roleLabel(r.role)} sx={{ fontWeight: 600 }} /> },
    { key: 'screens', header: 'Screens', value: (r) => (r.role === 'super_admin' ? 99 : (r.screens || []).length), render: (r) => r.role === 'super_admin' ? <Chip size="small" variant="outlined" label="All screens" /> : <span>{(r.screens || []).length}</span> },
    { key: 'status', header: 'Status', value: (r) => (r.is_active ? 'active' : 'inactive'), render: (r) => <StatusBadge status={r.is_active ? 'active' : 'inactive'} /> },
    { key: 'last_login_at', header: 'Last Login', value: (r) => r.last_login_at || '', render: (r) => fmtDateTime(r.last_login_at) },
    { key: 'is_active', header: 'Active', align: 'center', sortable: false, exportable: false, render: (r) => <Switch checked={r.is_active} onChange={() => toggle(r)} size="small" /> },
    {
      key: 'actions', header: '', align: 'right', sortable: false, exportable: false,
      render: (r) => (
        <Box sx={{ whiteSpace: 'nowrap' }}>
          <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(r)}><EditRoundedIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setConfirm({ id: r.id, name: r.name })}><DeleteRoundedIcon fontSize="small" /></IconButton></Tooltip>
        </Box>
      ),
    },
  ]

  return (
    <Box>
      <PageHeader
        title="User Management"
        subtitle="Create portal users and assign which Admin-Portal screens they can access."
        actions={<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setDialog({ mode: 'create', data: { ...EMPTY } })}>New User</Button>}
      />

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        searchPlaceholder="Search by name, email, username…"
        exportName="portal-users"
        empty={{ icon: <GroupRoundedIcon sx={{ fontSize: 42 }} />, title: 'No users yet', description: 'Create a user and assign their screen access.' }}
      />

      <FormDialog
        open={!!dialog}
        title={isCreate ? 'Create User' : 'Edit User'}
        subtitle="Fields marked * are required."
        onClose={() => setDialog(null)}
        onSubmit={save}
        submitLabel={isCreate ? 'Create' : 'Save'}
        loading={saving}
        maxWidth="md"
      >
        {d && (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}><TextField label="Name *" fullWidth value={d.name} onChange={(e) => set('name', e.target.value)} /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Email *" type="email" fullWidth disabled={!isCreate} value={d.email} onChange={(e) => set('email', e.target.value)} helperText={isCreate ? '' : 'Email cannot be changed'} /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Mobile Number *" fullWidth value={d.mobile_number} onChange={(e) => set('mobile_number', e.target.value.replace(/\D/g, '').slice(0, 10))} helperText="10 digits" /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Username *" fullWidth value={d.username} onChange={(e) => set('username', e.target.value)} /></Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="Role *" fullWidth value={d.role} onChange={(e) => set('role', e.target.value)}>
                {ROLES.map((r) => <MenuItem key={r.key} value={r.key}>{r.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}><TextField label={isCreate ? 'Password *' : 'New Password'} type="password" fullWidth value={d.password} onChange={(e) => set('password', e.target.value)} helperText={isCreate ? 'Min 8 characters' : 'Leave blank to keep current'} /></Grid>
            <Grid item xs={12}>
              <FormControlLabel control={<Switch checked={!!d.is_active} onChange={(e) => set('is_active', e.target.checked)} />} label={`Status: ${d.is_active ? 'Active' : 'Inactive'}`} />
            </Grid>

            <Grid item xs={12}><Divider /></Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Screen Access</Typography>
              {d.role === 'super_admin' ? (
                <Alert severity="info" sx={{ mt: 1 }}>A Super Admin has access to every screen, including User Management.</Alert>
              ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, mt: 0.5 }}>
                  {allScreens.map((s) => (
                    <FormControlLabel key={s.key}
                      control={<Checkbox size="small" checked={d.screens.includes(s.key)} onChange={() => toggleScreen(s.key)} />}
                      label={<Typography sx={{ fontSize: 14 }}>{s.label}</Typography>} />
                  ))}
                </Box>
              )}
            </Grid>
          </Grid>
        )}
      </FormDialog>

      <ConfirmDialog
        open={!!confirm}
        title="Delete user?"
        message={`This permanently removes "${confirm?.name}" and revokes their access. This cannot be undone.`}
        confirmLabel="Delete"
        color="error"
        onConfirm={remove}
        onClose={() => setConfirm(null)}
      />
    </Box>
  )
}
