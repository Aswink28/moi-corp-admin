import {
  Card, Grid, Typography, TextField, Box, Button, Stack, Tooltip,
} from '@mui/material'
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded'

export default function Step6Billing({ data, setField, errors, meta }) {
  const b = data?.billing || {}
  const set = (k) => (e) => setField(`billing.${k}`, e.target.value)
  const setUpper = (k) => (e) => setField(`billing.${k}`, e.target.value.toUpperCase())
  const err = (path, fallback = ' ') => ({
    error: !!errors?.[path],
    helperText: errors?.[path] || fallback,
  })

  // Convenience copy: pull billing details from the company profile + primary contact.
  function copyFromCompany() {
    const company = data?.company || {}
    const contact = data?.contact || {}
    const address = data?.address || {}
    const composedAddress = [
      address.address_line1,
      address.address_line2,
      [address.city, address.state].filter(Boolean).join(', '),
      address.pincode,
      address.country,
    ].filter(Boolean).join('\n')

    setField('billing.billing_contact_name', contact.contact_name || company.name || '')
    setField('billing.billing_email', contact.email || company.email || '')
    setField('billing.billing_mobile', contact.mobile || company.phone || '')
    setField('billing.billing_address', composedAddress)
    setField('billing.gstin', company.gstin || '')
    setField('billing.pan', company.pan || '')
  }

  return (
    <Card sx={{ p: 2.5 }}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1.5} sx={{ mb: 2.5 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.25 }}>Billing &amp; Invoicing</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Where invoices are addressed and the tax identifiers that appear on them.
          </Typography>
        </Box>
        <Tooltip title="Copy from company profile / primary contact">
          <Button
            variant="outlined"
            size="small"
            startIcon={<ContentCopyRoundedIcon />}
            onClick={copyFromCompany}
            sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            Same as company / contact
          </Button>
        </Tooltip>
      </Stack>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Billing Contact Name" required fullWidth
            value={b.billing_contact_name || ''}
            onChange={set('billing_contact_name')}
            {...err('billing.billing_contact_name')}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Billing Email" required type="email" fullWidth
            value={b.billing_email || ''}
            onChange={set('billing_email')}
            {...err('billing.billing_email')}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Billing Mobile Number" required fullWidth
            value={b.billing_mobile || ''}
            onChange={set('billing_mobile')}
            placeholder="9876543210 or +9715xxxxxxxx"
            {...err('billing.billing_mobile')}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="GSTIN" fullWidth
            value={b.gstin || ''}
            onChange={setUpper('gstin')}
            {...err('billing.gstin', '15-character GSTIN')}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="PAN Number" fullWidth
            value={b.pan || ''}
            onChange={setUpper('pan')}
            {...err('billing.pan', 'e.g. ABCDE1234F')}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Purchase Order Number" fullWidth
            value={b.po_number || ''}
            onChange={set('po_number')}
            {...err('billing.po_number')}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Vendor Code" fullWidth
            value={b.vendor_code || ''}
            onChange={set('vendor_code')}
            {...err('billing.vendor_code')}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            label="Billing Address" required fullWidth multiline rows={3}
            value={b.billing_address || ''}
            onChange={set('billing_address')}
            {...err('billing.billing_address')}
          />
        </Grid>
      </Grid>
    </Card>
  )
}
