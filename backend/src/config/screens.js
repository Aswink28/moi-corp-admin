/**
 * Master list of assignable Admin-Portal screens. `key` matches the frontend
 * nav item keys + route guards. A Super Admin implicitly has ALL screens
 * (including User Management); these are the screens that can be granted to
 * other users. User Management itself is intentionally NOT assignable — it is
 * Super-Admin-only.
 */
const SCREENS = [
  { key: 'dashboard',          label: 'Dashboard' },
  { key: 'company-analytics',  label: 'Company Analytics' },
  { key: 'approvals',          label: 'Approvals' },
  { key: 'companies',          label: 'Companies' },
  { key: 'company-onboarding', label: 'Onboard Company' },
  { key: 'company-admins',     label: 'Company Admins' },
  { key: 'configuration',      label: 'Configuration' },
  { key: 'subscriptions',      label: 'Subscriptions' },
  { key: 'wallets',            label: 'Wallets' },
  { key: 'audit-logs',         label: 'Audit Logs' },
]

const SCREEN_KEYS = SCREENS.map((s) => s.key)
// Everything a Super Admin can reach (all assignable screens + User Management).
const ALL_SCREENS = [...SCREEN_KEYS, 'user-management']

module.exports = { SCREENS, SCREEN_KEYS, ALL_SCREENS }
