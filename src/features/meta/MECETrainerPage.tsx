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
  Balance as BalanceIcon,
  CompareArrows as CompareIcon,
} from '@mui/icons-material'
import { meceAnalyze, parseMECEResult, type MECEAnalysisOutput } from '../../services/deconstructor'
import { usePersonalVaultStore } from '../../store/personalVaultStore'

const EXAMPLES = [
  '应该跳槽去创业公司吗？',
  '买房还是租房？',
  '要不要在职读一个 MBA？',
  '团队该激进扩张还是保守维持？',
  '孩子应该上公立还是私立学校？',
]

export default function MECETrainerPage(): JSX.Element {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamText, setStreamText] = useState('')
  const [result, setResult] = useState<MECEAnalysisOutput | null>(null)
  const [showRaw, setShowRaw] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)
  const addVaultEntry = usePersonalVaultStore((s) => s.addEntry)

  useEffect(() => {
    if (!loading && streamText) {
      const parsed = parseMECEResult(streamText)
      setResult(parsed)
    }
  }, [loading, streamText])

  useEffect(() => {
    if (resultRef.current) {
      resultRef.current.scrollTop = resultRef.current.scrollHeight
    }
  }, [streamText])

  const handleAnalyze = async () => {
    if (!input.trim() || loading) return
    setLoading(true)
    setError(null)
    setStreamText('')
    setResult(null)
    setShowRaw(false)

    try {
      const text = await meceAnalyze(input.trim(), (chunk: string) => {
        setStreamText((prev) => prev + chunk)
      })
      setStreamText(text)
      addVaultEntry('mece', input.trim(), text)
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
      handleAnalyze()
    }
  }

  const pairColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b']

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
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <BalanceIcon sx={{ fontSize: { xs: 22, md: 28 } }} />
          <Typography variant="h5" sx={{ fontWeight: 700, fontSize: { xs: '1.1rem', sm: '1.5rem' } }}>
            MECE 对立思考训练器
          </Typography>
          <Chip
            label="P2"
            size="small"
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }}
          />
        </Box>
        <Typography variant="body2" sx={{ opacity: 0.9, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
          输入任何决策或问题 → 自动匹配对立元概念组 → 双向分析 → MECE 校验 → 无死角结论
        </Typography>
      </Paper>

      {/* Input Area */}
      <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, flexDirection: isMobile ? 'column' : 'row' }}>
          <TextField
            fullWidth
            multiline
            minRows={2}
            maxRows={3}
            placeholder="输入你想分析的决策、问题或困境…（回车发送）"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
          />
          <Box sx={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: 1, ...(isMobile ? {} : { minWidth: 100 }) }}>
            <Button
              variant="contained"
              onClick={handleAnalyze}
              disabled={loading || !input.trim()}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
              sx={{ flex: isMobile ? 1 : undefined, borderRadius: 1.5, bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
            >
              分析
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
              典型场景：
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
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Results */}
      {streamText && (
        <Box ref={resultRef} sx={{ flexGrow: 1, overflow: 'auto', pb: 4 }}>
          {/* View toggle */}
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
              <Typography
                variant="body2"
                sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: '0.85rem' }}
              >
                {streamText}
              </Typography>
            </Paper>
          ) : result ? (
            <Box>
              {/* Question */}
              {result.question && (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    mb: 2,
                    borderRadius: 2,
                    bgcolor: 'rgba(16, 185, 129, 0.06)',
                    borderColor: '#10b981',
                  }}
                >
                  <Typography variant="subtitle2" sx={{ color: '#059669', mb: 0.5 }}>
                    问题陈述
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {result.question}
                  </Typography>
                </Paper>
              )}

              {/* Concept Pairs */}
              {result.pairs.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, px: 0.5 }}>
                    <CompareIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                    匹配对立概念组 ({result.pairs.length} 组)
                  </Typography>

                  {result.pairs.map((pair, i) => {
                    const color = pairColors[i % pairColors.length]
                    return (
                      <Card
                        key={i}
                        elevation={0}
                        sx={{ mb: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}
                      >
                        {/* Pair header */}
                        <Box
                          sx={{
                            px: 2,
                            py: 1,
                            bgcolor: `${color}12`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 1.5,
                          }}
                        >
                          <Chip label={pair.sideA} size="small" sx={{ bgcolor: color, color: 'white', fontWeight: 600 }} />
                          <CompareIcon sx={{ fontSize: 18, color }} />
                          <Chip label={pair.sideB} size="small" sx={{ bgcolor: color, color: 'white', fontWeight: 600 }} />
                        </Box>
                        <Divider />

                        {/* Analysis columns */}
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' } }}>
                          {/* Side A */}
                          <Box
                            sx={{
                              flex: 1,
                              p: 2,
                              borderRight: { xs: 'none', sm: '1px solid' },
                              borderBottom: { xs: '1px solid', sm: 'none' },
                              borderColor: 'divider',
                            }}
                          >
                            <Typography variant="caption" sx={{ color, fontWeight: 600, display: 'block', mb: 0.5 }}>
                              「{pair.sideA}」视角
                            </Typography>
                            <Typography variant="body2" sx={{ lineHeight: 1.7, fontSize: '0.85rem' }}>
                              {pair.analysisA}
                            </Typography>
                          </Box>

                          {/* Side B */}
                          <Box sx={{ flex: 1, p: 2 }}>
                            <Typography variant="caption" sx={{ color, fontWeight: 600, display: 'block', mb: 0.5 }}>
                              「{pair.sideB}」视角
                            </Typography>
                            <Typography variant="body2" sx={{ lineHeight: 1.7, fontSize: '0.85rem' }}>
                              {pair.analysisB}
                            </Typography>
                          </Box>
                        </Box>
                      </Card>
                    )
                  })}
                </Box>
              )}

              {/* MECE Validation */}
              {result.validation && (
                <Card
                  elevation={0}
                  sx={{
                    mb: 2,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: '#f59e0b',
                    bgcolor: 'rgba(245, 158, 11, 0.04)',
                  }}
                >
                  <Box sx={{ px: 2, py: 1, bgcolor: 'rgba(245, 158, 11, 0.1)' }}>
                    <Typography variant="subtitle2" sx={{ color: '#d97706', fontWeight: 700 }}>
                      ✅ MECE 完整性校验
                    </Typography>
                  </Box>
                  <Divider />
                  <CardContent sx={{ py: 1.5 }}>
                    <Typography variant="body2" sx={{ lineHeight: 1.8 }}>
                      {result.validation}
                    </Typography>
                  </CardContent>
                </Card>
              )}

              {/* Conclusion */}
              {result.conclusion && (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'rgba(99, 102, 241, 0.04)',
                    borderColor: '#6366f1',
                  }}
                >
                  <Typography variant="subtitle2" sx={{ color: '#6366f1', mb: 1, fontWeight: 700 }}>
                    🎯 综合结论
                  </Typography>
                  <Typography variant="body2" sx={{ lineHeight: 1.8, fontWeight: 500 }}>
                    {result.conclusion}
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
          <BalanceIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
          <Typography color="text.secondary">
            输入你的决策或问题，用对立元概念进行双向 MECE 穷尽分析
          </Typography>
        </Box>
      )}
    </Box>
  )
}
