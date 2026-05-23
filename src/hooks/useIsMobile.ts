import { useMediaQuery, useTheme } from '@mui/material'

/**
 * 响应式断点检测 Hook
 * 当视口宽度小于 MUI md 断点 (900px) 时返回 true，表示移动端
 */
export function useIsMobile(): boolean {
  const theme = useTheme()
  return useMediaQuery(theme.breakpoints.down('md'))
}
