import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Grid, Card, CardContent, Typography, Stack, Avatar, Skeleton, Button, Divider,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { motion } from 'framer-motion'
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded'
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded'
import AddBusinessRoundedIcon from '@mui/icons-material/AddBusinessRounded'
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded'
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded'
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
} from 'recharts'
import { dashboardApi, auditApi } from '../api/endpoints'
import { fmtMoney, fmtDateTime } from '../utils/format'
import { StatCard } from '../components/ui'
import { useAuth } from '../context/AuthContext'

const PLAN_COLORS = ['#0ea5e9', '#6366f1', '#8b5cf6', '#16a34a']
const STATUS_COLORS = { active: '#16a34a', suspended: '#d97706', inactive: '#94a3b8' }

function QuickAction({ icon, label, desc, color, onClick }) {
  const theme = useTheme()
  const main = theme.palette[color].main
  return (
    <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }} style={{ height: '100%' }}>
      <Card onClick={onClick} sx={{ p: 2, cursor: 'pointer', height: '100%', display: 'flex', gap: 1.5, alignItems: 'center', '&:hover': { borderColor: main } }}>
        <Avatar variant="rounded" sx={{ bgcolor: alpha(main, 0.14), color: main, width: 44, height: 44 }}>{icon}</Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{label}</Typography>
          <Typography variant="caption" color="text.secondary">{desc}</Typography>
        </Box>
        <ArrowForwardRoundedIcon fontSize="small" sx={{ color: 'text.disabled' }} />
      </Card>
    </motion.div>
  )
}

export default function Dashboard() {
  const theme = useTheme()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [activity, setActivity] = useState([])

  useEffect(() => {
    dashboardApi.stats().then(setStats).catch(() => setStats(null))
    auditApi.list({ limit: 8 }).then(setActivity).catch(() => setActivity([]))
  }, [])

  const sp = stats?.subscriptionsByPlan || {}
  const planData = ['trial', 'monthly', 'quarterly', 'yearly'].map((p) => ({ name: p[0].toUpperCase() + p.slice(1), value: sp[p] || 0 }))
  const statusData = stats
    ? [
        { name: 'Active', value: stats.companies.active, key: 'active' },
        { name: 'Suspended', value: stats.companies.suspended, key: 'suspended' },
        { name: 'Inactive', value: stats.companies.inactive, key: 'inactive' },
      ].filter((d) => d.value > 0)
    : []

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <Box>
      {/* Welcome banner */}
      <Card sx={{ mb: 3, p: { xs: 2.5, sm: 3.5 }, color: '#fff', position: 'relative', overflow: 'hidden', background: 'linear-gradient(120deg,#312e81,#4f46e5 55%,#0ea5e9)' }}>
        <Box sx={{ position: 'absolute', width: 260, height: 260, borderRadius: '50%', background: alpha('#fff', 0.08), top: -120, right: -60 }} />
        <Typography variant="h5" sx={{ fontWeight: 800 }}>{greeting}, {user?.name?.split(' ')[0] || 'Admin'} 👋</Typography>
        <Typography sx={{ opacity: 0.9, mt: 0.5, maxWidth: 560 }}>
          Here's what's happening across your client companies today.
        </Typography>
        <Button onClick={() => navigate('/companies')} variant="contained" sx={{ mt: 2, bgcolor: '#fff', color: 'primary.main', '&:hover': { bgcolor: '#f1f5f9' } }} startIcon={<AddBusinessRoundedIcon />}>
          Onboard a company
        </Button>
      </Card>

      {/* KPI cards */}
      <Grid container spacing={2.5}>
        {!stats &&
          Array.from({ length: 4 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}><Skeleton variant="rounded" height={132} /></Grid>
          ))}
        {stats && (
          <>
            <Grid item xs={12} sm={6} md={3}><StatCard index={0} icon={<BusinessRoundedIcon />} color="primary" label="Total Companies" value={stats.companies.total} /></Grid>
            <Grid item xs={12} sm={6} md={3}><StatCard index={1} icon={<CheckCircleRoundedIcon />} color="success" label="Active Companies" value={stats.companies.active} /></Grid>
            <Grid item xs={12} sm={6} md={3}><StatCard index={2} icon={<AdminPanelSettingsRoundedIcon />} color="secondary" label="Company Admins" value={stats.admins.total} /></Grid>
            <Grid item xs={12} sm={6} md={3}><StatCard index={3} icon={<AccountBalanceWalletRoundedIcon />} color="warning" label="Wallet Balance" value={stats.walletTotalBalance} format={(n) => fmtMoney(n)} /></Grid>
          </>
        )}
      </Grid>

      {/* Charts */}
      <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
        <Grid item xs={12} md={7}>
          <Card sx={{ p: 2.5, height: 340 }}>
            <Typography variant="h6">Active Subscriptions by Plan</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Distribution across billing tiers</Typography>
            <ResponsiveContainer width="100%" height="78%">
              <BarChart data={planData} barSize={42}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: theme.palette.text.secondary }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: theme.palette.text.secondary }} axisLine={false} tickLine={false} />
                <RTooltip contentStyle={{ borderRadius: 12, border: `1px solid ${theme.palette.divider}`, background: theme.palette.background.paper }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {planData.map((_, i) => <Cell key={i} fill={PLAN_COLORS[i % PLAN_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
        <Grid item xs={12} md={5}>
          <Card sx={{ p: 2.5, height: 340 }}>
            <Typography variant="h6">Company Status</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Lifecycle distribution</Typography>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="78%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={3}>
                    {statusData.map((d) => <Cell key={d.key} fill={STATUS_COLORS[d.key]} />)}
                  </Pie>
                  <RTooltip contentStyle={{ borderRadius: 12, border: `1px solid ${theme.palette.divider}`, background: theme.palette.background.paper }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ height: '78%', display: 'grid', placeItems: 'center', color: 'text.secondary' }}>No companies yet</Box>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* Quick actions + activity */}
      <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
        <Grid item xs={12} md={7}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>Quick Actions</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}><QuickAction icon={<AddBusinessRoundedIcon />} color="primary" label="Create Company" desc="Onboard a new client" onClick={() => navigate('/companies')} /></Grid>
            <Grid item xs={12} sm={6}><QuickAction icon={<PersonAddAlt1RoundedIcon />} color="secondary" label="Add Company Admin" desc="Invite an admin user" onClick={() => navigate('/company-admins')} /></Grid>
            <Grid item xs={12} sm={6}><QuickAction icon={<PaymentsRoundedIcon />} color="warning" label="Manage Wallet" desc="Allocate or add funds" onClick={() => navigate('/wallets')} /></Grid>
            <Grid item xs={12} sm={6}><QuickAction icon={<HistoryRoundedIcon />} color="info" label="Audit Logs" desc="Review recent activity" onClick={() => navigate('/audit-logs')} /></Grid>
          </Grid>
        </Grid>
        <Grid item xs={12} md={5}>
          <Card sx={{ p: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Recent Activity</Typography>
              <Button size="small" onClick={() => navigate('/audit-logs')}>View all</Button>
            </Stack>
            <Divider sx={{ mb: 1 }} />
            <Stack spacing={0}>
              {activity.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>No recent activity.</Typography>}
              {activity.map((a, i) => (
                <Box key={a.id} sx={{ display: 'flex', gap: 1.5, py: 1.25, borderBottom: i < activity.length - 1 ? 1 : 0, borderColor: 'divider' }}>
                  <Box sx={{ mt: 0.5, width: 9, height: 9, borderRadius: '50%', bgcolor: 'primary.main', flexShrink: 0, animation: 'ca-pulse-ring 2.4s infinite' }} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>{a.action}</Typography>
                    <Typography variant="caption" color="text.secondary">{a.actor_email || 'system'} · {fmtDateTime(a.created_at)}</Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
