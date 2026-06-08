import { useEffect, useState } from 'react'
import { Box, Button, Typography, Stack, Chip, FormControlLabel, Switch } from '@mui/material'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded'
import { PageHeader, DataTable, StatusBadge } from '../components/ui'
import CompanyWorkflowDialog from '../components/CompanyWorkflowDialog'
import { approvalsApi } from '../api/endpoints'
import { errMsg } from '../api/client'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { fmtDate } from '../utils/format'

const COPY = {
  maker: { title: 'My Requests', subtitle: 'Track your company onboarding requests through the approval workflow.' },
  checker: { title: 'Review Queue', subtitle: 'Verify submissions, then approve, reject, or request changes.' },
  super_admin: { title: 'Final Approvals', subtitle: 'Approve & activate checker-cleared companies, or manage their lifecycle.' },
}

export default function Approvals() {
  const { notify } = useToast()
  const { user } = useAuth()
  const role = user?.role
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const [openId, setOpenId] = useState(null)

  const copy = COPY[role] || COPY.super_admin
  const isSuper = role === 'super_admin' || role === 'admin'

  async function load() {
    setLoading(true)
    try {
      setRows(await approvalsApi.queue(isSuper && showAll))
    } catch (e) {
      notify(errMsg(e), 'error')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() /* eslint-disable-next-line */ }, [showAll])

  const actionLabel = role === 'maker' ? 'View' : 'Review'

  const columns = [
    {
      key: 'name', header: 'Company', value: (r) => r.name,
      render: (r) => (
        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{r.name}</Typography>
          <Typography variant="caption" color="text.secondary">{r.code}</Typography>
        </Box>
      ),
    },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'maker_name', header: 'Submitted By', render: (r) => r.maker_name || '—' },
    { key: 'checker_name', header: 'Reviewed By', render: (r) => r.checker_name || '—' },
    { key: 'approver_name', header: 'Approved By', render: (r) => r.approver_name || '—' },
    { key: 'submitted_at', header: 'Submitted', value: (r) => r.submitted_at || '', render: (r) => fmtDate(r.submitted_at) },
    { key: 'updated_at', header: 'Updated', value: (r) => r.updated_at || '', render: (r) => fmtDate(r.updated_at) },
    {
      key: 'actions', header: '', align: 'right', sortable: false, exportable: false,
      render: (r) => (
        <Button size="small" variant="outlined" startIcon={<VisibilityRoundedIcon />} onClick={() => setOpenId(r.id)}>
          {actionLabel}
        </Button>
      ),
    },
  ]

  return (
    <Box>
      <PageHeader
        title={copy.title}
        subtitle={copy.subtitle}
        actions={
          isSuper ? (
            <FormControlLabel
              control={<Switch checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />}
              label="Show all companies"
            />
          ) : (
            <Chip label={`${rows.length} in your queue`} color="primary" variant="outlined" />
          )
        }
      />

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        searchPlaceholder="Search by company name or code…"
        exportName="approvals"
        empty={{
          icon: <FactCheckRoundedIcon sx={{ fontSize: 42 }} />,
          title: 'Nothing here right now',
          description:
            role === 'maker'
              ? 'Submit a company from the Onboard Company wizard to see it tracked here.'
              : 'There are no requests awaiting your action.',
        }}
      />

      <CompanyWorkflowDialog
        open={!!openId}
        companyId={openId}
        role={role}
        onClose={() => setOpenId(null)}
        onChanged={load}
      />
    </Box>
  )
}
