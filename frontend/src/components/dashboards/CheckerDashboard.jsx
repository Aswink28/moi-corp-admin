import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Grid, Card, Typography, Stack, Button, Divider, Skeleton } from '@mui/material'
import { alpha } from '@mui/material/styles'
import PendingActionsRoundedIcon from '@mui/icons-material/PendingActionsRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import BlockRoundedIcon from '@mui/icons-material/BlockRounded'
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded'
import { StatCard } from '../ui'
import WorkflowLegend from './WorkflowLegend'
import { dashboardApi } from '../../api/endpoints'
import { fmtDateTime } from '../../utils/format'
import { actionLabel } from '../../constants/workflow'

export default function CheckerDashboard({ user }) {
  const navigate = useNavigate()
  const [s, setS] = useState(null)
  useEffect(() => { dashboardApi.stats().then(setS).catch(() => setS(null)) }, [])

  return (
    <Box>
      <Card sx={{ mb: 3, p: { xs: 2.5, sm: 3.5 }, color: '#fff', position: 'relative', overflow: 'hidden', background: 'linear-gradient(120deg,#0c4a6e,#0ea5e9 60%,#6366f1)' }}>
        <Box sx={{ position: 'absolute', width: 260, height: 260, borderRadius: '50%', background: alpha('#fff', 0.08), top: -120, right: -60 }} />
        <Typography variant="h5" sx={{ fontWeight: 800 }}>Welcome, {user?.name?.split(' ')[0] || 'Checker'} 👋</Typography>
        <Typography sx={{ opacity: 0.9, mt: 0.5, maxWidth: 560 }}>Review submissions, verify compliance, and move them forward.</Typography>
        <Button onClick={() => navigate('/approvals')} variant="contained" sx={{ mt: 2, bgcolor: '#fff', color: 'primary.main', '&:hover': { bgcolor: '#f1f5f9' } }} startIcon={<FactCheckRoundedIcon />}>
          Open review queue
        </Button>
      </Card>

      <Grid container spacing={2.5}>
        {!s && Array.from({ length: 4 }).map((_, i) => <Grid item xs={12} sm={6} md={3} key={i}><Skeleton variant="rounded" height={132} /></Grid>)}
        {s && (
          <>
            <Grid item xs={12} sm={6} md={3}><StatCard index={0} icon={<PendingActionsRoundedIcon />} color="primary" label="Pending Reviews" value={s.pending_reviews} /></Grid>
            <Grid item xs={12} sm={6} md={3}><StatCard index={1} icon={<CheckCircleRoundedIcon />} color="success" label="Approved Requests" value={s.approved} /></Grid>
            <Grid item xs={12} sm={6} md={3}><StatCard index={2} icon={<BlockRoundedIcon />} color="error" label="Rejected Requests" value={s.rejected} /></Grid>
            <Grid item xs={12} sm={6} md={3}><StatCard index={3} icon={<FactCheckRoundedIcon />} color="warning" label="Awaiting Verification" value={s.awaiting_verification} /></Grid>
          </>
        )}
      </Grid>

      <Box sx={{ mt: 2.5 }}><WorkflowLegend highlight="Checker" /></Box>

      <Card sx={{ p: 2.5, mt: 2.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Recent Activity</Typography>
          <Button size="small" onClick={() => navigate('/approvals')}>Review queue</Button>
        </Stack>
        <Divider sx={{ mb: 1 }} />
        {(!s?.recentActivity || s.recentActivity.length === 0) && <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>No recent activity.</Typography>}
        <Stack spacing={0}>
          {s?.recentActivity?.map((a, i) => (
            <Box key={a.id} sx={{ display: 'flex', gap: 1.5, py: 1.25, borderBottom: i < s.recentActivity.length - 1 ? 1 : 0, borderColor: 'divider' }}>
              <Box sx={{ mt: 0.6, width: 9, height: 9, borderRadius: '50%', bgcolor: 'primary.main', flexShrink: 0 }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>{actionLabel(a.action)} · {a.company_name}</Typography>
                <Typography variant="caption" color="text.secondary">{a.company_code} · {fmtDateTime(a.created_at)}</Typography>
              </Box>
            </Box>
          ))}
        </Stack>
      </Card>
    </Box>
  )
}
