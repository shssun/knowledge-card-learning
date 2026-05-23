import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Snackbar,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Link,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Chip,
  Tooltip,
} from '@mui/material'
import {
  Visibility,
  VisibilityOff,
  Save as SaveIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudIcon,
  Download as DownloadIcon,
  Api as ApiIcon,
  HelpOutline as HelpIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Circle as CircleIcon,
  Refresh as RefreshIcon,
  OpenInNew as OpenInNewIcon,
  SettingsBackupRestore as ImportIcon,
  PlayArrow as PlayIcon,
} from '@mui/icons-material'
import { useUIStore } from '../store/uiStore'
import { getOpenAIClient, getModelName, hasApiKey } from '../services/openai'
import { MODEL_PROVIDERS, fetchModelList, type ModelProvider } from '../config/modelProviders'
import TokenUsageChart from '../components/TokenUsageChart'
import { useIsMobile } from '../hooks/useIsMobile'
import { ROUTES } from '../constants/routes'
import {
  UserLevel,
  LEVEL_COLORS,
  LEVEL_DESCRIPTIONS,
  LEVEL_LAYER_NAMES,
  LEVEL_UNLOCKS,
} from '../types/level.types'
import { useEffectiveLevel } from '../hooks/useEffectiveLevel'

interface Settings {
  providerId: string
  apiKey: string
  baseURL: string
  model: string
  enableSpeech: boolean
  enableVoice: boolean
  autoSave: boolean
  reviewReminders: boolean
  dailyGoal: number
  userLevel: UserLevel
}

const DEFAULT_MODEL = 'gpt-4o-mini'

function SettingsPage(): JSX.Element {
  const navigate = useNavigate()
  const isDarkMode = useUIStore((s) => s.isDarkMode)
  const toggleDarkMode = useUIStore((s) => s.toggleDarkMode)
  const resetOnboarding = useUIStore((s) => s.resetOnboarding)
  const isMobile = useIsMobile()
  const effectiveLevel = useEffectiveLevel()

  const [settings, setSettings] = useState<Settings>({
    providerId: '',
    apiKey: '',
    baseURL: '',
    model: '',
    enableSpeech: true,
    enableVoice: true,
    autoSave: true,
    reviewReminders: true,
    dailyGoal: 20,
    userLevel: '小白',
  })

  const [showApiKey, setShowApiKey] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [verifyMessage, setVerifyMessage] = useState('')
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false, message: '', severity: 'success',
  })

  // 模型列表相关
  const [modelList, setModelList] = useState<string[]>([])
  const [fetchingModels, setFetchingModels] = useState(false)
  const [fetchModelError, setFetchModelError] = useState('')

  // 导入文件
  const importInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('zhika-settings')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // 兼容旧格式（没有 providerId）
        setSettings((prev) => ({ ...prev, ...parsed }))
      } catch {
        // ignore
      }
    }
  }, [])

  // 切换 provider → 自动填 baseURL + 清空模型列表
  const handleProviderChange = (providerId: string) => {
    const provider = MODEL_PROVIDERS.find((p) => p.id === providerId)
    setSettings((prev) => ({
      ...prev,
      providerId,
      baseURL: provider?.baseURL ?? prev.baseURL,
      model: provider?.defaultModels[0] ?? '',
    }))
    setModelList([])
    setFetchModelError('')
  }

  // 手动改 baseURL → 清除 provider 选中
  const handleBaseURLChange = (val: string) => {
    setSettings((prev) => ({ ...prev, baseURL: val, providerId: val ? 'custom' : '' }))
  }

  // 获取模型列表
  const handleFetchModels = async () => {
    const apiKey = settings.apiKey.trim()
    const baseURL = settings.baseURL.trim()
    if (!apiKey || !baseURL) {
      setFetchModelError('请先填写 API Key 和 Base URL')
      return
    }

    setFetchingModels(true)
    setFetchModelError('')
    setModelList([])

    try {
      const models = await fetchModelList(baseURL, apiKey, settings.providerId || 'custom')
      if (models.length === 0) {
        setFetchModelError('未获取到模型列表，请检查 API Key 和 Base URL 是否正确')
      } else {
        setModelList(models.map((m) => m.id))
        // 自动选中第一个
        setSettings((prev) => ({ ...prev, model: models[0].id }))
        setSnackbar({ open: true, message: `获取到 ${models.length} 个模型，已自动选中第一个`, severity: 'success' })
      }
    } catch (err) {
      setFetchModelError(err instanceof Error ? err.message : '获取模型列表失败')
    } finally {
      setFetchingModels(false)
    }
  }

  const handleSave = () => {
    try {
      const toSave = {
        ...settings,
        baseURL: settings.baseURL.trim(),
        model: settings.model.trim(),
      }
      localStorage.setItem('zhika-settings', JSON.stringify(toSave))
      setSnackbar({ open: true, message: '设置已保存，部分设置需刷新页面后生效', severity: 'success' })
    } catch {
      setSnackbar({ open: true, message: '保存失败，请检查浏览器存储权限', severity: 'error' })
    }
  }

  const handleClearData = () => {
    if (window.confirm('确定要清除所有数据吗？此操作不可恢复！')) {
      localStorage.clear()
      setSnackbar({ open: true, message: '数据已清除，请刷新页面', severity: 'success' })
    }
  }

  const handleVerify = async () => {
    if (!hasApiKey()) {
      setVerifyStatus('error')
      setVerifyMessage('请先填写 API Key')
      return
    }

    setVerifying(true)
    setVerifyStatus('idle')
    setVerifyMessage('')

    try {
      const client = getOpenAIClient()
      const model = getModelName()
      const response = await client.chat.completions.create({
        model,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 10,
      })
      const reply = response.choices[0]?.message?.content?.trim()
      if (reply && reply.length > 0) {
        setVerifyStatus('success')
        setVerifyMessage(`连接成功！模型回复：「${reply}」`)
      } else {
        setVerifyStatus('error')
        setVerifyMessage('连接成功，但模型回复为空')
      }
    } catch (err: any) {
      setVerifyStatus('error')
      const msg = err?.message || String(err)
      if (msg.includes('401') || msg.includes('Incorrect API key') || msg.includes('invalid')) {
        setVerifyMessage('API Key 无效，请检查是否填写正确')
      } else if (msg.includes('404') || msg.includes('does not exist')) {
        setVerifyMessage(`模型 "${getModelName()}" 不存在，请检查模型名称`)
      } else if (msg.includes('429') || msg.includes('rate_limit')) {
        setVerifyMessage('请求过于频繁，请稍后再试')
      } else if (msg.includes('network') || msg.includes('fetch') || msg.includes('Failed to fetch') || msg.includes('CORS')) {
        setVerifyMessage('网络错误，可能是 Base URL 配置错误或存在跨域限制')
      } else {
        setVerifyMessage(`连接失败：${msg.slice(0, 80)}`)
      }
    } finally {
      setVerifying(false)
    }
  }

  // 导出全部配置
  const handleExportConfig = () => {
    const data: Record<string, string> = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('zhika-')) {
        data[key] = localStorage.getItem(key) || ''
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zhika-config-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    setSnackbar({ open: true, message: '配置已导出，可在另一台设备导入', severity: 'success' })
  }

  // 导入配置
  const handleImportConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        if (!data['zhika-settings']) {
          setSnackbar({ open: true, message: '无效的配置文件，请确认文件来自知卡研习', severity: 'error' })
          return
        }
        // 逐条写回 localStorage
        Object.entries(data).forEach(([key, value]) => {
          localStorage.setItem(key, value as string)
        })
        // 重载设置
        const parsed = JSON.parse(data['zhika-settings'])
        setSettings((prev) => ({ ...prev, ...parsed }))
        setSnackbar({ open: true, message: '配置已导入，请刷新页面生效', severity: 'success' })
      } catch {
        setSnackbar({ open: true, message: '文件解析失败，请确认是有效的 JSON 文件', severity: 'error' })
      }
    }
    reader.readAsText(file)
    // reset input
    if (importInputRef.current) importInputRef.current.value = ''
  }

  const currentProvider = MODEL_PROVIDERS.find((p) => p.id === settings.providerId)
  const displayModel = settings.model.trim() || DEFAULT_MODEL
  const displayBaseURL = settings.baseURL.trim() || 'https://api.openai.com/v1'
  // 合并：预设默认模型 + 动态获取的模型
  const allModelOptions = [
    ...(currentProvider?.defaultModels ?? []),
    ...modelList,
  ].filter((v, i, a) => a.indexOf(v) === i)

  return (
    <Container maxWidth={isMobile ? false : 'md'} sx={{ py: 4 }}>
      <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight={700} sx={{ mb: 4 }}>
        设置
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* ===== 快速开始（无 API Key 时显示） ===== */}
        {!hasApiKey() && (
          <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, border: '1px solid', borderColor: 'success.light', bgcolor: 'success.50' }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 1, color: 'success.dark' }}>
              开箱即用，零配置开始学习
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              不需要任何配置，点击下方按钮即可开始使用。所有功能在默认模式下都能正常使用。
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                color="success"
                size="large"
                startIcon={<PlayIcon />}
                onClick={() => navigate(ROUTES.HOME)}
              >
                先体验，不配置
              </Button>
              <Button
                variant="outlined"
                color="success"
                startIcon={<SaveIcon />}
                onClick={() => {
                  // 一键配置 DeepSeek（需用户填入自己的 Key）
                  handleProviderChange('deepseek')
                  setSettings((prev) => ({
                    ...prev,
                    providerId: 'deepseek',
                    baseURL: 'https://api.deepseek.com',
                    model: 'deepseek-chat',
                  }))
                }}
              >
                我用 DeepSeek
              </Button>
              <Button
                variant="outlined"
                startIcon={<SaveIcon />}
                onClick={() => {
                  handleProviderChange('siliconflow')
                  setSettings((prev) => ({
                    ...prev,
                    providerId: 'siliconflow',
                    baseURL: 'https://api.siliconflow.cn/v1',
                    model: 'deepseek-ai/DeepSeek-V3',
                  }))
                }}
              >
                我用硅基流动
              </Button>
            </Box>
          </Paper>
        )}

        {/* ===== AI 接口设置 ===== */}
        <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            <ApiIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            AI 接口设置
          </Typography>

          {/* 第一行：厂家预设 + Base URL */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel>选择模型厂家</InputLabel>
              <Select
                value={settings.providerId}
                label="选择模型厂家"
                onChange={(e) => handleProviderChange(e.target.value)}
              >
                {MODEL_PROVIDERS.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              size="small"
              label="Base URL"
              placeholder="https://api.deepseek.com"
              value={settings.baseURL}
              onChange={(e) => handleBaseURLChange(e.target.value)}
              sx={{ flexGrow: 1, minWidth: 240 }}
              helperText="留空使用 OpenAI 官方"
            />

            {currentProvider?.website && (
              <Button
                size="small"
                endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
                href={currentProvider.website}
                target="_blank"
                rel="noopener"
                variant="text"
                sx={{ alignSelf: 'flex-end', whiteSpace: 'nowrap' }}
              >
                {currentProvider.websiteLabel}
              </Button>
            )}
          </Box>

          {/* API Key */}
          <TextField
            fullWidth
            label="API Key"
            type={showApiKey ? 'text' : 'password'}
            value={settings.apiKey}
            onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
            sx={{ mb: 2 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowApiKey(!showApiKey)} edge="end">
                    {showApiKey ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            helperText="API Key 仅存储在本地浏览器中，不会上传到任何服务器"
          />

          {/* 模型选择 + 获取按钮 */}
          <Box sx={{ display: 'flex', gap: 1.5, mb: 1, alignItems: 'flex-start' }}>
            {allModelOptions.length > 0 ? (
              <FormControl size="small" sx={{ minWidth: 240, flexGrow: 1 }}>
                <InputLabel>模型名称</InputLabel>
                <Select
                  value={settings.model}
                  label="模型名称"
                  onChange={(e) => setSettings((prev) => ({ ...prev, model: e.target.value }))}
                >
                  {allModelOptions.map((m) => (
                    <MenuItem key={m} value={m}>
                      {m}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <TextField
                size="small"
                label="模型名称（手动填写）"
                placeholder={DEFAULT_MODEL}
                value={settings.model}
                onChange={(e) => setSettings((prev) => ({ ...prev, model: e.target.value }))}
                sx={{ flexGrow: 1 }}
                helperText="点击右侧按钮自动获取可用模型"
              />
            )}

            <Tooltip title="填入 API Key 后点击获取可用模型列表">
              <Button
                size="small"
                variant="outlined"
                startIcon={fetchingModels ? <CircularProgress size={14} /> : <RefreshIcon />}
                onClick={handleFetchModels}
                disabled={fetchingModels || !settings.apiKey.trim() || !settings.baseURL.trim()}
                sx={{ whiteSpace: 'nowrap', mt: { xs: 0, sm: 0.5 } }}
              >
                {fetchingModels ? '获取中...' : '获取模型'}
              </Button>
            </Tooltip>
          </Box>

          {fetchModelError && (
            <Alert severity="warning" sx={{ mb: 1, py: 0.5 }}>
              {fetchModelError}
            </Alert>
          )}

          {modelList.length > 0 && (
            <Alert severity="success" sx={{ mb: 1, py: 0.5 }}>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                {modelList.slice(0, 20).map((m) => (
                  <Chip key={m} label={m} size="small" variant="outlined" />
                ))}
                {modelList.length > 20 && (
                  <Chip label={`+${modelList.length - 20} 个`} size="small" />
                )}
              </Box>
            </Alert>
          )}

          {/* 验证按钮 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Tooltip title={!settings.apiKey.trim() ? '请先输入 API Key' : ''}>
              <span>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={verifying ? undefined : <ApiIcon />}
                  onClick={handleVerify}
                  disabled={verifying || !settings.apiKey.trim()}
                >
                  {verifying ? '验证中...' : '验证连接'}
                </Button>
              </span>
            </Tooltip>
            {verifyStatus === 'success' && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CheckIcon color="success" fontSize="small" />
                <Typography variant="body2" color="success.main">{verifyMessage}</Typography>
              </Box>
            )}
            {verifyStatus === 'error' && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ErrorIcon color="error" fontSize="small" />
                <Typography variant="body2" color="error.main">{verifyMessage}</Typography>
              </Box>
            )}
          </Box>

          {/* 配置预览 */}
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              当前生效配置（保存后刷新页面生效）：
            </Typography>
            <Typography variant="body2" fontFamily="monospace" sx={{ mt: 0.5 }}>
              Base URL: {displayBaseURL}
            </Typography>
            <Typography variant="body2" fontFamily="monospace">
              Model: {displayModel}
            </Typography>
          </Paper>
        </Paper>

        {/* ===== Token 使用统计 ===== */}
        <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Token 使用统计
          </Typography>
          <TokenUsageChart height={320} />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Token 数据仅保存在本机浏览器，清除浏览器数据会同时清除统计。
          </Typography>
        </Paper>

        {/* ===== 学习设置 ===== */}
        <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            学习设置
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* 用户等级（自动计算，不可手动修改） */}
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                borderRadius: 2,
                bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.03)',
                borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(99,102,241,0.3)' : 'primary.light',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 16, height: 16, borderRadius: '50%',
                      bgcolor: LEVEL_COLORS[effectiveLevel.level],
                      boxShadow: `0 0 8px ${LEVEL_COLORS[effectiveLevel.level]}`,
                    }}
                  />
                  <Typography variant="subtitle1" fontWeight={700}>
                    当前等级：{effectiveLevel.level}
                  </Typography>
                  <Chip
                    label={`解锁: ${LEVEL_UNLOCKS[effectiveLevel.level]}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 500 }}
                  />
                </Box>
                {effectiveLevel.canAdvance && (() => {
                  const nextLevel: Record<UserLevel, UserLevel> = {
                    小白: '初级', 初级: '中级', 中级: '高级', 高级: '大师', 大师: '大师',
                  }
                  return (
                    <Chip
                      label={`已达升级门槛 → 可升为 ${nextLevel[effectiveLevel.level]}`}
                      size="small"
                      color="success"
                      icon={<CheckIcon />}
                    />
                  )
                })()}
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                {LEVEL_LAYER_NAMES[effectiveLevel.level]}
              </Typography>

              {/* 进度条 */}
              <Box sx={{ mb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    当前层掌握进度
                  </Typography>
                  <Typography variant="caption" fontWeight={600} color="primary.main">
                    {effectiveLevel.currentLearned} / {effectiveLevel.currentTotal} ({effectiveLevel.currentPercent}%)
                  </Typography>
                </Box>
                <Box sx={{ width: '100%', height: 6, bgcolor: 'action.hover', borderRadius: 3, overflow: 'hidden' }}>
                  <Box
                    sx={{
                      width: `${Math.min(effectiveLevel.currentPercent, 100)}%`,
                      height: '100%',
                      borderRadius: 3,
                      bgcolor: effectiveLevel.canAdvance ? 'success.main' : 'primary.main',
                      transition: 'width 0.5s ease',
                    }}
                  />
                </Box>
              </Box>

              {!effectiveLevel.canAdvance && effectiveLevel.remainingToAdvance > 0 && (
                <Typography variant="caption" color="warning.main">
                  还需掌握 {effectiveLevel.remainingToAdvance} 个元概念即可升级（需达到 80%）
                </Typography>
              )}

              {/* 全局统计 */}
              <Box sx={{ display: 'flex', gap: 3, mt: 1.5, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="body2" fontWeight={600} color="primary.main">
                    {effectiveLevel.totalLearned} / {effectiveLevel.totalConcepts}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">全部元概念掌握</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight={600} color="primary.main">
                    {Math.round((effectiveLevel.totalLearned / effectiveLevel.totalConcepts) * 100)}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">总体进度</Typography>
                </Box>
              </Box>
            </Paper>

            <Typography variant="caption" color="text.secondary">
              等级由元概念掌握进度自动计算，无需手动设置。在「元概念」页面完成每层 80% 的概念掌握即可晋级。
            </Typography>
            <Divider />
            <FormControlLabel
              control={<Switch checked={settings.enableSpeech} onChange={(e) => setSettings({ ...settings, enableSpeech: e.target.checked })} />}
              label="启用语音输入"
            />
            <FormControlLabel
              control={<Switch checked={settings.enableVoice} onChange={(e) => setSettings({ ...settings, enableVoice: e.target.checked })} />}
              label="启用语音播报"
            />
            <FormControlLabel
              control={<Switch checked={settings.autoSave} onChange={(e) => setSettings({ ...settings, autoSave: e.target.checked })} />}
              label="自动保存进度"
            />
            <Divider />
            <TextField
              label="每日学习目标（张卡片）"
              type="number"
              value={settings.dailyGoal}
              onChange={(e) => setSettings({ ...settings, dailyGoal: parseInt(e.target.value) || 20 })}
              inputProps={{ min: 1, max: 100 }}
              sx={{ maxWidth: { xs: '100%', md: 300 } }}
            />
          </Box>
        </Paper>

        {/* ===== 通知 & 外观 ===== */}
        <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>通知 & 外观</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={<Switch checked={settings.reviewReminders} onChange={(e) => setSettings({ ...settings, reviewReminders: e.target.checked })} />}
              label="复习提醒通知"
            />
            <FormControlLabel
              control={<Switch checked={isDarkMode} onChange={() => toggleDarkMode()} />}
              label="深色模式"
            />
          </Box>
        </Paper>

        {/* ===== 数据备份与恢复 ===== */}
        <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, border: '1px solid', borderColor: 'primary.light' }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
            <DownloadIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: 20 }} />
            数据备份与恢复
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            你积累的每一个概念定义、每一次思考讨论、每一张融合卡片，都是你心智格栅上的一块砖石。
            定期备份这些数据，避免辛苦搭起来的高塔因浏览器缓存失效而倒塌。
          </Typography>

          {/* 数据概览 */}
          <Paper variant="outlined" sx={{ p: 1.5, mb: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              本地数据概览
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {(() => {
                try {
                  const ss = JSON.parse(localStorage.getItem('zhika-study-store') || '{}')?.state
                  const rs = JSON.parse(localStorage.getItem('zhika-score-store') || '{}')?.state
                  const ms = JSON.parse(localStorage.getItem('zhika-material-store') || '{}')?.state
                  const sessionCount = ss?.sessions?.length ?? 0
                  const termCount = ss?.sessions?.flatMap((s: any) => s.fusionCards ?? []).length ?? 0
                  const domainCount = new Set(ss?.sessions?.flatMap((s: any) => s.fusionCards?.map((c: any) => c.term) ?? [])).size
                  const streak = rs?.streak ?? 0
                  return (
                    <>
                      <Box><Typography variant="body2" fontWeight={600}>{sessionCount}</Typography><Typography variant="caption" color="text.secondary">研习会话</Typography></Box>
                      <Box><Typography variant="body2" fontWeight={600}>{termCount}</Typography><Typography variant="caption" color="text.secondary">融合卡片</Typography></Box>
                      <Box><Typography variant="body2" fontWeight={600}>{streak}天</Typography><Typography variant="caption" color="text.secondary">连续学习</Typography></Box>
                    </>
                  )
                } catch {
                  return <Typography variant="caption" color="text.secondary">读取中...</Typography>
                }
              })()}
            </Box>
          </Paper>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportConfig}
              color="primary"
            >
              导出备份 (JSON)
            </Button>
            <Button
              variant="outlined"
              startIcon={<ImportIcon />}
              onClick={() => importInputRef.current?.click()}
              color="primary"
            >
              导入恢复
            </Button>
            <input
              ref={importInputRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleImportConfig}
            />
          </Box>
          <Alert severity="info" sx={{ mt: 2, py: 1 }}>
            所有数据（API Key、学习记录、融合卡片、评分历史）都会被导出到一个 JSON 文件中。
            请妥善保管，换浏览器或清理缓存后导入即可恢复。
          </Alert>
        </Paper>

        {/* ===== 危险操作 ===== */}
        <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, border: '1px solid', borderColor: 'error.light' }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 1, color: 'error.main' }}>
            危险操作
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            清除所有本地数据，此操作不可恢复。
          </Typography>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleClearData}
          >
            清除所有数据
          </Button>
        </Paper>

        {/* ===== 使用帮助 ===== */}
        <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            <HelpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            使用帮助
          </Typography>
          <Stack spacing={1.5}>
            <Box>
              <Typography variant="subtitle2" color="primary" gutterBottom>快速配置 DeepSeek</Typography>
              <Typography variant="body2" color="text.secondary">
                ① 选择厂家 → DeepSeek ② 填入 API Key ③ 点击「获取模型」→ 选择模型 → 保存
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="primary" gutterBottom>如何开始学习？</Typography>
              <Typography variant="body2" color="text.secondary">
                ① 进入「元概念学习」→ 从 130 个元概念开始，8 层递进 → ② 用六大工具练习（万物拆解/MECE/翻译等）→ ③ 粘贴资料进入系统学习流程
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="primary" gutterBottom>数据存储在哪里？</Typography>
              <Typography variant="body2" color="text.secondary">
                所有数据保存在本地浏览器，换设备后不会同步。使用「导出配置」备份，换设备后「导入配置」即可恢复。
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="primary" gutterBottom>想重新看新手引导？</Typography>
              <Button
                variant="text"
                size="small"
                onClick={() => resetOnboarding()}
                sx={{ p: 0, textTransform: 'none', fontWeight: 400 }}
              >
                点击重新查看引导
              </Button>
            </Box>
          </Stack>
        </Paper>

        {/* ===== 保存按钮 ===== */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" size="large" startIcon={<SaveIcon />} onClick={handleSave}>
            保存设置
          </Button>
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  )
}

export default SettingsPage
