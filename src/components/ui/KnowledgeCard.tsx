import { Box, Typography, Chip, Paper, Divider } from '@mui/material'
import {
  Lightbulb as LightbulbIcon,
} from '@mui/icons-material'
import { KnowledgeCard as KnowledgeCardType } from '../../types/study.types'
import CardFlip from './CardFlip'

interface KnowledgeCardProps {
  card: KnowledgeCardType
  showDetails?: boolean
  onFlip?: (isFlipped: boolean) => void
}

function KnowledgeCard({
  card,
  showDetails = true,
  onFlip,
}: KnowledgeCardProps): JSX.Element {
  return (
    <CardFlip onFlip={onFlip}>
      <>
        {/* Front - Summary */}
        <Paper
          elevation={2}
          sx={{
            p: 3,
            borderRadius: 3,
            bgcolor: 'background.paper',
            height: '100%',
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Chip
                label={card.domain}
                size="small"
                sx={{
                  bgcolor: 'primary.50',
                  color: 'primary.main',
                  fontWeight: 500,
                }}
              />
              <Chip
                label={card.type === 'FUSION' ? '融合卡' : '标准卡'}
                size="small"
                color={card.type === 'FUSION' ? 'secondary' : 'default'}
              />
            </Box>

            <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
              {card.term}
            </Typography>

            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ mb: 2 }}
            >
              {card.topic}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <LightbulbIcon
                sx={{ color: 'warning.main', mt: 0.3, fontSize: 20 }}
              />
              <Typography variant="body2" color="text.secondary">
                {card.coreDefinition.slice(0, 100)}
                {card.coreDefinition.length > 100 && '...'}
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Back - Details */}
        <Paper
          elevation={2}
          sx={{
            p: 3,
            borderRadius: 3,
            bgcolor: 'background.paper',
            height: '100%',
          }}
        >
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
            核心定义
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {card.coreDefinition}
          </Typography>

          {showDetails && (
            <>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                适用范围
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {card.applicableScope}
              </Typography>

              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                基本案例
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {card.basicCase}
              </Typography>

              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                常见误区
              </Typography>
              <Typography variant="body2" color="error.main">
                {card.commonMisconceptions}
              </Typography>
            </>
          )}
        </Paper>
      </>
    </CardFlip>
  )
}

export default KnowledgeCard
