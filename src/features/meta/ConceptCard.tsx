import {
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Box,
  Chip,
  LinearProgress,
} from '@mui/material'
import { CheckCircle as CheckIcon, RadioButtonUnchecked as UncheckIcon } from '@mui/icons-material'
import type { MetaConceptCard } from '../../data/meta-concepts-api'

interface Props {
  concept: MetaConceptCard
  mastered: boolean
  score: number
  onClick: (concept: MetaConceptCard) => void
}

export default function ConceptCard({ concept, mastered, score, onClick }: Props): JSX.Element {
  const defPreview =
    concept.levelContent.definition.length > 60
      ? concept.levelContent.definition.slice(0, 60) + '…'
      : concept.levelContent.definition

  return (
    <Card
      sx={{
        mb: 1.5,
        borderLeft: 4,
        borderColor: mastered ? 'success.main' : 'divider',
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: mastered ? 'success.main' : 'primary.main',
          boxShadow: 3,
        },
      }}
    >
      <CardActionArea onClick={() => onClick(concept)}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {mastered ? (
                <CheckIcon sx={{ fontSize: 20, color: 'success.main' }} />
              ) : (
                <UncheckIcon sx={{ fontSize: 20, color: 'text.disabled' }} />
              )}
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {concept.term}
              </Typography>
            </Box>
            <Chip
              label={mastered ? `已掌握 ${score}分` : score > 0 ? `${score}分` : '未学习'}
              size="small"
              color={mastered ? 'success' : score > 0 ? 'warning' : 'default'}
              variant={mastered ? 'filled' : 'outlined'}
              sx={{ fontSize: '0.7rem', height: 22 }}
            />
          </Box>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: '0.8rem', lineHeight: 1.4 }}
          >
            {defPreview}
          </Typography>

          {score > 0 && !mastered && (
            <LinearProgress
              variant="determinate"
              value={score}
              sx={{ mt: 0.75, height: 3, borderRadius: 1 }}
              color="warning"
            />
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  )
}
