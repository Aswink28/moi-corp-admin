import {
  Card, Grid, Typography, TextField, Switch, FormControlLabel, InputAdornment, Box, Stack,
} from '@mui/material'
import { alpha } from '@mui/material/styles'

const CURRENCY_SYMBOLS = { INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'AED', SGD: 'S$' }

// Canonical module order + labels (§E.3 / §D.3). Falls back to these when meta is absent.
const MODULES = [
  { key: 'flight', label: 'Flight' },
  { key: 'hotel', label: 'Hotel' },
  { key: 'train', label: 'Train' },
  { key: 'bus', label: 'Bus' },
  { key: 'cab', label: 'Cab' },
  { key: 'expense', label: 'Expense Management' },
  { key: 'wallet', label: 'Wallet Management' },
  { key: 'approval', label: 'Approval Workflow' },
  { key: 'reports', label: 'Reports & Analytics' },
]

const LABEL_OVERRIDES = {
  expense: 'Expense Management',
  wallet: 'Wallet Management',
  approval: 'Approval Workflow',
  reports: 'Reports & Analytics',
}

export default function Step8Modules({ data, setField, errors, meta }) {
  const modules = Array.isArray(data?.modules) ? data.modules : []
  const symbol = CURRENCY_SYMBOLS[data?.subscription?.currency || data?.company?.currency] || '₹'

  // Drive the grid off the canonical payload order; enrich labels from meta when present.
  const metaLabels = (meta?.modules || []).reduce((acc, m) => { acc[m.key] = m.label; return acc }, {})
  const list = (modules.length ? modules : MODULES.map((m) => ({ module_key: m.key, enabled: false, price: 0 })))
    .map((row, i) => ({ ...row, _index: i }))

  const labelFor = (key) =>
    LABEL_OVERRIDES[key] || metaLabels[key] || MODULES.find((m) => m.key === key)?.label || key

  const err = (path) => ({ error: !!errors?.[path], helperText: errors?.[path] || ' ' })

  return (
    <Card sx={{ p: 2.5 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.25 }}>Modules &amp; Pricing</Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5 }}>
        Enable the modules this company can access and set an optional per-module price.
      </Typography>

      <Grid container spacing={2}>
        {list.map((m) => {
          const enabled = !!m.enabled
          return (
            <Grid item xs={12} sm={6} md={4} key={m.module_key}>
              <Card
                variant="outlined"
                sx={{
                  p: 2.5,
                  height: '100%',
                  borderColor: (t) =>
                    enabled ? alpha(t.palette.primary.main, 0.4) : t.palette.divider,
                  bgcolor: (t) =>
                    enabled ? alpha(t.palette.primary.main, 0.04) : 'transparent',
                  transition: 'border-color .2s, background-color .2s',
                }}
              >
                <Stack spacing={1.5}>
                  <FormControlLabel
                    sx={{ m: 0, justifyContent: 'space-between', width: '100%' }}
                    labelPlacement="start"
                    control={
                      <Switch
                        checked={enabled}
                        onChange={(e) => setField(`modules.${m._index}.enabled`, e.target.checked)}
                      />
                    }
                    label={
                      <Box>
                        <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                          {labelFor(m.module_key)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: enabled ? 'primary.main' : 'text.secondary' }}>
                          {enabled ? 'Enabled' : 'Disabled'}
                        </Typography>
                      </Box>
                    }
                  />

                  <TextField
                    label="Module Price"
                    type="number"
                    size="small"
                    fullWidth
                    disabled={!enabled}
                    inputProps={{ min: 0, step: '0.01' }}
                    InputProps={{ startAdornment: <InputAdornment position="start">{symbol}</InputAdornment> }}
                    value={m.price ?? ''}
                    onChange={(e) => {
                      const v = e.target.value
                      setField(`modules.${m._index}.price`, v === '' ? '' : Number(v))
                    }}
                    {...err(`modules.${m._index}.price`)}
                  />
                </Stack>
              </Card>
            </Grid>
          )
        })}
      </Grid>
    </Card>
  )
}
