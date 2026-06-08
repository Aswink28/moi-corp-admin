import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded'
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded'
import AddBusinessRoundedIcon from '@mui/icons-material/AddBusinessRounded'
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'
import CardMembershipRoundedIcon from '@mui/icons-material/CardMembershipRounded'
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded'
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded'

// Grouped sidebar navigation. Each item maps to a route in App.jsx.
export const NAV_GROUPS = [
  {
    heading: 'Overview',
    items: [{ to: '/', label: 'Dashboard', icon: <DashboardRoundedIcon /> }],
  },
  {
    heading: 'Management',
    items: [
      { to: '/companies', label: 'Companies', icon: <BusinessRoundedIcon /> },
      { to: '/company-onboarding', label: 'Onboard Company', icon: <AddBusinessRoundedIcon /> },
      { to: '/company-admins', label: 'Company Admins', icon: <AdminPanelSettingsRoundedIcon /> },
      { to: '/configuration', label: 'Configuration', icon: <TuneRoundedIcon /> },
    ],
  },
  {
    heading: 'Billing',
    items: [
      { to: '/subscriptions', label: 'Subscriptions', icon: <CardMembershipRoundedIcon /> },
      { to: '/wallets', label: 'Wallets', icon: <AccountBalanceWalletRoundedIcon /> },
    ],
  },
  {
    heading: 'System',
    items: [{ to: '/audit-logs', label: 'Audit Logs', icon: <HistoryRoundedIcon /> }],
  },
]

export const ALL_NAV = NAV_GROUPS.flatMap((g) => g.items)

export function findNav(pathname) {
  return ALL_NAV.find((n) => (n.to === '/' ? pathname === '/' : pathname.startsWith(n.to)))
}
