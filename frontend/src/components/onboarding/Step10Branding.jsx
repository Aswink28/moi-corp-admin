import { useRef, useState } from 'react'
import {
  Card, Grid, Typography, TextField, InputAdornment, Box, Avatar, Button,
  CircularProgress, Stack,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded'
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded'
import { onboardingApi } from '../../api/endpoints'
import { errMsg, assetBase } from '../../api/client'
import { useToast } from '../../context/ToastContext'

// Resolve a backend-served upload path (e.g. /uploads/logos/x.png) against the API origin.
function resolveLogoUrl(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${assetBase}${url.startsWith('/') ? '' : '/'}${url}`
}

const HEX_RE = /^#?[0-9a-fA-F]{6}$/
function normColor(v, fallback) {
  const s = (v || '').trim()
  if (!HEX_RE.test(s)) return fallback
  return s.startsWith('#') ? s : `#${s}`
}

export default function Step10Branding({ data, setField, errors, meta }) {
  const { notify } = useToast()
  const branding = data?.branding || {}
  const fileRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  const labelSx = { mb: 0.5, color: 'text.secondary', fontWeight: 600, letterSpacing: 0.2 }
  const err = (path) => ({ error: !!errors?.[path], helperText: errors?.[path] || ' ' })

  const primary = normColor(branding.primary_color, '#4f46e5')
  const secondary = normColor(branding.secondary_color, '#0ea5e9')
  const logoPreview = resolveLogoUrl(branding.logo_url)

  // Email domain live preview — normalise so it always renders as "@domain".
  const rawDomain = (branding.email_domain || '').trim()
  const cleanDomain = rawDomain.replace(/^@+/, '')

  async function onLogo(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      const res = await onboardingApi.uploadLogo(file)
      setField('branding.logo_url', res?.logo_url || '')
      notify('Logo uploaded', 'success')
    } catch (err2) {
      notify(errMsg(err2), 'error')
    } finally {
      setUploading(false)
    }
  }

  const colorField = (key, label, value, fallback) => (
    <TextField
      label={label}
      fullWidth
      value={branding[key] ?? ''}
      onChange={(e) => setField(`branding.${key}`, e.target.value)}
      placeholder={fallback}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Box
              component="input"
              type="color"
              value={value}
              onChange={(e) => setField(`branding.${key}`, e.target.value)}
              sx={{
                width: 28, height: 28, p: 0, border: 'none', borderRadius: 1,
                background: 'none', cursor: 'pointer',
              }}
            />
          </InputAdornment>
        ),
      }}
      {...err(`branding.${key}`)}
    />
  )

  return (
    <Card sx={{ p: 2.5 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.25 }}>Branding</Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5 }}>
        Theme colours, logo and email domain used across this company&apos;s portal.
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="caption" sx={labelSx} component="div">Company Logo</Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              src={logoPreview || undefined}
              variant="rounded"
              sx={{
                width: 64, height: 64,
                bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
                color: 'primary.main',
              }}
            >
              {!logoPreview && <BusinessRoundedIcon />}
            </Avatar>
            <Box>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                hidden
                onChange={onLogo}
              />
              <Button
                variant="outlined"
                size="small"
                startIcon={uploading ? <CircularProgress size={16} /> : <CloudUploadRoundedIcon />}
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                {logoPreview ? 'Replace logo' : 'Upload logo'}
              </Button>
              <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}>
                {logoPreview
                  ? 'Reuses the logo from Company Information — re-upload to replace it.'
                  : 'PNG, JPG, SVG or WEBP, up to 2 MB.'}
              </Typography>
            </Box>
          </Stack>
        </Grid>

        <Grid item xs={12} sm={6}>
          {colorField('primary_color', 'Primary Theme Color', primary, '#4f46e5')}
        </Grid>

        <Grid item xs={12} sm={6}>
          {colorField('secondary_color', 'Secondary Theme Color', secondary, '#0ea5e9')}
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Company Email Domain"
            fullWidth
            placeholder="@tcs.com"
            value={branding.email_domain ?? ''}
            onChange={(e) => setField('branding.email_domain', e.target.value)}
            {...(errors?.['branding.email_domain']
              ? err('branding.email_domain')
              : { helperText: cleanDomain ? `Admins will sign in with e.g. someone@${cleanDomain}` : 'e.g. @tcs.com' })}
          />
        </Grid>

        <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'flex-start' }}>
          <Box
            sx={{
              width: '100%', borderRadius: 2, p: 1.5,
              border: (t) => `1px dashed ${alpha(t.palette.primary.main, 0.3)}`,
              bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
            }}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.75 }}>
              Theme preview
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: primary, border: (t) => `1px solid ${t.palette.divider}` }} />
              <Box sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: secondary, border: (t) => `1px solid ${t.palette.divider}` }} />
              <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                {cleanDomain ? `@${cleanDomain}` : 'no email domain set'}
              </Typography>
            </Stack>
          </Box>
        </Grid>
      </Grid>
    </Card>
  )
}
