import { Navigate } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return children
}

/** Guard that also enforces an allowed-roles list; bounces unauthorized users home. */
export function RoleRoute({ roles, children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

/**
 * Screen-access guard: allows the route only if the user is granted the screen
 * (per their assigned permissions). `requireSuperAdmin` additionally restricts
 * to the Super Admin (used for the User Management screen).
 */
export function ScreenRoute({ screen, requireSuperAdmin = false, children }) {
  const { user, loading, hasScreen } = useAuth()
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  if (requireSuperAdmin && user.role !== 'super_admin') return <Navigate to="/" replace />
  if (screen && !hasScreen(screen)) return <Navigate to="/" replace />
  return children
}
