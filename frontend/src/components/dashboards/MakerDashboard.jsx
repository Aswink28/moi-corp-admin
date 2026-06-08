import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Grid, Card, Typography, Stack, Button, Divider, Skeleton } from '@mui/material'
import { alpha } from '@mui/material/styles'
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded'
import DraftsRoundedIcon from '@mui/icons-material/DraftsRounded'
import SendRoundedIcon from '@mui/icons-material/SendRounded'
import EditNoteRoundedIcon from '@mui/icons-material/EditNoteRounded'
import AddBusinessRoundedIcon from '@mui/icons-material/AddBusinessRounded'
import { StatCard, StatusBadge } from '../ui'
import WorkflowLegend from './WorkflowLegend'
import { dashboardApi } from '../../api/endpoints'
import { fmtDate } from '../../utils/format'

export default function MakerDashboard({ user }) {
  const navigate = useNavigate()
  const [s, setS] = useState(null)
  useEffect(() => { dashboardApi.stats().then(setS).catch(() => setS(null)) }, [])

  return (
    <Box>
      <Card sx={{ mb: 3, p: { xs: 2.5, sm: 3.5 }, color: '#fff', position: 'relative', overflow: 'hidden', background: 'linear-gradient(120deg,#312e81,#4f46e5 55%,#0ea5e9)' }}>
        <Box sx={{ position: 'absolute', width: 260, height: 260, borderRadius: '50%', background: alpha('#fff', 0.08), top: -120, right: -60 }} />
        <Typography variant="h5" sx={{ fontWeight: 800 }}>Welcome, {user?.name?.split(' ')[0] || 'Maker'} 👋</Typography>
        <Typography sx={{ opacity: 0.9, mt: 0.5, maxWidth: 560 }}>Create onboarding requests and track them through approval.</Typography>
        <Button onClick={() => navigate('/company-onboarding')} variant="contained" sx={{ mt: 2, bgcolor: '#fff', color: 'primary.main', '&:hover': { bgcolor: '#f1f5f9' } }} startIcon={<AddBusinessRoundedIcon />}>
          Onboard a company
        </Button>
      </Card>

      <Grid container spacing={2.5}>
        {!s && Array.from({ length: 4 }).map((_, i) => <Grid item xs={12} sm={6} md={3} key={i}><Skeleton variant="rounded" height={132} /></Grid>)}
        {s && (
          <>
            <Grid item xs={12} sm={6} md={3}><StatCard index={0} icon={<BusinessRoundedIcon />} color="primary" label="Total Companies Created" value={s.total_created} /></Grid>
            <Grid item xs={12} sm={6} md={3}><StatCard index={1} icon={<DraftsRoundedIcon />} color="secondary" label="Draft Applications" value={s.drafts} /></Grid>
            <Grid item xs={12} sm={6} md={3}><StatCard index={2} icon={<SendRoundedIcon />} color="info" label="Submitted Applications" value={s.submitted + s.in_review} /></Grid>
            <Grid item xs={12} sm={6} md={3}><StatCard index={3} icon={<EditNoteRoundedIcon />} color="warning" label="Returned for Changes" value={s.changes_requested} /></Grid>
          </>
        )}
      </Grid>

      <Box sx={{ mt: 2.5 }}><WorkflowLegend highlight="Maker" /></Box>

      <Card sx={{ p: 2.5, mt: 2.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Recently Created Companies</Typography>
          <Button size="small" onClick={() => navigate('/approvals')}>View all</Button>
        </Stack>
        <Divider sx={{ mb: 1 }} />
        {(!s?.recent || s.recent.length === 0) && <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>No companies yet — start by onboarding one.</Typography>}
        <Stack spacing={0}>
          {s?.recent?.map((c, i) => (
            <Box key={c.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.25, borderBottom: i < s.recent.length - 1 ? 1 : 0, borderColor: 'divider' }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{c.name}</Typography>
                <Typography variant="caption" color="text.secondary">{c.code} · created {fmtDate(c.created_at)}</Typography>
              </Box>
              <StatusBadge status={c.status} />
            </Box>
          ))}
        </Stack>
      </Card>
    </Box>
  )
}
