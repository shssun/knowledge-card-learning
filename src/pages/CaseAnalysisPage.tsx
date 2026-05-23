/**
 * 案例分析页面
 * 基于用户已掌握的思维模型，对真实场景进行分层分析
 * 用户能看到自己已掌握的模型能分析到什么程度，
 * 同时看到「还没学到的模型」在哪里。
 */
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  Divider,
  Alert,
  Collapse,
  Skeleton,
  useTheme,
  useMediaQuery,
  Stack,
} from '@mui/material'
import {
  Psychology as PsychologyIcon,
  PlayArrow as PlayIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Refresh as RefreshIcon,
  Lightbulb as LightbulbIcon,
  AutoAwesome as AutoAwesomeIcon,
} from '@mui/icons-material'
import { ROUTES } from '../constants/routes'
import { SAMPLE_CASES } from '../data/sample-cases'
import { useScoreStore } from '../store/scoreStore'
import { useArchiveStore } from '../store/archiveStore'
import { AI_BASICS_PRESET_CARDS } from '../data/ai-basics-10-words'
import { analyzeCase } from '../services/caseAnalysisService'
import { hasApiKey } from '../services/openai'
import type { CaseAnalysisResult, LearnedConcept, SampleCase } from '../types/caseAnalysis.types'

/** 默认提示语 */
const PLACEHOLDER = `粘贴你想分析的真实场景...

例如：
• 面试时面试官压薪资，要不要接受？
• 朋友推荐一只"内幕股"，要不要买？
• 公司新上了一个AI功能，用户反馈很差，怎么分析？

粘贴后点击「开始分析」，系统会基于你已掌握的思维模型给出分析。`

function CaseAnalysisPage(): JSX.Element {
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  // 状态
  const [caseContent, setCaseContent] = useState('')
  const [selectedSample, setSelectedSample] = useState<SampleCase | null>(null)
  const [analysisResult, setAnalysisResult] = useState<CaseAnalysisResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [unlockedConcepts, setUnlockedConcepts] = useState<string[]>([])
  const [showFullAnalysis, setShowFullAnalysis] = useState(false)

  // 从 scoreStore 获取用户已点亮概念
  const levelRecords = useScoreStore((s) => s.levelRecords)
  const archiveRecords = useArchiveStore((s) => s.records)

  // 计算用户已点亮的概念列表（从 scoreStore）
  const learnedConcepts: LearnedConcept[] = useMemo(() => {
    const learned: LearnedConcept[] = []

    // 从 scoreStore.levelRecords 找已完成的概念
    Object.entries(levelRecords).forEach(([cardId, records]) => {
      const completedLevels = Object.values(records).filter((r) => r.completed)
      if (completedLevels.length === 0) return

      // 找到最高等级
      const levelOrder = ['小白', '初级', '中级', '高级', '大师']
      const maxCompleted = completedLevels.reduce((max, r) => {
        const idx = levelOrder.indexOf(r.level)
        const maxIdx = levelOrder.indexOf(max)
        return idx > maxIdx ? r.level : max
      }, '小白' as string)

      // 从归档记录找 levelContent
      const fusionCard = archiveRecords
        .flatMap((r) => r.fusionCards || [])
        .find((c) => c.id === cardId || c.baseCardId === cardId)

      // 也从预设数据查
      const presetCard = Object.values(AI_BASICS_PRESET_CARDS).find(
        (p) => p.term === cardId || (fusionCard && fusionCard.term === p.term)
      )

      learned.push({
        term: cardId,
        maxLevel: maxCompleted as LearnedConcept['maxLevel'],
        levelRecords: records,
        levelContent: fusionCard?.levelContent || presetCard?.levelContent,
      })
    })

    return learned
  }, [levelRecords, archiveRecords])

  // 如果用户还没点亮任何概念，显示引导
  const hasNoConcepts = learnedConcepts.length === 0

  // 所有可用概念（用于关键词匹配）
  const allConcepts = useMemo(() => {
    const concepts: Array<{ term: string; domain: string; keywords?: string[] }> = []
    // 从预设数据
    Object.values(AI_BASICS_PRESET_CARDS).forEach((card) => {
      concepts.push({ term: card.term, domain: 'AI基础' })
    })
    return concepts
  }, [])

  void allConcepts // 预留扩展：用于未来关键词匹配

  /** 开始分析 */
  const handleAnalyze = async () => {
    if (!caseContent.trim()) return
    if (!hasApiKey()) {
      setError('此功能需要 AI 接口。请到设置页配置，或先使用学习中心的核心功能。')
      return
    }

    setIsLoading(true)
    setError(null)
    setStreamingText('')
    setAnalysisResult(null)
    setUnlockedConcepts([])
    setShowFullAnalysis(false)

    try {
      const result = await analyzeCase(
        {
          caseContent: caseContent.trim(),
          learnedConcepts,
        },
        (chunk) => {
          setStreamingText((prev) => prev + chunk)
        }
      )
      setAnalysisResult(result)
    } catch (err: any) {
      setError(err.message || '分析失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  /** 选择快捷案例 */
  const handleSelectSample = (sample: SampleCase) => {
    setSelectedSample(sample)
    setCaseContent(sample.content)
    // 切换案例时清除之前的状态和结果
    setAnalysisResult(null)
    setUnlockedConcepts([])
    setShowFullAnalysis(false)
    setStreamingText('')
  }

  /** 解锁概念 */
  const handleUnlock = (term: string) => {
    setUnlockedConcepts((prev) => [...prev, term])
  }

  /** 解锁全部 */
  const handleUnlockAll = () => {
    if (!analysisResult) return
    setUnlockedConcepts(analysisResult.hiddenConcepts)
  }

  /** 跳转到研习该概念 */
  const handleStudyConcept = (term: string) => {
    // 跳转到研习页面，自动选择 AI基础词库 并定位到指定术语
    navigate(`${ROUTES.STUDY}?materialId=bank-ai-basics&term=${encodeURIComponent(term)}`)
  }

  // 渲染分析结果
  const renderAnalysis = () => {
    if (!analysisResult && !isLoading) return null

    // 流式输出中
    if (isLoading && streamingText) {
      return (
        <Paper sx={{ p: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            <AutoAwesomeIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
            AI 正在分析中...
          </Typography>
          <Typography
            component="pre"
            sx={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 14, mt: 1 }}
          >
            {streamingText}
            <Box component="span" sx={{
              display: 'inline-block',
              animation: 'blink 1s step-end infinite',
              '@keyframes blink': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0 },
              },
            }}>▌</Box>
          </Typography>
        </Paper>
      )
    }

    if (!analysisResult) return null

    const { ownedAnalysis, hiddenConcepts, rawOutput, usedConcepts } = analysisResult

    // 分割 ownedAnalysis 和 fullAnalysis
    const ownedPart = ownedAnalysis || extractBeforeLocked(rawOutput)
    const lockedPart = extractLockedSection(rawOutput)

    return (
      <Stack spacing={3}>
        {/* 已掌握的模型分析 */}
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <LightbulbIcon color="primary" />
            <Typography variant="h6">你能想到的</Typography>
            <Chip
              size="small"
              label={`用了 ${usedConcepts.length} 个模型`}
              color="primary"
              variant="outlined"
            />
          </Box>

          {ownedPart ? (
            <Typography
              component="pre"
              sx={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 14 }}
            >
              {ownedPart}
            </Typography>
          ) : (
            <Alert severity="info">
              {hasNoConcepts
                ? '你还没有点亮任何概念，请先在「学习中心」完成研习后再来分析案例。'
                : 'AI 正在分析中，请稍候...'}
            </Alert>
          )}

          {/* 使用的模型标签 */}
          {usedConcepts.length > 0 && (
            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {usedConcepts.map((term) => (
                <Chip
                  key={term}
                  size="small"
                  label={term}
                  variant="outlined"
                  onClick={() => handleStudyConcept(term)}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
          )}
        </Paper>

        {/* 未掌握的模型 */}
        {hiddenConcepts.length > 0 && (
          <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <LockIcon sx={{ color: 'text.secondary' }} />
              <Typography variant="h6" color="text.secondary">
                你可能没想到的
              </Typography>
              <Chip
                size="small"
                label={`${hiddenConcepts.length} 个概念待解锁`}
                color="default"
              />
            </Box>

            <Stack spacing={1.5}>
              {hiddenConcepts.map((term, idx) => {
                const isUnlocked = unlockedConcepts.includes(term)
                const reason = analysisResult.recommendedConcepts.find(
                  (r) => r.term === term
                )?.reason

                return (
                  <Card
                    key={term}
                    variant="outlined"
                    sx={{
                      opacity: isUnlocked ? 1 : 0.7,
                      bgcolor: isUnlocked ? 'background.paper' : 'grey.100',
                      transition: 'all 0.3s',
                    }}
                  >
                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {!isUnlocked ? (
                          <LockIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                        ) : (
                          <LockOpenIcon fontSize="small" color="primary" />
                        )}
                        <Typography fontWeight={600}>{term}</Typography>
                        {!isUnlocked && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleUnlock(term)}
                            sx={{ ml: 'auto' }}
                          >
                            解锁
                          </Button>
                        )}
                        {isUnlocked && (
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleStudyConcept(term)}
                            sx={{ ml: 'auto' }}
                          >
                            去学习
                          </Button>
                        )}
                      </Box>

                      {/* 解锁后的理由 */}
                      <Collapse in={isUnlocked}>
                        {reason && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 0.5, ml: 4 }}
                          >
                            {reason}
                          </Typography>
                        )}
                      </Collapse>
                    </CardContent>
                  </Card>
                )
              })}
            </Stack>

            {unlockedConcepts.length < hiddenConcepts.length && (
              <Button
                size="small"
                onClick={handleUnlockAll}
                sx={{ mt: 2 }}
                startIcon={<LockOpenIcon />}
              >
                全部解锁
              </Button>
            )}
          </Paper>
        )}

        {/* 综合评估（解锁后可见） */}
        {lockedPart && (
          <Paper sx={{ p: 3, border: '2px solid', borderColor: 'primary.main' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <AutoAwesomeIcon color="primary" />
              <Typography variant="h6">综合评估</Typography>
              <Chip
                size="small"
                label="含全部视角"
                color="primary"
              />
            </Box>

            <Typography
              component="pre"
              sx={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 14 }}
            >
              {lockedPart}
            </Typography>

            {hiddenConcepts.length > 0 && unlockedConcepts.length < hiddenConcepts.length && (
              <Alert severity="info" sx={{ mt: 2 }}>
                解锁更多概念后，综合评估会更加完整。
                已解锁 {unlockedConcepts.length}/{hiddenConcepts.length} 个。
              </Alert>
            )}
          </Paper>
        )}
      </Stack>
    )
  }

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      {/* 页面标题 */}
      <Box sx={{ p: 3, pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <PsychologyIcon sx={{ fontSize: 28, color: 'primary.main' }} />
          <Typography variant="h5" fontWeight={700}>
            案例分析
          </Typography>
          <Chip
            size="small"
            label={`已点亮 ${learnedConcepts.length} 个概念`}
            color={learnedConcepts.length > 0 ? 'primary' : 'default'}
            variant="outlined"
            sx={{ ml: 1 }}
          />
        </Box>
        <Typography variant="body2" color="text.secondary">
          基于你已掌握的思维模型，分析真实场景，看看你能想到什么，以及还有什么没想到的。
        </Typography>
      </Box>

      <Divider />

      {/* 主内容区 */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: 2,
          p: 2,
          height: isMobile ? 'auto' : 'calc(100vh - 140px)',
        }}
      >
        {/* 左栏：输入区 */}
        <Box
          sx={{
            width: isMobile ? '100%' : '40%',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            flexShrink: 0,
          }}
        >
          {/* 案例输入 */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              输入案例
            </Typography>
            <TextField
              multiline
              minRows={6}
              maxRows={12}
              fullWidth
              placeholder={PLACEHOLDER}
              value={caseContent}
              onChange={(e) => setCaseContent(e.target.value)}
              sx={{ mb: 1.5 }}
              disabled={isLoading}
            />
            {error && (
              <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={isLoading
                ? <Box component="span" sx={{ display: 'inline-flex', animation: 'spin 1s linear infinite', '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }}><RefreshIcon /></Box>
                : <PlayIcon />}
              onClick={handleAnalyze}
              disabled={isLoading || !caseContent.trim() || hasNoConcepts}
            >
              {isLoading ? '分析中...' : hasNoConcepts ? '先完成研习' : '开始分析'}
            </Button>
          </Paper>

          {/* 快捷案例 */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              快捷案例
            </Typography>
            <Stack spacing={1}>
              {SAMPLE_CASES.map((sample) => (
                <Card
                  key={sample.id}
                  variant="outlined"
                  sx={{
                    borderColor:
                      selectedSample?.id === sample.id ? 'primary.main' : undefined,
                    bgcolor:
                      selectedSample?.id === sample.id ? 'action.selected' : undefined,
                  }}
                >
                  <CardActionArea onClick={() => handleSelectSample(sample)}>
                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="body2" fontWeight={600}>
                        {sample.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {sample.description}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              ))}
            </Stack>
          </Paper>
        </Box>

        {/* 右栏：结果区 */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            minWidth: 0,
          }}
        >
          {isLoading && !streamingText && (
            <Stack spacing={2}>
              <Skeleton variant="rectangular" height={200} />
              <Skeleton variant="rectangular" height={150} />
            </Stack>
          )}

          {!isLoading && !analysisResult && !streamingText && (
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'text.secondary',
                gap: 2,
              }}
            >
              <PsychologyIcon sx={{ fontSize: 64, opacity: 0.3 }} />
              <Typography variant="body1" textAlign="center">
                粘贴案例或选择一个快捷案例
                <br />
                开始你的多元思维模型分析
              </Typography>
            </Box>
          )}

          {renderAnalysis()}
        </Box>
      </Box>
    </Box>
  )
}

/** 从原始输出提取 LOCKED 之后的综合评估部分 */
function extractLockedSection(text: string): string {
  const lockedIndex = text.indexOf('[LOCKED')
  if (lockedIndex === -1) return ''

  // 找下一个 ## 或结尾
  const afterLocked = text.slice(lockedIndex)
  const endMatch = afterLocked.match(/\n## /)
  if (endMatch) {
    return afterLocked.slice(0, afterLocked.indexOf(endMatch[0])).replace(/^\[LOCKED[^\]]+\][^\n]*\n?/, '').trim()
  }
  return afterLocked.replace(/^\[LOCKED[^\]]+\][^\n]*\n?/, '').trim()
}

/** 从原始输出提取 LOCKED 之前的分析部分 */
function extractBeforeLocked(text: string): string {
  const lockedIndex = text.indexOf('[LOCKED')
  if (lockedIndex === -1) {
    // 没有 LOCKED，尝试找 ## 综合评估
    const sections = text.split(/\n## /)
    if (sections.length > 1) {
      return sections[0].replace(/^## 你能想到的\n?/, '').trim()
    }
    return text
  }
  return text.slice(0, lockedIndex).replace(/^## 你能想到的\n?/, '').trim()
}

export default CaseAnalysisPage
