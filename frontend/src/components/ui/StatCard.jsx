import { Card, Box, Typography, Chip } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { motion } from 'framer-motion'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import AnimatedNumber from './AnimatedNumber'

/**
 * Premium KPI card with a subtle gradient accent, icon, animated counter and
 * optional trend/delta chip. Lifts on hover.
 */
export default function StatCard({ icon, label, value, color = 'primary', format, delta, index = 0 }) {
  const theme = useTheme()
  const main = theme.palette[color]?.main || theme.palette.primary.main

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 220, damping: 24 }}
      whileHover={{ y: -4 }}
      style={{ height: '100%' }}
    >
      <Card sx={{ p: 2.5, height: '100%', position: 'relative', overflow: 'hidden' }}>
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(135deg, ${alpha(main, 0.10)} 0%, ${alpha(main, 0)} 55%)`,
            pointerEvents: 'none',
          }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
          <Box
            sx={{
              width: 46, height: 46, borderRadius: 3, display: 'grid', placeItems: 'center',
              color: '#fff', background: `linear-gradient(135deg, ${main}, ${alpha(main, 0.7)})`,
              boxShadow: `0 8px 20px ${alpha(main, 0.4)}`,
            }}
          >
            {icon}
          </Box>
          {delta != null && (
            <Chip
              size="small"
              icon={<TrendingUpIcon sx={{ fontSize: 16 }} />}
              label={delta}
              sx={{ bgcolor: alpha(theme.palette.success.main, 0.12), color: 'success.main', fontWeight: 700 }}
            />
          )}
        </Box>
        <Typography variant="h4" sx={{ mt: 2, position: 'relative' }}>
          <AnimatedNumber value={value} format={format || ((n) => Math.round(n).toLocaleString('en-IN'))} />
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, position: 'relative' }}>
          {label}
        </Typography>
      </Card>
    </motion.div>
  )
}
