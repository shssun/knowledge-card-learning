/**
 * 个人思维积木库（PRD 模块六）
 *
 * 聚合全部工具产出：拆解记录、MECE分析、概念翻译、拆书笔记
 * 时间线浏览 + 来源分类筛选 + 详情展开
 */
import { useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  Tabs,
  Tab,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  Tooltip,
  Badge,
} from '@mui/material'
import {
  Psychology as DeconstructIcon,
  Balance as MECETrainerIcon,
  Translate as TranslationIcon,
  AutoStories as BookDeconstructIcon,
  Delete as DeleteIcon,
  AllInclusive as AllIcon,
  OpenInNew as ExpandIcon,
  EmojiObjects as InsightIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material'
import { usePersonalVaultStore } from '../store/personalVaultStore'
import { useMetaProgressStore } from '../store/metaProgressStore'
import { useStudyStore } from '../store/studyStore'
import type { VaultEntry, VaultEntryType } from '../types/vault.types'

// ==================== 类型配置 ====================

const TYPE_CONFIG: Record<VaultEntryType, { label: string; icon: JSX.Element; color: string; bg: string }> = {
  deconstruct: {
    label: '万物拆解',
    icon: <DeconstructIcon />,
    color: '#0ea5e9',
    bg: 'rgba(14, 165, 233, 0.08)',
  },
  mece: {
    label: 'MECE 分析',
    icon: <MECETrainerIcon />,
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.08)',
  },
  translation: {
    label: '概念翻译',
    icon: <TranslationIcon />,
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.08)',
  },
  book_deconstruct: {
    label: '拆书笔记',
    icon: <BookDeconstructIcon />,
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.08)',
  },
}

const TYPE_ORDER: VaultEntryType[] = ['deconstruct', 'mece', 'translation', 'book_deconstruct']

// ==================== 工具函数 ====================

function formatTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)

  const time = d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 0) return `今天 ${time}`
  if (diffDays === 1) return `昨天 ${time}`
  if (diffDays < 7) return `${diffDays} 天前 ${time}`
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) + ' ' + time
}

// ==================== 组件 ====================

function StatCard({
  icon,
  label,
  count,
  color,
}: {
  icon: JSX.Element
  label: string
  count: number
  color: string
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: `${color}18`,
          color,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
          {count}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
      </Box>
    </Paper>
  )
}

function EntryCard({
  entry,
  onDelete,
  onExpand,
}: {
  entry: VaultEntry
  onDelete: (id: string) => void
  onExpand: (entry: VaultEntry) => void
}) {
  const config = TYPE_CONFIG[entry.type]

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.15s',
        '&:hover': {
          borderColor: config.color,
          boxShadow: `0 2px 8px ${config.bg}`,
        },
      }}
    >
      <CardActionArea onClick={() => onExpand(entry)}>
        <CardContent sx={{ p: 2, pb: '12px !important' }}>
          {/* 头部 */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
            <Chip
              label={config.label}
              size="small"
              sx={{
                bgcolor: config.bg,
                color: config.color,
                fontWeight: 600,
                fontSize: '0.7rem',
              }}
            />
            <Typography variant="caption" color="text.disabled">
              {formatTime(entry.createdAt)}
            </Typography>
          </Box>

          {/* 标题 */}
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, lineHeight: 1.4 }}>
            {entry.title}
          </Typography>

          {/* 摘要 */}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              lineHeight: 1.6,
              fontSize: '0.8rem',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {entry.summary}
          </Typography>
        </CardContent>
      </CardActionArea>

      {/* 底部操作 */}
      <Divider />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 1, py: 0.5 }}>
        <Tooltip title="展开详情">
          <IconButton size="small" onClick={() => onExpand(entry)}>
            <ExpandIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="删除记录">
          <IconButton size="small" onClick={() => onDelete(entry.id)} color="error">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Card>
  )
}

// ==================== 主页面 ====================

export default function VaultPage(): JSX.Element {
  const entries = usePersonalVaultStore((s) => s.entries)
  const removeEntry = usePersonalVaultStore((s) => s.removeEntry)
  const counts = usePersonalVaultStore((s) => s.countByType)
  const masteredCount = useMetaProgressStore((s) => s.getTotalLearned)
  const totalConcepts = useMetaProgressStore((s) => s.getTotalLearned)
  const completedSessions = useStudyStore((s) => s.sessions.filter((ss) => ss.status === 'COMPLETED').length)

  const [filter, setFilter] = useState<VaultEntryType | 'all'>('all')
  const [detailEntry, setDetailEntry] = useState<VaultEntry | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const filteredEntries =
    filter === 'all' ? entries : entries.filter((e) => e.type === filter)

  const handleDelete = (id: string) => setDeleteConfirm(id)
  const confirmDelete = () => {
    if (deleteConfirm) {
      removeEntry(deleteConfirm)
      setDeleteConfirm(null)
    }
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          pb: 2,
          borderRadius: 2,
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <TimelineIcon sx={{ fontSize: 28 }} />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            个人思维积木库
          </Typography>
          <Chip
            label="NEW"
            size="small"
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }}
          />
        </Box>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          你所有的拆解、分析、翻译、笔记都会自动沉淀到这里，形成你的专属认知资产
        </Typography>
      </Paper>

      {/* 统计卡片 */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(6, 1fr)' },
          gap: 1.5,
        }}
      >
        <StatCard icon={<InsightIcon />} label="已掌握元概念" count={masteredCount()} color="#6366f1" />
        <StatCard icon={<DeconstructIcon />} label="万物拆解" count={counts().deconstruct} color="#0ea5e9" />
        <StatCard icon={<MECETrainerIcon />} label="MECE 分析" count={counts().mece} color="#10b981" />
        <StatCard icon={<TranslationIcon />} label="概念翻译" count={counts().translation} color="#f59e0b" />
        <StatCard icon={<BookDeconstructIcon />} label="拆书笔记" count={counts().book_deconstruct} color="#8b5cf6" />
        <StatCard icon={<TimelineIcon />} label="累计学习" count={completedSessions} color="#ec4899" />
      </Box>

      {/* 筛选 Tab */}
      <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Tabs
          value={filter}
          onChange={(_, v) => setFilter(v)}
          variant="scrollable"
          scrollButtons={false}
          sx={{ px: 1, '& .MuiTab-root': { minHeight: 44, textTransform: 'none', fontWeight: 600 } }}
        >
          <Tab
            value="all"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <AllIcon sx={{ fontSize: 18 }} />
                全部 ({entries.length})
              </Box>
            }
          />
          {TYPE_ORDER.map((type) => (
            <Tab
              key={type}
              value={type}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  {TYPE_CONFIG[type].icon}
                  {TYPE_CONFIG[type].label} ({counts()[type]})
                </Box>
              }
            />
          ))}
        </Tabs>
      </Paper>

      {/* 条目列表 */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', pb: 4 }}>
        {filteredEntries.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 8,
              color: 'text.disabled',
            }}
          >
            <TimelineIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
            <Typography color="text.secondary">
              {entries.length === 0
                ? '还没有任何积木记录。去万物拆解、MECE训练或概念翻译产出第一条吧！'
                : '该分类下暂无记录'}
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              columnCount: { xs: 1, sm: 2, lg: 3 },
              columnGap: 2,
              '& > *': {
                breakInside: 'avoid',
                mb: 2,
              },
            }}
          >
            {filteredEntries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onDelete={handleDelete}
                onExpand={setDetailEntry}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* 详情弹窗 */}
      <Dialog
        open={!!detailEntry}
        onClose={() => setDetailEntry(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, maxHeight: '80vh' } }}
      >
        {detailEntry && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
              <Chip
                label={TYPE_CONFIG[detailEntry.type].label}
                size="small"
                sx={{
                  bgcolor: TYPE_CONFIG[detailEntry.type].bg,
                  color: TYPE_CONFIG[detailEntry.type].color,
                  fontWeight: 600,
                }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
                {formatTime(detailEntry.createdAt)}
              </Typography>
            </DialogTitle>
            <DialogContent dividers>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                {detailEntry.input}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.9,
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                }}
              >
                {detailEntry.fullOutput}
              </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 1.5 }}>
              <Button onClick={() => setDetailEntry(null)}>关闭</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* 删除确认弹窗 */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="xs">
        <DialogTitle>确认删除这条记录？</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            删除后无法恢复。确定要删除吗？
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>取消</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            删除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
