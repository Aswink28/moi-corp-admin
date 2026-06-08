import {
  Card, Grid, TextField, Typography, Switch, FormControlLabel, InputAdornment, Box,
} from '@mui/material'

const CURRENCY_SYMBOLS = { INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'AED', SGD: 'S$' }

export default function Step7Wallet({ data, setField, errors, meta }) {
  const w = data?.wallet || {}
  const enabled = w.wallet_enabled !== false
  const symbol = CURRENCY_SYMBOLS[data?.subscription?.currency || data?.company?.currency] || '₹'

  const num = (k) => (e) => {
    const v = e.target.value
    setField(`wallet.${k}`, v === '' ? '' : Number(v))
  }
  const err = (path) => ({ error: !!errors?.[path], helperText: errors?.[path] || ' ' })
  const money = { InputProps: { startAdornment: <InputAdornment position="start">{symbol}</InputAdornment> } }

  return (
    <Card sx={{ p: 2.5 }}>
      <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Wallet &amp; Credit</Typography>
      <Typography variant="caption" color="text.secondary">
        Configure the prepaid wallet, credit limit and low-balance alerts for this company.
      </Typography>

      <Box sx={{ mt: 1.5 }}>
        <FormControlLabel
          control={
            <Switch
              checked={enabled}
              onChange={(e) => setField('wallet.wallet_enabled', e.target.checked)}
            />
          }
          label={
            <Box>
              <Typography sx={{ fontWeight: 600, fontSize: 14 }}>Wallet Enabled</Typography>
              <Typography variant="caption" color="text.secondary">
                Turn on to allocate funds and manage spend for this company.
              </Typography>
            </Box>
          }
        />
      </Box>

      {enabled && (
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Initial Wallet Balance"
              type="number"
              fullWidth
              value={w.initial_balance ?? ''}
              onChange={num('initial_balance')}
              {...money}
              {...err('wallet.initial_balance')}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Credit Limit"
              type="number"
              fullWidth
              value={w.credit_limit ?? ''}
              onChange={num('credit_limit')}
              {...money}
              {...err('wallet.credit_limit')}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Low Balance Alert Threshold"
              type="number"
              fullWidth
              value={w.low_balance_threshold ?? ''}
              onChange={num('low_balance_threshold')}
              {...money}
              {...err('wallet.low_balance_threshold')}
            />
          </Grid>

          <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={!!w.auto_recharge_enabled}
                  onChange={(e) => setField('wallet.auto_recharge_enabled', e.target.checked)}
                />
              }
              label={
                <Box>
                  <Typography sx={{ fontWeight: 600, fontSize: 14 }}>Auto Recharge Enabled</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Automatically top up when the balance dips below the threshold.
                  </Typography>
                </Box>
              }
            />
          </Grid>
        </Grid>
      )}
    </Card>
  )
}
