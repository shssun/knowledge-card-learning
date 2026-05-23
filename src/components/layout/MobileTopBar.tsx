import { useLocation, useNavigate } from 'react-router-dom'
import {
  AppBar, Toolbar, Typography,
  IconButton, Box, Badge, Tooltip
} from '@mui/material'
import {
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Person as AvatarIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material'
import { useUIStore } from '../../store/uiStore'
import { useStudyStore } from '../../store/studyStore'
import { useReviewStore } from '../../store/reviewStore'
import { ROUTES } from '../../constants/routes'

const PAGE_TITLES: Record<string, string> = {
  [ROUTES.HOME]: '知卡研习',
  [ROUTES.MATERIALS]: '资料中心',
  [ROUTES.STUDY]: '研习',
  [ROUTES.ARCHIVE]: '知识归档',
  [ROUTES.REVIEW]: '复习中心',
  [ROUTES.OUTPUT]: '成果输出',
  [ROUTES.SETTINGS]: '设置',
  [ROUTES.CASE_ANALYSIS]: '案例分析',
}

function MobileTopBar(): JSX.Element {
  const location = useLocation()
  const navigate = useNavigate()
  const { isDarkMode, toggleDarkMode } = useUIStore()
  const sessions = useStudyStore((s) => s.sessions)
  const pendingReviewCount = useReviewStore(
    (s) => s.tasks.filter((t) => !t.isCompleted).length
  )

  const todayProgress = ((): number => {
    const today = new Date().toDateString()
    let count = 0
    for (const session of sessions) {
      if (new Date(session.startedAt).toDateString() === today) {
        count += session.generatedCards?.length ?? 0
      }
    }
    return count
  })()

  const getPageTitle = (): string => {
    const currentPath = location.pathname
    if (PAGE_TITLES[currentPath]) {
      return PAGE_TITLES[currentPath]
    }
    // 动态路由：/graph/:domain
    if (currentPath.startsWith('/graph/')) {
      const domain = decodeURIComponent(currentPath.split('/graph/')[1])
      return `图谱 · ${domain}`
    }
    // 动态路由：/level/:domain
    if (currentPath.startsWith('/level/')) {
      const domain = decodeURIComponent(currentPath.split('/level/')[1])
      return `分级 · ${domain}`
    }
    // 兜底
    return PAGE_TITLES[ROUTES.HOME]
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
        height: 48,
        minHeight: 48,
      }}
    >
      <Toolbar
        sx={{
          minHeight: '48px !important',
          height: 48,
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
          {getPageTitle()}
          {todayProgress > 0 && (
            <Box component="span" sx={{ ml: 1, color: 'primary.main', fontSize: 13 }}>
              今日 {todayProgress}
            </Box>
          )}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title={`待复习 ${pendingReviewCount} 张`}>
            <IconButton
              onClick={() => navigate(ROUTES.REVIEW)}
              size="small"
              sx={{ color: pendingReviewCount > 0 ? 'warning.main' : 'text.secondary' }}
            >
              <Badge badgeContent={pendingReviewCount > 0 ? pendingReviewCount : 0} color="warning">
                <NotificationsIcon fontSize="small" />
              </Badge>
            </IconButton>
          </Tooltip>

          <IconButton
            onClick={toggleDarkMode}
            size="small"
            sx={{ color: 'text.secondary' }}
            title={isDarkMode ? '切换亮色模式' : '切换暗色模式'}
          >
            {isDarkMode ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
          </IconButton>

          <IconButton
            onClick={() => navigate(ROUTES.SETTINGS)}
            size="small"
            sx={{ color: 'text.secondary' }}
            title="设置"
          >
            <AvatarIcon fontSize="small" />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default MobileTopBar
