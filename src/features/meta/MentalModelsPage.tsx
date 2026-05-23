import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Button,
  Divider,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import {
  Psychology as ModelIcon,
  ArrowBack as BackIcon,
  Lightbulb as InsightIcon,
  Shield as StrengthIcon,
  Warning as WeaknessIcon,
  BorderAll as BoundaryIcon,
  Upgrade as UpgradeIcon,
  Grain as MetaIcon,
  NavigateNext as NavigateNextIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import type { MentalModelManifestEntry, MentalModel } from '../../data/mental-models-api'
import {
  getModels,
  getModel,
  getModelsByCategory,
} from '../../data/mental-models-api'

export default function MentalModelsPage(): JSX.Element {
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [models, setModels] = useState<MentalModelManifestEntry[]>([])
  const [categories, setCategories] = useState<Map<string, MentalModelManifestEntry[]>>(new Map())
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<MentalModel | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadModels = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [list, byCat] = await Promise.all([getModels(), getModelsByCategory()])
      setModels(list)
      setCategories(byCat)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadModels()
  }, [loadModels])

  const handleSelectModel = async (key: string) => {
    setSelectedKey(key)
    setDetailLoading(true)
    try {
      const model = await getModel(key)
      setSelectedModel(model)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleBack = () => {
    setSelectedKey(null)
    setSelectedModel(null)
  }

  const handleMetaConceptClick = (concept: string) => {
    navigate(`${ROUTES.META_CONCEPTS}?search=${encodeURIComponent(concept)}`)
  }

  const categoryIcons: Record<string, string> = {
    '成长与财富': '📈',
    '决策与经济学': '⚖️',
    '商业与创新': '🚀',
    '决策与分析': '🔍',
    '效率与分配': '🎯',
    '思维方法': '🧠',
    '决策与策略': '♟️',
    '认知与自省': '🪞',
    '认知偏误': '⚠️',
    '学习与进化': '🔄',
    '风险与韧性': '🛡️',
  }

  // ---- 列表视图 ----
  const renderList = () => (
    <Box>
      {Array.from(categories.entries()).map(([cat, catModels]) => (
        <Box key={cat} sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary', px: 0.5 }}>
            {categoryIcons[cat] || '📋'} {cat} ({catModels.length})
          </Typography>
          <Grid container spacing={1.5}>
            {catModels.map((m) => (
              <Grid item xs={12} sm={6} md={4} key={m.key}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: selectedKey === m.key ? 'primary.main' : 'divider',
                    transition: 'all 0.2s',
                    '&:hover': { boxShadow: 2, borderColor: 'primary.light' },
                  }}
                >
                  <CardActionArea onClick={() => handleSelectModel(m.key)}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                        {m.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, lineHeight: 1.3 }}>
                        {m.elevator}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        <Chip label={m.origin} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
                        <Chip label={m.category} size="small" sx={{ fontSize: '0.65rem', height: 20 }} />
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}
    </Box>
  )

  // ---- 详情视图 ----
  const renderDetail = () => {
    if (!selectedModel) return null
    const d = selectedModel.deconstruction

    return (
      <Box>
        {/* Breadcrumbs */}
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton size="small" onClick={handleBack}>
            <BackIcon fontSize="small" />
          </IconButton>
          <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
            <Typography variant="caption" sx={{ cursor: 'pointer' }} onClick={handleBack}>
              经典思维模型
            </Typography>
            <Typography variant="caption" color="primary">
              {selectedModel.name}
            </Typography>
          </Breadcrumbs>
        </Box>

        {/* Model Header */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            mb: 2,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
            color: 'white',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
            {selectedModel.name}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mb: 1.5 }}>
            {selectedModel.elevator}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
            <Chip
              label={selectedModel.origin}
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
            />
            <Chip
              label={selectedModel.category}
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
            />
          </Box>
        </Paper>

        {/* Core Formula */}
        <Card elevation={0} sx={{ mb: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.75, color: '#7c3aed' }}>
              <InsightIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
              核心公式
            </Typography>
            <Typography variant="body2" sx={{ lineHeight: 1.7, fontWeight: 500 }}>
              {d.coreFormula}
            </Typography>
          </CardContent>
        </Card>

        {/* Meta Concept Breakdown */}
        <Card elevation={0} sx={{ mb: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <Box sx={{ px: 2, py: 1, bgcolor: 'rgba(99, 102, 241, 0.06)' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#6366f1' }}>
              <MetaIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
              元概念拆解
            </Typography>
          </Box>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="body2" sx={{ lineHeight: 1.8 }}>
              {d.metaBreakdown}
            </Typography>
            <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selectedModel.metaConceptMapping.map((mc) => (
                <Chip
                  key={mc}
                  label={mc}
                  size="small"
                  color="primary"
                  variant="outlined"
                  onClick={() => handleMetaConceptClick(mc)}
                  sx={{ cursor: 'pointer', fontSize: '0.7rem', height: 22 }}
                />
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* Strengths */}
        <Card elevation={0} sx={{ mb: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.75, color: '#10b981' }}>
              <StrengthIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
              模型优势
            </Typography>
            <Typography variant="body2" sx={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
              {d.strengths}
            </Typography>
          </CardContent>
        </Card>

        {/* Weaknesses */}
        <Card elevation={0} sx={{ mb: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.75, color: '#f59e0b' }}>
              <WeaknessIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
              短板与盲区
            </Typography>
            <Typography variant="body2" sx={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
              {d.weaknesses}
            </Typography>
          </CardContent>
        </Card>

        {/* Boundary */}
        <Card elevation={0} sx={{ mb: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.75, color: '#6366f1' }}>
              <BoundaryIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
              使用边界
            </Typography>
            <Typography variant="body2" sx={{ lineHeight: 1.8 }}>
              {d.boundary}
            </Typography>
          </CardContent>
        </Card>

        {/* Upgrade Hints */}
        <Card
          elevation={0}
          sx={{
            mb: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: '#10b981',
            bgcolor: 'rgba(16, 185, 129, 0.04)',
          }}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.75, color: '#059669' }}>
              <UpgradeIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
              升级与组合建议
            </Typography>
            <Typography variant="body2" sx={{ lineHeight: 1.8 }}>
              {d.upgradeHints}
            </Typography>
          </CardContent>
        </Card>
      </Box>
    )
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 3 },
          pb: { xs: 1.5, md: 2 },
          borderRadius: 2,
          mb: 2,
          background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <ModelIcon sx={{ fontSize: { xs: 22, md: 28 } }} />
          <Typography variant="h5" sx={{ fontWeight: 700, fontSize: { xs: '1.1rem', sm: '1.5rem' } }}>
            经典思维模型归一拆解
          </Typography>
          <Chip
            label="P2"
            size="small"
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }}
          />
        </Box>
        <Typography variant="body2" sx={{ opacity: 0.9, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
          把芒格、经济学、系统论等主流思维模型，全部拆解为底层元概念组合——看清它们从哪里来、强在哪里、盲区在哪
        </Typography>
      </Paper>

      {/* Content */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', pb: 4 }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} />
          </Box>
        )}

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {detailLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {!loading && !detailLoading && (selectedModel ? renderDetail() : renderList())}

        {!loading && models.length === 0 && !error && (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            暂无思维模型数据
          </Typography>
        )}
      </Box>
    </Box>
  )
}
