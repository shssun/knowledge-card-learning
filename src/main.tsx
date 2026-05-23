import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import { useUIStore } from './store/uiStore'
import './index.css'

// 深色模式主题包装组件
function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const isDarkMode = useUIStore((state) => state.isDarkMode)

  const theme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: {
        main: '#6366f1',
      },
      secondary: {
        main: '#8b5cf6',
      },
    },
    components: {
      MuiBottomNavigation: {
        defaultProps: {
          showLabels: true,
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            minWidth: 'auto',
          },
        },
      },
    },
  })

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeWrapper>
          <App />
        </ThemeWrapper>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)
