import {
  Box, Stepper, Step, StepLabel, StepButton, LinearProgress, Typography, useMediaQuery,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'

/**
 * Responsive onboarding stepper.
 *  - Desktop: a full horizontal MUI Stepper with clickable labels for visited steps.
 *  - Mobile: a compact "Step n of N — <Title>" header.
 * In both modes a brand-coloured progress bar shows overall completion %.
 *
 * Props:
 *   steps:     string[] — the 11 step titles (order is canonical).
 *   active:    number   — current step index (0-based).
 *   maxVisited:number   — highest step index reached so far (controls clickability).
 *   onStepClick:(index:number)=>void — invoked when a visited step label is clicked.
 */
export default function WizardStepper({ steps = [], active = 0, maxVisited = 0, onStepClick }) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const total = steps.length || 1
  const pct = Math.round(((active + 1) / total) * 100)

  return (
    <Box>
      {/* Progress bar + percentage */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
        <Box sx={{ flex: 1 }}>
          <LinearProgress
            variant="determinate"
            value={pct}
            sx={{
              height: 8,
              borderRadius: 999,
              bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
              '& .MuiLinearProgress-bar': { borderRadius: 999 },
            }}
          />
        </Box>
        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', minWidth: 36, textAlign: 'right' }}>
          {pct}%
        </Typography>
      </Box>

      {isMobile ? (
        // Compact mobile header
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>
            Step {active + 1} of {total}
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
            {steps[active]}
          </Typography>
        </Box>
      ) : (
        <Stepper nonLinear activeStep={active} alternativeLabel sx={{ '& .MuiStepConnector-line': { borderColor: 'divider' } }}>
          {steps.map((label, i) => {
            const visited = i <= maxVisited
            const completed = i < active
            return (
              <Step key={label} completed={completed}>
                <StepButton
                  onClick={() => visited && onStepClick && onStepClick(i)}
                  disabled={!visited}
                  sx={{ '& .MuiStepLabel-label': { fontSize: 12, fontWeight: i === active ? 700 : 500 } }}
                >
                  <StepLabel
                    StepIconComponent={completed ? () => <CheckIcon /> : undefined}
                  >
                    {label}
                  </StepLabel>
                </StepButton>
              </Step>
            )
          })}
        </Stepper>
      )}
    </Box>
  )
}

function CheckIcon() {
  return (
    <Box
      sx={{
        width: 24, height: 24, borderRadius: '50%', display: 'grid', placeItems: 'center',
        bgcolor: 'primary.main', color: 'primary.contrastText',
      }}
    >
      <CheckRoundedIcon sx={{ fontSize: 16 }} />
    </Box>
  )
}
