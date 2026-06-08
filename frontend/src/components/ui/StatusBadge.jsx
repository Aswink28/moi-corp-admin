import { Chip } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'

const MAP = {
  active: { color: 'success', label: 'Active' },
  suspended: { color: 'warning', label: 'Suspended' },
  inactive: { color: 'default', label: 'Inactive' },
  // Approval-workflow statuses
  draft: { color: 'default', label: 'Draft' },
  submitted: { color: 'info', label: 'Submitted' },
  under_checker_review: { color: 'info', label: 'Under Checker Review' },
  changes_requested: { color: 'warning', label: 'Changes Requested' },
  checker_approved: { color: 'secondary', label: 'Checker Approved' },
  pending_super_admin_approval: { color: 'secondary', label: 'Pending Super Admin' },
  rejected: { color: 'error', label: 'Rejected' },
  expired: { color: 'default', label: 'Expired' },
  cancelled: { color: 'error', label: 'Cancelled' },
  trial: { color: 'info', label: 'Trial' },
  monthly: { color: 'info', label: 'Monthly' },
  quarterly: { color: 'secondary', label: 'Quarterly' },
  yearly: { color: 'primary', label: 'Yearly' },
  allocate: { color: 'primary', label: 'Allocate' },
  credit: { color: 'success', label: 'Credit' },
  debit: { color: 'error', label: 'Debit' },
}

/** A soft, dot-prefixed status pill driven by a known status keyword. */
export default function StatusBadge({ status, label }) {
  const theme = useTheme()
  const cfg = MAP[status] || { color: 'default', label: status }
  const palette = theme.palette[cfg.color]?.main || theme.palette.text.secondary
  return (
    <Chip
      size="small"
      label={label || cfg.label}
      sx={{
        bgcolor: alpha(palette, theme.palette.mode === 'dark' ? 0.22 : 0.12),
        color: cfg.color === 'default' ? 'text.secondary' : palette,
        fontWeight: 700,
        textTransform: 'capitalize',
        '& .MuiChip-label': { px: 1.25 },
        '&::before': {
          content: '""', width: 7, height: 7, borderRadius: '50%', mr: 0.75, ml: 0.5,
          bgcolor: cfg.color === 'default' ? theme.palette.text.disabled : palette,
        },
      }}
    />
  )
}
