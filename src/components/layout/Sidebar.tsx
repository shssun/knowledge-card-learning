import { useState, useMemo, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Typography,
  Divider,
  Avatar,
} from '@mui/material'
import {
  Home as HomeIcon,
  LibraryBooks as LibraryIcon,
  School as SchoolIcon,
  Archive as ArchiveIcon,
  Reviews as ReviewIcon,
  Assessment as OutputIcon,
  Psychology as PsychologyIcon,
  Settings as SettingsIcon,
  AdminPanelSettings as AdminIcon,
  BubbleChart as MetaIcon,
  AutoAwesome as DeconstructIcon,
  MenuBook as DomainIcon,
  AutoStories as BookDeconstructIcon,
  Balance as MECETrainerIcon,
  Translate as TranslationIcon,
  Timeline as VaultIcon,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material'
import { ROUTES } from '../../constants/routes'

const DRAWER_WIDTH = 260

// ─── 菜单类型 ───────────────────────────────────────────
interface MenuLeaf {
  kind: 'leaf'
  path: string
  label: string
  icon: React.ReactNode
}

interface MenuGroup {
  kind: 'group'
  label: string
  icon: React.ReactNode
  children: MenuLeaf[]
}

type MenuEntry = MenuLeaf | MenuGroup

// ─── 菜单定义 ───────────────────────────────────────────
// 所有功能保留，仅菜单层面合并分组
const menuEntries: MenuEntry[] = [
  { kind: 'leaf', path: ROUTES.HOME, label: '首页', icon: <HomeIcon /> },
  {
    kind: 'group',
    label: '元概念体系',
    icon: <MetaIcon />,
    children: [
      { kind: 'leaf', path: ROUTES.META_CONCEPTS, label: '元概念学习', icon: <MetaIcon /> },
      { kind: 'leaf', path: ROUTES.DOMAIN_TERMS, label: '领域术语', icon: <DomainIcon /> },
    ],
  },
  {
    kind: 'group',
    label: '工具集',
    icon: <DeconstructIcon />,
    children: [
      { kind: 'leaf', path: ROUTES.DECONSTRUCTOR, label: '万物拆解', icon: <DeconstructIcon /> },
      { kind: 'leaf', path: ROUTES.BOOK_DECONSTRUCTOR, label: '拆书', icon: <BookDeconstructIcon /> },
      { kind: 'leaf', path: ROUTES.MECE_TRAINER, label: 'MECE训练', icon: <MECETrainerIcon /> },
      { kind: 'leaf', path: ROUTES.MENTAL_MODELS, label: '思维模型', icon: <PsychologyIcon /> },
      { kind: 'leaf', path: ROUTES.TRANSLATION_PRACTICE, label: '概念翻译', icon: <TranslationIcon /> },
    ],
  },
  { kind: 'leaf', path: ROUTES.VAULT, label: '思维积木库', icon: <VaultIcon /> },
  {
    kind: 'group',
    label: '学习流程',
    icon: <SchoolIcon />,
    children: [
      { kind: 'leaf', path: ROUTES.MATERIALS, label: '资料中心', icon: <LibraryIcon /> },
      { kind: 'leaf', path: ROUTES.STUDY, label: '学习中心', icon: <SchoolIcon /> },
      { kind: 'leaf', path: ROUTES.ARCHIVE, label: '知识归档', icon: <ArchiveIcon /> },
      { kind: 'leaf', path: ROUTES.REVIEW, label: '复习中心', icon: <ReviewIcon /> },
    ],
  },
  { kind: 'leaf', path: ROUTES.OUTPUT, label: '成果输出', icon: <OutputIcon /> },
  { kind: 'leaf', path: ROUTES.CASE_ANALYSIS, label: '案例分析', icon: <PsychologyIcon /> },
]

const bottomItems: MenuLeaf[] = [
  { kind: 'leaf', path: ROUTES.ADMIN, label: '管理后台', icon: <AdminIcon /> },
  { kind: 'leaf', path: ROUTES.SETTINGS, label: '设置', icon: <SettingsIcon /> },
]

// ─── 收集所有叶子路径（用于 isActive 精确判断） ─────────
const allLeafPaths = (() => {
  const paths: string[] = []
  for (const entry of menuEntries) {
    if (entry.kind === 'leaf') paths.push(entry.path)
    else entry.children.forEach((c) => paths.push(c.path))
  }
  bottomItems.forEach((c) => paths.push(c.path))
  return paths
})()

// ─── 构建 group → children 映射 ──────────────────────────
const groupChildrenMap = new Map<string, string[]>()
for (const entry of menuEntries) {
  if (entry.kind === 'group') {
    groupChildrenMap.set(entry.label, entry.children.map((c) => c.path))
  }
}

// ─── 组件 ────────────────────────────────────────────────
function Sidebar(): JSX.Element {
  const location = useLocation()
  const navigate = useNavigate()

  // 当前路由匹配的叶子路径
  const activeLeaf = useMemo(() => {
    const pn = location.pathname
    if (pn === ROUTES.HOME) return ROUTES.HOME
    // 精确匹配优先
    if (allLeafPaths.includes(pn)) return pn
    // startsWith 回退（处理 /admin/domains 等子路由）
    for (const lp of [...allLeafPaths].sort((a, b) => b.length - a.length)) {
      if (pn.startsWith(lp + '/') || pn === lp) return lp
    }
    return null
  }, [location.pathname])

  // 展开状态管理
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const init = new Set<string>()
    // 初始时展开包含 activeLeaf 的组
    if (activeLeaf) {
      for (const [label, children] of groupChildrenMap) {
        if (children.includes(activeLeaf)) init.add(label)
      }
    }
    return init
  })

  const toggleGroup = useCallback((label: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }, [])

  // 当路由变化时，自动展开对应组
  useMemo(() => {
    if (activeLeaf) {
      setExpandedGroups((prev) => {
        const next = new Set(prev)
        let changed = false
        for (const [label, children] of groupChildrenMap) {
          if (children.includes(activeLeaf) && !next.has(label)) {
            next.add(label)
            changed = true
          }
        }
        return changed ? next : prev
      })
    }
  }, [activeLeaf])

  const isActive = useCallback(
    (path: string): boolean => {
      return activeLeaf === path
    },
    [activeLeaf],
  )

  // 检查某个组是否包含当前活动项
  const isGroupActive = useCallback(
    (group: MenuGroup): boolean => {
      return group.children.some((c) => isActive(c.path))
    },
    [isActive],
  )

  // ─── 渲染叶子项 ───────────────────────────────────────
  const renderLeaf = (item: MenuLeaf, nested = false) => (
    <ListItem key={item.path} disablePadding sx={{ px: 1.5, py: 0.5 }}>
      <ListItemButton
        onClick={() => navigate(item.path)}
        selected={isActive(item.path)}
        sx={{
          pl: nested ? 4 : 2,
          borderRadius: 2,
          '&.Mui-selected': {
            bgcolor: 'action.selected',
            color: 'primary.main',
            '&:hover': { bgcolor: 'action.selected', opacity: 0.9 },
            '& .MuiListItemIcon-root': { color: 'primary.main' },
          },
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: 40,
            color: isActive(item.path) ? 'primary.main' : 'text.secondary',
          }}
        >
          {item.icon}
        </ListItemIcon>
        <ListItemText
          primary={item.label}
          primaryTypographyProps={{
            fontWeight: isActive(item.path) ? 600 : 500,
            fontSize: nested ? '0.875rem' : undefined,
          }}
        />
      </ListItemButton>
    </ListItem>
  )

  // ─── 渲染分组 ─────────────────────────────────────────
  const renderGroup = (group: MenuGroup) => {
    const expanded = expandedGroups.has(group.label)
    const active = isGroupActive(group)

    return (
      <Box key={group.label}>
        <ListItem disablePadding sx={{ px: 1.5, py: 0.5 }}>
          <ListItemButton
            onClick={() => toggleGroup(group.label)}
            sx={{
              borderRadius: 2,
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 40,
                color: active ? 'primary.main' : 'text.secondary',
              }}
            >
              {group.icon}
            </ListItemIcon>
            <ListItemText
              primary={group.label}
              primaryTypographyProps={{
                fontWeight: active ? 600 : 500,
              }}
            />
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <List disablePadding>
            {group.children.map((child) => renderLeaf(child, true))}
          </List>
        </Collapse>
      </Box>
    )
  }

  // ─── 主渲染 ───────────────────────────────────────────
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          bgcolor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          p: 2.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
        }}
      >
        <Avatar
          sx={{
            bgcolor: 'background.paper',
            color: 'primary.main',
            fontWeight: 700,
            width: 40,
            height: 40,
          }}
        >
          知
        </Avatar>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            知卡研习
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.85 }}>
            AI智能学习平台
          </Typography>
        </Box>
      </Box>

      {/* Main Navigation */}
      <List sx={{ flexGrow: 1, pt: 2, overflow: 'auto' }}>
        {menuEntries.map((entry) =>
          entry.kind === 'leaf' ? renderLeaf(entry) : renderGroup(entry),
        )}
      </List>

      <Divider />

      {/* Bottom Navigation */}
      <List sx={{ py: 1.5 }}>
        {bottomItems.map((item) => renderLeaf(item))}
      </List>
    </Drawer>
  )
}

export default Sidebar
