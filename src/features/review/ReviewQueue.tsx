import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
} from '@mui/material'
import {
  Schedule as ScheduleIcon,
  PlayArrow as PlayIcon,
  School as StudyIcon,
} from '@mui/icons-material'
import { useReviewStore } from '../../store/reviewStore'
import { useStudyStore } from '../../store/studyStore'
import { useArchiveStore } from '../../store/archiveStore'
import { ReviewMode } from '../../types/review.types'
import EmptyState from '../../components/ui/EmptyState'
import { ROUTES } from '../../constants/routes'
import { useIsMobile } from '../../hooks/useIsMobile'

interface ReviewQueueProps {
  onStartReview?: (mode: ReviewMode) => void
}

/** 给复习队列中的每个任务补充融合卡片内容 */
interface EnrichedTask {
  taskId: string
  term: string
  mode: ReviewMode
  scheduledAt: string
  isCompleted: boolean
  stage: number
  reviewCount: number
  definition?: string
  boundary?: string
}

function ReviewQueue({ onStartReview }: ReviewQueueProps): JSX.Element {
  const { tasks } = useReviewStore()
  const sessions = useStudyStore((s) => s.sessions)
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const [selectedCard, setSelectedCard] = useState<EnrichedTask | null>(null)

  // 补充融合卡片内容
  const enrichedTasks: EnrichedTask[] = useMemo(() => {
    return tasks.map((task) => {
      let definition = ''
      let boundary = ''
      for (const session of sessions) {
        const card = session.fusionCards.find((c) => c.id === task.cardId)
        if (card) {
          definition = card.personalizedDefinition || ''
          boundary = card.refinedBoundary || ''
          break
        }
      }
      // 回退：从 archiveStore 查找
      if (!definition) {
        const records = useArchiveStore.getState().records
        for (const record of records) {
          if (!record.fusionCards) continue
          const card = record.fusionCards.find((c: any) => c.id === task.cardId)
          if (card) {
            definition = card.personalizedDefinition || ''
            boundary = card.refinedBoundary || ''
            break
          }
        }
      }
      return {
        taskId: task.id,
        term: task.term,
        mode: task.mode,
        scheduledAt: task.scheduledAt,
        isCompleted: task.isCompleted,
        stage: task.stage,
        reviewCount: task.reviewCount,
        definition: definition.slice(0, 80) + (definition.length > 80 ? '...' : ''),
        boundary,
      }
    })
  }, [tasks, sessions])

  const pendingTasks = useMemo(
    () => enrichedTasks.filter((t) => !t.isCompleted),
    [enrichedTasks]
  )

  const todayTasks = useMemo(() => {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)

    return pendingTasks.filter((task) => {
      const scheduled = new Date(task.scheduledAt)
      return scheduled >= startOfDay && scheduled <= endOfDay
    })
  }, [pendingTasks])

  const overdueTasks = useMemo(
    () => pendingTasks.filter((t) => new Date(t.scheduledAt) < new Date()),
    [pendingTasks]
  )

  const completedToday = enrichedTasks.filter((t) => {
    if (!t.isCompleted) return false
    const completed = new Date(t.scheduledAt)
    const now = new Date()
    return (
      completed.getDate() === now.getDate() &&
      completed.getMonth() === now.getMonth() &&
      completed.getFullYear() === now.getFullYear()
    )
  })

  const todayProgress = todayTasks.length + completedToday.length > 0
    ? (completedToday.length / (todayTasks.length + completedToday.length)) * 100
    : 0

  const getStageLabel = (stage: number): string => {
    switch (stage) {
      case 1: return '第1天'
      case 3: return '第3天'
      case 7: return '第7天'
      case 15: return '第15天'
      default: return `第${stage}天`
    }
  }

  if (enrichedTasks.length === 0) {
    return (
      <EmptyState
        icon={<ScheduleIcon sx={{ fontSize: 48 }} />}
        title="暂无复习内容"
        description="完成学习后系统会自动安排艾宾浩斯间隔重复复习"
        actionLabel="去学习"
        onAction={() => navigate(ROUTES.STUDY)}
      />
    )
  }

  return (
    <Box>
      {/* 汇总统计 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        <Card sx={{ bgcolor: 'primary.50' }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary">今日待复习</Typography>
            <Typography variant="h3" fontWeight={700} color="primary.main">{todayTasks.length}</Typography>
            <Typography variant="caption" color="text.secondary">张卡片</Typography>
          </CardContent>
        </Card>
        <Card sx={{ bgcolor: 'warning.50' }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary">已逾期</Typography>
            <Typography variant="h3" fontWeight={700} color="warning.main">{overdueTasks.length}</Typography>
            <Typography variant="caption" color="text.secondary">张卡片</Typography>
          </CardContent>
        </Card>
        <Card sx={{ bgcolor: 'success.50' }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary">今日完成</Typography>
            <Typography variant="h3" fontWeight={700} color="success.main">{completedToday.length}</Typography>
            <Typography variant="caption" color="text.secondary">张卡片</Typography>
          </CardContent>
        </Card>
        <Card sx={{ bgcolor: 'info.50' }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary">总待复习</Typography>
            <Typography variant="h3" fontWeight={700} color="info.main">{pendingTasks.length}</Typography>
            <Typography variant="caption" color="text.secondary">张卡片</Typography>
          </CardContent>
        </Card>
      </Box>

      {/* 今日进度 */}
      {completedToday.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ py: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" fontWeight={500}>今日复习进度</Typography>
              <Typography variant="body2" color="text.secondary">
                {completedToday.length} / {todayTasks.length + completedToday.length}
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={todayProgress} sx={{ height: 6, borderRadius: 4 }} />
          </CardContent>
        </Card>
      )}

      {/* 复习队列列表 */}
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        复习队列
        <Chip label={`共 ${pendingTasks.length} 项`} size="small" sx={{ ml: 1 }} />
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {(overdueTasks.length > 0 ? overdueTasks : todayTasks).length === 0 && pendingTasks.length > 0 && (
          <Alert severity="info" sx={{ mb: 1 }}>
            今日暂无到期的复习任务，但你仍有 {pendingTasks.length} 张卡片在等待未来的复习计划
          </Alert>
        )}

        {(overdueTasks.length > 0 ? overdueTasks : todayTasks).map((task) => (
          <Card
            key={task.taskId}
            sx={{
              borderLeft: '4px solid',
              borderLeftColor: task.isCompleted
                ? 'success.main'
                : (overdueTasks.includes(task) ? 'error.main' : 'primary.main'),
              cursor: 'pointer',
              '&:hover': { boxShadow: 2 },
            }}
            onClick={() => setSelectedCard(task)}
          >
            <CardContent sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, py: 1.5 }}>
              <Avatar sx={{ bgcolor: task.mode === ReviewMode.SPEED_REVIEW ? 'primary.100' : 'secondary.100' }}>
                {task.mode === ReviewMode.SPEED_REVIEW ? '⚡' : '📝'}
              </Avatar>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  {task.term}
                </Typography>
                {task.definition && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mt: 0.3,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {task.definition}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                  <Chip
                    label={task.mode === ReviewMode.SPEED_REVIEW ? '快速复习' : '自测模式'}
                    size="small"
                    color={task.mode === ReviewMode.SPEED_REVIEW ? 'primary' : 'secondary'}
                    variant="outlined"
                  />
                  <Chip label={getStageLabel(task.stage)} size="small" variant="outlined" />
                  <Chip label={`第${task.reviewCount + 1}次`} size="small" variant="outlined" />
                  {overdueTasks.includes(task) && (
                    <Chip label="逾期" size="small" color="error" />
                  )}
                </Box>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5, flexShrink: 0 }}>
                <Typography variant="caption" color="text.secondary">
                  {new Date(task.scheduledAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<PlayIcon />}
                  onClick={(e) => {
                    e.stopPropagation()
                    onStartReview?.(task.mode)
                  }}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  开始
                </Button>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* 卡片预览弹窗 */}
      <Dialog open={Boolean(selectedCard)} onClose={() => setSelectedCard(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <StudyIcon color="primary" />
          {selectedCard?.term}
        </DialogTitle>
        <DialogContent>
          {selectedCard?.definition ? (
            <>
              <Typography variant="subtitle2" color="primary" gutterBottom>核心定义</Typography>
              <DialogContentText sx={{ mb: 2 }}>{selectedCard.definition}</DialogContentText>
            </>
          ) : (
            <DialogContentText sx={{ mb: 2 }}>（暂未生成融合卡片内容）</DialogContentText>
          )}
          {selectedCard?.boundary && (
            <>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>适用范围</Typography>
              <DialogContentText>{selectedCard.boundary}</DialogContentText>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedCard(null)}>关闭</Button>
          <Button
            variant="contained"
            startIcon={<PlayIcon />}
            onClick={() => {
              setSelectedCard(null)
              onStartReview?.(selectedCard?.mode ?? ReviewMode.SPEED_REVIEW)
            }}
          >
            开始复习此卡片
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ReviewQueue
