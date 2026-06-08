import { useState } from 'react'
import {
  Box, Card, CardContent, Typography, Grid, Button, TextField, MenuItem, Stack, Divider, Chip,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { motion } from 'framer-motion'
import CardMembershipRoundedIcon from '@mui/icons-material/CardMembershipRounded'
import { PageHeader, DataTable, StatusBadge, EmptyState } from '../components/ui'
import CompanyPicker from '../components/CompanyPicker'
import { subscriptionsApi } from '../api/endpoints'
import { fmtDate, fmtMoney } from '../utils/format'
import { errMsg } from '../api/client'
import { useToast } from '../context/ToastContext'

const PLANS = [
  { value: 'trial', label: 'Trial', days: '14 days' },
  { value: 'monthly', label: 'Monthly', days: '30 days' },
  { value: 'quarterly', label: 'Quarterly', days: '90 days' },
  { value: 'yearly', label: 'Yearly', days: '365 days' },
]

export default function Subscriptions() {
  const { notify } = useToast()
  const [companyId, setCompanyId] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ plan: 'trial', amount: '', currency: 'INR' })
  const [saving, setSaving] = useState(false)

  async function pick(id) {
    setCompanyId(id)
    setRows([])
    if (!id) return
    setLoading(true)
    try {
      setRows(await subscriptionsApi.listByCompany(id))
    } catch (e) {
      notify(errMsg(e), 'error')
    } finally {
      setLoading(false)
    }
  }

  async function create() {
    setSaving(true)
    try {
      await subscriptionsApi.create(companyId, { ...form, amount: Number(form.amount) || 0 })
      notify('Subscription activated', 'success')
      pick(companyId)
    } catch (e) {
      notify(errMsg(e), 'error')
    } finally {
      setSaving(false)
    }
  }

  async function cancel(id) {
    try {
      await subscriptionsApi.setStatus(id, 'cancelled')
      notify('Subscription cancelled', 'warning')
      pick(companyId)
    } catch (e) {
      notify(errMsg(e), 'error')
    }
  }

  const columns = [
    { key: 'plan', header: 'Plan', render: (r) => <StatusBadge status={r.plan} /> },
    { key: 'amount', header: 'Amount', value: (r) => Number(r.amount), render: (r) => fmtMoney(r.amount, r.currency) },
    { key: 'start_date', header: 'Start', render: (r) => fmtDate(r.start_date) },
    { key: 'end_date', header: 'End', render: (r) => fmtDate(r.end_date) },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'actions', header: '', align: 'right', sortable: false, exportable: false, render: (r) => (r.status === 'active' ? <Button size="small" color="warning" onClick={() => cancel(r.id)}>Cancel</Button> : null) },
  ]

  return (
    <Box>
      <PageHeader title="Subscriptions" subtitle="Manage billing plans for each company" actions={<CompanyPicker value={companyId} onChange={pick} label="Select a company" />} />

      {!companyId && (
        <Card><EmptyState icon={<CardMembershipRoundedIcon sx={{ fontSize: 42 }} />} title="Select a company" description="Choose a company to view and manage its subscription plans." /></Card>
      )}

      {companyId && (
        <Grid container spacing={2.5}>
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 2.5 }}>
              <Typography variant="h6" gutterBottom>New Subscription</Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={1.25} sx={{ mb: 2 }}>
                {PLANS.map((p) => (
                  <motion.div key={p.value} whileHover={{ x: 3 }}>
                    <Box
                      onClick={() => setForm((f) => ({ ...f, plan: p.value }))}
                      sx={{
                        cursor: 'pointer', borderRadius: 2.5, px: 2, py: 1.25, border: 1,
                        borderColor: (t) => (form.plan === p.value ? t.palette.primary.main : t.palette.divider),
                        bgcolor: (t) => (form.plan === p.value ? alpha(t.palette.primary.main, 0.08) : 'transparent'),
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}
                    >
                      <Box>
                        <Typography sx={{ fontWeight: 700 }}>{p.label}</Typography>
                        <Typography variant="caption" color="text.secondary">{p.days}</Typography>
                      </Box>
                      {form.plan === p.value && <Chip size="small" color="primary" label="Selected" />}
                    </Box>
                  </motion.div>
                ))}
              </Stack>
              <TextField label="Amount" type="number" fullWidth sx={{ mb: 2 }} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              <Button variant="contained" fullWidth onClick={create} disabled={saving}>{saving ? 'Activating…' : 'Activate Subscription'}</Button>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.25 }}>
                Activating expires any currently-active plan. End date is derived from the plan duration.
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} md={8}>
            <DataTable columns={columns} rows={rows} loading={loading} searchable={false} exportName="subscriptions" empty={{ icon: <CardMembershipRoundedIcon sx={{ fontSize: 42 }} />, title: 'No subscriptions yet', description: 'Activate a plan to start billing this company.' }} />
          </Grid>
        </Grid>
      )}
    </Box>
  )
}
