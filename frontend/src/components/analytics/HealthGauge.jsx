import { Box, Typography, Stack, LinearProgress } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'

const BAND_COLOR = {
  Excellent: 'success',
  Good: 'info',
  Average: 'warning',
  'Needs Attention': 'error',
}

/** Semicircular gauge + per-factor breakdown for the company health score. */
export default function HealthGauge({ score = 0, band = 'Average', factors = [] }) {
  const theme = useTheme()
  const colorKey = BAND_COLOR[band] || 'info'
  const color = theme.palette[colorKey].main
  // Semicircle: 0 → 180deg. Arc length of a semicircle of r=80 ≈ π*80 ≈ 251.
  const r = 80
  const circ = Math.PI * r
  const pct = Math.max(0, Math.min(100, score)) / 100

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
      <Box sx={{ position: 'relative', width: 200, height: 116, flexShrink: 0 }}>
        <svg width="200" height="116" viewBox="0 0 200 116">
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke={alpha(color, 0.15)} strokeWidth="16" strokeLinecap="round" />
          <path
            d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke={color} strokeWidth="16" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
          />
        </svg>
        <Box sx={{ position: 'absolute', inset: 0, top: 28, display: 'grid', placeItems: 'center' }}>
          <Typography sx={{ fontWeight: 800, fontSize: 36, lineHeight: 1, color }}>{score}</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>/ 100</Typography>
        </Box>
      </Box>

      <Box sx={{ flex: 1, width: '100%' }}>
        <Typography sx={{ fontWeight: 800, color, fontSize: 18, mb: 1 }}>{band}</Typography>
        <Stack spacing={1}>
          {factors.map((f) => (
            <Box key={f.label}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption" sx={{ fontWeight: 600 }}>{f.label}</Typography>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>{f.score}</Typography>
              </Stack>
              <LinearProgress
                variant="determinate" value={Math.min(100, f.score)}
                sx={{ height: 6, borderRadius: 3, bgcolor: alpha(theme.palette.text.primary, 0.08), '& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: f.score >= 70 ? theme.palette.success.main : f.score >= 55 ? theme.palette.warning.main : theme.palette.error.main } }}
              />
            </Box>
          ))}
        </Stack>
      </Box>
    </Stack>
  )
}
