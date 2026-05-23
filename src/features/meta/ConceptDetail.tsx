import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Chip,
  Slider,
  Button,
  Divider,
  IconButton,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import {
  Close as CloseIcon,
  CheckCircle as CheckIcon,
  Translate as TranslateIcon,
} from '@mui/icons-material'
import { ROUTES } from '../../constants/routes'
import type { MetaConceptCard } from '../../data/meta-concepts-api'

interface Props {
  open: boolean
  concept: MetaConceptCard | null
  currentScore: number
  onClose: () => void
  onScore: (conceptKey: string, score: number) => void
}

const SECTIONS: { key: string; label: string }[] = [
  { key: 'definition', label: '定义' },
  { key: 'boundary', label: '边界' },
  { key: 'examples', label: '案例' },
  { key: 'applicationScenario', label: '应用场景' },
  { key: 'misconceptions', label: '常见误解' },
  { key: 'relations', label: '概念关系' },
  { key: 'transferTest', label: '迁移测试' },
  { key: 'teachingOutput', label: '教学输出' },
]

export default function ConceptDetail({ open, concept, currentScore, onClose, onScore }: Props): JSX.Element {
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [sliderScore, setSliderScore] = useState(currentScore)

  if (!concept) return <></>

  const isMastered = sliderScore >= 80

  const handleSave = () => {
    onScore(concept.term, sliderScore)
    // 不再直接关闭——让用户看到 mastery 确认状态
  }

  const handleTranslate = () => {
    onClose()
    navigate(`${ROUTES.TRANSLATION_PRACTICE}?from=${encodeURIComponent(concept.term)}`)
  }

  // 小助手刷新：重置滑条
  const handleOpen = () => {
    setSliderScore(currentScore)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      TransitionProps={{ onEntered: handleOpen }}
      PaperProps={{ sx: { borderRadius: { xs: 0, sm: 2 } } }}
    >
      {/* Header */}
      <DialogTitle sx={{ pb: 1, pr: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {concept.term}
          </Typography>
          <Chip label={`Layer ${concept.layer}`} size="small" color="primary" variant="outlined" />
          <Chip
            label={concept.layerName}
            size="small"
            sx={{
              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
              color: (theme) => theme.palette.mode === 'dark' ? 'grey.200' : 'text.primary',
            }}
          />
        </Box>
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', top: 8, right: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      {/* Content */}
      <DialogContent sx={{ pt: 2, pb: 1 }}>
        {SECTIONS.map((section) => {
          const content = (concept.levelContent as Record<string, string>)[section.key]
          if (!content) return null

          return (
            <Paper
              key={section.key}
              variant="outlined"
              sx={{
                p: 2,
                mb: 1.5,
                borderRadius: 1.5,
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
                borderColor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'divider',
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  color: 'primary.main',
                  mb: 0.5,
                  fontSize: '0.85rem',
                }}
              >
                {section.label}
              </Typography>
              <Typography variant="body2" sx={{ lineHeight: 1.7, fontSize: '0.875rem' }}>
                {content}
              </Typography>
            </Paper>
          )
        })}
      </DialogContent>

      <Divider />

      {/* Self-Assessment */}
      <DialogActions sx={{ flexDirection: 'column', alignItems: 'stretch', px: { xs: 2, sm: 3 }, py: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          自我评估：你对「{concept.term}」的掌握程度（0-100分，≥80分 = 已掌握）
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="caption" color="text.disabled">0</Typography>
          <Slider
            value={sliderScore}
            onChange={(_, v) => setSliderScore(v as number)}
            step={5}
            marks={[
              { value: 0, label: '0' },
              { value: 50, label: '50' },
              { value: 80, label: '80✓' },
              { value: 100, label: '100' },
            ]}
            valueLabelDisplay="auto"
            sx={{ flexGrow: 1 }}
            color={sliderScore >= 80 ? 'success' : 'warning'}
          />
          <Typography variant="caption" color="text.disabled">100</Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 1, flexWrap: 'wrap' }}>
          <Button onClick={onClose} variant="outlined" size="small">
            关闭
          </Button>
          {isMastered && (
            <Button
              onClick={handleTranslate}
              variant="outlined"
              size="small"
              color="secondary"
              startIcon={<TranslateIcon />}
              sx={{
                borderColor: 'secondary.main',
                color: 'secondary.main',
                '&:hover': { borderColor: 'secondary.dark', bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(139,92,246,0.12)' : 'rgba(99,102,241,0.04)' },
              }}
            >
              用这个概念翻译
            </Button>
          )}
          <Button
            onClick={handleSave}
            variant="contained"
            size="small"
            startIcon={isMastered ? <CheckIcon /> : undefined}
            color={isMastered ? 'success' : 'primary'}
          >
            {isMastered ? '标记为已掌握' : '保存评分'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  )
}
