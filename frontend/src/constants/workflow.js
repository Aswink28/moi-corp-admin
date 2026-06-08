// Shared metadata for the 3-level approval workflow (Maker → Checker → Super Admin).

export const STATUS_META = {
  draft: { label: 'Draft', color: 'default', stage: 0 },
  submitted: { label: 'Submitted', color: 'info', stage: 1 },
  under_checker_review: { label: 'Under Checker Review', color: 'info', stage: 1 },
  changes_requested: { label: 'Changes Requested', color: 'warning', stage: 0 },
  checker_approved: { label: 'Checker Approved', color: 'secondary', stage: 2 },
  pending_super_admin_approval: { label: 'Pending Super Admin Approval', color: 'secondary', stage: 2 },
  active: { label: 'Active', color: 'success', stage: 3 },
  rejected: { label: 'Rejected', color: 'error', stage: -1 },
  suspended: { label: 'Suspended', color: 'warning', stage: 3 },
  inactive: { label: 'Inactive', color: 'default', stage: -1 },
}

export function statusMeta(status) {
  return STATUS_META[status] || { label: status || '—', color: 'default', stage: -1 }
}

// The four visible stages of the lifecycle tracker.
export const WORKFLOW_STAGES = ['Maker', 'Checker', 'Super Admin', 'Active']

// Human-readable label for an approval-history action.
export const ACTION_LABELS = {
  submit: 'Submitted for review',
  resubmit: 'Resubmitted after changes',
  start_review: 'Checker started review',
  checker_approve: 'Approved by Checker',
  request_changes: 'Changes requested',
  reject: 'Rejected',
  activate: 'Approved & activated',
  suspend: 'Suspended',
  reactivate: 'Reactivated',
}

export function actionLabel(action) {
  return ACTION_LABELS[action] || action
}

// Role metadata used by the Login page and role-aware UI.
export const ROLE_META = {
  maker: {
    label: 'Maker',
    short: 'Maker Login',
    description: 'Create and manage company onboarding requests.',
    color: 'primary',
  },
  checker: {
    label: 'Checker',
    short: 'Checker Login',
    description: 'Review and verify onboarding submissions.',
    color: 'secondary',
  },
  super_admin: {
    label: 'Super Admin',
    short: 'Super Admin Login',
    description: 'Final approval and platform administration.',
    color: 'success',
  },
}

export function roleLabel(role) {
  return ROLE_META[role]?.label || role || 'User'
}

// All roles land on '/', which renders the role-specific dashboard.
export function roleHome() {
  return '/'
}
