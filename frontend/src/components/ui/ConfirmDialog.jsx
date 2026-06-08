import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography } from '@mui/material'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import { alpha, useTheme } from '@mui/material/styles'

const Transition = undefined // MUI default Grow; backdrop blur added via slotProps

/** A polished confirmation dialog with a coloured icon and loading state. */
export default function ConfirmDialog({
  open, title = 'Are you sure?', message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  color = 'error', loading = false, onConfirm, onClose,
}) {
  const theme = useTheme()
  const main = theme.palette[color]?.main || theme.palette.error.main
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{ backdrop: { sx: { backdropFilter: 'blur(4px)', bgcolor: alpha('#0b1020', 0.45) } } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ width: 40, height: 40, borderRadius: 2, display: 'grid', placeItems: 'center', color: main, bgcolor: alpha(main, 0.12) }}>
          <WarningAmberRoundedIcon />
        </Box>
        {title}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">{message}</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} color="inherit">{cancelLabel}</Button>
        <Button onClick={onConfirm} variant="contained" color={color} disabled={loading}>
          {loading ? 'Working…' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
