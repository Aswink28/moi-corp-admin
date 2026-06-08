import { Box, Typography, Stack } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import EditNoteRoundedIcon from '@mui/icons-material/EditNoteRounded'
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded'
import VerifiedUserRoundedIcon from '@mui/icons-material/VerifiedUserRounded'
import RocketLaunchRoundedIcon from '@mui/icons-material/RocketLaunchRounded'
import { statusMeta, WORKFLOW_STAGES } from '../constants/workflow'

const STAGE_ICONS = [<EditNoteRoundedIcon />, <FactCheckRoundedIcon />, <VerifiedUserRoundedIcon />, <RocketLaunchRoundedIcon />]

/**
 * Horizontal stepper: Maker → Checker → Super Admin → Active.
 * Highlights completed/current stages from the company status. Rejected records
 * render the current stage in red.
 */
export default function WorkflowTracker({ status, size = 'md' }) {
  const theme = useTheme()
  const meta = statusMeta(status)
  const stage = meta.stage // -1 for rejected/inactive
  const rejected = status === 'rejected'
  const changes = status === 'changes_requested'

  const dot = size === 'sm' ? 30 : 38
  const fz = size === 'sm' ? 16 : 19

  return (
    <Box sx={{ width: '100%' }}>
      <Stack direction="row" alignItems="flex-start" sx={{ width: '100%' }}>
        {WORKFLOW_STAGES.map((label, i) => {
          const done = stage > i && stage !== -1
          const current = stage === i && stage !== -1
          const isRejectedHere = rejected && i === 1 // rejection happens at review stages; mark checker
          const active = done || current
          let color = theme.palette.text.disabled
          if (active) color = theme.palette.primary.main
          if (current && status === 'active') color = theme.palette.success.main
          if ((rejected && i <= 1) ) color = i === 1 ? theme.palette.error.main : theme.palette.primary.main
          if (changes && i === 0) color = theme.palette.warning.main

          return (
            <Box key={label} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
              {/* connector to the left */}
              {i > 0 && (
                <Box
                  sx={{
                    position: 'absolute', top: dot / 2 - 1, right: '50%', width: '100%', height: 3, borderRadius: 2,
                    bgcolor: stage > i - 1 && stage !== -1 ? alpha(theme.palette.primary.main, 0.5) : theme.palette.divider,
                    zIndex: 0,
                  }}
                />
              )}
              <Box
                sx={{
                  width: dot, height: dot, borderRadius: '50%', display: 'grid', placeItems: 'center',
                  zIndex: 1, fontSize: fz, flexShrink: 0,
                  color: active || current ? '#fff' : theme.palette.text.disabled,
                  bgcolor: active ? color : theme.palette.action.disabledBackground,
                  border: current ? `3px solid ${alpha(color, 0.25)}` : 'none',
                  boxShadow: active ? `0 4px 12px ${alpha(color, 0.4)}` : 'none',
                  transition: 'all .25s ease',
                }}
              >
                {rejected && i === 1 ? (
                  <CloseRoundedIcon sx={{ fontSize: fz }} />
                ) : done ? (
                  <CheckRoundedIcon sx={{ fontSize: fz }} />
                ) : (
                  <Box sx={{ display: 'grid', placeItems: 'center', '& svg': { fontSize: fz } }}>{STAGE_ICONS[i]}</Box>
                )}
              </Box>
              <Typography
                sx={{
                  mt: 0.75, fontSize: size === 'sm' ? 11 : 12, fontWeight: current ? 700 : 600, textAlign: 'center',
                  color: active ? 'text.primary' : 'text.secondary',
                }}
              >
                {label}
              </Typography>
            </Box>
          )
        })}
      </Stack>
    </Box>
  )
}
