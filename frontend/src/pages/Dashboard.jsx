import { useAuth } from '../context/AuthContext'
import MakerDashboard from '../components/dashboards/MakerDashboard'
import CheckerDashboard from '../components/dashboards/CheckerDashboard'
import SuperAdminDashboard from '../components/dashboards/SuperAdminDashboard'

// Renders the role-specific dashboard. All three roles land on '/'.
export default function Dashboard() {
  const { user } = useAuth()
  if (user?.role === 'maker') return <MakerDashboard user={user} />
  if (user?.role === 'checker') return <CheckerDashboard user={user} />
  return <SuperAdminDashboard user={user} />
}
