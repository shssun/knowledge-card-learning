import { useState, useRef, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  IconButton,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import {
  Send as SendIcon,
  Refresh as RefreshIcon,
  ContentCopy as CopyIcon,
  Psychology as PsychologyIcon,
  AutoAwesome as AIIcon,
} from '@mui/icons-material'
import { deconstruct, parseDeconstructResult, type DeconstructOutput } from '../../services/deconstructor'
import { usePersonalVaultStore } from '../../store/personalVaultStore'

/** 层的颜色映射 */
const LAYER_COLORS: Record<string, string> = {
  layer1_本源: '#6366f1',
  layer2_逻辑: '#8b5cf6',
  layer3_人性: '#ec4899',
  layer4_社会行动商业: '#f59e0b',
  极简定论: '#10b981',
}

const LAYER_LABELS: Record<string, string> = {
  layer1_本源: '本源层',
  layer2_逻辑: '逻辑层',
  layer3_人性: '人性层',
  layer4_社会行动商业: '社会/行动/商业层',
  极简定论: '极简定论',
}

/** 示例输入 */
const EXAMPLES = [
  '什么是内卷？',
  '为什么人会拖延？',
  '复利思维的本质是什么？',
  '中年危机是怎么产生的？',
  '自由职业 vs 打工，怎么选？',
]

export default function DeconstructorPage(): JSX.Element {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamText, setStreamText] = useState('')
  const [result, setResult] = useState<DeconstructOutput | null>(null)
  const [error, setError] = useState<string | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)
  const addVaultEntry = usePersonalVaultStore((s) => s.addEntry)

  // 流式完成后解析
  useEffect(() => {
    if (!loading && streamText) {
      const parsed = parseDeconstructResult(streamText)
      setResult(parsed)
    }
  }, [loading, streamText])

  const handleDeconstruct = async () => {
    if (!input.trim() || loading) return
    setLoading(true)
    setError(null)
    setStreamText('')
    setResult(null)

    try {
      const text = await deconstruct(input.trim(), (chunk) => {
        setStreamText((prev) => prev + chunk)
      })
      setStreamText(text)
      addVaultEntry('deconstruct', input.trim(), text)
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
      handleDeconstruct()
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
          background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <PsychologyIcon sx={{ fontSize: { xs: 22, md: 28 } }} />
          <Typography variant="h5" sx={{ fontWeight: 700, fontSize: { xs: '1.1rem', sm: '1.5rem' } }}>
            万物拆解器
          </Typography>
          <Chip
            label="MVP"
            size="small"
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }}
          />
        </Box>
        <Typography variant="body2" sx={{ opacity: 0.9, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
          用 130 个底层元概念拆解一切——概念、问题、事件、决策，逐层分析直到本质
        </Typography>
      </Paper>

      {/* Input Area */}
      <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, flexDirection: isMobile ? 'column' : 'row' }}>
          <TextField
            fullWidth
            multiline
            minRows={2}
            maxRows={4}
            placeholder="输入你想拆解的概念、问题或事件…（回车发送）"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1.5,
              },
            }}
          />
          <Box sx={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: 1, ...(isMobile ? {} : { minWidth: 100 }) }}>
            <Button
              variant="contained"
              onClick={handleDeconstruct}
              disabled={loading || !input.trim()}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
              sx={{ flex: isMobile ? 1 : undefined, borderRadius: 1.5 }}
            >
              拆解
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

        {/* Examples */}
        {!result && !streamText && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              试试这些：
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {EXAMPLES.map((ex) => (
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
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Streaming / Result */}
      {streamText && (
        <Box ref={resultRef} sx={{ flexGrow: 1, overflow: 'auto', pb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AIIcon sx={{ fontSize: 20, color: 'primary.main' }} />
              <Typography variant="subtitle2" color="primary">
                拆解结果
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => handleCopy(streamText)}>
              <CopyIcon fontSize="small" />
            </IconButton>
          </Box>

          {loading && !result ? (
            // 流式输出中
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography
                variant="body2"
                sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, fontFamily: 'monospace' }}
              >
                {streamText}
                <Box component="span" sx={{ animation: 'blink 1s infinite', color: 'primary.main' }}>
                  ▍
                </Box>
              </Typography>
            </Paper>
          ) : result ? (
            // 结构化展示
            <Box>
              {Object.entries(LAYER_LABELS).map(([key, label]) => {
                const content = result[key as keyof DeconstructOutput]
                const color = LAYER_COLORS[key]
                if (!content) return null

                return (
                  <Card
                    key={key}
                    elevation={0}
                    sx={{
                      mb: 1.5,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        px: 2,
                        py: 0.75,
                        bgcolor: `${color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          bgcolor: color,
                        }}
                      />
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 700, color, fontSize: '0.85rem' }}
                      >
                        {label}
                      </Typography>
                    </Box>
                    <Divider />
                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="body2" sx={{ lineHeight: 1.8, fontSize: '0.9rem' }}>
                        {content}
                      </Typography>
                    </CardContent>
                  </Card>
                )
              })}

              {/* Raw text toggle */}
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => {
                    setResult(null)
                  }}
                  sx={{ fontSize: '0.75rem' }}
                >
                  查看原始输出
                </Button>
              </Box>
            </Box>
          ) : (
            // Raw text (toggle from structured)
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography
                variant="body2"
                sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, fontFamily: 'monospace', fontSize: '0.85rem' }}
              >
                {streamText}
              </Typography>
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => {
                    const parsed = parseDeconstructResult(streamText)
                    setResult(parsed)
                  }}
                >
                  查看结构化视图
                </Button>
              </Box>
            </Paper>
          )}
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
          <PsychologyIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
          <Typography color="text.secondary">输入任何概念、问题或事件，开始逐层拆解</Typography>
        </Box>
      )}
    </Box>
  )
}
