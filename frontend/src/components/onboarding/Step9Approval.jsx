import {
  Card, Grid, Typography, Stack, Box, Switch, Radio, RadioGroup,
  FormControlLabel, FormControl, FormHelperText, IconButton, Tooltip,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded'
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded'
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'

// Employee is the implicit originating level and is always present (not stored).
// Toggleable participating levels stored in data.approval.levels as ordered keys.
const LEVELS = [
  { key: 'manager', label: 'Manager' },
  { key: 'travel_admin', label: 'Travel Admin' },
  { key: 'finance', label: 'Finance' },
]

export default function Step9Approval({ data, setField, errors, meta }) {
  const approval = data.approval || {}
  const required = !!approval.approval_required
  const type = approval.approval_type || 'none'
  const levels = Array.isArray(approval.levels) ? approval.levels : []
  const isMulti = required && type === 'multi'

  const setRequired = (checked) => {
    setField('approval.approval_required', checked)
    if (!checked) {
      setField('approval.approval_type', 'none')
      setField('approval.levels', [])
    } else if (type === 'none') {
      setField('approval.approval_type', 'single')
    }
  }

  const setType = (value) => {
    setField('approval.approval_type', value)
    if (value !== 'multi') setField('approval.levels', [])
    else if (levels.length === 0) setField('approval.levels', LEVELS.map((l) => l.key))
  }

  const toggleLevel = (key, enabled) => {
    let next
    if (enabled) {
      // Insert preserving the canonical LEVELS ordering for newly-added keys.
      const set = new Set([...levels, key])
      next = LEVELS.map((l) => l.key).filter((k) => set.has(k))
    } else {
      next = levels.filter((k) => k !== key)
    }
    setField('approval.levels', next)
  }

  const move = (idx, dir) => {
    const target = idx + dir
    if (target < 0 || target >= levels.length) return
    const next = [...levels]
    const [item] = next.splice(idx, 1)
    next.splice(target, 0, item)
    setField('approval.levels', next)
  }

  const labelOf = (key) => LEVELS.find((l) => l.key === key)?.label || key
  const types = meta?.approval_types || ['none', 'single', 'multi']
  const supportsSingle = types.includes('single')
  const supportsMulti = types.includes('multi')

  return (
    <Card sx={{ p: 2.5 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
        <Box
          sx={{
            width: 38, height: 38, borderRadius: 1.5, display: 'grid', placeItems: 'center',
            bgcolor: (t) => alpha(t.palette.primary.main, 0.12), color: 'primary.main',
          }}
        >
          <AccountTreeRoundedIcon fontSize="small" />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Approval Workflow</Typography>
          <Typography variant="caption" color="text.secondary">
            Configure whether travel and expense requests need approval before booking.
          </Typography>
        </Box>
      </Stack>

      <Grid container spacing={2} sx={{ mt: 0.5 }}>
        <Grid item xs={12}>
          <Box
            sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              p: 1.5, borderRadius: 1.5, border: 1, borderColor: 'divider',
            }}
          >
            <Box>
              <Typography sx={{ fontWeight: 600, fontSize: 14 }}>Approval Required</Typography>
              <Typography variant="caption" color="text.secondary">
                When off, requests are auto-approved without any review step.
              </Typography>
            </Box>
            <Switch
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
            />
          </Box>
        </Grid>

        {required && (
          <Grid item xs={12}>
            <FormControl error={!!errors['approval.approval_type']}>
              <Typography sx={{ fontWeight: 600, fontSize: 14, mb: 0.5 }}>Approval Type</Typography>
              <RadioGroup
                row
                value={type === 'none' ? '' : type}
                onChange={(e) => setType(e.target.value)}
              >
                {supportsSingle && (
                  <FormControlLabel value="single" control={<Radio />} label="Single Level" />
                )}
                {supportsMulti && (
                  <FormControlLabel value="multi" control={<Radio />} label="Multi-Level" />
                )}
              </RadioGroup>
              <FormHelperText>
                {errors['approval.approval_type']
                  || (type === 'single'
                    ? 'A single approver reviews every request.'
                    : type === 'multi'
                      ? 'Requests move through an ordered chain of approvers.'
                      : 'Choose how requests are reviewed.')}
              </FormHelperText>
            </FormControl>
          </Grid>
        )}

        {isMulti && (
          <Grid item xs={12}>
            <Typography sx={{ fontWeight: 600, fontSize: 14, mb: 0.25 }}>Approval Levels</Typography>
            <Typography variant="caption" color="text.secondary">
              Every request starts with the Employee. Enable and order the levels that participate.
            </Typography>

            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
              useFlexGap
              sx={{ mt: 1.5, mb: 1 }}
            >
              <Box
                sx={{
                  px: 1.25, py: 0.5, borderRadius: 1, fontSize: 13, fontWeight: 600,
                  bgcolor: (t) => alpha(t.palette.text.secondary, 0.1), color: 'text.secondary',
                }}
              >
                Employee
              </Box>
              {levels.map((key) => (
                <Stack key={key} direction="row" spacing={1} alignItems="center">
                  <ArrowForwardRoundedIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                  <Box
                    sx={{
                      px: 1.25, py: 0.5, borderRadius: 1, fontSize: 13, fontWeight: 600,
                      bgcolor: (t) => alpha(t.palette.primary.main, 0.12), color: 'primary.main',
                    }}
                  >
                    {labelOf(key)}
                  </Box>
                </Stack>
              ))}
              {levels.length === 0 && (
                <Typography variant="caption" color="error">
                  Enable at least one approval level below.
                </Typography>
              )}
            </Stack>

            <Stack spacing={1}>
              {LEVELS.map((lvl) => {
                const enabled = levels.includes(lvl.key)
                const orderIdx = levels.indexOf(lvl.key)
                return (
                  <Box
                    key={lvl.key}
                    sx={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      p: 1.25, borderRadius: 1.5, border: 1,
                      borderColor: enabled ? 'primary.main' : 'divider',
                      bgcolor: (t) => (enabled ? alpha(t.palette.primary.main, 0.04) : 'transparent'),
                    }}
                  >
                    <FormControlLabel
                      sx={{ m: 0 }}
                      control={(
                        <Switch
                          checked={enabled}
                          onChange={(e) => toggleLevel(lvl.key, e.target.checked)}
                        />
                      )}
                      label={(
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{lvl.label}</Typography>
                          {enabled && (
                            <Typography variant="caption" color="text.secondary">
                              Level {orderIdx + 1}
                            </Typography>
                          )}
                        </Stack>
                      )}
                    />
                    {enabled && (
                      <Box sx={{ whiteSpace: 'nowrap' }}>
                        <Tooltip title="Move up">
                          <span>
                            <IconButton
                              size="small"
                              disabled={orderIdx <= 0}
                              onClick={() => move(orderIdx, -1)}
                            >
                              <ArrowUpwardRoundedIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Move down">
                          <span>
                            <IconButton
                              size="small"
                              disabled={orderIdx >= levels.length - 1}
                              onClick={() => move(orderIdx, 1)}
                            >
                              <ArrowDownwardRoundedIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    )}
                  </Box>
                )
              })}
            </Stack>
          </Grid>
        )}
      </Grid>
    </Card>
  )
}
