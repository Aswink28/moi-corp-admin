import { useEffect, useState } from 'react'
import {
  Box, Grid, Card, Typography, Stack, Avatar, Chip, Autocomplete, TextField, MenuItem,
  Skeleton, Divider, Tabs, Tab,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import FlightTakeoffRoundedIcon from '@mui/icons-material/FlightTakeoffRounded'
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'
import CreditScoreRoundedIcon from '@mui/icons-material/CreditScoreRounded'
import CardMembershipRoundedIcon from '@mui/icons-material/CardMembershipRounded'
import SavingsRoundedIcon from '@mui/icons-material/SavingsRounded'
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded'
import RuleRoundedIcon from '@mui/icons-material/RuleRounded'
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded'
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded'
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded'
import MonitorHeartRoundedIcon from '@mui/icons-material/MonitorHeartRounded'
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded'
import { PageHeader, StatCard, StatusBadge } from '../components/ui'
import { SectionCard, Trend, Bars, Donut, RankedList, Heatmap, PALETTE } from '../components/analytics/Charts'
import HealthGauge from '../components/analytics/HealthGauge'
import { companiesApi, analyticsApi } from '../api/endpoints'
import { errMsg, assetBase } from '../api/client'
import { useToast } from '../context/ToastContext'
import { fmtMoney, fmtDate } from '../utils/format'

const resolveLogo = (url) => {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${assetBase}${url.startsWith('/') ? '' : '/'}${url}`
}

// Small inline metric (label + bold value) used inside sections.
function Metric({ label, value, sub }) {
  return (
    <Box sx={{ minWidth: 120 }}>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>{label}</Typography>
      <Typography sx={{ fontWeight: 800, fontSize: 19, lineHeight: 1.2 }}>{value}</Typography>
      {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
    </Box>
  )
}
function MetricRow({ children }) {
  return <Stack direction="row" flexWrap="wrap" useFlexGap spacing={3} sx={{ mb: 2 }}>{children}</Stack>
}
function SummaryItem({ label, children }) {
  return (
    <Grid item xs={6} sm={4} md={3}>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, fontSize: 10.5 }}>{label}</Typography>
      <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{children ?? '—'}</Typography>
    </Grid>
  )
}

export default function CompanyAnalytics() {
  const theme = useTheme()
  const { notify } = useToast()
  const [companies, setCompanies] = useState([])
  const [selected, setSelected] = useState(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [range, setRange] = useState(12)
  const [dept, setDept] = useState('All')
  const [location, setLocation] = useState('All')
  const [bookingType, setBookingType] = useState('All')
  const [status, setStatus] = useState('All')
  const [category, setCategory] = useState('All')
  const [recentTab, setRecentTab] = useState(0)

  useEffect(() => {
    companiesApi.list()
      .then((rows) => {
        setCompanies(rows)
        // Default to the first active company, else the first company.
        const def = rows.find((r) => r.status === 'active') || rows[0]
        if (def) setSelected(def)
      })
      .catch((e) => notify(errMsg(e), 'error'))
  }, []) // eslint-disable-line

  useEffect(() => {
    if (!selected) return
    setLoading(true)
    analyticsApi.company(selected.id)
      .then(setData)
      .catch((e) => { notify(errMsg(e), 'error'); setData(null) })
      .finally(() => setLoading(false))
  }, [selected]) // eslint-disable-line

  // Date-range filter: keep only the last N months of any monthly series.
  const sliceN = (arr) => (Array.isArray(arr) ? arr.slice(-range) : [])

  const filters = (
    <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1.5} alignItems="center">
      <TextField select size="small" label="Date Range" value={range} onChange={(e) => setRange(Number(e.target.value))} sx={{ minWidth: 130 }}>
        <MenuItem value={3}>Last 3 months</MenuItem>
        <MenuItem value={6}>Last 6 months</MenuItem>
        <MenuItem value={12}>Last 12 months</MenuItem>
      </TextField>
      <TextField select size="small" label="Department" value={dept} onChange={(e) => setDept(e.target.value)} sx={{ minWidth: 150 }}>
        <MenuItem value="All">All Departments</MenuItem>
        {(data?.meta?.departments || []).map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
      </TextField>
      <TextField select size="small" label="Location" value={location} onChange={(e) => setLocation(e.target.value)} sx={{ minWidth: 140 }}>
        <MenuItem value="All">All Locations</MenuItem>
        {(data?.meta?.locations || []).map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
      </TextField>
      <TextField select size="small" label="Booking Type" value={bookingType} onChange={(e) => setBookingType(e.target.value)} sx={{ minWidth: 130 }}>
        {['All', 'Flight', 'Hotel', 'Train', 'Bus'].map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
      </TextField>
      <TextField select size="small" label="Expense Category" value={category} onChange={(e) => setCategory(e.target.value)} sx={{ minWidth: 150 }}>
        <MenuItem value="All">All Categories</MenuItem>
        {(data?.meta?.expenseCategories || []).map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
      </TextField>
      <TextField select size="small" label="Status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 130 }}>
        {['All', 'Approved', 'Pending', 'Rejected', 'Cancelled'].map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
      </TextField>
    </Stack>
  )

  const companySelector = (
    <Autocomplete
      size="small" sx={{ minWidth: 280 }} options={companies} value={selected}
      onChange={(_, v) => setSelected(v)}
      getOptionLabel={(o) => (o ? `${o.name} (${o.code})` : '')}
      isOptionEqualToValue={(o, v) => o.id === v.id}
      renderInput={(params) => <TextField {...params} label="Select company" placeholder="Search companies…" />}
    />
  )

  return (
    <Box>
      <PageHeader
        title="Company Analytics"
        subtitle="A complete 360° view of an onboarded company — performance, financials, travel, expenses, policy & health."
        actions={companySelector}
      />

      {!selected && (
        <Card sx={{ p: 6, textAlign: 'center', color: 'text.secondary' }}>
          <BusinessRoundedIcon sx={{ fontSize: 42, mb: 1 }} />
          <Typography>Select a company to view its analytics.</Typography>
        </Card>
      )}

      {selected && (loading || !data) && (
        <Grid container spacing={2.5}>
          {Array.from({ length: 8 }).map((_, i) => <Grid item xs={12} sm={6} md={3} key={i}><Skeleton variant="rounded" height={120} /></Grid>)}
          <Grid item xs={12}><Skeleton variant="rounded" height={300} /></Grid>
        </Grid>
      )}

      {selected && !loading && data && (
        <Stack spacing={3}>
          {/* ── Summary + Health ─────────────────────────────────────────────── */}
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={7}>
              <Card sx={{ p: 2.5, height: '100%' }}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <Avatar variant="rounded" src={resolveLogo(data.summary.logo_url) || undefined} sx={{ width: 60, height: 60, bgcolor: (t) => alpha(t.palette.primary.main, 0.12), color: 'primary.main', fontWeight: 800, fontSize: 24 }}>
                    {!data.summary.logo_url && data.summary.name?.charAt(0)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>{data.summary.name}</Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip size="small" label={data.summary.code} sx={{ fontWeight: 700 }} />
                      <StatusBadge status={data.summary.status} />
                      <Typography variant="caption" color="text.secondary">{data.summary.industry || '—'}</Typography>
                    </Stack>
                  </Box>
                </Stack>
                <Grid container spacing={1.5}>
                  <SummaryItem label="Subscription Plan"><Typography component="span" sx={{ textTransform: 'capitalize', fontWeight: 700 }}>{data.summary.subscriptionPlan}</Typography></SummaryItem>
                  <SummaryItem label="Onboarding Date">{fmtDate(data.summary.onboardingDate)}</SummaryItem>
                  <SummaryItem label="Renewal Date">{fmtDate(data.summary.renewalDate)}</SummaryItem>
                  <SummaryItem label="Account Manager">{data.summary.accountManager}</SummaryItem>
                  <SummaryItem label="Total Employees">{data.summary.totalEmployees.toLocaleString('en-IN')}</SummaryItem>
                  <SummaryItem label="Active Employees">{data.summary.activeEmployees.toLocaleString('en-IN')}</SummaryItem>
                  <SummaryItem label="Total Departments">{data.summary.totalDepartments}</SummaryItem>
                  <SummaryItem label="Company Admins">{data.summary.adminCount}</SummaryItem>
                </Grid>
              </Card>
            </Grid>
            <Grid item xs={12} md={5}>
              <SectionCard title="Company Health Score" icon={<MonitorHeartRoundedIcon />} live height>
                <HealthGauge score={data.health.score} band={data.health.band} factors={data.health.factors} />
              </SectionCard>
            </Grid>
          </Grid>

          {/* ── Live-data unavailable banner ─────────────────────────────────── */}
          {data.productUnavailable && (
            <Card sx={{ p: 1.5, bgcolor: (t) => alpha(t.palette.warning.main, 0.12), border: (t) => `1px solid ${alpha(t.palette.warning.main, 0.4)}` }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'warning.main' }}>
                Live operational data is currently unavailable from the Product system{data.productError ? ` (${data.productError})` : ''}. Company profile, subscription, credit and invoice figures below are live; operational metrics show 0 until the Product system is reachable.
              </Typography>
            </Card>
          )}

          {/* ── Filters ──────────────────────────────────────────────────────── */}
          <Card sx={{ p: 2 }}>
            {filters}
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Date range filters all trend charts. Department & location filter their respective views. All figures are live from the Moi-Corp Product system, aggregated in real time.
            </Typography>
          </Card>

          {/* ── Top KPI cards ────────────────────────────────────────────────── */}
          <Grid container spacing={2.5}>
            {[
              { icon: <GroupsRoundedIcon />, label: 'Total Employees', value: data.kpis.totalEmployees, color: 'primary' },
              { icon: <PersonRoundedIcon />, label: 'Active Employees', value: data.kpis.activeEmployees, color: 'success' },
              { icon: <FlightTakeoffRoundedIcon />, label: 'Total Bookings', value: data.kpis.totalBookings, color: 'info' },
              { icon: <PaymentsRoundedIcon />, label: 'Total Booking Value', value: data.kpis.totalBookingValue, color: 'secondary', money: true },
              { icon: <ReceiptLongRoundedIcon />, label: 'Total Expense Claims', value: data.kpis.totalExpenseClaims, color: 'warning' },
              { icon: <PaymentsRoundedIcon />, label: 'Total Claim Amount', value: data.kpis.totalClaimAmount, color: 'warning', money: true },
              { icon: <TrendingUpRoundedIcon />, label: 'Revenue Generated', value: data.kpis.totalRevenue, color: 'success', money: true },
              { icon: <SavingsRoundedIcon />, label: 'Outstanding Amount', value: data.kpis.outstandingAmount, color: 'error', money: true },
              { icon: <CreditScoreRoundedIcon />, label: 'Credit Limit', value: data.kpis.creditLimit, color: 'info', money: true },
              { icon: <AccountBalanceWalletRoundedIcon />, label: 'Available Credit', value: data.kpis.availableCredit, color: 'primary', money: true },
              { icon: <CardMembershipRoundedIcon />, label: 'Subscription Value', value: data.kpis.subscriptionValue, color: 'secondary', money: true },
              { icon: <TrendingUpRoundedIcon />, label: 'Avg Monthly Spend', value: data.kpis.avgMonthlySpend, color: 'info', money: true },
            ].map((k, i) => (
              <Grid item xs={12} sm={6} md={3} key={k.label}>
                <StatCard index={i} icon={k.icon} color={k.color} label={k.label} value={k.value} format={k.money ? ((n) => fmtMoney(n)) : undefined} />
              </Grid>
            ))}
          </Grid>

          {/* ── Employee Analytics ───────────────────────────────────────────── */}
          <SectionCard title="Employee Analytics" icon={<GroupsRoundedIcon />} live>
            <MetricRow>
              <Metric label="Total" value={data.employee.total.toLocaleString('en-IN')} />
              <Metric label="Active" value={data.employee.active.toLocaleString('en-IN')} />
              <Metric label="Inactive" value={data.employee.inactive.toLocaleString('en-IN')} />
              <Metric label="Added This Month" value={data.employee.addedThisMonth} />
            </MetricRow>
            <Grid container spacing={2.5}>
              <Grid item xs={12}><Typography variant="subtitle2" sx={{ mb: 1 }}>Employee Growth Trend</Typography><Trend data={sliceN(data.employee.growthTrend)} series={[{ key: 'employees', name: 'Employees' }]} area /></Grid>
            </Grid>
          </SectionCard>

          {/* ── Booking Analytics ────────────────────────────────────────────── */}
          <SectionCard title="Booking Analytics" icon={<FlightTakeoffRoundedIcon />} live>
            <MetricRow>
              <Metric label="Flight" value={data.booking.flight} />
              <Metric label="Hotel" value={data.booking.hotel} />
              <Metric label="Train" value={data.booking.train} />
              <Metric label="Bus" value={data.booking.bus} />
              <Metric label="Approved" value={data.booking.approved} />
              <Metric label="Pending" value={data.booking.pending} />
              <Metric label="Rejected" value={data.booking.rejected} />
              <Metric label="Cancelled" value={data.booking.cancelled} />
              <Metric label="Ticketed" value={data.booking.ticketed} />
            </MetricRow>
          </SectionCard>

          {/* ── Payment & Billing ────────────────────────────────────────────── */}
          <SectionCard title="Payment & Billing Analytics" icon={<PaymentsRoundedIcon />}
            action={<Chip size="small" label="Invoices = live" sx={{ fontWeight: 600 }} />}>
            <MetricRow>
              <Metric label="Subscription Fee" value={fmtMoney(data.billing.subscriptionFee)} />
              <Metric label="Last Payment" value={fmtDate(data.billing.lastPaymentDate)} />
              <Metric label="Next Billing" value={fmtDate(data.billing.nextBillingDate)} />
              <Metric label="Payment Status" value={data.billing.paymentStatus} />
              <Metric label="Overdue Amount" value={fmtMoney(data.billing.overdueAmount)} />
              <Metric label="Outstanding Invoices" value={data.billing.outstandingInvoices} />
            </MetricRow>
            <Grid container spacing={2.5}>
              <Grid item xs={12} md={6}><Typography variant="subtitle2" sx={{ mb: 1 }}>Billing Trend</Typography><Bars data={sliceN(data.billing.billingTrend)} xKey="month" bars={[{ key: 'billed', name: 'Billed' }]} money /></Grid>
              <Grid item xs={12} md={6}><Typography variant="subtitle2" sx={{ mb: 1 }}>Payment Collection Trend</Typography><Trend data={sliceN(data.billing.collectionTrend)} series={[{ key: 'collected', name: 'Collected', color: theme.palette.success.main }]} money area /></Grid>
            </Grid>
          </SectionCard>

          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', display: 'block', pb: 2 }}>
            Operational analytics are live from the Moi-Corp Product system, aggregated in real time. Company profile, subscription, credit and invoice figures come from the Admin system of record. Policy-compliance metrics are not yet tracked by the Product system.
          </Typography>
        </Stack>
      )}
    </Box>
  )
}
