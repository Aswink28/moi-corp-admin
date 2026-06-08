import { Card, Box, Typography, Stack } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import EditNoteRoundedIcon from '@mui/icons-material/EditNoteRounded'
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded'
import VerifiedUserRoundedIcon from '@mui/icons-material/VerifiedUserRounded'
import RocketLaunchRoundedIcon from '@mui/icons-material/RocketLaunchRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'

const STAGES = [
  { label: 'Maker', sub: 'Submit', icon: <EditNoteRoundedIcon />, color: 'primary' },
  { label: 'Checker', sub: 'Verify', icon: <FactCheckRoundedIcon />, color: 'info' },
  { label: 'Super Admin', sub: 'Approve', icon: <VerifiedUserRoundedIcon />, color: 'secondary' },
  { label: 'Active', sub: 'Provisioned', icon: <RocketLaunchRoundedIcon />, color: 'success' },
]

/** Static process diagram: Maker → Checker → Super Admin → Active. */
export default function WorkflowLegend({ highlight }) {
  const theme = useTheme()
  return (
    <Card sx={{ p: 2.5 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Approval Workflow</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Every company flows through a governed 3-level approval before activation.
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" spacing={1}>
        {STAGES.map((s, i) => {
          const main = theme.palette[s.color].main
          const on = !highlight || highlight === s.label
          return (
            <Box key={s.label} sx={{ display: 'contents' }}>
              <Stack alignItems="center" spacing={0.75} sx={{ flex: 1, opacity: on ? 1 : 0.5 }}>
                <Box sx={{ width: 48, height: 48, borderRadius: '50%', display: 'grid', placeItems: 'center', color: '#fff', background: `linear-gradient(135deg, ${main}, ${alpha(main, 0.7)})`, boxShadow: `0 6px 16px ${alpha(main, 0.35)}` }}>
                  {s.icon}
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{s.label}</Typography>
                  <Typography variant="caption" color="text.secondary">{s.sub}</Typography>
                </Box>
              </Stack>
              {i < STAGES.length - 1 && (
                <ChevronRightRoundedIcon sx={{ color: 'text.disabled', transform: { xs: 'rotate(90deg)', sm: 'none' } }} />
              )}
            </Box>
          )
        })}
      </Stack>
    </Card>
  )
}
