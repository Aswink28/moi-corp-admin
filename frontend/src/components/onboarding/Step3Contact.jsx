import { Card, Grid, TextField, Typography } from '@mui/material'

const DEPARTMENTS = ['Administration', 'Finance', 'Human Resources', 'Operations', 'Travel Desk', 'Procurement', 'IT', 'Other']

export default function Step3Contact({ data, setField, errors, meta }) {
  const c = data?.contact || {}
  const set = (k) => (e) => setField(`contact.${k}`, e.target.value)
  const err = (path) => ({ error: !!errors?.[path], helperText: errors?.[path] || ' ' })

  return (
    <Card sx={{ p: 2.5 }}>
      <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Point of Contact</Typography>
      <Typography variant="caption" color="text.secondary">
        The primary person we will coordinate with for this company.
      </Typography>

      <Grid container spacing={2} sx={{ mt: 0.5 }}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Contact Person Name"
            required
            fullWidth
            value={c.contact_name || ''}
            onChange={set('contact_name')}
            {...err('contact.contact_name')}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Designation"
            required
            fullWidth
            value={c.designation || ''}
            onChange={set('designation')}
            {...err('contact.designation')}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Email Address"
            required
            type="email"
            fullWidth
            value={c.email || ''}
            onChange={set('email')}
            {...err('contact.email')}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Mobile Number"
            required
            fullWidth
            value={c.mobile || ''}
            onChange={set('mobile')}
            placeholder="9876543210 or +9715xxxxxxxx"
            {...err('contact.mobile')}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Alternate Phone Number"
            fullWidth
            value={c.alternate_phone || ''}
            onChange={set('alternate_phone')}
            {...err('contact.alternate_phone')}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            select
            label="Department"
            fullWidth
            SelectProps={{ native: true }}
            value={c.department || ''}
            onChange={set('department')}
            {...err('contact.department')}
          >
            <option value="" />
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </TextField>
        </Grid>
      </Grid>
    </Card>
  )
}
