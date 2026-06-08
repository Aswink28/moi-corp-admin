import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Grid, Card, Typography, Stack, Button, Divider, Skeleton } from '@mui/material'
import { alpha } from '@mui/material/styles'
import VerifiedUserRoundedIcon from '@mui/icons-material/VerifiedUserRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import BlockRoundedIcon from '@mui/icons-material/BlockRounded'
import PauseCircleRoundedIcon from '@mui/icons-material/PauseCircleRounded'
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded'
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded'
import PendingActionsRoundedIcon from '@mui/icons-material/PendingActionsRounded'
import { StatCard, StatusBadge } from '../ui'
import WorkflowLegend from './WorkflowLegend'
import { dashboardApi } from '../../api/endpoints'
import { fmtMoney, fmtDate } from '../../utils/format'

export default function SuperAdminDashboard({ user }) {
  const navigate = useNavigate()
  const [s, setS] = useState(null)
  useEffect(() => { dashboardApi.stats().then(setS).catch(() => setS(null)) }, [])

  return (
    <Box>
      <Card sx={{ mb: 3, p: { xs: 2.5, sm: 3.5 }, color: '#fff', position: 'relative', overflow: 'hidden', background: 'linear-gradient(120deg,#14532d,#16a34a 55%,#0ea5e9)' }}>
        <Box sx={{ position: 'absolute', width: 260, height: 260, borderRadius: '50%', background: alpha('#fff', 0.08), top: -120, right: -60 }} />
        <Typography variant="h5" sx={{ fontWeight: 800 }}>Welcome, {user?.name?.split(' ')[0] || 'Super Admin'} 👋</Typography>
        <Typography sx={{ opacity: 0.9, mt: 0.5, maxWidth: 560 }}>Approve & activate companies and oversee the platform.</Typography>
        <Button onClick={() => navigate('/approvals')} variant="contained" sx={{ mt: 2, bgcolor: '#fff', color: 'success.main', '&:hover': { bgcolor: '#f1f5f9' } }} startIcon={<VerifiedUserRoundedIcon />}>
          Final approvals
        </Button>
      </Card>

      <Grid container spacing={2.5}>
        {!s && Array.from({ length: 6 }).map((_, i) => <Grid item xs={12} sm={6} md={4} key={i}><Skeleton variant="rounded" height={132} /></Grid>)}
        {s && (
          <>
            <Grid item xs={12} sm={6} md={4}><StatCard index={0} icon={<PendingActionsRoundedIcon />} color="secondary" label="Pending Final Approvals" value={s.pendingFinalApprovals} /></Grid>
            <Grid item xs={12} sm={6} md={4}><StatCard index={1} icon={<CheckCircleRoundedIcon />} color="success" label="Active Companies" value={s.activeCompanies} /></Grid>
            <Grid item xs={12} sm={6} md={4}><StatCard index={2} icon={<BusinessRoundedIcon />} color="primary" label="Total Companies Onboarded" value={s.totalCompaniesOnboarded} /></Grid>
            <Grid item xs={12} sm={6} md={4}><StatCard index={3} icon={<BlockRoundedIcon />} color="error" label="Rejected Companies" value={s.rejectedCompanies} /></Grid>
            <Grid item xs={12} sm={6} md={4}><StatCard index={4} icon={<PauseCircleRoundedIcon />} color="warning" label="Suspended Companies" value={s.suspendedCompanies} /></Grid>
            <Grid item xs={12} sm={6} md={4}><StatCard index={5} icon={<PaymentsRoundedIcon />} color="info" label="Total Revenue" value={s.totalRevenue} format={(n) => fmtMoney(n)} /></Grid>
          </>
        )}
      </Grid>

      <Box sx={{ mt: 2.5 }}><WorkflowLegend highlight="Super Admin" /></Box>

      <Card sx={{ p: 2.5, mt: 2.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Recent Companies</Typography>
          <Button size="small" onClick={() => navigate('/companies')}>View all</Button>
        </Stack>
        <Divider sx={{ mb: 1 }} />
        {(!s?.recent || s.recent.length === 0) && <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>No companies yet.</Typography>}
        <Stack spacing={0}>
          {s?.recent?.map((c, i) => (
            <Box key={c.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.25, borderBottom: i < s.recent.length - 1 ? 1 : 0, borderColor: 'divider' }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{c.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {c.code}{c.maker_name ? ` · by ${c.maker_name}` : ''} · updated {fmtDate(c.updated_at)}
                </Typography>
              </Box>
              <StatusBadge status={c.status} />
            </Box>
          ))}
        </Stack>
      </Card>
    </Box>
  )
}
