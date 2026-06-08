import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Box, AppBar, Toolbar, Typography, IconButton, Avatar, Menu, MenuItem, Divider, Breadcrumbs,
  Tooltip, ListItemIcon,
} from '@mui/material'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded'
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import { motion } from 'framer-motion'
import { useColorMode } from '../context/ColorModeContext'
import { useAuth } from '../context/AuthContext'
import { findNav } from './navConfig'

export default function Topbar({ onMenuClick }) {
  const { mode, toggle } = useColorMode()
  const { user, logout } = useAuth()
  const location = useLocation()
  const [anchor, setAnchor] = useState(null)
  const current = findNav(location.pathname)

  return (
    <AppBar
      position="sticky"
      elevation={0}
      color="inherit"
      sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider', backdropFilter: 'blur(6px)' }}
    >
      <Toolbar sx={{ minHeight: 'var(--ca-topbar-h) !important', gap: 1 }}>
        <IconButton onClick={onMenuClick} edge="start" sx={{ mr: 0.5 }}>
          <MenuRoundedIcon />
        </IconButton>
        <Box>
          <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ fontSize: 12, color: 'text.secondary' }}>
            <Typography sx={{ fontSize: 12 }} color="text.secondary">Portal</Typography>
            <Typography sx={{ fontSize: 12, fontWeight: 600 }} color="text.primary">{current?.label || 'Dashboard'}</Typography>
          </Breadcrumbs>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.1 }}>{current?.label || 'Dashboard'}</Typography>
        </Box>

        <Box sx={{ flex: 1 }} />

        <Tooltip title={mode === 'dark' ? 'Switch to light' : 'Switch to dark'}>
          <IconButton onClick={toggle}>
            <motion.div key={mode} initial={{ rotate: -45, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ duration: 0.25 }}>
              {mode === 'dark' ? <LightModeRoundedIcon /> : <DarkModeRoundedIcon />}
            </motion.div>
          </IconButton>
        </Tooltip>

        <IconButton onClick={(e) => setAnchor(e.currentTarget)} sx={{ ml: 0.5 }}>
          <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 15, fontWeight: 700 }}>
            {(user?.name || 'A').charAt(0).toUpperCase()}
          </Avatar>
        </IconButton>
        <Menu
          anchorEl={anchor}
          open={!!anchor}
          onClose={() => setAnchor(null)}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          slotProps={{ paper: { sx: { mt: 1, minWidth: 220, borderRadius: 2.5, boxShadow: '0 16px 40px rgba(2,6,23,0.22)' } } }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography sx={{ fontWeight: 700 }}>{user?.name}</Typography>
            <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
          </Box>
          <Divider />
          <MenuItem disabled>
            <ListItemIcon><PersonRoundedIcon fontSize="small" /></ListItemIcon>
            {user?.role}
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => { setAnchor(null); logout() }}>
            <ListItemIcon><LogoutRoundedIcon fontSize="small" color="error" /></ListItemIcon>
            <Typography color="error">Logout</Typography>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  )
}
