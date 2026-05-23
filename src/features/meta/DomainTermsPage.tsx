/**
 * 领域术语学习页面
 *
 * 中级及以上用户可用。展示预置领域术语：
 * - 领域卡片网格 → 术语列表 → 术语详情
 * - 每个术语标注其映射的底层元概念
 * - 中级以下用户展示等级门禁
 */
import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  LinearProgress,
  Divider,
  IconButton,
  Breadcrumbs,
  Link,
  Card,
  CardContent,
  CardActionArea,
} from '@mui/material'
import {
  ArrowBack as BackIcon,
  AutoStories as DomainIcon,
  AccountTree as MetaIcon,
  School as LevelIcon,
  TrendingUp as TrendingUpIcon,
  Lock as LockIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useEffectiveLevel } from '../../hooks/useEffectiveLevel'
import { ROUTES } from '../../constants/routes'
import type {
  DomainManifestEntry,
  DomainTerm,
} from '../../data/domain-terms-api'
import {
  getDomains,
  getTermsByDomain,
  clearDomainCache,
} from '../../data/domain-terms-api'

export default function DomainTermsPage(): JSX.Element {
  const navigate = useNavigate()
  const effectiveLevel = useEffectiveLevel()

  // 状态
  const [domains, setDomains] = useState<Array<{ key: string } & DomainManifestEntry>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // 当前选中的领域和术语
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null)
  const [terms, setTerms] = useState<DomainTerm[]>([])
  const [termsLoading, setTermsLoading] = useState(false)

  const [selectedTerm, setSelectedTerm] = useState<DomainTerm | null>(null)

  // 等级门禁
  const isLocked = effectiveLevel.levelIndex < 2 // 小白和初级都锁住

  useEffect(() => {
    clearDomainCache()
    getDomains()
      .then(setDomains)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const handleSelectDomain = useCallback(async (domainKey: string) => {
    setSelectedDomain(domainKey)
    setSelectedTerm(null)
    setTermsLoading(true)
    try {
      const t = await getTermsByDomain(domainKey)
      setTerms(t)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setTermsLoading(false)
    }
  }, [])

  const handleBackToDomains = useCallback(() => {
    setSelectedDomain(null)
    setSelectedTerm(null)
    setTerms([])
  }, [])

  const handleBackToTerms = useCallback(() => {
    setSelectedTerm(null)
  }, [])

  // ── 等级门禁 ──
  if (isLocked) {
    const levelNames = ['小白', '初级', '中级', '高级', '大师']
    const needed = 3 - effectiveLevel.levelIndex
    return (
      <Box sx={{ maxWidth: 640, mx: 'auto', p: 4, textAlign: 'center' }}>
        <LockIcon sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
        <Typography variant="h5" gutterBottom fontWeight={700}>
          领域术语学习
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          你需要达到 <strong>中级</strong> 才能解锁领域术语学习。
          当前等级：<strong>{levelNames[effectiveLevel.levelIndex]}</strong>，
          还需升级 {needed} 级。
        </Typography>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            元概念总进度
          </Typography>
          <LinearProgress
            variant="determinate"
            value={effectiveLevel.totalConcepts > 0
              ? (effectiveLevel.totalLearned / effectiveLevel.totalConcepts) * 100
              : 0
            }
            sx={{ height: 10, borderRadius: 5 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {effectiveLevel.totalLearned} / {effectiveLevel.totalConcepts} 已掌握
          </Typography>
        </Box>
        <Box sx={{ mt: 3 }}>
          <Chip
            label="去学元概念"
            icon={<TrendingUpIcon />}
            color="primary"
            clickable
            onClick={() => navigate(ROUTES.META_CONCEPTS)}
            sx={{ px: 2, py: 2.5, fontSize: '1rem' }}
          />
        </Box>
      </Box>
    )
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
  }

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: 2 }}>
      {/* 面包屑 */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          underline="hover"
          color="inherit"
          onClick={handleBackToDomains}
          sx={{ cursor: 'pointer' }}
        >
          领域术语
        </Link>
        {selectedDomain && !selectedTerm && (
          <Typography color="text.primary">
            {domains.find((d) => d.key === selectedDomain)?.name}
          </Typography>
        )}
        {selectedTerm && (
          <Link
            underline="hover"
            color="inherit"
            onClick={handleBackToTerms}
            sx={{ cursor: 'pointer' }}
          >
            {domains.find((d) => d.key === selectedDomain)?.name}
          </Link>
        )}
        {selectedTerm && (
          <Typography color="text.primary">{selectedTerm.term}</Typography>
        )}
      </Breadcrumbs>

      {/* ── 领域网格 ── */}
      {!selectedDomain && (
        <>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            领域术语
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            掌握底层元概念后，从这里进入具体领域。每个术语都标注了它依赖的核心元概念。
          </Typography>
          <Grid container spacing={2}>
            {domains.map((d) => (
              <Grid item xs={12} sm={6} md={4} key={d.key}>
                <Card
                  variant="outlined"
                  sx={{
                    transition: 'all 0.2s',
                    '&:hover': { boxShadow: 3, borderColor: 'primary.main' },
                  }}
                >
                  <CardActionArea onClick={() => handleSelectDomain(d.key)}>
                    <CardContent>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <DomainIcon color="primary" />
                        <Typography variant="h6" fontWeight={600}>
                          {d.name}
                        </Typography>
                      </Stack>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                        {d.description}
                      </Typography>
                      <Chip
                        label={`${d.termCount} 个术语`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.75rem' }}
                      />
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* ── 术语列表 ── */}
      {selectedDomain && !selectedTerm && (
        <>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <IconButton onClick={handleBackToDomains} size="small">
              <BackIcon />
            </IconButton>
            <Typography variant="h5" fontWeight={700}>
              {domains.find((d) => d.key === selectedDomain)?.name}
            </Typography>
          </Stack>

          {termsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <>
              {terms.map((t) => (
                <Paper
                  key={t.term}
                  variant="outlined"
                  sx={{
                    mb: 1.5,
                    p: 2,
                    borderRadius: 2,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': { boxShadow: 2, borderColor: 'primary.light' },
                  }}
                  onClick={() => setSelectedTerm(t)}
                >
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {t.term}
                    </Typography>
                    {t.opposingTerm && (
                      <Chip
                        label={`↔ ${t.opposingTerm}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ height: 22, fontSize: '0.7rem' }}
                      />
                    )}
                    <Chip
                      label={t.difficulty}
                      size="small"
                      color="warning"
                      sx={{ height: 22, fontSize: '0.7rem' }}
                    />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {t.definition}
                  </Typography>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                    {t.metaConceptMappings.map((mc: string) => (
                      <Chip
                        key={mc}
                        icon={<MetaIcon sx={{ fontSize: 14 }} />}
                        label={mc}
                        size="small"
                        variant="outlined"
                        sx={{ height: 22, fontSize: '0.65rem', mb: 0.5 }}
                      />
                    ))}
                  </Stack>
                </Paper>
              ))}
            </>
          )}
        </>
      )}

      {/* ── 术语详情 ── */}
      {selectedTerm && (
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <IconButton onClick={handleBackToTerms} size="small">
              <BackIcon />
            </IconButton>
            <Typography variant="h5" fontWeight={700}>
              {selectedTerm.term}
            </Typography>
            <Chip label={selectedTerm.difficulty} size="small" color="warning" />
          </Stack>

          {/* 元概念映射 */}
          <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: 'rgba(25, 118, 210, 0.04)', borderColor: 'primary.light' }}>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <MetaIcon fontSize="small" color="primary" />
              底层元概念映射
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              这个领域术语由以下元概念组合而成：
            </Typography>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              {selectedTerm.metaConceptMappings.map((mc: string) => (
                <Chip
                  key={mc}
                  label={mc}
                  size="small"
                  color="primary"
                  variant="outlined"
                  clickable
                  sx={{ mb: 0.5 }}
                  onClick={() => navigate(ROUTES.META_CONCEPTS)}
                />
              ))}
            </Stack>
          </Paper>

          {/* 五级内容 */}
          {([
            { key: 'definition', label: '核心定义', color: 'primary.main' as const },
            { key: 'boundary', label: '适用边界', color: 'warning.main' as const },
            { key: 'similarTerms', label: '近似概念', color: 'info.main' as const },
            { key: 'examples', label: '经典案例', color: 'success.main' as const },
            { key: 'applicationScenario', label: '应用场景', color: 'secondary.main' as const },
            { key: 'misconceptions', label: '常见误区', color: 'error.main' as const },
            { key: 'relations', label: '知识关联', color: 'text.primary' as const },
            { key: 'transferTest', label: '迁移测试', color: 'warning.dark' as const },
            { key: 'teachingOutput', label: '费曼输出', color: 'success.dark' as const },
          ] as const).map(({ key, label, color }) => {
            const content = selectedTerm.levelContent[key as keyof typeof selectedTerm.levelContent]
            if (!content) return null
            return (
              <Paper key={key} variant="outlined" sx={{ p: 2, mb: 1.5, borderRadius: 2 }}>
                <Typography
                  variant="subtitle2"
                  fontWeight={700}
                  sx={{ mb: 0.75, color }}
                >
                  {label}
                </Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {content}
                </Typography>
              </Paper>
            )
          })}
        </Box>
      )}
    </Box>
  )
}
