import { NavLink } from 'react-router-dom'
import { Box, Typography, Tooltip, IconButton } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { motion } from 'framer-motion'
import HubRoundedIcon from '@mui/icons-material/HubRounded'
import MenuOpenRoundedIcon from '@mui/icons-material/MenuOpenRounded'
import { navGroupsFor } from './navConfig'
import { useAuth } from '../context/AuthContext'
import { roleLabel } from '../constants/workflow'

export const SIDEBAR_W = 264
export const SIDEBAR_W_COLLAPSED = 76

function NavItem({ item, collapsed }) {
  const theme = useTheme()
  const content = (
    <NavLink to={item.to} end={item.to === '/'} style={{ textDecoration: 'none' }}>
      {({ isActive }) => (
        <Box
          component={motion.div}
          whileHover={{ x: collapsed ? 0 : 3 }}
          sx={{
            display: 'flex', alignItems: 'center', gap: 1.5, px: collapsed ? 0 : 1.5, mx: 1, mb: 0.5,
            height: 44, borderRadius: 2.5, cursor: 'pointer', position: 'relative',
            justifyContent: collapsed ? 'center' : 'flex-start',
            color: isActive ? '#fff' : alpha('#fff', 0.66),
            background: isActive
              ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.main, 0.78)})`
              : 'transparent',
            boxShadow: isActive ? `0 8px 20px ${alpha(theme.palette.primary.main, 0.45)}` : 'none',
            transition: 'background .2s ease, color .2s ease',
            '&:hover': { background: isActive ? undefined : alpha('#fff', 0.07), color: '#fff' },
          }}
        >
          <Box sx={{ display: 'grid', placeItems: 'center', minWidth: 24 }}>{item.icon}</Box>
          {!collapsed && (
            <Typography sx={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}>{item.label}</Typography>
          )}
        </Box>
      )}
    </NavLink>
  )
  return collapsed ? <Tooltip title={item.label} placement="right" arrow>{content}</Tooltip> : content
}

export default function Sidebar({ collapsed, onToggle }) {
  const { user } = useAuth()
  const groups = navGroupsFor(user?.role)
  const w = collapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W
  return (
    <Box
      component={motion.aside}
      animate={{ width: w }}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
      sx={{
        width: w, flexShrink: 0, height: '100%', display: 'flex', flexDirection: 'column',
        bgcolor: '#0d1426', color: '#e8edf6', overflow: 'hidden',
        borderRight: '1px solid rgba(148,163,184,0.10)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: collapsed ? 1.5 : 2.5, height: 'var(--ca-topbar-h)', justifyContent: collapsed ? 'center' : 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, overflow: 'hidden' }}>
          <Box sx={{ width: 38, height: 38, borderRadius: 2.5, display: 'grid', placeItems: 'center', color: '#fff', background: 'linear-gradient(135deg,#6366f1,#22d3ee)', flexShrink: 0 }}>
            <HubRoundedIcon fontSize="small" />
          </Box>
          {!collapsed && (
            <Box sx={{ lineHeight: 1.05 }}>
              <Typography sx={{ fontWeight: 800, fontSize: 15, color: '#fff' }}>Company Admin</Typography>
              <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>{roleLabel(user?.role)} Portal</Typography>
            </Box>
          )}
        </Box>
        {!collapsed && (
          <IconButton size="small" onClick={onToggle} sx={{ color: '#94a3b8' }}>
            <MenuOpenRoundedIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', py: 1 }}>
        {groups.map((group) => (
          <Box key={group.heading} sx={{ mb: 1 }}>
            {!collapsed && (
              <Typography sx={{ px: 3, py: 0.75, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b' }}>
                {group.heading}
              </Typography>
            )}
            {group.items.map((item) => (
              <NavItem key={item.to} item={item} collapsed={collapsed} />
            ))}
          </Box>
        ))}
      </Box>

      {!collapsed && (
        <Box sx={{ px: 2.5, py: 2, fontSize: 11, color: '#5b6677', borderTop: '1px solid rgba(148,163,184,0.10)' }}>
          Independent of Travel Desk
        </Box>
      )}
    </Box>
  )
}
