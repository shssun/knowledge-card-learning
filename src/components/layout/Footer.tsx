import { Box, Typography, Link, Divider } from '@mui/material'
import {
  GitHub as GitHubIcon,
  HelpOutline as HelpIcon,
  Info as InfoIcon,
} from '@mui/icons-material'
import { version } from '../../../package.json'

function Footer(): JSX.Element {
  return (
    <Box
      component="footer"
      sx={{
        py: 2,
        px: 3,
        bgcolor: 'background.paper',
        borderTop: '1px solid',
        borderColor: 'divider',
        mt: 'auto',
      }}
    >
      <Divider sx={{ mb: 2 }} />

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
        }}
      >
        {/* Left: Links */}
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          <Link
            href="https://github.com/shssun/knowledgeCardLearning"
            target="_blank"
            rel="noopener"
            underline="hover"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              color: 'text.secondary',
              fontSize: 13,
              '&:hover': { color: 'primary.main' },
            }}
          >
            <GitHubIcon sx={{ fontSize: 16 }} />
            GitHub
          </Link>

          <Link
            href="#"
            underline="hover"
            onClick={(e: React.MouseEvent) => {
              e.preventDefault()
              // Re-show onboarding guide from settings page
              const uiStore = (window as unknown as { __zhika_reset_onboarding?: () => void }).__zhika_reset_onboarding
              if (uiStore) uiStore()
            }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              color: 'text.secondary',
              fontSize: 13,
              cursor: 'pointer',
              '&:hover': { color: 'primary.main' },
            }}
          >
            <HelpIcon sx={{ fontSize: 16 }} />
            使用教程
          </Link>
        </Box>

        {/* Right: Version */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <InfoIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
          <Typography variant="caption" color="text.disabled">
            知卡研习 v{version} · MIT License
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

export default Footer
