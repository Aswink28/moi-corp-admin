import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded'
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded'
import AddBusinessRoundedIcon from '@mui/icons-material/AddBusinessRounded'
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'
import CardMembershipRoundedIcon from '@mui/icons-material/CardMembershipRounded'
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded'
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded'
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded'
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded'
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded'
import GroupRoundedIcon from '@mui/icons-material/GroupRounded'

// Canonical nav items. Each maps to a route in App.jsx and a `screen` key used
// by the per-user screen-access checks.
const ITEMS = {
  dashboard:     { to: '/', label: 'Dashboard', icon: <DashboardRoundedIcon />, screen: 'dashboard' },
  approvals:     { to: '/approvals', label: 'Approvals', icon: <FactCheckRoundedIcon />, screen: 'approvals' },
  analytics:     { to: '/company-analytics', label: 'Company Analytics', icon: <InsightsRoundedIcon />, screen: 'company-analytics' },
  onboard:       { to: '/company-onboarding', label: 'Onboard Company', icon: <AddBusinessRoundedIcon />, screen: 'company-onboarding' },
  companies:     { to: '/companies', label: 'Companies', icon: <BusinessRoundedIcon />, screen: 'companies' },
  admins:        { to: '/company-admins', label: 'Company Admins', icon: <AdminPanelSettingsRoundedIcon />, screen: 'company-admins' },
  configuration: { to: '/configuration', label: 'Configuration', icon: <TuneRoundedIcon />, screen: 'configuration' },
  users:         { to: '/users', label: 'User Management', icon: <GroupRoundedIcon />, screen: 'user-management', superAdminOnly: true },
  subscriptions: { to: '/subscriptions', label: 'Subscriptions', icon: <CardMembershipRoundedIcon />, screen: 'subscriptions' },
  wallets:       { to: '/wallets', label: 'Wallets', icon: <AccountBalanceWalletRoundedIcon />, screen: 'wallets' },
  emoney:        { to: '/e-money', label: 'E-Money Approval', icon: <PaymentsRoundedIcon />, screen: 'e-money-approval' },
  audit:         { to: '/audit-logs', label: 'Audit Logs', icon: <HistoryRoundedIcon />, screen: 'audit-logs' },
}

const GROUPS = [
  { heading: 'Overview', items: [ITEMS.dashboard, ITEMS.analytics] },
  { heading: 'Approvals', items: [ITEMS.approvals] },
  { heading: 'Management', items: [ITEMS.companies, ITEMS.onboard, ITEMS.admins, ITEMS.configuration] },
  { heading: 'Access Control', items: [ITEMS.users] },
  { heading: 'Billing', items: [ITEMS.subscriptions, ITEMS.wallets, ITEMS.emoney] },
  { heading: 'System', items: [ITEMS.audit] },
]

function canAccess(user, item) {
  if (!user) return false
  if (item.superAdminOnly && user.role !== 'super_admin') return false
  if (user.role === 'super_admin') return true
  return Array.isArray(user.screens) && user.screens.includes(item.screen)
}

const labelFor = (item, role) =>
  item.screen !== 'approvals' ? item.label
    : role === 'maker' ? 'My Requests'
    : role === 'checker' ? 'Review Queue'
    : 'Final Approvals'

/** Build the sidebar from the user's granted screens. */
export function navGroupsFor(user) {
  return GROUPS
    .map((g) => ({
      heading: g.heading,
      items: g.items.filter((it) => canAccess(user, it)).map((it) => ({ ...it, label: labelFor(it, user?.role) })),
    }))
    .filter((g) => g.items.length > 0)
}

export const ALL_NAV = Object.values(ITEMS)

export function findNav(pathname) {
  return ALL_NAV.find((n) => (n.to === '/' ? pathname === '/' : pathname.startsWith(n.to)))
}
