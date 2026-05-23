import { Box, Typography, Button } from '@mui/material'
import { FolderOpen as FolderIcon, Add as AddIcon } from '@mui/icons-material'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps): JSX.Element {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 4,
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          bgcolor: 'grey.100',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 3,
          color: 'grey.400',
        }}
      >
        {icon || <FolderIcon sx={{ fontSize: 40 }} />}
      </Box>

      <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
        {title}
      </Typography>

      {description && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 3, maxWidth: 400 }}
        >
          {description}
        </Typography>
      )}

      {actionLabel && onAction && (
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  )
}

export default EmptyState
