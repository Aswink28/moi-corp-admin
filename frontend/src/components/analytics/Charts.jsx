import { Card, Box, Typography, Stack, Chip, Tooltip } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend,
} from 'recharts'
import { fmtMoney } from '../../utils/format'

export const PALETTE = ['#4f46e5', '#0ea5e9', '#16a34a', '#d97706', '#dc2626', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b', '#22c55e']

const short = (n) => {
  const v = Number(n) || 0
  if (Math.abs(v) >= 1e7) return (v / 1e7).toFixed(1) + 'Cr'
  if (Math.abs(v) >= 1e5) return (v / 1e5).toFixed(1) + 'L'
  if (Math.abs(v) >= 1e3) return (v / 1e3).toFixed(1) + 'k'
  return String(v)
}

/** Titled card wrapper for any chart/section, with an optional "Demo data" badge. */
export function SectionCard({ title, subtitle, icon, demo, action, height, children }) {
  const theme = useTheme()
  return (
    <Card sx={{ p: 2.5, height: height ? '100%' : 'auto' }}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: subtitle ? 0.25 : 1.25 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          {icon && <Box sx={{ color: 'primary.main', display: 'grid', placeItems: 'center', '& svg': { fontSize: 20 } }}>{icon}</Box>}
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 16 }}>{title}</Typography>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          {action}
          {demo && (
            <Tooltip title="Sample data — wires to the Travel & Expense portal when its APIs are connected">
              <Chip size="small" icon={<InfoOutlinedIcon sx={{ fontSize: 14 }} />} label="Demo" sx={{ height: 22, fontWeight: 700, bgcolor: alpha(theme.palette.warning.main, 0.14), color: 'warning.main' }} />
            </Tooltip>
          )}
        </Stack>
      </Stack>
      {subtitle && <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{subtitle}</Typography>}
      {children}
    </Card>
  )
}

function tooltipStyle(theme) {
  return { borderRadius: 12, border: `1px solid ${theme.palette.divider}`, background: theme.palette.background.paper, fontSize: 12 }
}

/** Multi-series line/area trend. series = [{ key, name, color }]. */
export function Trend({ data, xKey = 'month', series, area = false, money = false, height = 240 }) {
  const theme = useTheme()
  const Chart = area ? AreaChart : LineChart
  return (
    <ResponsiveContainer width="100%" height={height}>
      <Chart data={data} margin={{ top: 6, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: theme.palette.text.secondary }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={short} tick={{ fontSize: 11, fill: theme.palette.text.secondary }} axisLine={false} tickLine={false} width={44} />
        <RTooltip contentStyle={tooltipStyle(theme)} formatter={(v) => (money ? fmtMoney(v) : v)} />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {series.map((s, i) => {
          const color = s.color || PALETTE[i % PALETTE.length]
          return area ? (
            <Area key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={color} fill={alpha(color, 0.18)} strokeWidth={2} />
          ) : (
            <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={color} strokeWidth={2.5} dot={false} />
          )
        })}
      </Chart>
    </ResponsiveContainer>
  )
}

/** Vertical bar chart (single or stacked). bars = [{ key, name, color }]. */
export function Bars({ data, xKey = 'name', bars, money = false, stacked = false, height = 240 }) {
  const theme = useTheme()
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 6, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: theme.palette.text.secondary }} axisLine={false} tickLine={false} interval={0} angle={data.length > 6 ? -20 : 0} textAnchor={data.length > 6 ? 'end' : 'middle'} height={data.length > 6 ? 50 : 30} />
        <YAxis tickFormatter={short} tick={{ fontSize: 11, fill: theme.palette.text.secondary }} axisLine={false} tickLine={false} width={44} />
        <RTooltip contentStyle={tooltipStyle(theme)} formatter={(v) => (money ? fmtMoney(v) : v)} />
        {bars.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {bars.map((b, i) => (
          <Bar key={b.key} dataKey={b.key} name={b.name} stackId={stacked ? 's' : undefined} fill={b.color || PALETTE[i % PALETTE.length]} radius={stacked ? 0 : [6, 6, 0, 0]} barSize={34} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

/** Donut / pie distribution. data = [{ name, value }]. */
export function Donut({ data, money = false, height = 240, colors = PALETTE }) {
  const theme = useTheme()
  const total = data.reduce((a, d) => a + (Number(d.value) || 0), 0)
  if (!total) return <Box sx={{ height, display: 'grid', placeItems: 'center', color: 'text.secondary' }}>No data</Box>
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="82%" paddingAngle={2}>
          {data.map((d, i) => <Cell key={d.name} fill={colors[i % colors.length]} />)}
        </Pie>
        <RTooltip contentStyle={tooltipStyle(theme)} formatter={(v, n) => [money ? fmtMoney(v) : v, n]} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

/** Ranked horizontal-bar list (top destinations/employees/departments). */
export function RankedList({ data, money = false, color, max }) {
  const theme = useTheme()
  const top = max ? data.slice(0, max) : data
  const peak = Math.max(1, ...top.map((d) => Number(d.value) || 0))
  return (
    <Stack spacing={1.25}>
      {top.length === 0 && <Typography variant="body2" color="text.secondary">No data</Typography>}
      {top.map((d, i) => {
        const c = color || PALETTE[i % PALETTE.length]
        return (
          <Box key={d.name}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.25 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600 }} noWrap>
                {d.name}{d.department ? <Typography component="span" variant="caption" color="text.secondary"> · {d.department}</Typography> : null}
              </Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{money ? fmtMoney(d.value) : (d.value ?? d.trips ?? d.actions)}</Typography>
            </Stack>
            <Box sx={{ height: 8, borderRadius: 4, bgcolor: alpha(c, 0.14), overflow: 'hidden' }}>
              <Box sx={{ width: `${((Number(d.value) || 0) / peak) * 100}%`, height: '100%', borderRadius: 4, bgcolor: c }} />
            </Box>
          </Box>
        )
      })}
    </Stack>
  )
}

/** Simple intensity heat-map grid. rows = [{ label, cells: [{ key, value }] }]. */
export function Heatmap({ rows, columns, money = false }) {
  const theme = useTheme()
  const all = rows.flatMap((r) => r.cells.map((c) => Number(c.value) || 0))
  const peak = Math.max(1, ...all)
  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: `120px repeat(${columns.length}, 1fr)`, gap: 0.5, minWidth: 420 }}>
        <Box />
        {columns.map((c) => <Typography key={c} variant="caption" sx={{ fontWeight: 700, textAlign: 'center', color: 'text.secondary' }}>{c}</Typography>)}
        {rows.map((r) => (
          <Box key={r.label} sx={{ display: 'contents' }}>
            <Typography variant="caption" sx={{ fontWeight: 600, alignSelf: 'center' }} noWrap>{r.label}</Typography>
            {r.cells.map((cell) => {
              const intensity = (Number(cell.value) || 0) / peak
              return (
                <Tooltip key={cell.key} title={money ? fmtMoney(cell.value) : String(cell.value)}>
                  <Box sx={{
                    height: 34, borderRadius: 1, display: 'grid', placeItems: 'center',
                    bgcolor: alpha(theme.palette.primary.main, 0.08 + intensity * 0.72),
                    color: intensity > 0.55 ? '#fff' : 'text.primary', fontSize: 11, fontWeight: 600,
                  }}>
                    {short(cell.value)}
                  </Box>
                </Tooltip>
              )
            })}
          </Box>
        ))}
      </Box>
    </Box>
  )
}
