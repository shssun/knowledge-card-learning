import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from '@mui/material'
import {
  CheckCircle as CheckIcon,
  Cancel as WrongIcon,
  EmojiEvents as TrophyIcon,
  Refresh as RetryIcon,
} from '@mui/icons-material'
import { useStudyStore } from '../../store/studyStore'
import { ROUTES } from '../../constants/routes'
import ScoreRadar from '../../components/ui/ScoreRadar'

interface Question {
  id: string
  term: string
  question: string
  options: string[]
  correctIndex: number
}

function FinalAssessment(): JSX.Element {
  const { getCurrentSession } = useStudyStore()
  const navigate = useNavigate()
  const session = getCurrentSession()
  
  const [isStarted, setIsStarted] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<{ questionId: string; selectedIndex: number | null }[]>([])
  const [isComplete, setIsComplete] = useState(false)
  
  // Mock questions based on session cards
  const questions: Question[] = session?.fusionCards.map((card, index) => ({
    id: `q-${index}`,
    term: card.term,
    question: `请简要解释什么是"${card.term}"？`,
    options: [
      `正确理解：${card.personalizedDefinition.slice(0, 50)}...`,
      `错误理解1`,
      `错误理解2`,
      `错误理解3`,
    ],
    correctIndex: 0, // In real app, would be determined by AI grading
  })) || []
  
  const currentQuestion = questions[currentIndex]
  const currentAnswer = answers.find((a) => a.questionId === currentQuestion?.id)
  
  const handleSelect = (index: number): void => {
    const existingIndex = answers.findIndex((a) => a.questionId === currentQuestion.id)
    if (existingIndex >= 0) {
      const newAnswers = [...answers]
      newAnswers[existingIndex].selectedIndex = index
      setAnswers(newAnswers)
    } else {
      setAnswers([...answers, { questionId: currentQuestion.id, selectedIndex: index }])
    }
  }
  
  const handleNext = (): void => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      setIsComplete(true)
    }
  }
  
  const handlePrev = (): void => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    }
  }
  
  const handleRetry = (): void => {
    setIsStarted(false)
    setCurrentIndex(0)
    setAnswers([])
    setIsComplete(false)
  }
  
  const correctCount = answers.filter((a) => {
    const question = questions.find((q) => q.id === a.questionId)
    return question && a.selectedIndex === question.correctIndex
  }).length
  
  const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0
  
  if (questions.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <TrophyIcon sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          暂无测评内容
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          完成学习后可以在这里进行最终测评
        </Typography>
        <Button
          variant="contained"
          sx={{ mt: 3 }}
          onClick={() => navigate(ROUTES.STUDY)}
        >
          去学习
        </Button>
      </Box>
    )
  }
  
  if (!isStarted) {
    return (
      <Card sx={{ maxWidth: 600, mx: 'auto', textAlign: 'center' }}>
        <CardContent sx={{ py: 6 }}>
          <TrophyIcon sx={{ fontSize: 80, color: 'warning.main', mb: 2 }} />
          <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
            最终测评
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            测试你对所学知识的掌握程度
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mb: 4 }}>
            <Box>
              <Typography variant="h5" fontWeight={700}>
                {questions.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                题目数量
              </Typography>
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700}>
                ~{Math.ceil(questions.length * 2)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                预计分钟
              </Typography>
            </Box>
          </Box>
          
          <Button
            variant="contained"
            size="large"
            onClick={() => setIsStarted(true)}
          >
            开始测评
          </Button>
        </CardContent>
      </Card>
    )
  }
  
  if (isComplete) {
    return (
      <Card sx={{ maxWidth: 800, mx: 'auto' }}>
        <CardContent sx={{ py: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <TrophyIcon
              sx={{
                fontSize: 80,
                color: score >= 70 ? 'success.main' : 'warning.main',
                mb: 2,
              }}
            />
            <Typography variant="h4" fontWeight={700}>
              测评完成！
            </Typography>
          </Box>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h2" fontWeight={700} color={score >= 70 ? 'success.main' : 'warning.main'}>
                  {score}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  总分
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                答题详情
              </Typography>
              {questions.map((q, index) => {
                const answer = answers.find((a) => a.questionId === q.id)
                const isCorrect = answer?.selectedIndex === q.correctIndex
                return (
                  <Box
                    key={q.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 1,
                      p: 1,
                      bgcolor: isCorrect ? 'success.50' : 'error.50',
                      borderRadius: 1,
                    }}
                  >
                    {isCorrect ? (
                      <CheckIcon color="success" />
                    ) : (
                      <WrongIcon color="error" />
                    )}
                    <Typography variant="body2">
                      {index + 1}. {q.term}
                    </Typography>
                    <Chip
                      label={isCorrect ? '正确' : '错误'}
                      size="small"
                      color={isCorrect ? 'success' : 'error'}
                      sx={{ ml: 'auto' }}
                    />
                  </Box>
                )
              })}
            </Grid>
          </Grid>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4 }}>
            <Button
              variant="outlined"
              startIcon={<RetryIcon />}
              onClick={handleRetry}
            >
              重新测评
            </Button>
            <Button variant="contained" onClick={() => navigate(ROUTES.ARCHIVE)}>
              查看归档
            </Button>
          </Box>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Box>
      {/* Progress */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          进度 {currentIndex + 1} / {questions.length}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={((currentIndex + 1) / questions.length) * 100}
          sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
        />
      </Box>
      
      {/* Question Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Chip label={`第${currentIndex + 1}题`} sx={{ mb: 2 }} />
          
          <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
            {currentQuestion?.question}
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {currentQuestion?.options.map((option, index) => (
              <Box
                key={index}
                onClick={() => handleSelect(index)}
                sx={{
                  p: 2,
                  border: '2px solid',
                  borderColor: currentAnswer?.selectedIndex === index ? 'primary.main' : 'grey.200',
                  borderRadius: 2,
                  cursor: 'pointer',
                  bgcolor: currentAnswer?.selectedIndex === index ? 'primary.50' : 'transparent',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'primary.50',
                  },
                }}
              >
                <Typography variant="body1">{option}</Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
      
      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button onClick={handlePrev} disabled={currentIndex === 0}>
          上一题
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={currentAnswer === undefined}
        >
          {currentIndex < questions.length - 1 ? '下一题' : '完成测评'}
        </Button>
      </Box>
    </Box>
  )
}

export default FinalAssessment
