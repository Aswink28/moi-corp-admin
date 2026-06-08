import { Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Box, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { alpha } from '@mui/material/styles'

/** A reusable modal for forms — blurred backdrop, header with close, footer actions. */
export default function FormDialog({
  open, title, subtitle, children, onClose, onSubmit, submitLabel = 'Save',
  submitDisabled = false, loading = false, maxWidth = 'sm',
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
      slotProps={{ backdrop: { sx: { backdropFilter: 'blur(4px)', bgcolor: alpha('#0b1020', 0.45) } } }}
    >
      <DialogTitle sx={{ pr: 6 }}>
        <Typography variant="h6">{title}</Typography>
        {subtitle && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{subtitle}</Typography>}
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 12, top: 12 }} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ pt: 1 }}>{children}</Box>
      </DialogContent>
      {onSubmit && (
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} color="inherit">Cancel</Button>
          <Button onClick={onSubmit} variant="contained" disabled={submitDisabled || loading}>
            {loading ? 'Saving…' : submitLabel}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  )
}
