import { useEffect, useRef, useState } from 'react'
import {
  Card, Grid, TextField, MenuItem, Typography, Box, InputAdornment, CircularProgress,
} from '@mui/material'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import { COUNTRIES, TIMEZONES, CURRENCIES, COUNTRY_LOCALE, withFallback } from './options'

// India Post public pincode API (CORS-enabled). Returns State + District (city)
// + Country for a 6-digit Indian PIN code.
const PINCODE_API = 'https://api.postalpincode.in/pincode'

export default function Step2Address({ data, setField, errors, meta }) {
  const a = data?.address || {}
  const company = data?.company || {}
  const countries = withFallback(meta?.countries, COUNTRIES)
  const timezones = withFallback(meta?.timezones, TIMEZONES)
  const currencies = withFallback(meta?.currencies, CURRENCIES)
  const err = (p) => errors?.[p] || ''

  const [pinStatus, setPinStatus] = useState('idle') // 'idle' | 'loading' | 'done' | 'notfound' | 'error'
  const [pinNote, setPinNote] = useState('')
  const lastPin = useRef('') // avoid re-fetching the same resolved pincode

  // When a full 6-digit pincode is entered, look up Country / State / City and
  // derive Time Zone + Currency. Debounced; only fires for new 6-digit values.
  useEffect(() => {
    const pin = String(a.pincode || '').trim()
    if (!/^\d{6}$/.test(pin)) {
      setPinStatus('idle')
      setPinNote('')
      return
    }
    if (pin === lastPin.current) return

    let alive = true
    setPinStatus('loading')
    setPinNote('Looking up location…')
    const t = setTimeout(async () => {
      try {
        const resp = await fetch(`${PINCODE_API}/${pin}`)
        const json = await resp.json()
        const rec = Array.isArray(json) ? json[0] : null
        const po = rec && rec.Status === 'Success' ? rec.PostOffice?.[0] : null
        if (!alive) return
        if (po) {
          lastPin.current = pin
          const country = po.Country || 'India'
          setField('address.country', country)
          setField('address.state', po.State || '')
          setField('address.city', po.District || po.Block || po.Division || '')
          const locale = COUNTRY_LOCALE[country] || COUNTRY_LOCALE.India
          setField('company.timezone', locale.timezone)
          setField('company.currency', locale.currency)
          setPinStatus('done')
          setPinNote(`Auto-filled ${[po.District, po.State].filter(Boolean).join(', ')}`)
        } else {
          setPinStatus('notfound')
          setPinNote('No location found for this pincode — enter it manually')
        }
      } catch {
        if (alive) {
          setPinStatus('error')
          setPinNote('Could not reach the pincode service — enter location manually')
        }
      }
    }, 500)
    return () => { alive = false; clearTimeout(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a.pincode])

  const pincodeAdornment =
    pinStatus === 'loading' ? (
      <InputAdornment position="end"><CircularProgress size={16} /></InputAdornment>
    ) : pinStatus === 'done' ? (
      <InputAdornment position="end"><CheckCircleRoundedIcon fontSize="small" color="success" /></InputAdornment>
    ) : null

  const pinHelper =
    err('address.pincode') ||
    pinNote ||
    'Enter a 6-digit pincode to auto-fill country, state, city, time zone & currency'

  return (
    <Card sx={{ p: 2.5 }}>
      <Box sx={{ mb: 2 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Address &amp; Locale</Typography>
        <Typography variant="caption" color="text.secondary">
          Registered address, time zone and the company&apos;s default currency.
        </Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            label="Address Line 1"
            required
            fullWidth
            value={a.address_line1 || ''}
            onChange={(e) => setField('address.address_line1', e.target.value)}
            error={!!err('address.address_line1')}
            helperText={err('address.address_line1')}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            label="Address Line 2"
            fullWidth
            value={a.address_line2 || ''}
            onChange={(e) => setField('address.address_line2', e.target.value)}
            error={!!err('address.address_line2')}
            helperText={err('address.address_line2')}
          />
        </Grid>

        {/* Pincode first — it drives the auto-fill for the fields below. */}
        <Grid item xs={12} sm={6}>
          <TextField
            label="Pincode"
            required
            fullWidth
            value={a.pincode || ''}
            onChange={(e) => setField('address.pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
            error={!!err('address.pincode') || pinStatus === 'notfound'}
            helperText={pinHelper}
            inputProps={{ inputMode: 'numeric', maxLength: 6 }}
            InputProps={{ endAdornment: pincodeAdornment }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            select
            label="Country"
            required
            fullWidth
            value={a.country || ''}
            onChange={(e) => setField('address.country', e.target.value)}
            error={!!err('address.country')}
            helperText={err('address.country')}
          >
            {countries.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="State"
            required
            fullWidth
            value={a.state || ''}
            onChange={(e) => setField('address.state', e.target.value)}
            error={!!err('address.state')}
            helperText={err('address.state')}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="City"
            required
            fullWidth
            value={a.city || ''}
            onChange={(e) => setField('address.city', e.target.value)}
            error={!!err('address.city')}
            helperText={err('address.city')}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            select
            label="Time Zone"
            required
            fullWidth
            value={company.timezone || ''}
            onChange={(e) => setField('company.timezone', e.target.value)}
            error={!!err('company.timezone')}
            helperText={err('company.timezone')}
          >
            {timezones.map((tz) => <MenuItem key={tz} value={tz}>{tz}</MenuItem>)}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            select
            label="Currency"
            required
            fullWidth
            value={company.currency || ''}
            onChange={(e) => setField('company.currency', e.target.value)}
            error={!!err('company.currency')}
            helperText={err('company.currency')}
          >
            {currencies.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
        </Grid>
      </Grid>
    </Card>
  )
}
