import { Box, Typography, Breadcrumbs, Link } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import { motion } from 'framer-motion'

/**
 * Standard page header: breadcrumbs + title + subtitle + right-aligned actions.
 */
export default function PageHeader({ title, subtitle, breadcrumbs = [], actions }) {
  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 2, flexWrap: 'wrap', mb: 2.5 }}>
        <Box>
          {breadcrumbs.length > 0 && (
            <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 0.5, fontSize: 13 }}>
              {breadcrumbs.map((b, i) =>
                b.to ? (
                  <Link key={i} component={RouterLink} to={b.to} underline="hover" color="inherit" sx={{ fontSize: 13 }}>
                    {b.label}
                  </Link>
                ) : (
                  <Typography key={i} color="text.secondary" sx={{ fontSize: 13 }}>
                    {b.label}
                  </Typography>
                )
              )}
            </Breadcrumbs>
          )}
          <Typography variant="h5">{title}</Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {actions && <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>{actions}</Box>}
      </Box>
    </motion.div>
  )
}
