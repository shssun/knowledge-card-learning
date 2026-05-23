import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  LinearProgress,
  Alert,
  Paper,
  Divider,
} from '@mui/material'
import {
  CheckCircle as CorrectIcon,
  Cancel as WrongIcon,
  Quiz as QuizIcon,
  Refresh as RetryIcon,
  Home as HomeIcon,
  Lightbulb as HintIcon,
} from '@mui/icons-material'
import { useReviewStore } from '../../store/reviewStore'
import { useStudyStore } from '../../store/studyStore'
import { useArchiveStore } from '../../store/archiveStore'
import { ReviewMode } from '../../types/review.types'
import { ROUTES } from '../../constants/routes'
import { useIsMobile } from '../../hooks/useIsMobile'

type QuestionType = 'definition' | 'boundary' | 'example' | 'deepLogic'

interface QuizItem {
  type: QuestionType
  question: string
  correctAnswer: string
  hint: string
}

function generateQuizzes(fusionCard: {
  term: string
  personalizedDefinition: string
  refinedBoundary: string
  practicalCases: string
  deepLogic: string
}): QuizItem[] {
  const quizzes: QuizItem[] = []
  const { term, personalizedDefinition, refinedBoundary, practicalCases, deepLogic } = fusionCard

  if (personalizedDefinition) {
    quizzes.push({
      type: 'definition',
      question: `用你自己的话解释「${term}」的核心定义`,
      correctAnswer: personalizedDefinition,
      hint: '思考这个概念的本质特征是什么',
    })
  }

  if (refinedBoundary) {
    quizzes.push({
      type: 'boundary',
      question: `「${term}」适合在什么场景下使用？什么场景下不适用？`,
      correctAnswer: refinedBoundary,
      hint: '思考这个概念的适用边界和限制条件',
    })
  }

  if (practicalCases) {
    quizzes.push({
      type: 'example',
      question: `举一个「${term}」的实际应用案例`,
      correctAnswer: practicalCases,
      hint: '想想生活或工作中可以用到这个概念的地方',
    })
  }

  if (deepLogic) {
    quizzes.push({
      type: 'deepLogic',
      question: `「${term}」的底层原理是什么？为什么它有效？`,
      correctAnswer: deepLogic,
      hint: '不仅仅是知道怎么用，更要理解为什么',
    })
  }

  // 如果内容太少，至少有个定义题
  if (quizzes.length === 0) {
    quizzes.push({
      type: 'definition',
      question: `请解释「${term}」`,
      correctAnswer: term,
      hint: '回忆你学过的内容',
    })
  }

  return quizzes
}

function ReciteMode(): JSX.Element {
  const { tasks, completeTask } = useReviewStore()
  const sessions = useStudyStore((s) => s.sessions)
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [userInput, setUserInput] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [results, setResults] = useState<{ correct: boolean }[]>([])
  const [isComplete, setIsComplete] = useState(false)

  // 从已完成session的fusionCard构建测验列表
  const quizzes = useMemo(() => {
    const list: QuizItem[] = []
    const reciteTasks = tasks.filter((t) => !t.isCompleted && t.mode === ReviewMode.RECITE_MODE)

    for (const task of reciteTasks) {
      let fusionCard: any = undefined
      // 先从 sessions 查找
      for (const session of sessions) {
        fusionCard = session.fusionCards.find((c) => c.id === task.cardId)
        if (fusionCard) break
      }
      // 回退：从 archiveStore 查找
      if (!fusionCard) {
        const records = useArchiveStore.getState().records
        for (const record of records) {
          if (!record.fusionCards) continue
          fusionCard = record.fusionCards.find((c: any) => c.id === task.cardId)
          if (fusionCard) break
        }
      }
      if (fusionCard) {
        list.push(...generateQuizzes(fusionCard))
      }
    }

    return list
  }, [tasks, sessions])

  const currentQuiz = quizzes[currentIndex]

  const handleSubmit = (): void => {
    if (!currentQuiz) return
    setShowResult(true)
  }

  const handleSelfAssess = (correct: boolean): void => {
    setResults([...results, { correct }])

    if (currentIndex < quizzes.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setUserInput('')
      setShowResult(false)
    } else {
      setIsComplete(true)
    }
  }

  const handleReset = (): void => {
    setCurrentIndex(0)
    setUserInput('')
    setShowResult(false)
    setResults([])
    setIsComplete(false)
  }

  if (quizzes.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <QuizIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
          暂无测验题目
        </Typography>
        <Typography variant="body2" color="text.secondary">
          完成研习并生成融合卡片后，AI 会自动生成测验题
        </Typography>
        <Button variant="outlined" startIcon={<HomeIcon />} onClick={() => navigate(ROUTES.STUDY)} sx={{ mt: 2 }}>
          去学习
        </Button>
      </Box>
    )
  }

  if (isComplete) {
    const correctCount = results.filter((r) => r.correct).length
    const accuracy = Math.round((correctCount / results.length) * 100)

    return (
      <Dialog open maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
          <Typography variant="h5" fontWeight={700}>测验完成</Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="h2" fontWeight={700} color={accuracy >= 80 ? 'success.main' : accuracy >= 60 ? 'warning.main' : 'error.main'}>
              {accuracy}%
            </Typography>
            <Typography variant="body1" color="text.secondary">自我评估正确率</Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mt: 3 }}>
              <Box>
                <Typography variant="h4" fontWeight={700} color="success.main">{correctCount}</Typography>
                <Typography variant="caption" color="text.secondary">掌握</Typography>
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={700} color="error.main">{results.length - correctCount}</Typography>
                <Typography variant="caption" color="text.secondary">需巩固</Typography>
              </Box>
            </Box>

            {results.length - correctCount > 0 && (
              <Alert severity="info" sx={{ mt: 3, textAlign: 'left' }}>
                答不上的题建议回到研习流程中重新学习。懂了就是懂了，不懂就是不懂——死磕到底。
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
      {/* 进度 */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Chip label={`${currentIndex + 1} / ${quizzes.length}`} size="small" />
        <Typography variant="body2" color="text.secondary">
          答题进度
        </Typography>
        <LinearProgress
          variant="determinate"
          value={((currentIndex + 1) / quizzes.length) * 100}
          sx={{ flexGrow: 1, height: 6, borderRadius: 4 }}
        />
      </Box>

      {/* 答题卡 */}
      <Card sx={{ mb: 2, minHeight: { xs: 280, md: 340 } }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Chip
              label={currentQuiz.type === 'definition' ? '定义题' : currentQuiz.type === 'boundary' ? '边界题' : currentQuiz.type === 'example' ? '案例题' : '深层题'}
              color={currentQuiz.type === 'definition' ? 'primary' : currentQuiz.type === 'boundary' ? 'warning' : currentQuiz.type === 'example' ? 'success' : 'secondary'}
              size="small"
            />
            <Chip label="自测模式" size="small" variant="outlined" />
          </Box>

          <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
            {currentQuiz?.question}
          </Typography>

          {!showResult ? (
            /* 输入答题阶段 */
            <Box>
              <TextField
                fullWidth
                multiline
                rows={isMobile ? 3 : 4}
                placeholder="在这里写下你的答案..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  <HintIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                  {currentQuiz?.hint}
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={!userInput.trim()}
                >
                  提交对比
                </Button>
              </Box>
            </Box>
          ) : (
            /* 对比答案阶段 */
            <Box>
              <Divider sx={{ mb: 2 }} />
              
              {/* 你的答案 */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  你的答案
                </Typography>
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body2">{userInput}</Typography>
                </Paper>
              </Box>

              {/* 标准答案 */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  参考答案
                </Typography>
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: 'primary.50' }}>
                  <Typography variant="body2">{currentQuiz?.correctAnswer}</Typography>
                </Paper>
              </Box>

              <Divider sx={{ mb: 2 }} />
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, textAlign: 'center' }}>
                对比后，你的答案与参考一致吗？
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="outlined"
                  color="error"
                  size="large"
                  startIcon={<WrongIcon />}
                  onClick={() => handleSelfAssess(false)}
                  sx={{ minWidth: { xs: '45%', sm: 140 } }}
                >
                  有差距
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  size="large"
                  startIcon={<CorrectIcon />}
                  onClick={() => handleSelfAssess(true)}
                  sx={{ minWidth: { xs: '45%', sm: 140 } }}
                >
                  基本一致
                </Button>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* 本轮答题统计 */}
      {results.length > 0 && (
        <Alert severity="info" sx={{ mb: 1, py: 0.5 }}>
          已答 {results.length} 题，自评正确率 {Math.round((results.filter(r => r.correct).length / results.length) * 100)}%
        </Alert>
      )}
    </Box>
  )
}

export default ReciteMode
