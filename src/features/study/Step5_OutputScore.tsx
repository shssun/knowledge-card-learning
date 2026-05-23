import { useState, useRef, useEffect, useMemo } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  Grid,
  LinearProgress,
  IconButton,
  Tooltip,
  InputAdornment,
  Chip,
} from '@mui/material'
import {
  CheckCircle as CheckIcon,
  TrendingUp as TrendIcon,
  Edit as EditIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
} from '@mui/icons-material'
import { useStudyStore } from '../../store/studyStore'
import { useScoreStore } from '../../store/scoreStore'
import { useArchiveStore } from '../../store/archiveStore'
import { useMaterialStore } from '../../store/materialStore'
import { useReviewStore } from '../../store/reviewStore'
import { ReviewMode } from '../../types/review.types'
import { OutputType } from '../../types/study.types'
import { scoreUserOutput, estimateScore } from '../../services/scoringService'
import { hasApiKey } from '../../services/openai'
import ScoreRadar from '../../components/ui/ScoreRadar'
import { v4 as uuidv4 } from 'uuid'

interface Step5Props {
  onFinish: () => void
  onBack: () => void
}

function Step5_OutputScore({ onFinish, onBack }: Step5Props): JSX.Element {
  const { getCurrentSession, addOutputRecord, completeSession } = useStudyStore()
  const session = getCurrentSession()
  
  const [userOutput, setUserOutput] = useState('')
  const [isScoring, setIsScoring] = useState(false)
  const [scoreResult, setScoreResult] = useState<{
    totalScore: number
    definitionAccuracy: number
    boundaryClarity: number
    caseCompleteness: number
    misconceptionAwareness: number
    annotations: { dimension: string; issue: string; suggestion: string }[]
  } | null>(null)
  const [completedOutputs, setCompletedOutputs] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  
  // 语音输入
  const recognitionRef = useRef<any>(null)
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(true)

  useEffect(() => {
    // 初始化语音识别（Web Speech API）
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      setSpeechSupported(false)
      return
    }
    const rec = new SR()
    rec.lang = 'zh-CN'
    rec.interimResults = true
    rec.continuous = true

    rec.onresult = (event: any) => {
      let transcript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      setUserOutput((prev) => prev + transcript)
    }
    rec.onerror = () => {
      setIsListening(false)
    }
    rec.onend = () => {
      setIsListening(false)
    }
    recognitionRef.current = rec

    return () => {
      rec.abort()
    }
  }, [])

  const toggleVoiceInput = () => {
    const rec = recognitionRef.current
    if (!rec) return
    if (isListening) {
      rec.stop()
      setIsListening(false)
    } else {
      setUserOutput('')
      rec.start()
      setIsListening(true)
    }
  }
  const apiKeyAvailable = hasApiKey()
  const currentFusionCard = session?.fusionCards[0]
  // 当前术语的历史评分趋势
  const scoreHistory = useScoreStore((s) =>
    currentFusionCard ? s.getHistoryForTerm(currentFusionCard.term) : []
  )
  const recordScore = useScoreStore((s) => s.recordScore)
  
  const handleSubmit = async (): Promise<void> => {
    if (!userOutput.trim() || !session || !currentFusionCard) return
    
    setIsScoring(true)
    setError(null)
    
    try {
      let result
      
      if (!apiKeyAvailable) {
        // Demo mode - use estimation
        result = estimateScore(userOutput, currentFusionCard)
      } else {
        const apiResult = await scoreUserOutput(currentFusionCard, userOutput)
        if (apiResult.success && apiResult.scoreResult) {
          result = apiResult.scoreResult
        } else {
          setError(apiResult.error || '评分失败')
          setIsScoring(false)
          return
        }
      }
      
      setScoreResult(result)
      
      // Add output record
      addOutputRecord(session.id, {
        cardId: currentFusionCard.id,
        userOutput,
        outputType: OutputType.TEXT,
        scoreResult: result,
      })

      // 记录分数历史（用于进步曲线）
      recordScore(
        currentFusionCard.id,
        currentFusionCard.term,
        result.totalScore,
        'output'
      )
      
      setCompletedOutputs((prev) => new Set([...prev, currentFusionCard.id]))
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生错误')
    } finally {
      setIsScoring(false)
    }
  }
  
  const handleNext = (): void => {
    if (session) {
      // Build archive record before completing session
      const scores = session.outputRecords
        .map((r) => r.scoreResult?.totalScore ?? 0)
        .filter((s) => s > 0)
      const averageScore = scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 0

      // 构建友好的标题和领域
      const cardTerms = session.fusionCards.map((c) => c.term)
      const resolved = useMaterialStore.getState().getMaterialOrBank(session.materialId)
      const friendlyTitle =
        resolved?.type === 'material'
          ? (resolved.data as any).title
          : resolved?.type === 'bank'
          ? (resolved.data as any).name
          : cardTerms.length > 0
          ? `${cardTerms[0]}${cardTerms.length > 1 ? ` 等${cardTerms.length}个术语` : ''}`
          : '未命名学习'
      const domain =
        resolved?.type === 'material'
          ? (resolved.data as any).category
          : 'AI基础'

      useArchiveStore.getState().addRecord({
        studySessionId: session.id,
        title: friendlyTitle,
        terms: cardTerms,
        averageScore,
        domain,
        studiedAt: new Date().toISOString(),
        fusionCards: session.fusionCards,
      })

      // 创建艾宾浩斯复习任务
      const reviewStore = useReviewStore.getState()
      session.fusionCards.forEach((card) => {
        reviewStore.scheduleReview(card.id, card.term, ReviewMode.SPEED_REVIEW)
      })

      completeSession(session.id)
    }
    onFinish()
  }
  
  if (!currentFusionCard) {
    return (
      <Box>
        <Alert severity="warning">没有可输出的融合卡片</Alert>
      </Box>
    )
  }
  
  const isCompleted = completedOutputs.has(currentFusionCard.id)
  
  return (
    <Box>
      <Typography variant="h5" fontWeight={600} sx={{ mb: 1 }}>
        输出理解
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        用自己的话复述"{currentFusionCard.term}"，获得 AI 评分和建议
      </Typography>
      
      {!apiKeyAvailable && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          系统会根据你的输出内容进行评估。配置 AI 接口后可获得更精准的分析。
        </Typography>
      )}
      
      <Grid container spacing={3}>
        {/* Left - Input */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                {isCompleted ? '已提交输出' : '你的理解'}
              </Typography>
              
              {!speechSupported && (
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  当前浏览器不支持语音输入，请手动输入
                </Typography>
              )}

              <TextField
                fullWidth
                multiline
                rows={6}
                placeholder={`请用你自己的话解释"${currentFusionCard.term}"...\n\n建议包括：\n1. 你是如何理解这个概念的\n2. 你能举出一个实际应用的例子吗\n3. 你觉得使用这个概念时需要注意什么`}
                value={userOutput}
                onChange={(e) => setUserOutput(e.target.value)}
                disabled={isCompleted}
                InputProps={{
                  endAdornment: speechSupported ? (
                    <InputAdornment position="end">
                      <Tooltip title={isListening ? '点击停止录音' : '点击开始语音输入'}>
                        <IconButton
                          onClick={toggleVoiceInput}
                          size="small"
                          color={isListening ? 'secondary' : 'default'}
                        >
                          {isListening ? <MicOffIcon /> : <MicIcon />}
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  ) : undefined,
                }}
              />
              
              {!isCompleted && (
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={!userOutput.trim() || isScoring}
                    startIcon={<EditIcon />}
                  >
                    {isScoring ? '评分中...' : '提交评分'}
                  </Button>
                </Box>
              )}
              
              {error && (
                <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Right - Score */}
        <Grid item xs={12} md={6}>
          {scoreResult ? (
            <ScoreRadar
              scoreResult={{
                ...scoreResult,
                totalScore: Math.round(scoreResult.totalScore),
              }}
            />
          ) : (
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'grey.50',
              }}
            >
              <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
                <Typography variant="body2">
                  提交你的理解后查看评分结果
                </Typography>
              </Box>
            </Card>
          )}
          
          {scoreResult && scoreResult.annotations.length > 0 && (
            <Card sx={{ mt: 2, bgcolor: 'warning.50' }}>
              <CardContent>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                  改进建议
                </Typography>
                {scoreResult.annotations.map((ann, index) => (
                  <Box key={index} sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      {ann.dimension}
                    </Typography>
                    <Typography variant="body2">{ann.suggestion}</Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}

          {/* 进步趋势 mini 展示 */}
          {scoreHistory.length >= 2 && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                  <TrendIcon fontSize="small" color="primary" />
                  <Typography variant="subtitle2" fontWeight={600}>
                    进步趋势
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {scoreHistory.slice(-5).map((entry, i) => {
                    const prev = i > 0 ? scoreHistory.slice(-5)[i - 1] : null
                    const improved = prev ? entry.score > prev.score : false
                    const declined = prev ? entry.score < prev.score : false
                    return (
                      <Chip
                        key={entry.id}
                        size="small"
                        label={`${new Date(entry.createdAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })} ${entry.score}分`}
                        color={improved ? 'success' : declined ? 'error' : 'default'}
                        variant="outlined"
                      />
                    )
                  })}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  近 5 次评分变化
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
      
      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button
          variant="outlined"
          onClick={onBack}
          color="inherit"
        >
          上一步
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={handleNext}
          endIcon={<CheckIcon />}
        >
          完成学习
        </Button>
      </Box>
    </Box>
  )
}

export default Step5_OutputScore
