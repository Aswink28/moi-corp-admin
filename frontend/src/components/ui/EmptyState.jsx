import { Box, Typography, Button } from '@mui/material'
import InboxRoundedIcon from '@mui/icons-material/InboxRounded'
import { alpha, useTheme } from '@mui/material/styles'
import { motion } from 'framer-motion'

/** Friendly empty-state with an illustrated icon and optional CTA. */
export default function EmptyState({ icon, title = 'Nothing here yet', description, action }) {
  const theme = useTheme()
  return (
    <Box sx={{ textAlign: 'center', py: 7, px: 2 }}>
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
      >
        <Box
          sx={{
            width: 88, height: 88, mx: 'auto', borderRadius: '28px', display: 'grid', placeItems: 'center',
            color: 'primary.main',
            background: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.16 : 0.09),
          }}
        >
          {icon || <InboxRoundedIcon sx={{ fontSize: 42 }} />}
        </Box>
      </motion.div>
      <Typography variant="h6" sx={{ mt: 2 }}>{title}</Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 380, mx: 'auto' }}>
          {description}
        </Typography>
      )}
      {action && <Box sx={{ mt: 2.5 }}>{action}</Box>}
    </Box>
  )
}
