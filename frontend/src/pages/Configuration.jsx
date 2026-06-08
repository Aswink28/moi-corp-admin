import { useState } from 'react'
import {
  Box, Card, CardContent, Typography, Grid, Switch, Button, Stack, Skeleton,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { motion } from 'framer-motion'
import FlightRoundedIcon from '@mui/icons-material/FlightRounded'
import HotelRoundedIcon from '@mui/icons-material/HotelRounded'
import TrainRoundedIcon from '@mui/icons-material/TrainRounded'
import DirectionsBusRoundedIcon from '@mui/icons-material/DirectionsBusRounded'
import LocalTaxiRoundedIcon from '@mui/icons-material/LocalTaxiRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded'
import SaveRoundedIcon from '@mui/icons-material/SaveRounded'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'
import { PageHeader, EmptyState } from '../components/ui'
import CompanyPicker from '../components/CompanyPicker'
import { settingsApi } from '../api/endpoints'
import { errMsg } from '../api/client'
import { useToast } from '../context/ToastContext'

const MODULES = [
  { key: 'flight_enabled', label: 'Flight', desc: 'Air ticket booking', icon: <FlightRoundedIcon />, color: 'primary' },
  { key: 'hotel_enabled', label: 'Hotel', desc: 'Hotel reservations', icon: <HotelRoundedIcon />, color: 'secondary' },
  { key: 'train_enabled', label: 'Train', desc: 'Rail bookings', icon: <TrainRoundedIcon />, color: 'success' },
  { key: 'bus_enabled', label: 'Bus', desc: 'Bus bookings', icon: <DirectionsBusRoundedIcon />, color: 'warning' },
  { key: 'cab_enabled', label: 'Cab', desc: 'Ground transport', icon: <LocalTaxiRoundedIcon />, color: 'info' },
  { key: 'expense_enabled', label: 'Expense', desc: 'Expense claims', icon: <ReceiptLongRoundedIcon />, color: 'error' },
  { key: 'wallet_enabled', label: 'Wallet', desc: 'Prepaid wallet', icon: <AccountBalanceWalletRoundedIcon />, color: 'primary' },
]

export default function Configuration() {
  const { notify } = useToast()
  const [companyId, setCompanyId] = useState('')
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  async function pick(id) {
    setCompanyId(id)
    setSettings(null)
    if (!id) return
    setLoading(true)
    try {
      setSettings(await settingsApi.get(id))
    } catch (e) {
      notify(errMsg(e), 'error')
    } finally {
      setLoading(false)
    }
  }

  async function save() {
    setSaving(true)
    try {
      setSettings(await settingsApi.update(companyId, settings))
      notify('Configuration saved', 'success', { title: 'Modules updated' })
    } catch (e) {
      notify(errMsg(e), 'error')
    } finally {
      setSaving(false)
    }
  }

  const enabledCount = settings ? MODULES.filter((m) => settings[m.key]).length : 0

  return (
    <Box>
      <PageHeader
        title="Configuration"
        subtitle="Enable or disable product modules per company"
        actions={<CompanyPicker value={companyId} onChange={pick} label="Select a company" />}
      />

      {!companyId && (
        <Card><EmptyState icon={<TuneRoundedIcon sx={{ fontSize: 42 }} />} title="Select a company" description="Choose a company above to configure which product modules are available to them." /></Card>
      )}

      {companyId && loading && (
        <Grid container spacing={2}>
          {MODULES.map((m) => <Grid item xs={12} sm={6} md={4} key={m.key}><Skeleton variant="rounded" height={92} /></Grid>)}
        </Grid>
      )}

      {settings && !loading && (
        <>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">{enabledCount} of {MODULES.length} modules enabled</Typography>
            <Button variant="contained" startIcon={<SaveRoundedIcon />} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Configuration'}</Button>
          </Stack>
          <Grid container spacing={2}>
            {MODULES.map((m, i) => {
              const on = !!settings[m.key]
              return (
                <Grid item xs={12} sm={6} md={4} key={m.key}>
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -3 }}>
                    <Card sx={{ p: 2, transition: 'border-color .2s', borderColor: (t) => (on ? alpha(t.palette[m.color].main, 0.5) : t.palette.divider) }}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{ width: 44, height: 44, borderRadius: 2.5, display: 'grid', placeItems: 'center', color: on ? `${m.color}.main` : 'text.disabled', bgcolor: (t) => alpha(t.palette[m.color].main, on ? 0.14 : 0.06) }}>
                          {m.icon}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 700 }}>{m.label} Module</Typography>
                          <Typography variant="caption" color="text.secondary">{m.desc}</Typography>
                        </Box>
                        <Switch checked={on} onChange={(e) => setSettings((s) => ({ ...s, [m.key]: e.target.checked }))} color={m.color} />
                      </Stack>
                    </Card>
                  </motion.div>
                </Grid>
              )
            })}
          </Grid>
        </>
      )}
    </Box>
  )
}
