import { useEffect, useRef, useState } from 'react'
import {
  Card, Grid, Typography, TextField, MenuItem, InputAdornment, IconButton,
  Tooltip, Box, Avatar, Button, CircularProgress, Stack,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded'
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded'
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded'
import { onboardingApi } from '../../api/endpoints'
import { errMsg, assetBase } from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { INDUSTRIES, withFallback } from './options'

// Resolve a backend-served upload path (e.g. /uploads/logos/x.png) against the API origin.
function resolveLogoUrl(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${assetBase}${url.startsWith('/') ? '' : '/'}${url}`
}

export default function Step1CompanyInfo({ data, setField, errors, meta }) {
  const { notify } = useToast()
  const company = data.company || {}
  const fileRef = useRef(null)

  const [genning, setGenning] = useState(false)
  const [checking, setChecking] = useState(false)
  const [codeAvailable, setCodeAvailable] = useState(null) // null=unknown, true/false=checked
  const [uploading, setUploading] = useState(false)

  const sx = { mb: 0.5, color: 'text.secondary', fontWeight: 600, letterSpacing: 0.2 }

  // Live uniqueness check on the company code (debounced).
  useEffect(() => {
    const code = (company.code || '').trim()
    if (!code) { setCodeAvailable(null); return }
    let alive = true
    setChecking(true)
    const t = setTimeout(async () => {
      try {
        const res = await onboardingApi.checkCode(code)
        if (alive) setCodeAvailable(!!res?.available)
      } catch {
        if (alive) setCodeAvailable(null)
      } finally {
        if (alive) setChecking(false)
      }
    }, 450)
    return () => { alive = false; clearTimeout(t) }
  }, [company.code])

  async function generateCode() {
    if (!company.name?.trim()) {
      notify('Enter a company name first', 'warning')
      return
    }
    setGenning(true)
    try {
      const res = await onboardingApi.generateCode(company.name)
      setField('company.code', res?.code || '')
      setCodeAvailable(res?.available ?? null)
    } catch (e) {
      notify(errMsg(e), 'error')
    } finally {
      setGenning(false)
    }
  }

  async function onLogo(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      const res = await onboardingApi.uploadLogo(file)
      setField('branding.logo_url', res?.logo_url || '')
      notify('Logo uploaded', 'success')
    } catch (err) {
      notify(errMsg(err), 'error')
    } finally {
      setUploading(false)
    }
  }

  const codeAdornment = (
    <InputAdornment position="end">
      {checking ? (
        <CircularProgress size={16} />
      ) : codeAvailable === true ? (
        <Tooltip title="Code is available"><CheckCircleRoundedIcon fontSize="small" color="success" /></Tooltip>
      ) : codeAvailable === false ? (
        <Tooltip title="Code already exists"><ErrorRoundedIcon fontSize="small" color="error" /></Tooltip>
      ) : null}
      <Tooltip title="Auto-generate from name">
        <span>
          <IconButton size="small" onClick={generateCode} disabled={genning} edge="end">
            {genning ? <CircularProgress size={16} /> : <AutoFixHighRoundedIcon fontSize="small" />}
          </IconButton>
        </span>
      </Tooltip>
    </InputAdornment>
  )

  const codeError = errors['company.code'] || (codeAvailable === false ? 'Company code already exists' : '')
  const logoPreview = resolveLogoUrl(data.branding?.logo_url)

  return (
    <Card sx={{ p: 2.5 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.25 }}>Company Information</Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5 }}>
        Basic identity and statutory details for the company you are onboarding.
      </Typography>

      <Grid
        container
        spacing={2}
        sx={{
          // Medium-sized field labels/placeholders and input text (the default
          // rendered a touch large for this form).
          '& .MuiInputBase-input': { fontSize: '0.9rem' },
          '& .MuiInputLabel-root': { fontSize: '0.9rem' },
        }}
      >
        <Grid item xs={12} sm={6}>
          <TextField
            label="Company Name" required fullWidth
            value={company.name || ''}
            onChange={(e) => setField('company.name', e.target.value)}
            error={!!errors['company.name']}
            helperText={errors['company.name'] || ' '}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Company Code" required fullWidth
            value={company.code || ''}
            onChange={(e) => setField('company.code', e.target.value.toUpperCase())}
            error={!!codeError}
            helperText={codeError || 'Auto-generate or type a unique short code'}
            InputProps={{ endAdornment: codeAdornment }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Legal Entity Name" required fullWidth
            value={company.legal_name || ''}
            onChange={(e) => setField('company.legal_name', e.target.value)}
            error={!!errors['company.legal_name']}
            helperText={errors['company.legal_name'] || ' '}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            select label="Industry Type" required fullWidth
            value={company.industry || ''}
            onChange={(e) => setField('company.industry', e.target.value)}
            error={!!errors['company.industry']}
            helperText={errors['company.industry'] || ' '}
          >
            {withFallback(meta?.industries, INDUSTRIES).map((i) => <MenuItem key={i} value={i}>{i}</MenuItem>)}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Company Registration Number" fullWidth
            value={company.registration_number || ''}
            onChange={(e) => setField('company.registration_number', e.target.value)}
            error={!!errors['company.registration_number']}
            helperText={errors['company.registration_number'] || ' '}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="GSTIN" required fullWidth
            value={company.gstin || ''}
            onChange={(e) => setField('company.gstin', e.target.value.toUpperCase())}
            error={!!errors['company.gstin']}
            helperText={errors['company.gstin'] || '15-character GSTIN'}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="PAN Number" required fullWidth
            value={company.pan || ''}
            onChange={(e) => setField('company.pan', e.target.value.toUpperCase())}
            error={!!errors['company.pan']}
            helperText={errors['company.pan'] || 'e.g. ABCDE1234F'}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Website" fullWidth placeholder="https://example.com"
            value={company.website || ''}
            onChange={(e) => setField('company.website', e.target.value)}
            error={!!errors['company.website']}
            helperText={errors['company.website'] || ' '}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            label="Company Description" fullWidth multiline rows={3}
            value={company.description || ''}
            onChange={(e) => setField('company.description', e.target.value)}
            error={!!errors['company.description']}
            helperText={errors['company.description'] || ' '}
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="caption" sx={sx} component="div">Company Logo</Typography>
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
                PNG, JPG, SVG or WEBP, up to 2 MB.
              </Typography>
            </Box>
          </Stack>
        </Grid>
      </Grid>
    </Card>
  )
}
