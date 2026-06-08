import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Box, LinearProgress } from '@mui/material'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'

// Code-split the authenticated pages.
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Companies = lazy(() => import('./pages/Companies'))
const CompanyOnboarding = lazy(() => import('./pages/CompanyOnboarding'))
const CompanyAdmins = lazy(() => import('./pages/CompanyAdmins'))
const Configuration = lazy(() => import('./pages/Configuration'))
const Subscriptions = lazy(() => import('./pages/Subscriptions'))
const Wallets = lazy(() => import('./pages/Wallets'))
const AuditLogs = lazy(() => import('./pages/AuditLogs'))

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
          <Route path="/" element={<Dashboard />} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/company-onboarding" element={<CompanyOnboarding />} />
          <Route path="/company-onboarding/:draftId" element={<CompanyOnboarding />} />
          <Route path="/company-admins" element={<CompanyAdmins />} />
          <Route path="/configuration" element={<Configuration />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/wallets" element={<Wallets />} />
          <Route path="/audit-logs" element={<AuditLogs />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
