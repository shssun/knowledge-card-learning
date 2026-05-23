import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  CircularProgress,
  Alert,
  LinearProgress,
  Chip,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  ViewList as ListIcon,
  CompareArrows as CompareIcon,
} from '@mui/icons-material'
import {
  fetchLayer,
  fetchManifest,
  type MetaConceptCard,
  type MetaManifest,
} from '../../data/meta-concepts-api'
import { useMetaProgressStore } from '../../store/metaProgressStore'
import ConceptCard from './ConceptCard'
import ConceptDetail from './ConceptDetail'

/** 层名称映射 */
const LAYER_NAMES: Record<number, string> = {
  1: '宇宙本源',
  2: '逻辑思维',
  3: '人性意识',
  4: '社会人际',
  5: '成事行动',
  6: '商业财富',
  7: '认知思维',
  8: '创新创造',
}

/** 层级说明 */
const LAYER_DESCRIPTIONS: Record<number, string> = {
  1: '不可再分的最底层概念',
  2: '思维工具与推理方法',
  3: '驱动力与认知偏误',
  4: '群体互动与权力结构',
  5: '目标达成与执行方法论',
  6: '价值创造与资源交换',
  7: '高级思维框架与模型',
  8: '突破常规的创造方法',
}

export default function MetaConceptsPage(): JSX.Element {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  // 当前选中的层
  const [currentLayer, setCurrentLayer] = useState(1)

  // 视图模式: list | opposition
  const [viewMode, setViewMode] = useState<'list' | 'opposition'>('list')

  // 数据状态
  const [manifest, setManifest] = useState<MetaManifest | null>(null)
  const [concepts, setConcepts] = useState<MetaConceptCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 详情弹窗
  const [detailConcept, setDetailConcept] = useState<MetaConceptCard | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  // 进度
  const { scores, getScore, isMastered, setScore, getLayerProgress } = useMetaProgressStore()

  // 加载 manifest
  useEffect(() => {
    fetchManifest()
      .then(setManifest)
      .catch((e) => setError('加载概念清单失败: ' + e.message))
  }, [])

  // 按层加载概念
  const loadLayer = useCallback(async (layer: number) => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchLayer(layer)
      setConcepts(Object.values(data))
    } catch (e: any) {
      setError('加载概念数据失败: ' + e.message)
      setConcepts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadLayer(currentLayer)
  }, [currentLayer, loadLayer])

  // 打开详情
  const handleConceptClick = (concept: MetaConceptCard) => {
    setDetailConcept(concept)
    setDetailOpen(true)
  }

  // 保存评分
  const handleScore = (conceptKey: string, score: number) => {
    setScore(conceptKey, score)
  }

  // 层进度
  const layerKeys = manifest?.layerConcepts[currentLayer] ?? []
  const progress = getLayerProgress(layerKeys)

  // 全局进度
  const totalLearned = Object.values(scores).filter((s) => s >= 80).length
  const totalConcepts = manifest?.total ?? 130

  // 对立视角分组：pairs + solos
  const { pairs, solos } = useMemo(() => {
    const usedInPair = new Set<string>()
    const pairList: [MetaConceptCard, MetaConceptCard][] = []
    const soloList: MetaConceptCard[] = []

    for (const c of concepts) {
      if (usedInPair.has(c.term)) continue
      const opp = c.opposingConcept
      if (opp) {
        const oppConcept = concepts.find((x) => x.term === opp)
        if (oppConcept) {
          pairList.push([c, oppConcept])
          usedInPair.add(c.term)
          usedInPair.add(opp)
        } else {
          soloList.push(c)
        }
      } else {
        soloList.push(c)
      }
    }
    return { pairs: pairList, solos: soloList }
  }, [concepts])

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
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
        }}
      >
        <Box sx={{
          display: 'flex',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 1.5 : 0,
        }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, fontSize: { xs: '1.1rem', sm: '1.5rem' } }}>
              元概念学习
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              从不可再分的底层概念出发，构建可迁移的思维根基
            </Typography>
          </Box>
          <Box sx={{
            textAlign: isMobile ? 'left' : 'center',
            display: 'flex',
            alignItems: 'baseline',
            gap: 0.5,
          }}>
            <Typography variant="h3" sx={{ fontWeight: 700, fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3rem' } }}>
              {totalLearned}
              <Typography component="span" variant="h6" sx={{ opacity: 0.7, ml: 0.5, fontSize: { xs: '0.8rem', sm: '1rem', md: '1.25rem' } }}>
                / {totalConcepts}
              </Typography>
            </Typography>
            {!isMobile && (
              <Typography variant="caption" sx={{ opacity: 0.8, display: 'block' }}>
                已掌握
              </Typography>
            )}
          </Box>
        </Box>

        <LinearProgress
          variant="determinate"
          value={totalConcepts > 0 ? (totalLearned / totalConcepts) * 100 : 0}
          sx={{
            mt: 2,
            height: 6,
            borderRadius: 3,
            bgcolor: 'rgba(255,255,255,0.2)',
            '& .MuiLinearProgress-bar': { bgcolor: 'rgba(255,255,255,0.9)' },
          }}
        />
      </Paper>

      {/* Layer Tabs */}
      <Paper elevation={0} sx={{ borderRadius: 2, mb: 2 }}>
        <Tabs
          value={currentLayer}
          onChange={(_, v) => setCurrentLayer(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 1,
            '& .MuiTab-root': {
              minWidth: { xs: 72, sm: 100 },
              fontSize: { xs: '0.7rem', sm: '0.8rem' },
              fontWeight: 600,
              px: { xs: 0.5, sm: 1.5 },
            },
          }}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8].map((layer) => {
            const keys = manifest?.layerConcepts[layer] ?? []
            const layerProgress = getLayerProgress(keys)
            const isActiveLayer = layer <= 2 // Layer 1-2 高亮（小白阶段核心）

            return (
              <Tab
                key={layer}
                value={layer}
                label={
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>
                        L{layer} {LAYER_NAMES[layer]}
                      </span>
                      {isActiveLayer && (
                        <Chip
                          label="核心"
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '0.6rem',
                            bgcolor: 'warning.main',
                            color: 'warning.contrastText',
                          }}
                        />
                      )}
                    </Box>
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                      {layerProgress.learned}/{layerProgress.total} · {layerProgress.percent}%
                    </Typography>
                  </Box>
                }
                sx={{
                  textTransform: 'none',
                  opacity: 1,
                }}
              />
            )
          })}
        </Tabs>
      </Paper>

      {/* Layer Description + View Toggle */}
      <Box sx={{ px: 0.5, mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 0.5 }}>
        {!isMobile && (
          <Stack direction="row" spacing={1} alignItems="center">
            <TrendingUpIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {LAYER_DESCRIPTIONS[currentLayer]} · 共 {layerKeys.length} 个概念 · 已掌握 {progress.learned} 个
            </Typography>
          </Stack>
        )}
        {isMobile && (
          <Typography variant="caption" color="text.secondary" noWrap>
            {layerKeys.length} 概念 · 掌握 {progress.learned}
          </Typography>
        )}

        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(_, v) => v && setViewMode(v)}
          size="small"
        >
          <ToggleButton value="list" sx={{ px: 1.5, textTransform: 'none' }}>
            <ListIcon sx={{ fontSize: 18, mr: 0.5 }} />
            列表
          </ToggleButton>
          <ToggleButton value="opposition" sx={{ px: 1.5, textTransform: 'none' }}>
            <CompareIcon sx={{ fontSize: 18, mr: 0.5 }} />
            对立
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Concept List / Opposition View */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', pb: 4 }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mx: 1 }}>
            {error}
          </Alert>
        )}

        {/* 列表模式 */}
        {!loading && !error && viewMode === 'list' &&
          concepts.map((c) => (
            <ConceptCard
              key={c.term}
              concept={c}
              mastered={isMastered(c.term)}
              score={getScore(c.term)}
              onClick={handleConceptClick}
            />
          ))}

        {/* 对立模式 */}
        {!loading && !error && viewMode === 'opposition' && (
          <Box>
            {/* 配对概念 */}
            {pairs.length > 0 && (
              <>
                <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary', px: 0.5 }}>
                  📎 对立配对 ({pairs.length} 组)
                </Typography>
                {pairs.map(([left, right]) => (
                  <Paper
                    key={`${left.term}-${right.term}`}
                    variant="outlined"
                    sx={{
                      mb: 1.5,
                      p: 1.5,
                      borderRadius: 2,
                      borderColor: 'divider',
                      transition: 'all 0.2s',
                      '&:hover': { boxShadow: 2, borderColor: 'primary.light' },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'stretch', gap: { xs: 0.5, sm: 1 }, flexDirection: 'row' }}>
                      {/* 左概念 */}
                      <Box
                        sx={{ flex: 1, cursor: 'pointer' }}
                        onClick={() => handleConceptClick(left)}
                      >
                        <ConceptCardMini
                          concept={left}
                          mastered={isMastered(left.term)}
                          score={getScore(left.term)}
                        />
                      </Box>

                      {/* 连接器 */}
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: { xs: 20, sm: 40 },
                          px: { xs: 0, sm: 0.5 },
                          flexShrink: 0,
                        }}
                      >
                        <Box
                          sx={{
                            width: { xs: 1, sm: 1 },
                            height: { xs: 2, sm: 2 },
                            bgcolor: 'primary.light',
                            position: 'relative',
                            flexShrink: 0,
                            '&::before, &::after': {
                              content: '""',
                              position: 'absolute',
                              width: { xs: 6, sm: 10 },
                              height: { xs: 6, sm: 10 },
                              borderRadius: '50%',
                              bgcolor: 'primary.main',
                            },
                            '&::before': { left: -2, top: { xs: -2, sm: -4 } },
                            '&::after': { right: -2, top: { xs: -2, sm: -4 } },
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{
                            mt: 0.25,
                            color: 'primary.main',
                            fontSize: { xs: '0.55rem', sm: '0.6rem' },
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          VS
                        </Typography>
                      </Box>

                      {/* 右概念 */}
                      <Box
                        sx={{ flex: 1, cursor: 'pointer' }}
                        onClick={() => handleConceptClick(right)}
                      >
                        <ConceptCardMini
                          concept={right}
                          mastered={isMastered(right.term)}
                          score={getScore(right.term)}
                        />
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </>
            )}

            {/* 独立概念（无对立面） */}
            {solos.length > 0 && (
              <>
                <Typography
                  variant="subtitle2"
                  sx={{ mb: 1.5, mt: 3, color: 'text.secondary', px: 0.5 }}
                >
                  🔹 独立概念 ({solos.length} 个) — 无明确层内对立面
                </Typography>
                {solos.map((c) => (
                  <ConceptCard
                    key={c.term}
                    concept={c}
                    mastered={isMastered(c.term)}
                    score={getScore(c.term)}
                    onClick={handleConceptClick}
                  />
                ))}
              </>
            )}
          </Box>
        )}

        {!loading && !error && concepts.length === 0 && (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            该层暂无概念数据
          </Typography>
        )}
      </Box>

      {/* Detail Dialog */}
      <ConceptDetail
        open={detailOpen}
        concept={detailConcept}
        currentScore={detailConcept ? getScore(detailConcept.term) : 0}
        onClose={() => setDetailOpen(false)}
        onScore={handleScore}
      />
    </Box>
  )
}

/** 紧凑版概念卡片 - 用于对立配对视图 */
function ConceptCardMini({
  concept,
  mastered,
  score,
}: {
  concept: MetaConceptCard
  mastered: boolean
  score: number
}): JSX.Element {
  return (
    <Box
      sx={{
        p: { xs: 1, sm: 1.5 },
        borderRadius: 1.5,
        border: 1,
        borderColor: mastered ? 'success.main' : 'divider',
        bgcolor: mastered ? 'rgba(46, 125, 50, 0.08)' : 'background.paper',
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: 'primary.main',
          bgcolor: 'action.hover',
        },
      }}
    >
      <Typography
        variant="body2"
        sx={{ fontWeight: 700, mb: 0.25, fontSize: { xs: '0.75rem', sm: '0.85rem' } }}
      >
        {concept.term}
        {concept.opposingConcept && (
          <Typography
            component="span"
            variant="caption"
            sx={{ ml: 0.75, color: 'primary.main', fontSize: { xs: '0.6rem', sm: '0.65rem' } }}
          >
            ↹ {concept.opposingConcept}
          </Typography>
        )}
      </Typography>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: { xs: 'none', sm: 'block' }, lineHeight: 1.3, fontSize: '0.7rem' }}
      >
        {concept.levelContent.definition.length > 50
          ? concept.levelContent.definition.slice(0, 50) + '…'
          : concept.levelContent.definition}
      </Typography>
      <Box sx={{ mt: { xs: 0.25, sm: 0.75 }, display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {mastered ? (
          <Chip label="已掌握" size="small" color="success" sx={{ height: 20, fontSize: '0.65rem' }} />
        ) : score > 0 ? (
          <Chip
            label={`${score}分`}
            size="small"
            color="warning"
            variant="outlined"
            sx={{ height: 20, fontSize: '0.65rem' }}
          />
        ) : (
          <Chip label="未学" size="small" sx={{ height: 20, fontSize: '0.65rem' }} />
        )}
      </Box>
    </Box>
  )
}
