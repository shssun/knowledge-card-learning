import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Box, Typography, Button } from '@mui/material'
import { Refresh as RefreshIcon } from '@mui/icons-material'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * React Error Boundary — 捕获组件树中未处理的异常，防止白屏。
 * 显示友好的错误提示并提供刷新按钮。
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            gap: 2,
            p: 4,
          }}
        >
          <Typography variant="h4" color="error" gutterBottom>
            页面出错了
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400, textAlign: 'center' }}>
            {this.state.error?.message || '发生了未知错误'}
          </Typography>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={this.handleReset}
          >
            重试
          </Button>
        </Box>
      )
    }

    return this.props.children
  }
}
