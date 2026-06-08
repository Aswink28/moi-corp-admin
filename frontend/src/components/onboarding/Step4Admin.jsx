import { useState } from 'react'
import {
  Card, Grid, Typography, TextField, Button, Stack, Switch, FormControlLabel, InputAdornment, IconButton, Tooltip,
} from '@mui/material'
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded'
import { onboardingApi } from '../../api/endpoints'
import { errMsg } from '../../api/client'
import { useToast } from '../../context/ToastContext'

export default function Step4Admin({ data, setField, errors /*, meta */ }) {
  const { notify } = useToast()
  const admin = data?.admin || {}
  const [showPwd, setShowPwd] = useState(false)
  const [generating, setGenerating] = useState(false)

  async function generatePassword() {
    setGenerating(true)
    try {
      const { password } = await onboardingApi.generatePassword()
      setField('admin.temp_password', password)
      setShowPwd(true)
      notify('Temporary password generated', 'success')
    } catch (e) {
      notify(errMsg(e), 'error')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Card variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
      <Stack spacing={0.5} sx={{ mb: 2.5 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Admin Account</Typography>
        <Typography variant="caption" color="text.secondary">
          The primary company administrator who will sign in and manage this organisation.
        </Typography>
      </Stack>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Full Name" required fullWidth
            value={admin.name || ''}
            onChange={(e) => setField('admin.name', e.target.value)}
            error={!!errors['admin.name']}
            helperText={errors['admin.name'] || ' '}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Employee ID" fullWidth
            value={admin.employee_id || ''}
            onChange={(e) => setField('admin.employee_id', e.target.value)}
            error={!!errors['admin.employee_id']}
            helperText={errors['admin.employee_id'] || ' '}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Email Address" required fullWidth type="email"
            value={admin.email || ''}
            onChange={(e) => setField('admin.email', e.target.value)}
            error={!!errors['admin.email']}
            helperText={errors['admin.email'] || ' '}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Mobile Number" required fullWidth
            value={admin.phone || ''}
            onChange={(e) => setField('admin.phone', e.target.value)}
            error={!!errors['admin.phone']}
            helperText={errors['admin.phone'] || ' '}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Username" required fullWidth
            value={admin.username || ''}
            onChange={(e) => setField('admin.username', e.target.value)}
            error={!!errors['admin.username']}
            helperText={errors['admin.username'] || ' '}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Role" fullWidth value="Company Admin"
            InputProps={{ readOnly: true }}
            helperText="Fixed for onboarding"
            sx={{ '& .MuiInputBase-input': { color: 'text.secondary' } }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Temporary Password" required fullWidth
            type={showPwd ? 'text' : 'password'}
            value={admin.temp_password || ''}
            onChange={(e) => setField('admin.temp_password', e.target.value)}
            error={!!errors['admin.temp_password']}
            helperText={errors['admin.temp_password'] || ' '}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title={showPwd ? 'Hide' : 'Show'}>
                    <IconButton size="small" edge="end" onClick={() => setShowPwd((v) => !v)}>
                      {showPwd ? <VisibilityOffRoundedIcon fontSize="small" /> : <VisibilityRoundedIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Button
            variant="outlined" fullWidth startIcon={<AutorenewRoundedIcon />}
            onClick={generatePassword} disabled={generating}
            sx={{ height: 56 }}
          >
            {generating ? 'Generating…' : 'Generate Password'}
          </Button>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Switch
                checked={admin.send_welcome_email !== false}
                onChange={(e) => setField('admin.send_welcome_email', e.target.checked)}
              />
            }
            label={
              <Stack spacing={0}>
                <Typography sx={{ fontSize: 14, fontWeight: 600 }}>Send Welcome Email</Typography>
                <Typography variant="caption" color="text.secondary">Email the admin their login details.</Typography>
              </Stack>
            }
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Switch
                checked={admin.force_password_reset !== false}
                onChange={(e) => setField('admin.force_password_reset', e.target.checked)}
              />
            }
            label={
              <Stack spacing={0}>
                <Typography sx={{ fontSize: 14, fontWeight: 600 }}>Force Password Reset on First Login</Typography>
                <Typography variant="caption" color="text.secondary">Require a new password at first sign-in.</Typography>
              </Stack>
            }
          />
        </Grid>
      </Grid>
    </Card>
  )
}
