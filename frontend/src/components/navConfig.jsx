import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded'
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded'
import AddBusinessRoundedIcon from '@mui/icons-material/AddBusinessRounded'
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'
import CardMembershipRoundedIcon from '@mui/icons-material/CardMembershipRounded'
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded'
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded'
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded'

// Canonical nav items. Each maps to a route in App.jsx.
const ITEMS = {
  dashboard: { to: '/', label: 'Dashboard', icon: <DashboardRoundedIcon /> },
  approvals: { to: '/approvals', label: 'Approvals', icon: <FactCheckRoundedIcon /> },
  onboard: { to: '/company-onboarding', label: 'Onboard Company', icon: <AddBusinessRoundedIcon /> },
  companies: { to: '/companies', label: 'Companies', icon: <BusinessRoundedIcon /> },
  admins: { to: '/company-admins', label: 'Company Admins', icon: <AdminPanelSettingsRoundedIcon /> },
  configuration: { to: '/configuration', label: 'Configuration', icon: <TuneRoundedIcon /> },
  subscriptions: { to: '/subscriptions', label: 'Subscriptions', icon: <CardMembershipRoundedIcon /> },
  wallets: { to: '/wallets', label: 'Wallets', icon: <AccountBalanceWalletRoundedIcon /> },
  audit: { to: '/audit-logs', label: 'Audit Logs', icon: <HistoryRoundedIcon /> },
}

/** Role-aware sidebar groups. */
export function navGroupsFor(role) {
  if (role === 'maker') {
    return [
      { heading: 'Overview', items: [ITEMS.dashboard] },
      { heading: 'Onboarding', items: [ITEMS.onboard, { ...ITEMS.approvals, label: 'My Requests' }] },
    ]
  }
  if (role === 'checker') {
    return [
      { heading: 'Overview', items: [ITEMS.dashboard] },
      { heading: 'Review', items: [{ ...ITEMS.approvals, label: 'Review Queue' }, ITEMS.companies] },
    ]
  }
  // super_admin / admin
  return [
    { heading: 'Overview', items: [ITEMS.dashboard] },
    { heading: 'Approvals', items: [{ ...ITEMS.approvals, label: 'Final Approvals' }] },
    { heading: 'Management', items: [ITEMS.companies, ITEMS.onboard, ITEMS.admins, ITEMS.configuration] },
    { heading: 'Billing', items: [ITEMS.subscriptions, ITEMS.wallets] },
    { heading: 'System', items: [ITEMS.audit] },
  ]
}

export const ALL_NAV = Object.values(ITEMS)

export function findNav(pathname) {
  return ALL_NAV.find((n) => (n.to === '/' ? pathname === '/' : pathname.startsWith(n.to)))
}
