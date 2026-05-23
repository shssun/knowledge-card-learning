import { useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  LinearProgress,
} from '@mui/material'
import {
  School as StudyIcon,
  LibraryBooks as MaterialIcon,
  Archive as ArchiveIcon,
  Reviews as ReviewIcon,
  TrendingUp as TrendingIcon,
  PlayArrow as PlayIcon,
  Star as StarIcon,
  EmojiEvents as TrophyIcon,
  Schedule as ScheduleIcon,
  BubbleChart as MetaConceptIcon,
} from '@mui/icons-material'
import { ROUTES } from '../constants/routes'
import { useMaterialStore } from '../store/materialStore'
import { useStudyStore } from '../store/studyStore'
import { useReviewStore } from '../store/reviewStore'
import { useArchiveStore } from '../store/archiveStore'
import { useEffectiveLevel } from '../hooks/useEffectiveLevel'
import { LEVEL_COLORS, LEVEL_DESCRIPTIONS } from '../types/level.types'

function HomePage(): JSX.Element {
  const navigate = useNavigate()
  const materials = useMaterialStore((state) => state.materials)
  const studySessions = useStudyStore((state) => state.sessions)
  const reviewTasks = useReviewStore((state) => state.tasks)
  const stats = useArchiveStore((state) => state.stats)
  const effectiveLevel = useEffectiveLevel()

  const pendingReviews = reviewTasks.filter((t) => !t.isCompleted).length
  const completedSessions = studySessions.filter(
    (s) => s.status === 'COMPLETED'
  ).length

  const quickActions = [
    {
      title: '开始学习',
      description: '选择资料，生成知识卡片',
      icon: <StudyIcon sx={{ fontSize: 40 }} />,
      color: '#3b82f6',
      route: ROUTES.STUDY,
    },
    {
      title: '复习卡片',
      description: `待复习 ${pendingReviews} 张`,
      icon: <ReviewIcon sx={{ fontSize: 40 }} />,
      color: '#10b981',
      route: ROUTES.REVIEW,
    },
    {
      title: '查看归档',
      description: '回顾已学知识',
      icon: <ArchiveIcon sx={{ fontSize: 40 }} />,
      color: '#8b5cf6',
      route: ROUTES.ARCHIVE,
    },
    {
      title: '资料中心',
      description: '管理学习资料',
      icon: <MaterialIcon sx={{ fontSize: 40 }} />,
      color: '#f59e0b',
      route: ROUTES.MATERIALS,
    },
  ]

  const recentMaterials = materials.slice(0, 5)
  const recentSessions = studySessions.slice(-3).reverse()

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
      {/* Welcome Section */}
      <Paper
        sx={{
          p: { xs: 2, sm: 3, md: 4 },
          mb: 4,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: 3,
        }}
      >
        <Grid container alignItems="center" spacing={4}>
          <Grid item xs={12} md={8}>
            <Typography variant="h4" fontWeight={700} gutterBottom sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
              欢迎回来，同学！
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, mb: 3 }}>
              每天进步一点点，积跬步以至千里。继续你的学习之旅吧！
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<PlayIcon />}
              onClick={() => navigate(ROUTES.STUDY)}
              sx={{
                bgcolor: 'white',
                color: 'primary.main',
                '&:hover': { bgcolor: 'grey.100' },
                fontWeight: 600,
              }}
            >
              开始今日学习
            </Button>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 1, mb: 1 }}>
                <Chip
                  icon={<MetaConceptIcon />}
                  label={effectiveLevel.level}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 600,
                  }}
                />
              </Box>
              <Typography variant="h2" fontWeight={700} sx={{ fontSize: { xs: '1.75rem', md: '3rem' } }}>
                {effectiveLevel.totalLearned}<Typography component="span" variant="h5" sx={{ opacity: 0.7 }}>/{effectiveLevel.totalConcepts}</Typography>
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, mb: 1.5 }}>
                元概念已掌握
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={() => navigate(ROUTES.META_CONCEPTS)}
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.5)',
                  '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
                  fontSize: '0.75rem',
                }}
              >
                进入元概念学习 →
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Quick Actions */}
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        快捷入口
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {quickActions.map((action) => (
          <Grid item xs={6} sm={3} key={action.title}>
            <Card
              sx={{
                borderRadius: 3,
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
            >
              <CardActionArea
                onClick={() => navigate(action.route)}
                sx={{ p: 3, textAlign: 'center' }}
              >
                <Avatar
                  sx={{
                    bgcolor: action.color,
                    width: 64,
                    height: 64,
                    mb: 2,
                    mx: 'auto',
                  }}
                >
                  {action.icon}
                </Avatar>
                <Typography variant="subtitle1" fontWeight={600}>
                  {action.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {action.description}
                </Typography>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Learning Progress */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" fontWeight={600}>
                学习进度
              </Typography>
              <Button size="small" onClick={() => navigate(ROUTES.ARCHIVE)}>
                查看全部
              </Button>
            </Box>
            <Grid container spacing={3}>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Avatar sx={{ bgcolor: 'primary.100', mx: 'auto', mb: 1 }}>
                    <StudyIcon color="primary" />
                  </Avatar>
                  <Typography variant="h5" fontWeight={700}>
                    {completedSessions}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    完成学习
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Avatar sx={{ bgcolor: 'warning.100', mx: 'auto', mb: 1 }}>
                    <ReviewIcon color="warning" />
                  </Avatar>
                  <Typography variant="h5" fontWeight={700}>
                    {pendingReviews}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    待复习
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Avatar sx={{ bgcolor: 'success.100', mx: 'auto', mb: 1 }}>
                    <TrendingIcon color="success" />
                  </Avatar>
                  <Typography variant="h5" fontWeight={700}>
                    {stats.averageMasteryScore.toFixed(1)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    平均掌握度
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Avatar sx={{ bgcolor: 'secondary.100', mx: 'auto', mb: 1 }}>
                    <TrophyIcon color="secondary" />
                  </Avatar>
                  <Typography variant="h5" fontWeight={700}>
                    {Math.floor(stats.totalStudySessions / 7) || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    连续学习(天)
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Weekly Progress */}
            <Box sx={{ mt: 4 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                本周学习进度
              </Typography>
              <LinearProgress
                variant="determinate"
                value={Math.min((completedSessions / 7) * 100, 100)}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                  },
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                {completedSessions}/7 天
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              最近学习
            </Typography>
            {recentSessions.length > 0 ? (
              <List disablePadding>
                {recentSessions.map((session, index) => (
                  <ListItem
                    key={session.id}
                    disablePadding
                    sx={{
                      py: 1.5,
                      borderBottom:
                        index < recentSessions.length - 1 ? '1px solid' : 'none',
                      borderColor: 'divider',
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.50' }}>
                        <StudyIcon color="primary" fontSize="small" />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={session.selectedTerms.slice(0, 2).join('、')}
                      secondary={
                        <Box component="span">
                          {session.selectedTerms.length > 2
                            ? `等${session.selectedTerms.length}个`
                            : ''}
                          {' · '}
                          {new Date(session.startedAt).toLocaleDateString('zh-CN')}
                        </Box>
                      }
                      primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }}
                      secondaryTypographyProps={{ fontSize: 12 }}
                    />
                    <Chip
                      size="small"
                      label={
                        session.status === 'COMPLETED' ? '已完成' : '进行中'
                      }
                      color={session.status === 'COMPLETED' ? 'success' : 'warning'}
                      sx={{ fontSize: 11 }}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <ScheduleIcon sx={{ fontSize: 48, color: 'grey.300', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  暂无学习记录
                </Typography>
                <Button
                  size="small"
                  onClick={() => navigate(ROUTES.STUDY)}
                  sx={{ mt: 1 }}
                >
                  开始学习
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Recent Materials */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                最近使用资料
              </Typography>
              <Button size="small" onClick={() => navigate(ROUTES.MATERIALS)}>
                查看全部
              </Button>
            </Box>
            {recentMaterials.length > 0 ? (
              <Grid container spacing={2}>
                {recentMaterials.map((material) => (
                  <Grid item xs={12} sm={6} md={4} key={material.id}>
                    <Card
                      variant="outlined"
                      sx={{
                        borderRadius: 2,
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: 'primary.main',
                          bgcolor: 'primary.5',
                        },
                      }}
                    >
                      <CardContent>
                        <Typography
                          variant="subtitle2"
                          fontWeight={600}
                          noWrap
                          gutterBottom
                        >
                          {material.title}
                        </Typography>
                        <Box
                          sx={{
                            display: 'flex',
                            gap: 0.5,
                            flexWrap: 'wrap',
                            mb: 1,
                          }}
                        >
                          <Chip
                            size="small"
                            label={material.category.replace('_', ' ')}
                            sx={{ fontSize: 10, height: 20 }}
                          />
                          <Chip
                            size="small"
                            label={material.difficulty}
                            color={
                              material.difficulty === 'BEGINNER'
                                ? 'success'
                                : material.difficulty === 'INTERMEDIATE'
                                ? 'warning'
                                : 'error'
                            }
                            sx={{ fontSize: 10, height: 20 }}
                          />
                        </Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          noWrap
                        >
                          {material.content.slice(0, 60)}...
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <MaterialIcon sx={{ fontSize: 48, color: 'grey.300', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  暂无资料
                </Typography>
                <Button
                  size="small"
                  onClick={() => navigate(ROUTES.MATERIALS)}
                  sx={{ mt: 1 }}
                >
                  添加资料
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Weak Areas */}
        {stats.weakDomains.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TrendingIcon color="error" />
                <Typography variant="h6" fontWeight={600}>
                  待加强领域
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {stats.weakDomains.map((domain) => (
                  <Chip
                    key={domain}
                    label={domain}
                    onClick={() => navigate(ROUTES.STUDY)}
                    sx={{
                      bgcolor: 'error.50',
                      color: 'error.main',
                      '&:hover': {
                        bgcolor: 'error.100',
                        cursor: 'pointer',
                      },
                    }}
                  />
                ))}
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Container>
  )
}

export default HomePage
