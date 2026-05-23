import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  TextField,
  Button,
  Alert,
  Divider,
  CircularProgress,
  Tooltip,
  Badge,
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  ExpandMore as ExpandMoreIcon,
  Star as StarIcon,
  CheckCircle as CheckIcon,
  Lock as LockIcon,
  School as SchoolIcon,
} from '@mui/icons-material'
import { ROUTES } from '../../constants/routes'
import { useScoreStore } from '../../store/scoreStore'
import {
  UserLevel,
  USER_LEVELS,
  LEVEL_COLORS,
  LEVEL_DESCRIPTIONS,
  LEVEL_MAX_SCORES,
  LEVEL_CUMULATIVE_SCORES,
} from '../../types/level.types'
import { useArchiveStore } from '../../store/archiveStore'
import { useEffectiveLevel } from '../../hooks/useEffectiveLevel'

interface LevelContent {
  definition?: string
  boundary?: string
  similarTerms?: string
  examples?: string
  applicationScenario?: string
  misconceptions?: string
  relations?: string
  transferTest?: string
  teachingOutput?: string
}

interface CardWithLevel {
  id: string
  term: string
  fusionCards: Array<{
    id: string
    term: string
    levelContent?: LevelContent
  }>
}

function LevelStudyPage(): JSX.Element {
  const { domain } = useParams<{ domain: string }>()
  const navigate = useNavigate()

  const { totalScore, studyScore, communityScore, streak, getMaxLevel, getCardTotalScore } =
    useScoreStore()

  const effectiveLevel = useEffectiveLevel()

  // 获取该领域的归档记录
  const archiveRecords = useArchiveStore((s) =>
    s.records.filter((r) => r.domain === (domain || ''))
  )

  // 从归档中提取融合卡片
  const fusionCards = useMemo<CardWithLevel[]>(() => {
    return archiveRecords.map((r) => ({
      id: r.id,
      term: r.domain,
      fusionCards: (r.fusionCards || []).map((fc) => ({
        id: fc.id || '',
        term: fc.term,
        levelContent: fc.levelContent,
      })),
    }))
  }, [archiveRecords])

  // 获取所有词汇列表
  const allCards = fusionCards.flatMap((r) => r.fusionCards)

  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [currentLevel, setCurrentLevel] = useState<UserLevel>('小白')
  const [userAnswer, setUserAnswer] = useState('')
  const [answeringCardId, setAnsweringCardId] = useState<string | null>(null)
  const [answerResult, setAnswerResult] = useState<{
    score: number
    feedback: string
  } | null>(null)

  // 统计该领域的完成情况
  const stats = useMemo(() => {
    const total = allCards.length
    const completed = allCards.filter(
      (c) => getMaxLevel(c.id) !== undefined
    ).length
    const score = allCards.reduce((sum, c) => sum + getCardTotalScore(c.id), 0)
    const maxScore = total * 50
    return { total, completed, score, maxScore }
  }, [allCards, getMaxLevel, getCardTotalScore])

  // 获取某卡片某等级的标准内容
  const getLevelDisplayContent = (
    level: UserLevel,
    levelContent?: LevelContent
  ): { label: string; content: string; isQuestion: boolean } | null => {
    if (!levelContent) return null

    switch (level) {
      case '小白':
        return {
          label: '一句话定义',
          content: levelContent.definition || '（尚未生成）',
          isQuestion: false,
        }
      case '初级':
        return {
          label: '边界辨析',
          content: [
            levelContent.boundary ? `【适用范围】${levelContent.boundary}` : '',
            levelContent.similarTerms ? `【近义/反义】${levelContent.similarTerms}` : '',
          ]
            .filter(Boolean)
            .join('\n\n'),
          isQuestion: false,
        }
      case '中级':
        return {
          label: '应用实战',
          content: [
            levelContent.examples ? `【造句示例】${levelContent.examples}` : '',
            levelContent.applicationScenario
              ? `【日常场景】${levelContent.applicationScenario}`
              : '',
          ]
            .filter(Boolean)
            .join('\n\n'),
          isQuestion: false,
        }
      case '高级':
        return {
          label: '深度辨析',
          content: [
            levelContent.misconceptions ? `【误区辨析】${levelContent.misconceptions}` : '',
            levelContent.relations ? `【概念关联】${levelContent.relations}` : '',
          ]
            .filter(Boolean)
            .join('\n\n'),
          isQuestion: false,
        }
      case '大师':
        return {
          label: '举一反三',
          content: levelContent.transferTest
            ? `【测试题】${levelContent.transferTest}`
            : '（大师内容待解锁）',
          isQuestion: !!levelContent.transferTest,
        }
    }
  }

  // 提交答案（大师等级）
  const handleSubmitAnswer = (cardId: string) => {
    if (!userAnswer.trim()) return

    // Demo 模式：随机 7-8 分
    const score = Math.random() > 0.5 ? 8 : 7
    const feedback =
      score >= 8
        ? '理解准确，表达清晰'
        : '基本理解正确，可进一步完善'

    setAnswerResult({ score, feedback })
    setAnsweringCardId(null)

    // 调用 scoreStore 记录
    const { completeLevel } = useScoreStore.getState()
    completeLevel(cardId, '', '大师', score, feedback)
  }

  if (!domain) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">领域参数缺失</Alert>
      </Box>
    )
  }

  // 等级门禁：小白阶段需先完成元概念基础学习
  if (effectiveLevel.level === '小白') {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', p: { xs: 3, md: 6 } }}>
        <Paper
          sx={{
            p: 4,
            borderRadius: 3,
            textAlign: 'center',
            bgcolor: 'grey.50',
          }}
        >
          <LockIcon sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
          <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
            暂未解锁
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            领域学习需要先打好元概念基础。
            <br />
            当前等级：<strong>{effectiveLevel.level}</strong>（已掌握 {effectiveLevel.totalLearned}/{effectiveLevel.totalConcepts} 个元概念）
          </Typography>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              核心层（L1+L2）进度：{effectiveLevel.currentLearned}/{effectiveLevel.currentTotal}
              （需≥{Math.ceil(effectiveLevel.currentTotal * 0.8)} 个 → {effectiveLevel.remainingToAdvance > 0 ? `还差${effectiveLevel.remainingToAdvance}个` : '已达升级门槛'})
            </Typography>
            <LinearProgress
              variant="determinate"
              value={effectiveLevel.currentPercent}
              sx={{ height: 8, borderRadius: 4, mt: 1 }}
              color="warning"
            />
          </Box>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate(ROUTES.META_CONCEPTS)}
            startIcon={<SchoolIcon />}
          >
            去元概念学习
          </Button>
        </Paper>
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: { xs: 2, md: 4 } }}>
      {/* 顶部导航 */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" fontWeight={700}>
          {domain} · 分级学习
        </Typography>
      </Box>

      {/* 积分总览 */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          学习进度
        </Typography>
        <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="caption" color="text.secondary">总分</Typography>
            <Typography variant="h4" fontWeight={700} color="primary">
              {totalScore}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">学习力</Typography>
            <Typography variant="h6" fontWeight={600}>{studyScore}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">社区力</Typography>
            <Typography variant="h6" fontWeight={600}>{communityScore}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">连续打卡</Typography>
            <Typography variant="h6" fontWeight={600}>
              {streak} 天
            </Typography>
          </Box>
        </Box>

        {/* 领域进度条 */}
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              已学 {stats.completed}/{stats.total} 词
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {stats.score}/{stats.maxScore} 分
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={stats.maxScore > 0 ? (stats.score / stats.maxScore) * 100 : 0}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
      </Paper>

      {/* 等级切换器 */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
        {USER_LEVELS.map((level) => {
          const color = LEVEL_COLORS[level]
          const isActive = currentLevel === level
          return (
            <Chip
              key={level}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {isActive && <StarIcon sx={{ fontSize: 14, color }} />}
                  {level}（{LEVEL_MAX_SCORES[level]}分）
                </Box>
              }
              onClick={() => setCurrentLevel(level)}
              sx={{
                bgcolor: isActive ? `${color}22` : 'transparent',
                border: `1.5px solid ${isActive ? color : 'divider'}`,
                color: isActive ? color : 'text.secondary',
                fontWeight: isActive ? 700 : 400,
                cursor: 'pointer',
              }}
            />
          )
        })}
      </Box>

      {/* 等级说明 */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: 'action.hover' }}>
        <Typography variant="body2" color="text.secondary">
          <strong>当前：{currentLevel}</strong>
          {' —— '}
          {LEVEL_DESCRIPTIONS[currentLevel]}
          {'（满分 '}
          {LEVEL_MAX_SCORES[currentLevel]}
          {' 分，真实质量给分，7-8 分区间）'}
        </Typography>
      </Paper>

      {/* 词汇卡片列表 */}
      {allCards.length === 0 ? (
        <Alert severity="info">
          该领域暂无学习记录，请先在「学习中心」完成研习流程
        </Alert>
      ) : (
        allCards.map((card) => {
          const maxLevel = getMaxLevel(card.id)
          const cardScore = getCardTotalScore(card.id)
          const displayContent = getLevelDisplayContent(
            currentLevel,
            card.levelContent
          )
          const isExpanded = expandedCard === card.id

          return (
            <Paper
              key={card.id}
              sx={{ mb: 2, borderRadius: 3, overflow: 'hidden' }}
            >
              {/* 卡片头部 */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 2,
                  cursor: 'pointer',
                  bgcolor: isExpanded ? 'action.hover' : 'transparent',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
                onClick={() =>
                  setExpandedCard(isExpanded ? null : card.id)
                }
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {card.term}
                  </Typography>
                  {maxLevel && (
                    <Chip
                      label={maxLevel}
                      size="small"
                      sx={{
                        bgcolor: `${LEVEL_COLORS[maxLevel]}22`,
                        color: LEVEL_COLORS[maxLevel],
                        fontWeight: 600,
                      }}
                    />
                  )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {cardScore > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      {cardScore}分
                    </Typography>
                  )}
                  <ExpandMoreIcon
                    sx={{
                      transform: isExpanded ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s',
                    }}
                  />
                </Box>
              </Box>

              {/* 展开内容 */}
              {isExpanded && displayContent && (
                <Box sx={{ px: 2, pb: 2 }}>
                  <Divider sx={{ mb: 2 }} />

                  {/* 五级内容展示 */}
                  {USER_LEVELS.map((lvl) => {
                    const content = getLevelDisplayContent(lvl, card.levelContent)
                    if (!content) return null
                    const isCurrent = lvl === currentLevel
                    const isUnlocked =
                      USER_LEVELS.indexOf(lvl) <=
                      USER_LEVELS.indexOf(maxLevel || '小白')

                    return (
                      <Box
                        key={lvl}
                        sx={{
                          mb: 1.5,
                          opacity: isUnlocked ? 1 : 0.4,
                          pl: isCurrent ? 2 : 0,
                          borderLeft: isCurrent
                            ? `3px solid ${LEVEL_COLORS[lvl]}`
                            : '3px solid transparent',
                        }}
                      >
                        <Typography
                          variant="caption"
                          fontWeight={600}
                          sx={{ color: LEVEL_COLORS[lvl] }}
                        >
                          {lvl} · {content.label}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            whiteSpace: 'pre-wrap',
                            fontSize: 13,
                            color: isUnlocked ? 'text.primary' : 'text.disabled',
                          }}
                        >
                          {isUnlocked ? content.content : '（尚未解锁）'}
                        </Typography>
                      </Box>
                    )
                  })}

                  {/* 答题区域（大师等级） */}
                  {currentLevel === '大师' &&
                    card.levelContent?.transferTest && (
                      <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          请作答：
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {card.levelContent.transferTest}
                        </Typography>
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          placeholder="在这里写下你的答案..."
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(e.target.value)}
                          sx={{ mb: 1 }}
                        />
                        {answerResult && (
                          <Alert
                            severity={answerResult.score >= 8 ? 'success' : 'info'}
                            sx={{ mb: 1 }}
                          >
                            得分：{answerResult.score}/10 — {answerResult.feedback}
                          </Alert>
                        )}
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleSubmitAnswer(card.id)}
                          disabled={!userAnswer.trim() || !!answerResult}
                        >
                          提交答案
                        </Button>
                      </Box>
                    )}
                </Box>
              )}
            </Paper>
          )
        })
      )}
    </Box>
  )
}

export default LevelStudyPage
