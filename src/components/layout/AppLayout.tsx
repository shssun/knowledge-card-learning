import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import Footer from './Footer'
import MobileBottomNav from './MobileBottomNav'
import MobileTopBar from './MobileTopBar'
import { Box } from '@mui/material'
import { useIsMobile } from '../../hooks/useIsMobile'
import ErrorBoundary from './ErrorBoundary'

function AppLayout(): JSX.Element {
  const isMobile = useIsMobile()

  // 移动端键盘弹出检测：通过 visualViewport 判断键盘是否打开，动态添加/移除 CSS 类
  useEffect(() => {
    if (!isMobile) return
    const handler = (): void => {
      const isKeyboardOpen = window.visualViewport
        ? window.visualViewport.height < window.innerHeight * 0.75
        : false
      document.body.classList.toggle('keyboard-open', isKeyboardOpen)
    }
    window.visualViewport?.addEventListener('resize', handler)
    return () => window.visualViewport?.removeEventListener('resize', handler)
  }, [isMobile])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {isMobile ? (
        <>
          <MobileTopBar />
          <Box
            component="main"
            className="main-content-mobile"
            sx={{
              flexGrow: 1,
              overflow: 'auto',
              bgcolor: 'background.default',
              p: { xs: 1.5, sm: 2 },
            }}
          >
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </Box>
          <MobileBottomNav />
        </>
      ) : (
        <>
          <Box sx={{ display: 'flex', flex: 1 }}>
            <Sidebar />
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <TopBar />
              <Box
                component="main"
                sx={{
                  flexGrow: 1,
                  p: 3,
                  overflow: 'auto',
                  bgcolor: 'background.default',
                }}
              >
                <ErrorBoundary>
                  <Outlet />
                </ErrorBoundary>
              </Box>
            </Box>
          </Box>
          <Footer />
        </>
      )}
    </Box>
  )
}

export default AppLayout
