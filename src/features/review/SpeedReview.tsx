import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Alert,
  Divider,
  Paper,
} from '@mui/material'
import {
  CheckCircle as CorrectIcon,
  Cancel as WrongIcon,
  Lightbulb as HintIcon,
  Refresh as RetryIcon,
  Home as HomeIcon,
} from '@mui/icons-material'
import { useReviewStore } from '../../store/reviewStore'
import { useStudyStore } from '../../store/studyStore'
import { useArchiveStore } from '../../store/archiveStore'
import { ReviewMode } from '../../types/review.types'
import { ROUTES } from '../../constants/routes'
import { useIsMobile } from '../../hooks/useIsMobile'

interface ReviewCardContent {
  term: string
  cardId: string
  definition: string
  boundary: string
  caseExample: string
  deepLogic: string
}

function SpeedReview(): JSX.Element {
  const { tasks, completeTask, snoozeTask } = useReviewStore()
  const sessions = useStudyStore((s) => s.sessions)
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [revealStage, setRevealStage] = useState(0) // 0=term, 1=definition, 2=deepDive
  const [results, setResults] = useState<{ cardId: string; correct: boolean }[]>([])
  const [isComplete, setIsComplete] = useState(false)

  // 获取带真实卡片内容的复习项
  const reviewCards: ReviewCardContent[] = useMemo(() => {
    const pendingTasks = tasks.filter((t) => !t.isCompleted && t.mode === ReviewMode.SPEED_REVIEW)
    
    return pendingTasks.map((task) => {
      // 从 studyStore 的 sessions 中查找 FusionCard
      let definition = ''
      let boundary = ''
      let caseExample = ''
      let deepLogic = ''

      for (const session of sessions) {
        const fusionCard = session.fusionCards.find((c) => c.id === task.cardId)
        if (fusionCard) {
          definition = fusionCard.personalizedDefinition || ''
          boundary = fusionCard.refinedBoundary || ''
          caseExample = fusionCard.practicalCases || ''
          deepLogic = fusionCard.deepLogic || ''
          break
        }
      }

      // 回退：从 archiveStore 查找（防止 sessions 被清除）
      if (!definition) {
        const records = useArchiveStore.getState().records
        for (const record of records) {
          if (!record.fusionCards) continue
          const fc = record.fusionCards.find((c: any) => c.id === task.cardId)
          if (fc) {
            definition = fc.personalizedDefinition || ''
            boundary = fc.refinedBoundary || ''
            caseExample = fc.practicalCases || ''
            deepLogic = fc.deepLogic || ''
            break
          }
        }
      }

      return {
        term: task.term,
        cardId: task.id,
        definition: definition || '（暂无定义内容，请重新研习此概念）',
        boundary,
        caseExample,
        deepLogic,
      }
    })
  }, [tasks, sessions])

  const currentCard = reviewCards[currentIndex]

  const handleReveal = () => {
    setShowAnswer(true)
    setRevealStage(1)
  }

  const handleDeeper = () => {
    setRevealStage(2)
  }

  const handleAnswer = (correct: boolean): void => {
    if (!currentCard) return

    setResults([...results, { cardId: currentCard.cardId, correct }])

    if (correct) {
      completeTask(currentCard.cardId)
    } else {
      snoozeTask(currentCard.cardId, 1)
    }

    if (currentIndex < reviewCards.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setShowAnswer(false)
      setRevealStage(0)
    } else {
      setIsComplete(true)
    }
  }

  const handleReset = (): void => {
    setCurrentIndex(0)
    setShowAnswer(false)
    setRevealStage(0)
    setResults([])
    setIsComplete(false)
  }

  if (reviewCards.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
          暂无快速复习任务
        </Typography>
        <Typography variant="body2" color="text.secondary">
          完成学习后，系统会自动安排间隔重复复习
        </Typography>
        <Button
          variant="outlined"
          startIcon={<HomeIcon />}
          onClick={() => navigate(ROUTES.STUDY)}
          sx={{ mt: 2 }}
        >
          去学习
        </Button>
      </Box>
    )
  }

  if (isComplete) {
    const correctCount = results.filter((r) => r.correct).length
    const accuracy = reviewCards.length > 0
      ? Math.round((correctCount / results.length) * 100)
      : 0

    return (
      <Dialog open maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
          <Typography variant="h5" fontWeight={700}>本轮复习完成</Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="h2" fontWeight={700} color={accuracy >= 80 ? 'success.main' : accuracy >= 60 ? 'warning.main' : 'error.main'}>
              {accuracy}%
            </Typography>
            <Typography variant="body1" color="text.secondary">正确率</Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mt: 3 }}>
              <Box>
                <Typography variant="h4" fontWeight={700} color="success.main">{correctCount}</Typography>
                <Typography variant="caption" color="text.secondary">记住</Typography>
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={700} color="error.main">{results.length - correctCount}</Typography>
                <Typography variant="caption" color="text.secondary">需复习</Typography>
              </Box>
            </Box>

            {accuracy < 80 && (
              <Alert severity="info" sx={{ mt: 3, textAlign: 'left' }}>
                答错的卡片会在明天自动进入复习队列。死磕就是反复打磨，直到真的记住。
              </Alert>
            )}
            {accuracy >= 80 && (
              <Alert severity="success" sx={{ mt: 3, textAlign: 'left' }}>
                大部分记住了，这些概念正在变成你的砖石。
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'center', gap: 2 }}>
          <Button startIcon={<RetryIcon />} onClick={handleReset}>再来一轮</Button>
          <Button variant="contained" onClick={() => navigate(ROUTES.REVIEW)}>返回复习中心</Button>
        </DialogActions>
      </Dialog>
    )
  }

  return (
    <Box>
      {/* 进度 + 统计 */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80 }}>
          进度 {currentIndex + 1} / {reviewCards.length}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={((currentIndex + 1) / reviewCards.length) * 100}
          sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
        />
      </Box>

      {results.length > 0 && (
        <Alert severity="info" sx={{ mb: 2, py: 0.5 }}>
          本轮正确率 {Math.round((results.filter(r => r.correct).length / results.length) * 100)}%
          （{results.filter(r => r.correct).length}/{results.length}）
        </Alert>
      )}

      {/* 主卡片 */}
      <Card sx={{ mb: 2, minHeight: { xs: 300, md: 360 } }}>
        <CardContent sx={{ p: 3 }}>
          {/* 阶段标签 */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Chip
              label={revealStage === 0 ? '回忆阶段' : revealStage === 1 ? '验证阶段' : '深度阶段'}
              color={revealStage === 0 ? 'warning' : revealStage === 1 ? 'info' : 'success'}
              size="small"
            />
            <Chip label="快速复习" size="small" variant="outlined" />
          </Box>

          {/* 术语名称 */}
          <Typography
            variant={isMobile ? 'h5' : 'h4'}
            fontWeight={700}
            sx={{ mb: 3, textAlign: 'center', py: 1 }}
          >
            {currentCard?.term}
          </Typography>

          <Divider sx={{ mb: 2 }} />

          {/* 答案内容 - 分阶段展示 */}
          {!showAnswer ? (
            /* 阶段0：只显示术语，用户自行回忆 */
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                在心里默念这个概念的准确定义，准备好了再点下方按钮
              </Typography>
              <Box sx={{ bgcolor: 'grey.50', borderRadius: 2, p: 2, mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  提示：思考这个概念的本质是什么、适用范围、以及能否举一个例子
                </Typography>
              </Box>
              <Button
                variant="contained"
                size="large"
                onClick={handleReveal}
                startIcon={<HintIcon />}
              >
                显示定义，验证回忆
              </Button>
            </Box>
          ) : (
            <Box>
              {/* 阶段1：显示核心定义 */}
              {revealStage >= 1 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom fontWeight={600}>
                    核心理念
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: 'primary.50' }}>
                    <Typography variant="body1">
                      {currentCard?.definition}
                    </Typography>
                  </Paper>
                </Box>
              )}

              {/* 阶段1 + 2的边界和案例 */}
              {revealStage >= 1 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    适用范围
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {currentCard?.boundary || '（暂无边界描述）'}
                  </Typography>
                </Box>
              )}

              {/* 阶段2：深度内容 */}
              {revealStage >= 2 && (
                <>
                  {currentCard?.caseExample && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        案例
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {currentCard.caseExample}
                      </Typography>
                    </Box>
                  )}
                  {currentCard?.deepLogic && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        深层逻辑
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {currentCard.deepLogic}
                      </Typography>
                    </Box>
                  )}
                </>
              )}

              {/* 未展开深度内容时显示按钮 */}
              {revealStage === 1 && (currentCard?.caseExample || currentCard?.deepLogic) && (
                <Button
                  size="small"
                  onClick={handleDeeper}
                  sx={{ mb: 2 }}
                >
                  查看更多（案例 + 深层逻辑） →
                </Button>
              )}

              <Divider sx={{ my: 2 }} />

              {/* 自评按钮 */}
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  对比后，你觉得自己掌握得怎么样？
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexDirection: { xs: 'column', sm: 'row' } }}>
                  <Button
                    variant="outlined"
                    color="error"
                    size="large"
                    startIcon={<WrongIcon />}
                    onClick={() => handleAnswer(false)}
                    sx={{ minWidth: { xs: '100%', sm: 140 } }}
                  >
                    有偏差，需复习
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    size="large"
                    startIcon={<CorrectIcon />}
                    onClick={() => handleAnswer(true)}
                    sx={{ minWidth: { xs: '100%', sm: 140 } }}
                  >
                    准确，记住了
                  </Button>
                </Box>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* 本轮进展 */}
      {results.length > 0 && (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', flexWrap: 'wrap' }}>
          {results.map((r, i) => (
            <Chip
              key={i}
              size="small"
              icon={r.correct ? <CorrectIcon /> : <WrongIcon />}
              label={r.correct ? '对' : '错'}
              color={r.correct ? 'success' : 'error'}
              variant="outlined"
            />
          ))}
        </Box>
      )}
    </Box>
  )
}

export default SpeedReview
