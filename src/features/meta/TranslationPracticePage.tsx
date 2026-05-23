import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Card,
  CardContent,
  Badge,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import {
  Send as SendIcon,
  Refresh as RefreshIcon,
  ContentCopy as CopyIcon,
  Translate as TranslateIcon,
  CheckCircle as CheckIcon,
  EmojiEvents as TrophyIcon,
  BubbleChart as BubbleChartIcon,
} from '@mui/icons-material'
import {
  translateConcept,
  parseTranslationResult,
  type TranslationOutput,
} from '../../services/deconstructor'
import { usePersonalVaultStore } from '../../store/personalVaultStore'

const PRESET_CONCEPTS = [
  '内卷', '躺平', '自律', '焦虑',
  '情商', '格局', '认知升级', '降维打击',
  '长期主义', '信息茧房', '延迟满足', '心流',
  '社交资本', '边际效用', '黑天鹅',
]

export default function TranslationPracticePage(): JSX.Element {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [searchParams] = useSearchParams()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamText, setStreamText] = useState('')
  const [result, setResult] = useState<TranslationOutput | null>(null)
  const [showRaw, setShowRaw] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [completed, setCompleted] = useState<number>(() => {
    try {
      return JSON.parse(localStorage.getItem('zhika-translations') || '[]').length
    } catch {
      return 0
    }
  })
  const [fromMetaConcept, setFromMetaConcept] = useState<string | null>(
    () => searchParams.get('from') || null
  )
  const resultRef = useRef<HTMLDivElement>(null)
  const addVaultEntry = usePersonalVaultStore((s) => s.addEntry)

  // 从元概念学习页跳转来时，自动提示并聚焦翻译练习
  useEffect(() => {
    if (fromMetaConcept) {
      setInput(`用「${fromMetaConcept}」这个概念翻译: `)
    }
  }, [fromMetaConcept])

  useEffect(() => {
    if (!loading && streamText) {
      const parsed = parseTranslationResult(streamText)
      setResult(parsed)
    }
  }, [loading, streamText])

  useEffect(() => {
    if (resultRef.current) {
      resultRef.current.scrollTop = resultRef.current.scrollHeight
    }
  }, [streamText])

  const handleTranslate = async () => {
    if (!input.trim() || loading) return
    setLoading(true)
    setError(null)
    setStreamText('')
    setResult(null)
    setShowRaw(false)

    try {
      const text = await translateConcept(input.trim(), (chunk: string) => {
        setStreamText((prev) => prev + chunk)
      })
      setStreamText(text)
      addVaultEntry('translation', input.trim(), text)

      // 记录打卡
      try {
        const existing = JSON.parse(localStorage.getItem('zhika-translations') || '[]')
        existing.push({ concept: input.trim(), date: new Date().toISOString() })
        // 只保留最近 100 条
        if (existing.length > 100) existing.splice(0, existing.length - 100)
        localStorage.setItem('zhika-translations', JSON.stringify(existing))
        setCompleted(existing.length)
      } catch { /* ignore */ }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const handleReset = () => {
    setInput('')
    setStreamText('')
    setResult(null)
    setError(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleTranslate()
    }
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
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <TranslateIcon sx={{ fontSize: { xs: 22, md: 28 } }} />
          <Typography variant="h5" sx={{ fontWeight: 700, fontSize: { xs: '1.1rem', sm: '1.5rem' } }}>
            概念翻译练习
          </Typography>
          <Chip
            label="P2"
            size="small"
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }}
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexDirection: isMobile ? 'column' : 'row' }}>
          <Typography variant="body2" sx={{ opacity: 0.9, flex: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            用底层元概念重新表述上层概念——把复杂术语翻译成你真正理解的东西
          </Typography>
          <Badge badgeContent={completed} color="error" showZero>
            <TrophyIcon sx={{ fontSize: 28, opacity: 0.9 }} />
          </Badge>
        </Box>
      </Paper>

      {/* 从元概念学习来的提示 */}
      {fromMetaConcept && (
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            mb: 2,
            borderRadius: 2,
            bgcolor: 'rgba(99, 102, 241, 0.06)',
            border: '1px solid',
            borderColor: '#6366f1',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <BubbleChartIcon sx={{ color: '#6366f1', fontSize: 20 }} />
          <Typography variant="body2" sx={{ color: '#4f46e5', flex: 1 }}>
            来自元概念 <strong>「{fromMetaConcept}」</strong> — 试试用这个概念翻译一个你遇到的上层概念
          </Typography>
          <Chip
            label="× 清除"
            size="small"
            variant="outlined"
            onClick={() => { setFromMetaConcept(null); setInput('') }}
            sx={{ fontSize: '0.7rem', borderColor: '#6366f1', color: '#6366f1' }}
          />
        </Paper>
      )}

      {/* Input Area */}
      <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, flexDirection: isMobile ? 'column' : 'row' }}>
          <TextField
            fullWidth
            placeholder="输入一个你想用元概念翻译的上层概念…（如：内卷、认知升级、黑天鹅）"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
          />
          <Box sx={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: 1, ...(isMobile ? {} : { minWidth: 100 }) }}>
            <Button
              variant="contained"
              onClick={handleTranslate}
              disabled={loading || !input.trim()}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
              sx={{ flex: isMobile ? 1 : undefined, borderRadius: 1.5, bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' } }}
            >
              翻译
            </Button>
            <Button
              variant="outlined"
              onClick={handleReset}
              disabled={loading}
              startIcon={<RefreshIcon />}
              size="small"
              sx={{ flex: isMobile ? 1 : undefined, borderRadius: 1.5 }}
            >
              重置
            </Button>
          </Box>
        </Box>

        {!result && !streamText && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              点击试试：
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {PRESET_CONCEPTS.map((ex) => (
                <Chip
                  key={ex}
                  label={ex}
                  size="small"
                  variant="outlined"
                  onClick={() => setInput(ex)}
                  sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                />
              ))}
            </Box>
          </Box>
        )}
      </Paper>

      {/* Error */}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Results */}
      {streamText && (
        <Box ref={resultRef} sx={{ flexGrow: 1, overflow: 'auto', pb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.5 }}>
            <Button
              size="small"
              variant="text"
              onClick={() => setShowRaw(!showRaw)}
              sx={{ fontSize: '0.75rem' }}
            >
              {showRaw ? '结构化视图' : '原始输出'}
            </Button>
            <IconButton size="small" onClick={() => handleCopy(streamText)}>
              <CopyIcon fontSize="small" />
            </IconButton>
          </Box>

          {loading && !result ? (
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography
                variant="body2"
                sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, fontFamily: 'monospace' }}
              >
                {streamText}
                <Box component="span" sx={{ color: 'primary.main' }}>▍</Box>
              </Typography>
            </Paper>
          ) : showRaw ? (
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                {streamText}
              </Typography>
            </Paper>
          ) : result ? (
            <Box>
              {/* Concept name */}
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  mb: 2,
                  borderRadius: 2,
                  bgcolor: 'rgba(245, 158, 11, 0.06)',
                  borderColor: '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">目标概念</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {result.concept}
                    <CheckIcon sx={{ ml: 1, fontSize: 20, color: '#f59e0b', verticalAlign: 'middle' }} />
                  </Typography>
                </Box>
                <Chip
                  icon={<TrophyIcon />}
                  label={`打卡 #${completed}`}
                  color="warning"
                  size="small"
                />
              </Paper>

              {/* Translation */}
              <Card elevation={0} sx={{ mb: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                <Box sx={{ px: 2, py: 1, bgcolor: 'rgba(245, 158, 11, 0.06)' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#d97706' }}>
                    🔄 元概念翻译
                  </Typography>
                </Box>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="body2" sx={{ lineHeight: 1.9, fontSize: '0.9rem' }}>
                    {result.translation}
                  </Typography>
                </CardContent>
              </Card>

              {/* Used Meta Concepts */}
              {result.usedMetaConcepts.length > 0 && (
                <Card elevation={0} sx={{ mb: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: '#6366f1', fontWeight: 700 }}>
                      📦 使用的元概念 ({result.usedMetaConcepts.length})
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                      {result.usedMetaConcepts.map((mc) => (
                        <Chip
                          key={mc}
                          label={mc}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* One-liner */}
              {result.oneLiner && (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'rgba(16, 185, 129, 0.04)',
                    borderColor: '#10b981',
                  }}
                >
                  <Typography variant="subtitle2" sx={{ color: '#059669', mb: 0.5, fontWeight: 700 }}>
                    💡 一句话
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {result.oneLiner}
                  </Typography>
                </Paper>
              )}
            </Box>
          ) : null}
        </Box>
      )}

      {!streamText && !loading && !error && (
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'text.disabled',
          }}
        >
          <TranslateIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
          <Typography color="text.secondary">
            输入一个上层概念，用底层元概念把它翻译成你真正理解的语言
          </Typography>
        </Box>
      )}
    </Box>
  )
}
