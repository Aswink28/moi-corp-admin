import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import {
  Box, TextField, Button, Typography, Alert, InputAdornment, IconButton, Grid, Stack, Chip,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import HubRoundedIcon from '@mui/icons-material/HubRounded'
import EmailRoundedIcon from '@mui/icons-material/EmailRounded'
import LockRoundedIcon from '@mui/icons-material/LockRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { errMsg } from '../api/client'

const FEATURES = ['Company onboarding & lifecycle', 'Module configuration per client', 'Subscriptions & wallet control', 'Full audit trail']

export default function Login() {
  const theme = useTheme()
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email.trim(), pw)
      navigate('/', { replace: true })
    } catch (err) {
      setError(errMsg(err, 'Login failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: 'background.default' }}>
      <Grid container sx={{ flex: 1 }}>
        {/* Brand panel */}
        <Grid item xs={12} md={6} sx={{ display: { xs: 'none', md: 'flex' }, position: 'relative', overflow: 'hidden', background: 'linear-gradient(150deg,#111a36 0%,#4f46e5 60%,#0ea5e9 130%)', color: '#fff', p: 6, flexDirection: 'column', justifyContent: 'space-between' }}>
          <Box sx={{ position: 'absolute', width: 420, height: 420, borderRadius: '50%', background: alpha('#fff', 0.08), top: -120, right: -120 }} />
          <Box sx={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: alpha('#fff', 0.06), bottom: -100, left: -80 }} />
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ width: 44, height: 44, borderRadius: 3, display: 'grid', placeItems: 'center', background: alpha('#fff', 0.16) }}>
                <HubRoundedIcon />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Company Admin Portal</Typography>
            </Stack>
          </motion.div>
          <Box sx={{ position: 'relative' }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                Onboard & manage<br />client companies.
              </Typography>
              <Typography sx={{ mt: 2, opacity: 0.85, maxWidth: 420 }}>
                A premium control plane for provisioning organizations, configuring modules, billing and wallets — with a complete audit trail.
              </Typography>
              <Stack spacing={1.2} sx={{ mt: 4 }}>
                {FEATURES.map((f, i) => (
                  <motion.div key={f} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.08 }}>
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <CheckCircleRoundedIcon sx={{ fontSize: 20, color: '#a5f3fc' }} />
                      <Typography sx={{ opacity: 0.92 }}>{f}</Typography>
                    </Stack>
                  </motion.div>
                ))}
              </Stack>
            </motion.div>
          </Box>
          <Chip label="Independent of Travel Desk" size="small" sx={{ alignSelf: 'flex-start', bgcolor: alpha('#fff', 0.14), color: '#fff', fontWeight: 600 }} />
        </Grid>

        {/* Form panel */}
        <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 3, sm: 6 } }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ width: '100%', maxWidth: 400 }}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>Welcome back</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Sign in to your Super Admin account.</Typography>

            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
              </motion.div>
            )}

            <form onSubmit={submit}>
              <TextField
                label="Email" type="email" fullWidth required margin="normal" value={email}
                onChange={(e) => setEmail(e.target.value)} autoFocus size="medium"
                InputProps={{ startAdornment: <InputAdornment position="start"><EmailRoundedIcon fontSize="small" color="action" /></InputAdornment> }}
              />
              <TextField
                label="Password" type={show ? 'text' : 'password'} fullWidth required margin="normal" value={pw}
                onChange={(e) => setPw(e.target.value)} size="medium"
                InputProps={{
                  startAdornment: <InputAdornment position="start"><LockRoundedIcon fontSize="small" color="action" /></InputAdornment>,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShow((s) => !s)} edge="end">{show ? <VisibilityOff /> : <Visibility />}</IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button type="submit" variant="contained" fullWidth size="large" sx={{ mt: 3, py: 1.25 }} disabled={loading}>
                {loading ? 'Signing in…' : 'Sign In'}
              </Button>
            </form>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3, textAlign: 'center' }}>
              Protected area · Super Admins only
            </Typography>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  )
}
