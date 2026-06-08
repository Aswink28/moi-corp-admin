import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Box, LinearProgress } from '@mui/material'
import ProtectedRoute, { RoleRoute } from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'

// Code-split the authenticated pages.
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Approvals = lazy(() => import('./pages/Approvals'))
const Companies = lazy(() => import('./pages/Companies'))
const CompanyOnboarding = lazy(() => import('./pages/CompanyOnboarding'))
const CompanyAdmins = lazy(() => import('./pages/CompanyAdmins'))
const Configuration = lazy(() => import('./pages/Configuration'))
const Subscriptions = lazy(() => import('./pages/Subscriptions'))
const Wallets = lazy(() => import('./pages/Wallets'))
const AuditLogs = lazy(() => import('./pages/AuditLogs'))

const MAKER = ['maker', 'super_admin', 'admin']
const CHECKER = ['checker', 'super_admin', 'admin']
const ADMIN = ['super_admin', 'admin']

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

          {/* Maker */}
          <Route path="/company-onboarding" element={<RoleRoute roles={MAKER}><CompanyOnboarding /></RoleRoute>} />
          <Route path="/company-onboarding/:draftId" element={<RoleRoute roles={MAKER}><CompanyOnboarding /></RoleRoute>} />

          {/* Checker + Super Admin can browse companies */}
          <Route path="/companies" element={<RoleRoute roles={CHECKER}><Companies /></RoleRoute>} />

          {/* Super Admin only */}
          <Route path="/company-admins" element={<RoleRoute roles={ADMIN}><CompanyAdmins /></RoleRoute>} />
          <Route path="/configuration" element={<RoleRoute roles={ADMIN}><Configuration /></RoleRoute>} />
          <Route path="/subscriptions" element={<RoleRoute roles={ADMIN}><Subscriptions /></RoleRoute>} />
          <Route path="/wallets" element={<RoleRoute roles={ADMIN}><Wallets /></RoleRoute>} />
          <Route path="/audit-logs" element={<RoleRoute roles={ADMIN}><AuditLogs /></RoleRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
