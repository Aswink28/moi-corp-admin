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
import EditNoteRoundedIcon from '@mui/icons-material/EditNoteRounded'
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded'
import VerifiedUserRoundedIcon from '@mui/icons-material/VerifiedUserRounded'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { errMsg } from '../api/client'
import { ROLE_META, roleHome } from '../constants/workflow'

const FEATURES = ['Maker → Checker → Super Admin approval', 'Document & compliance verification', 'Role-based dashboards & access control', 'Full approval history & audit trail']

// Demo credentials (match backend seed) prefilled when a role is selected.
const ROLE_CARDS = [
  { role: 'maker', icon: <EditNoteRoundedIcon />, email: 'maker@company-admin.local', password: 'Maker@12345' },
  { role: 'checker', icon: <FactCheckRoundedIcon />, email: 'checker@company-admin.local', password: 'Checker@12345' },
  { role: 'super_admin', icon: <VerifiedUserRoundedIcon />, email: 'superadmin@company-admin.local', password: 'Admin@12345' },
]

export default function Login() {
  const theme = useTheme()
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState('maker')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to={roleHome(user.role)} replace />

  function pickRole(card) {
    setRole(card.role)
    setError('')
    // Prefill demo credentials to make each role easy to try.
    setEmail(card.email)
    setPw(card.password)
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const u = await login(email.trim(), pw)
      navigate(roleHome(u.role), { replace: true })
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
                Onboard with<br />maker–checker control.
              </Typography>
              <Typography sx={{ mt: 2, opacity: 0.85, maxWidth: 420 }}>
                A premium control plane for provisioning organizations through a governed 3-level approval workflow — with a complete audit trail.
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
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ width: '100%', maxWidth: 440 }}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>Sign in to continue</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>Choose your role, then sign in.</Typography>

            {/* Role selection */}
            <Stack spacing={1.25} sx={{ mb: 2.5 }}>
              {ROLE_CARDS.map((card) => {
                const meta = ROLE_META[card.role]
                const selected = role === card.role
                const main = theme.palette[meta.color].main
                return (
                  <Box
                    key={card.role}
                    component={motion.div}
                    whileHover={{ y: -2 }}
                    onClick={() => pickRole(card)}
                    role="button"
                    tabIndex={0}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, cursor: 'pointer',
                      borderRadius: 2.5, border: '1.5px solid',
                      borderColor: selected ? main : 'divider',
                      bgcolor: selected ? alpha(main, 0.08) : 'transparent',
                      transition: 'all .18s ease',
                    }}
                  >
                    <Box sx={{ width: 40, height: 40, borderRadius: 2, display: 'grid', placeItems: 'center', color: '#fff', background: `linear-gradient(135deg, ${main}, ${alpha(main, 0.7)})`, flexShrink: 0 }}>
                      {card.icon}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{meta.short}</Typography>
                      <Typography variant="caption" color="text.secondary">{meta.description}</Typography>
                    </Box>
                    {selected && <CheckCircleRoundedIcon sx={{ color: main }} />}
                  </Box>
                )
              })}
            </Stack>

            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
              </motion.div>
            )}

            <form onSubmit={submit}>
              <TextField
                label="Email" type="email" fullWidth required margin="normal" value={email}
                onChange={(e) => setEmail(e.target.value)} size="medium"
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
                {loading ? 'Signing in…' : `Sign in as ${ROLE_META[role].label}`}
              </Button>
            </form>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3, textAlign: 'center' }}>
              You'll be routed to your role dashboard after sign-in.
            </Typography>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  )
}
