import { useMemo } from 'react'
import {
  Card, Grid, Typography, TextField, MenuItem, InputAdornment, Box, Stack,
  FormControlLabel, Switch, Divider,
} from '@mui/material'
import { alpha } from '@mui/material/styles'

const PLAN_TIERS = ['trial', 'basic', 'professional', 'enterprise']
const BILLING_CYCLES = ['monthly', 'quarterly', 'half_yearly', 'annual']

const LABELS = {
  trial: 'Trial',
  basic: 'Basic',
  professional: 'Professional',
  enterprise: 'Enterprise',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  half_yearly: 'Half-Yearly',
  annual: 'Annual',
}

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100
const inr = (n) =>
  `₹ ${round2(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function Step5Subscription({ data, setField, errors, meta }) {
  const s = data?.subscription || {}
  const planTiers = meta?.plan_tiers || PLAN_TIERS
  const billingCycles = meta?.billing_cycles || BILLING_CYCLES

  const setNum = (k) => (e) => {
    const v = e.target.value
    setField(`subscription.${k}`, v === '' ? '' : Number(v))
  }
  const set = (k) => (e) => setField(`subscription.${k}`, e.target.value)
  const err = (path) => ({ error: !!errors?.[path], helperText: errors?.[path] || ' ' })

  // §E.3 computed amounts — must mirror the server formula exactly.
  const { baseAmount, taxAmount, totalAmount } = useMemo(() => {
    const base = round2(s.subscription_amount)
    const discount = round2(base * ((Number(s.discount_percentage) || 0) / 100))
    const taxable = round2(base - discount)
    const tax = round2(taxable * ((Number(s.tax_percentage) || 0) / 100))
    const total = round2(taxable + tax)
    return { baseAmount: base, taxAmount: tax, totalAmount: total }
  }, [s.subscription_amount, s.discount_percentage, s.tax_percentage])

  return (
    <Card sx={{ p: 2.5 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.25 }}>Subscription &amp; Billing</Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5 }}>
        Plan, billing cycle, contract term and pricing for this company.
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            select label="Subscription Plan" required fullWidth
            value={s.plan_tier || ''}
            onChange={set('plan_tier')}
            {...err('subscription.plan_tier')}
          >
            {planTiers.map((t) => (
              <MenuItem key={t} value={t}>{LABELS[t] || t}</MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            select label="Billing Cycle" required fullWidth
            value={s.billing_cycle || ''}
            onChange={set('billing_cycle')}
            {...err('subscription.billing_cycle')}
          >
            {billingCycles.map((c) => (
              <MenuItem key={c} value={c}>{LABELS[c] || c}</MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Contract Start Date" type="date" required fullWidth
            InputLabelProps={{ shrink: true }}
            value={s.contract_start_date || ''}
            onChange={set('contract_start_date')}
            {...err('subscription.contract_start_date')}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Contract End Date" type="date" required fullWidth
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: s.contract_start_date || undefined }}
            value={s.contract_end_date || ''}
            onChange={set('contract_end_date')}
            {...err('subscription.contract_end_date')}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Number of Licensed Users" type="number" required fullWidth
            inputProps={{ min: 1, step: 1 }}
            value={s.licensed_users ?? ''}
            onChange={setNum('licensed_users')}
            {...err('subscription.licensed_users')}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Subscription Amount" type="number" required fullWidth
            inputProps={{ min: 0, step: '0.01' }}
            InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
            value={s.subscription_amount ?? ''}
            onChange={setNum('subscription_amount')}
            {...err('subscription.subscription_amount')}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Tax Percentage" type="number" required fullWidth
            inputProps={{ min: 0, step: '0.001' }}
            InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
            value={s.tax_percentage ?? ''}
            onChange={setNum('tax_percentage')}
            {...err('subscription.tax_percentage')}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Discount Percentage" type="number" fullWidth
            inputProps={{ min: 0, step: '0.001' }}
            InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
            value={s.discount_percentage ?? ''}
            onChange={setNum('discount_percentage')}
            {...err('subscription.discount_percentage')}
          />
        </Grid>

        <Grid item xs={12}>
          <FormControlLabel
            control={(
              <Switch
                checked={!!s.auto_renewal}
                onChange={(e) => setField('subscription.auto_renewal', e.target.checked)}
              />
            )}
            label="Auto Renewal"
          />
          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
            Automatically renew the subscription at the end of each billing cycle.
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              border: (t) => `1px solid ${alpha(t.palette.primary.main, 0.2)}`,
              bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
            }}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: 0.2 }}>
              ORDER SUMMARY
            </Typography>
            <Stack spacing={1} sx={{ mt: 1 }}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Base Amount</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{inr(baseAmount)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Tax{Number(s.tax_percentage) ? ` (${Number(s.tax_percentage)}%)` : ''}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{inr(taxAmount)}</Typography>
              </Stack>
              <Divider />
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Total Amount</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>{inr(totalAmount)}</Typography>
              </Stack>
            </Stack>
          </Box>
        </Grid>
      </Grid>
    </Card>
  )
}
