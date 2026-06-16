import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Box, LinearProgress } from '@mui/material'
import ProtectedRoute, { ScreenRoute } from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'

// Code-split the authenticated pages.
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Approvals = lazy(() => import('./pages/Approvals'))
const CompanyAnalytics = lazy(() => import('./pages/CompanyAnalytics'))
const Companies = lazy(() => import('./pages/Companies'))
const CompanyOnboarding = lazy(() => import('./pages/CompanyOnboarding'))
const CompanyAdmins = lazy(() => import('./pages/CompanyAdmins'))
const Configuration = lazy(() => import('./pages/Configuration'))
const Subscriptions = lazy(() => import('./pages/Subscriptions'))
const Wallets = lazy(() => import('./pages/Wallets'))
const AuditLogs = lazy(() => import('./pages/AuditLogs'))
const UserManagement = lazy(() => import('./pages/UserManagement'))

function PageFallback() {
  return (
    <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 2000 }}>
      <LinearProgress />
    </Box>
  )
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Role-aware dashboard + shared approvals workspace */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/approvals" element={<Approvals />} />

          {/* Screen access is enforced per-user via assigned screens */}
          <Route path="/company-onboarding" element={<ScreenRoute screen="company-onboarding"><CompanyOnboarding /></ScreenRoute>} />
          <Route path="/company-onboarding/:draftId" element={<ScreenRoute screen="company-onboarding"><CompanyOnboarding /></ScreenRoute>} />
          <Route path="/companies" element={<ScreenRoute screen="companies"><Companies /></ScreenRoute>} />
          <Route path="/company-analytics" element={<ScreenRoute screen="company-analytics"><CompanyAnalytics /></ScreenRoute>} />
          <Route path="/company-admins" element={<ScreenRoute screen="company-admins"><CompanyAdmins /></ScreenRoute>} />
          <Route path="/configuration" element={<ScreenRoute screen="configuration"><Configuration /></ScreenRoute>} />
          <Route path="/subscriptions" element={<ScreenRoute screen="subscriptions"><Subscriptions /></ScreenRoute>} />
          <Route path="/wallets" element={<ScreenRoute screen="wallets"><Wallets /></ScreenRoute>} />
          <Route path="/audit-logs" element={<ScreenRoute screen="audit-logs"><AuditLogs /></ScreenRoute>} />

          {/* User Management — Super Admin only */}
          <Route path="/users" element={<ScreenRoute screen="user-management" requireSuperAdmin><UserManagement /></ScreenRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
