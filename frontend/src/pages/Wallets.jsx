import { useState } from 'react'
import {
  Box, Card, Typography, Grid, Button, TextField, MenuItem, Stack, Divider, ToggleButtonGroup, ToggleButton,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { motion } from 'framer-motion'
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded'
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded'
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded'
import { PageHeader, DataTable, StatusBadge, EmptyState, AnimatedNumber } from '../components/ui'
import CompanyPicker from '../components/CompanyPicker'
import { walletsApi } from '../api/endpoints'
import { fmtMoney, fmtDateTime } from '../utils/format'
import { errMsg } from '../api/client'
import { useToast } from '../context/ToastContext'

const TYPES = [
  { value: 'allocate', label: 'Allocate' },
  { value: 'credit', label: 'Add Funds' },
  { value: 'debit', label: 'Deduct' },
]

export default function Wallets() {
  const { notify } = useToast()
  const [companyId, setCompanyId] = useState('')
  const [wallet, setWallet] = useState(null)
  const [txns, setTxns] = useState([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ type: 'credit', amount: '', description: '' })
  const [saving, setSaving] = useState(false)

  async function pick(id) {
    setCompanyId(id)
    setWallet(null)
    setTxns([])
    if (!id) return
    setLoading(true)
    try {
      const [w, t] = await Promise.all([walletsApi.get(id), walletsApi.transactions(id)])
      setWallet(w)
      setTxns(t)
    } catch (e) {
      notify(errMsg(e), 'error')
    } finally {
      setLoading(false)
    }
  }

  async function submit() {
    const amount = Number(form.amount)
    if (!(amount > 0)) return notify('Enter an amount greater than 0', 'warning')
    setSaving(true)
    try {
      const res = await walletsApi.operate(companyId, { ...form, amount })
      setWallet(res.wallet)
      setForm({ ...form, amount: '', description: '' })
      setTxns(await walletsApi.transactions(companyId))
      notify('Transaction recorded', 'success')
    } catch (e) {
      notify(errMsg(e), 'error')
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    { key: 'type', header: 'Type', render: (r) => <StatusBadge status={r.type} /> },
    { key: 'amount', header: 'Amount', align: 'right', value: (r) => Number(r.amount), render: (r) => (
      <Typography sx={{ fontWeight: 700, color: r.type === 'debit' ? 'error.main' : 'success.main' }}>
        {r.type === 'debit' ? '−' : '+'}{fmtMoney(r.amount)}
      </Typography>
    ) },
    { key: 'balance_after', header: 'Balance After', align: 'right', value: (r) => Number(r.balance_after), render: (r) => fmtMoney(r.balance_after) },
    { key: 'description', header: 'Description', render: (r) => r.description || '—' },
    { key: 'created_at', header: 'Date', render: (r) => fmtDateTime(r.created_at) },
  ]

  return (
    <Box>
      <PageHeader title="Wallets" subtitle="Allocate and manage company prepaid wallets" actions={<CompanyPicker value={companyId} onChange={pick} label="Select a company" />} />

      {!companyId && (
        <Card><EmptyState icon={<AccountBalanceWalletRoundedIcon sx={{ fontSize: 42 }} />} title="Select a company" description="Choose a company to view its wallet balance and transaction history." /></Card>
      )}

      {wallet && (
        <Grid container spacing={2.5}>
          <Grid item xs={12} md={4}>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <Card sx={{ p: 3, mb: 2.5, color: '#fff', position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg,#1e1b4b,#4f46e5)' }}>
                <Box sx={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%', background: alpha('#fff', 0.08), top: -80, right: -50 }} />
                <Stack direction="row" alignItems="center" spacing={1}><AccountBalanceWalletRoundedIcon /><Typography sx={{ opacity: 0.85 }}>Wallet Balance</Typography></Stack>
                <Typography variant="h3" sx={{ fontWeight: 800, mt: 1 }}>
                  <AnimatedNumber value={wallet.balance} format={(n) => fmtMoney(n, wallet.currency)} />
                </Typography>
              </Card>
            </motion.div>
            <Card sx={{ p: 2.5 }}>
              <Typography variant="h6" gutterBottom>Manage Funds</Typography>
              <Divider sx={{ mb: 2 }} />
              <ToggleButtonGroup exclusive fullWidth size="small" value={form.type} onChange={(_, v) => v && setForm({ ...form, type: v })} sx={{ mb: 2 }}>
                {TYPES.map((t) => <ToggleButton key={t.value} value={t.value} sx={{ textTransform: 'none', fontWeight: 600 }}>{t.label}</ToggleButton>)}
              </ToggleButtonGroup>
              <TextField label="Amount" type="number" fullWidth sx={{ mb: 2 }} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                InputProps={{ startAdornment: form.type === 'debit' ? <ArrowDownwardRoundedIcon color="error" fontSize="small" sx={{ mr: 1 }} /> : <ArrowUpwardRoundedIcon color="success" fontSize="small" sx={{ mr: 1 }} /> }} />
              <TextField label="Description" fullWidth sx={{ mb: 2 }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <Button variant="contained" fullWidth onClick={submit} disabled={saving}>{saving ? 'Processing…' : 'Submit Transaction'}</Button>
            </Card>
          </Grid>
          <Grid item xs={12} md={8}>
            <DataTable columns={columns} rows={txns} loading={loading} searchPlaceholder="Search transactions…" exportName="wallet-transactions" empty={{ icon: <AccountBalanceWalletRoundedIcon sx={{ fontSize: 42 }} />, title: 'No transactions yet', description: 'Allocate or add funds to get started.' }} />
          </Grid>
        </Grid>
      )}
    </Box>
  )
}
