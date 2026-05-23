import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Box,
  Menu,
  MenuItem,
  Divider,
  Chip,
} from '@mui/material'
import {
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
} from '@mui/icons-material'
import { useUIStore } from '../../store/uiStore'
import { useStudyStore } from '../../store/studyStore'
import { useReviewStore } from '../../store/reviewStore'
import { ROUTES } from '../../constants/routes'

/** 路由 → 页面标题映射 */
const PAGE_TITLES: Record<string, string> = {
  [ROUTES.HOME]: '知卡研习',
  [ROUTES.MATERIALS]: '资料中心',
  [ROUTES.STUDY]: '学习中心',
  [ROUTES.ARCHIVE]: '学习档案',
  [ROUTES.REVIEW]: '艾宾浩斯复习',
  [ROUTES.OUTPUT]: '输出广场',
  [ROUTES.SETTINGS]: '设置',
  [ROUTES.CASE_ANALYSIS]: '案例分析',
  [ROUTES.META_CONCEPTS]: '元概念启蒙',
  [ROUTES.DECONSTRUCTOR]: '万物拆解',
  [ROUTES.BOOK_DECONSTRUCTOR]: '拆书',
  [ROUTES.DOMAIN_TERMS]: '领域术语',
  [ROUTES.MECE_TRAINER]: 'MECE 训练',
  [ROUTES.MENTAL_MODELS]: '思维模型',
  [ROUTES.TRANSLATION_PRACTICE]: '概念翻译',
  [ROUTES.VAULT]: '思维积木库',
  [ROUTES.ADMIN]: '管理后台',
  [ROUTES.ADMIN_DOMAINS]: '领域管理',
  [ROUTES.ADMIN_TERMS]: '术语管理',
  [ROUTES.ADMIN_PODCASTS]: '播客管理',
  [ROUTES.ADMIN_DATA]: '数据管理',
}

const TopBar = (): JSX.Element => {
  const navigate = useNavigate()
  const location = useLocation()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const { isDarkMode, toggleDarkMode } = useUIStore()
  const sessions = useStudyStore((s) => s.sessions)

  // 从 localStorage 读取设置
  const [dailyGoal, setDailyGoal] = useState(20)

  useEffect(() => {
    const saved = localStorage.getItem('zhika-settings')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.dailyGoal) setDailyGoal(parsed.dailyGoal)
      } catch {}
    }
  }, [])

  // 计算今日学习进度
  const todayProgress = sessions.reduce((count, session) => {
    const sessionDate = new Date(session.startedAt).toDateString()
    const today = new Date().toDateString()
    if (sessionDate === today) {
      return count + session.generatedCards.length
    }
    return count
  }, 0)

  // 实时读取待复习任务数（从 reviewStore，非 active session 数）
  const pendingReviewCount = useReviewStore((s) => s.tasks.filter((t) => !t.isCompleted).length)

  // 根据当前路由确定页面标题（支持 /graph/:domain 和 /level/:domain 动态标题）
  const getPageTitle = (): string => {
    const path = location.pathname
    // 精确匹配
    if (PAGE_TITLES[path]) return PAGE_TITLES[path]
    // 动态路由匹配：/graph/:domain → "知识图谱 · {domain}"
    if (path.startsWith('/graph/')) {
      const domain = decodeURIComponent(path.split('/graph/')[1])
      return `知识图谱 · ${domain}`
    }
    // 动态路由匹配：/level/:domain → "{domain} 分级学习"
    if (path.startsWith('/level/')) {
      const domain = decodeURIComponent(path.split('/level/')[1])
      return `${domain} 分级学习`
    }
    return '知卡研习'
  }

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>): void => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = (): void => {
    setAnchorEl(null)
  }

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        color: 'text.primary',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Left side - Page Title */}
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {getPageTitle()}
          </Typography>
        </Box>

        {/* Right side - Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Quick Stats */}
          <Chip
            size="small"
            label={`今日学习 ${todayProgress}/${dailyGoal}`}
            sx={{
              bgcolor: 'action.selected',
              color: 'primary.main',
              fontWeight: 500,
              display: { xs: 'none', sm: 'flex' },
            }}
          />
          <Chip
            size="small"
            label={`待复习 ${pendingReviewCount}`}
            sx={{
              bgcolor: 'action.selected',
              color: 'warning.main',
              fontWeight: 500,
              display: { xs: 'none', md: 'flex' },
            }}
          />

          {/* Dark Mode Toggle */}
          <IconButton
            onClick={toggleDarkMode}
            sx={{ color: 'text.secondary' }}
            title={isDarkMode ? '切换亮色模式' : '切换暗色模式'}
          >
            {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>

          {/* Notifications */}
          <IconButton
            onClick={handleNotificationClick}
            sx={{ color: 'text.secondary' }}
            title="通知"
          >
            <Badge badgeContent={pendingReviewCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              sx: { width: 320, maxHeight: 400 },
            }}
          >
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                通知中心
              </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={handleClose}>
              <Box>
                <Typography variant="body2" fontWeight={500}>
                  学习提醒
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  您有 {pendingReviewCount} 张卡片等待复习
                </Typography>
              </Box>
            </MenuItem>
            <MenuItem onClick={handleClose}>
              <Box>
                <Typography variant="body2" fontWeight={500}>
                  新功能上线
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  AI 对话讨论功能已更新
                </Typography>
              </Box>
            </MenuItem>
            <MenuItem onClick={handleClose}>
              <Box>
                <Typography variant="body2" fontWeight={500}>
                  学习统计
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  本周学习时长较上周提升 20%
                </Typography>
              </Box>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => { handleClose(); navigate(ROUTES.ARCHIVE) }} sx={{ justifyContent: 'center' }}>
              <Typography variant="body2" color="primary">
                查看全部
              </Typography>
            </MenuItem>
          </Menu>

          {/* User Profile */}
          <IconButton sx={{ ml: 1 }} title="个人中心" onClick={() => navigate(ROUTES.ARCHIVE)}>
            <PersonIcon sx={{ color: 'text.secondary' }} />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default TopBar
