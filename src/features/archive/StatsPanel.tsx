import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Avatar,
} from '@mui/material'
import {
  School as SchoolIcon,
  TrendingUp as TrendingIcon,
  EmojiEvents as TrophyIcon,
  Psychology as BrainIcon,
} from '@mui/icons-material'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { useArchiveStore } from '../../store/archiveStore'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

function StatsPanel(): JSX.Element {
  const { stats, records } = useArchiveStore()
  
  // Prepare data for domain chart
  const domainData = Object.entries(stats.domainScoreMap).map(
    ([domain, score]) => ({
      name: domain,
      score: Math.round(score),
    })
  )
  
  // Weekly trend data (mock)
  const weeklyData = [
    { day: '周一', score: 75 },
    { day: '周二', score: 82 },
    { day: '周三', score: 68 },
    { day: '周四', score: 85 },
    { day: '周五', score: 78 },
    { day: '周六', score: 90 },
    { day: '周日', score: 88 },
  ]
  
  return (
    <Box>
      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.100', mx: 'auto', mb: 1 }}>
                <SchoolIcon color="primary" />
              </Avatar>
              <Typography variant="h4" fontWeight={700}>
                {stats.totalTermsLearned}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                已掌握术语
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'success.100', mx: 'auto', mb: 1 }}>
                <TrendingIcon color="success" />
              </Avatar>
              <Typography variant="h4" fontWeight={700}>
                {stats.averageMasteryScore.toFixed(1)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                平均掌握度
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'warning.100', mx: 'auto', mb: 1 }}>
                <TrophyIcon color="warning" />
              </Avatar>
              <Typography variant="h4" fontWeight={700}>
                {stats.totalStudySessions}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                学习次数
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'secondary.100', mx: 'auto', mb: 1 }}>
                <BrainIcon color="secondary" />
              </Avatar>
              <Typography variant="h4" fontWeight={700}>
                {stats.weakDomains.length || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                待加强领域
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Charts */}
      <Grid container spacing={3}>
        {/* Weekly Trend */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                本周学习趋势
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Domain Distribution */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                领域分布
              </Typography>
              {domainData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={domainData}
                      dataKey="score"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {domainData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box
                  sx={{
                    height: 250,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    暂无数据
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Weak Domains */}
        {stats.weakDomains.length > 0 && (
          <Grid item xs={12}>
            <Card sx={{ bgcolor: 'error.50' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                  待加强领域
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  以下领域掌握度低于 70%，建议加强复习
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {stats.weakDomains.map((domain) => (
                    <Box
                      key={domain}
                      sx={{
                        px: 2,
                        py: 1,
                        bgcolor: 'white',
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <Typography variant="body2" fontWeight={500}>
                        {domain}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {stats.domainScoreMap[domain].toFixed(0)}分
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  )
}

export default StatsPanel
