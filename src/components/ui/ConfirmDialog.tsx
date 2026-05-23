import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
  IconButton,
} from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  confirmColor?: 'primary' | 'secondary' | 'error' | 'warning' | 'success'
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = '确认',
  cancelLabel = '取消',
  confirmColor = 'primary',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps): JSX.Element {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontWeight: 600,
        }}
      >
        {title}
        <IconButton onClick={onCancel} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} color="inherit" disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          color={confirmColor}
          variant="contained"
          disabled={loading}
        >
          {loading ? '处理中...' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ConfirmDialog
