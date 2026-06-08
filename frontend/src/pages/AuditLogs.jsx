import { useEffect, useState } from 'react'
import { Box, Chip, TextField, MenuItem, Typography, Stack } from '@mui/material'
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded'
import { PageHeader, DataTable } from '../components/ui'
import { auditApi } from '../api/endpoints'
import { fmtDateTime } from '../utils/format'
import { useToast } from '../context/ToastContext'

const ENTITY_TYPES = ['', 'company', 'company_admin', 'company_wallet', 'company_subscription', 'super_admin']

export default function AuditLogs() {
  const { notify } = useToast()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [entityType, setEntityType] = useState('')

  async function load() {
    setLoading(true)
    try {
      setRows(await auditApi.list({ entityType: entityType || undefined, limit: 500 }))
    } catch (e) {
      notify('Failed to load audit logs', 'error')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() /* eslint-disable-next-line */ }, [entityType])

  const columns = [
    { key: 'created_at', header: 'Time', value: (r) => r.created_at, render: (r) => <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>{fmtDateTime(r.created_at)}</Typography> },
    { key: 'actor_email', header: 'Actor', render: (r) => r.actor_email || '—' },
    { key: 'action', header: 'Action', render: (r) => <Chip size="small" variant="outlined" label={r.action} sx={{ fontFamily: 'monospace' }} /> },
    { key: 'entity_type', header: 'Entity', render: (r) => r.entity_type || '—' },
    { key: 'details', header: 'Details', sortable: false, value: (r) => (r.details ? JSON.stringify(r.details) : ''), render: (r) => (
      <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary', display: 'block', maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {r.details ? JSON.stringify(r.details) : '—'}
      </Typography>
    ) },
    { key: 'ip_address', header: 'IP', render: (r) => r.ip_address || '—' },
  ]

  return (
    <Box>
      <PageHeader
        title="Audit Logs"
        subtitle="A complete trail of every administrative action"
        actions={
          <TextField select label="Entity type" value={entityType} onChange={(e) => setEntityType(e.target.value)} sx={{ minWidth: 200 }}>
            {ENTITY_TYPES.map((t) => <MenuItem key={t} value={t}>{t ? t.replace('_', ' ') : 'All entities'}</MenuItem>)}
          </TextField>
        }
      />
      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        searchPlaceholder="Search by action, actor, entity…"
        exportName="audit-logs"
        empty={{ icon: <HistoryRoundedIcon sx={{ fontSize: 42 }} />, title: 'No audit entries', description: 'Administrative actions will appear here as they happen.' }}
      />
    </Box>
  )
}
