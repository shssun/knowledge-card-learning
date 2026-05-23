/**
 * 拆书功能 - 万物拆解器的书籍专用版本
 *
 * 输入书名+作者 → AI 用130个元概念拆解全书：
 * - 核心论点 → 核心概念拆解 → 论证结构 → 人性洞察 → 实用价值与边界 → 极简定论
 * 流式输出 + 结构化卡片展示
 */
import { useState, useCallback, useRef } from 'react'
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import {
  Send as SendIcon,
  AutoStories as BookIcon,
  ContentCopy as CopyIcon,
  RawOn as RawIcon,
  Dashboard as StructuredIcon,
  Person as AuthorIcon,
  Lightbulb as InsightIcon,
} from '@mui/icons-material'
import { deconstructBook } from '../../services/deconstructor'
import { usePersonalVaultStore } from '../../store/personalVaultStore'

/** 结构化输出片段 */
interface BookDeconstructSections {
  核心论点: string
  核心概念拆解: string
  论证结构: string
  人性洞察: string
  实用价值与边界: string
  极简定论: string
}

/** 从原始文本解析结构化片段 */
function parseSections(raw: string): BookDeconstructSections {
  const extract = (label: string): string => {
    const regex = new RegExp(
      `##\\s*${label}[\\s\\S]*?\\n([\\s\\S]*?)(?=\\n##|$)`,
      'i'
    )
    const match = raw.match(regex)
    return match?.[1]?.trim() || ''
  }

  return {
    核心论点: extract('书籍核心论点'),
    核心概念拆解: extract('核心概念拆解'),
    论证结构: extract('论证结构'),
    人性洞察: extract('人性洞察'),
    实用价值与边界: extract('实用价值与边界'),
    极简定论: extract('极简定论'),
  }
}

const EXAMPLES = [
  { book: '思考，快与慢', author: '丹尼尔·卡尼曼' },
  { book: '原则', author: '瑞·达利欧' },
  { book: '人类简史', author: '尤瓦尔·赫拉利' },
  { book: '穷查理宝典', author: '查理·芒格' },
  { book: '影响力', author: '罗伯特·西奥迪尼' },
]

export default function BookDeconstructorPage(): JSX.Element {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [bookName, setBookName] = useState('')
  const [author, setAuthor] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [rawOutput, setRawOutput] = useState('')
  const [sections, setSections] = useState<BookDeconstructSections | null>(null)
  const [viewMode, setViewMode] = useState<'structured' | 'raw'>('structured')

  const abortRef = useRef<AbortController | null>(null)
  const addVaultEntry = usePersonalVaultStore((s) => s.addEntry)

  const streamBuffer = useRef('')

  const handleDeconstruct = useCallback(async () => {
    if (!bookName.trim()) return
    setLoading(true)
    setError('')
    setRawOutput('')
    setSections(null)
    streamBuffer.current = ''

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const result = await deconstructBook(
        bookName.trim(),
        author.trim() || undefined,
        (chunk: string) => {
          streamBuffer.current += chunk
          setRawOutput(streamBuffer.current)

          // 实时解析片段
          const parsed = parseSections(streamBuffer.current)
          if (
            parsed.核心论点 ||
            parsed.核心概念拆解 ||
            parsed.论证结构
          ) {
            setSections(parsed)
          }
        },
        controller.signal
      )
      setRawOutput(result)
      setSections(parseSections(result))
      addVaultEntry('book_deconstruct', `${bookName.trim()}${author.trim() ? ' / ' + author.trim() : ''}`, result)
    } catch (e: any) {
      if (e.message === 'ABORTED') return
      setError(e.message || '拆解失败')
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }, [bookName, author])

  const handleStop = useCallback(() => {
    abortRef.current?.abort()
    setLoading(false)
  }, [])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(rawOutput)
  }, [rawOutput])

  // ── 结构化卡片 ──
  const sectionCards = sections
    ? [
        { key: '核心论点', label: '📖 核心论点', color: 'primary.main' as const },
        { key: '核心概念拆解', label: '🔍 概念拆解', color: 'secondary.main' as const },
        { key: '论证结构', label: '🧩 论证结构', color: 'info.main' as const },
        { key: '人性洞察', label: '🧠 人性洞察', color: 'warning.main' as const },
        { key: '实用价值与边界', label: '⚖️ 价值与边界', color: 'success.main' as const },
        { key: '极简定论', label: '💡 极简定论', color: 'error.main' as const },
      ]
    : []

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: { xs: 1, sm: 2 } }}>
      {/* 标题 */}
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <BookIcon color="primary" />
        <Typography variant="h5" fontWeight={700}>
          拆书
        </Typography>
        <Chip label="用元概念拆解任意书籍" size="small" variant="outlined" />
      </Stack>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        输入一本书名，AI 会用 130 个底层元概念逐层拆解其核心论点、论证结构、人性洞察和实用边界。
      </Typography>

      {/* 输入区 */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Stack direction={isMobile ? 'column' : 'row'} spacing={1.5} alignItems={isMobile ? 'stretch' : 'center'}>
          <TextField
            fullWidth
            placeholder="书名，如：思考，快与慢"
            value={bookName}
            onChange={(e) => setBookName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleDeconstruct()
              }
            }}
            size="small"
            InputProps={{
              startAdornment: <BookIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />,
            }}
          />
          <TextField
            placeholder="作者（选填）"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            size="small"
            sx={{ maxWidth: isMobile ? undefined : 180 }}
            InputProps={{
              startAdornment: <AuthorIcon sx={{ mr: 0.5, color: 'text.secondary', fontSize: 18 }} />,
            }}
          />
          {loading ? (
            <Button variant="outlined" color="error" onClick={handleStop} size="small">
              停止
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleDeconstruct}
              disabled={!bookName.trim()}
              size="small"
              startIcon={<SendIcon />}
            >
              拆解
            </Button>
          )}
        </Stack>
      </Paper>

      {/* 示例 */}
      {!rawOutput && !loading && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            试试这些：
          </Typography>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {EXAMPLES.map((ex) => (
              <Chip
                key={ex.book}
                label={`《${ex.book}》${ex.author}`}
                size="small"
                variant="outlined"
                clickable
                onClick={() => {
                  setBookName(ex.book)
                  setAuthor(ex.author)
                }}
                sx={{ mb: 0.5 }}
              />
            ))}
          </Stack>
        </Box>
      )}

      {/* 错误 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 输出区 */}
      {(rawOutput || loading) && (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          {/* 工具栏 */}
          <Stack
            direction={isMobile ? 'column' : 'row'}
            justifyContent="space-between"
            alignItems={isMobile ? 'stretch' : 'center'}
            spacing={isMobile ? 1 : 0}
            sx={{ mb: 2 }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <BookIcon color="primary" fontSize="small" />
              <Typography fontWeight={600}>
                《{bookName}》
                {author && ` — ${author}`}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={0.5}>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(_, v) => v && setViewMode(v)}
                size="small"
              >
                <ToggleButton value="structured" sx={{ px: 1 }}>
                  <StructuredIcon sx={{ fontSize: 16, mr: 0.5 }} />
                  结构
                </ToggleButton>
                <ToggleButton value="raw" sx={{ px: 1 }}>
                  <RawIcon sx={{ fontSize: 16, mr: 0.5 }} />
                  原始
                </ToggleButton>
              </ToggleButtonGroup>
              <Tooltip title="复制全文">
                <IconButton size="small" onClick={handleCopy}>
                  <CopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>

          <Divider sx={{ mb: 2 }} />

          {/* 加载中 */}
          {loading && (rawOutput.length === 0 || !sections) && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 4 }}>
              <CircularProgress size={24} />
              <Typography color="text.secondary">正在拆解《{bookName}》...</Typography>
            </Box>
          )}

          {/* 结构化视图 */}
          {viewMode === 'structured' && sections && (
            <Box>
              {sectionCards.map(({ key, label, color }) => {
                const content = sections[key as keyof BookDeconstructSections]
                if (!content && !loading) return null
                return (
                  <Paper
                    key={key}
                    variant="outlined"
                    sx={{
                      p: 2,
                      mb: 1.5,
                      borderRadius: 2,
                      borderColor: loading && !content ? 'divider' : color,
                      borderLeft: `3px solid ${color}`,
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      fontWeight={700}
                      sx={{ mb: 1, color }}
                    >
                      {label}
                    </Typography>
                    {content ? (
                      <Typography
                        variant="body2"
                        sx={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}
                      >
                        {content}
                      </Typography>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={14} />
                        <Typography variant="caption" color="text.secondary">
                          生成中...
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                )
              })}
            </Box>
          )}

          {/* 原始视图 */}
          {viewMode === 'raw' && (
            <Typography
              variant="body2"
              sx={{
                lineHeight: 1.8,
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
              }}
            >
              {rawOutput}
              {loading && (
                <Box component="span" sx={{ display: 'inline-block', width: 8, height: 16, bgcolor: 'primary.main', ml: 0.5, opacity: 0.7 }} />
              )}
            </Typography>
          )}
        </Paper>
      )}
    </Box>
  )
}
