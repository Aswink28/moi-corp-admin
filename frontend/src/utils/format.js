export function fmtMoney(n, currency = 'INR') {
  const value = Number(n || 0)
  const symbol = currency === 'INR' ? '₹' : ''
  return `${symbol}${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

export function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN')
}

export function fmtDateTime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-IN')
}

export function statusColor(status) {
  switch (status) {
    case 'active':
      return 'success'
    case 'suspended':
      return 'warning'
    case 'inactive':
    case 'expired':
    case 'cancelled':
      return 'default'
    default:
      return 'default'
  }
}
