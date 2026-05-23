import { useLocation, useNavigate } from 'react-router-dom'
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material'
import {
  Home as HomeIcon,
  BubbleChart as BubbleChartIcon,
  Build as BuildIcon,
  School as SchoolIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material'
import { ROUTES } from '../../constants/routes'

/**
 * 5 项精简导航（与 Sidebar 分组一致）
 * 首页 | 元概念 | 工具 | 学习 | 设置
 */
const NAV_ITEMS = [
  { label: '首页', icon: <HomeIcon />, route: ROUTES.HOME },
  { label: '元概念', icon: <BubbleChartIcon />, route: ROUTES.META_CONCEPTS },
  { label: '工具', icon: <BuildIcon />, route: ROUTES.DECONSTRUCTOR },
  { label: '学习', icon: <SchoolIcon />, route: ROUTES.STUDY },
  { label: '设置', icon: <SettingsIcon />, route: ROUTES.SETTINGS },
]

/** 每个 icon 对应的一组路由（宽匹配，避免 startsWith 冲突） */
const ROUTE_SETS: Record<number, string[]> = {
  0: [ROUTES.HOME],
  1: [ROUTES.META_CONCEPTS, ROUTES.DOMAIN_TERMS],
  2: [ROUTES.DECONSTRUCTOR, ROUTES.BOOK_DECONSTRUCTOR, ROUTES.MECE_TRAINER, ROUTES.MENTAL_MODELS, ROUTES.TRANSLATION_PRACTICE, ROUTES.VAULT],
  3: [ROUTES.STUDY, ROUTES.MATERIALS, ROUTES.ARCHIVE, ROUTES.REVIEW, ROUTES.OUTPUT, ROUTES.CASE_ANALYSIS],
  4: [ROUTES.SETTINGS],
}

function MobileBottomNav(): JSX.Element {
  const location = useLocation()
  const navigate = useNavigate()
  const currentPath = location.pathname

  const getActiveIndex = (): number => {
    // 精确匹配主页
    if (currentPath === ROUTES.HOME) return 0
    // 按 ROUTE_SETS 匹配
    for (let i = 0; i < NAV_ITEMS.length; i++) {
      const routes = ROUTE_SETS[i]
      if (routes.some((r) => currentPath === r || currentPath.startsWith(r + '/'))) {
        return i
      }
    }
    return 0
  }

  const handleChange = (_event: React.SyntheticEvent, newValue: number): void => {
    navigate(NAV_ITEMS[newValue].route)
  }

  return (
    <Paper
      className="mobile-bottom-nav"
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1200,
      }}
    >
      <BottomNavigation value={getActiveIndex()} onChange={handleChange} showLabels>
        {NAV_ITEMS.map((item) => (
          <BottomNavigationAction key={item.route} label={item.label} icon={item.icon} />
        ))}
      </BottomNavigation>
    </Paper>
  )
}

export default MobileBottomNav
