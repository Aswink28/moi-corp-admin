import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Box, Drawer, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { AnimatePresence, motion } from 'framer-motion'
import Sidebar, { SIDEBAR_W, SIDEBAR_W_COLLAPSED } from './Sidebar'
import Topbar from './Topbar'

export default function Layout() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  const handleMenu = () => (isMobile ? setMobileOpen((o) => !o) : setCollapsed((c) => !c))

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Desktop sidebar */}
      {!isMobile && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 1200 }}>
          <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
        </Box>
      )}

      {/* Mobile drawer */}
      {isMobile && (
        <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)} PaperProps={{ sx: { border: 0 } }}>
          <Box sx={{ height: '100vh' }} onClick={() => setMobileOpen(false)}>
            <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
          </Box>
        </Drawer>
      )}

      <Box
        sx={{
          flex: 1, minWidth: 0,
          ml: isMobile ? 0 : `${collapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W}px`,
          transition: 'margin-left .3s cubic-bezier(.4,0,.2,1)',
        }}
      >
        <Topbar onMenuClick={handleMenu} />
        <Box component="main" sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1440, mx: 'auto' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.26, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </Box>
      </Box>
    </Box>
  )
}
