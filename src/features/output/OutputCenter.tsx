import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme, useMediaQuery } from '@mui/material'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  TextField,
  Grid,
  Tabs,
  Tab,
  Alert,
} from '@mui/material'
import {
  Edit as EditIcon,
  Mic as MicIcon,
  Send as SendIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material'
import { useStudyStore } from '../../store/studyStore'
import { ROUTES } from '../../constants/routes'
import ScoreRadar from '../../components/ui/ScoreRadar'
import EmptyState from '../../components/ui/EmptyState'

function OutputCenter(): JSX.Element {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const navigate = useNavigate()
  const { getCurrentSession } = useStudyStore()
  const session = getCurrentSession()

  const [activeTab, setActiveTab] = useState(0)
  const [outputText, setOutputText] = useState('')

  const fusionCards = session?.fusionCards || []

  if (fusionCards.length === 0) {
    return (
      <EmptyState
        icon={<EditIcon sx={{ fontSize: 48 }} />}
        title="暂无输出内容"
        description="完成学习后将自动生成融合卡片，可以在这里进行输出练习"
        actionLabel="去学习"
        onAction={() => navigate(ROUTES.STUDY)}
      />
    )
  }
  
  const handleCopy = (text: string): void => {
    navigator.clipboard.writeText(text)
  }
  
  const sampleOutput = `# 关于"${fusionCards[0]?.term}"的理解

## 个性化定义
${fusionCards[0]?.personalizedDefinition}

## 深层逻辑
${fusionCards[0]?.deepLogic}

## 实践案例
${fusionCards[0]?.practicalCases}

## 适用边界
${fusionCards[0]?.refinedBoundary}
`
  
  return (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        在这里你可以练习将所学知识用自己的话输出，系统会给出评分和建议
      </Alert>
      
      <Grid container spacing={3}>
        {/* Left - Cards List */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                融合卡片列表
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {fusionCards.map((card, index) => (
                  <Card
                    key={card.id}
                    variant="outlined"
                    sx={{
                      cursor: 'pointer',
                      bgcolor: index === 0
                        ? theme.palette.mode === 'dark' ? 'grey.700' : 'primary.50'
                        : 'transparent',
                      borderColor: index === 0 ? 'primary.main' : 'divider',
                    }}
                  >
                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {card.term}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {card.personalizedDefinition.slice(0, 30)}...
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Right - Output Area */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 1 : 0 }}>
                <Typography variant="h6" fontWeight={600}>
                  输出练习
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    startIcon={<MicIcon />}
                    onClick={() => setOutputText('（语音输入功能）')}
                  >
                    语音
                  </Button>
                  <Button
                    size="small"
                    startIcon={<CopyIcon />}
                    onClick={() => handleCopy(sampleOutput)}
                  >
                    复制模板
                  </Button>
                </Box>
              </Box>
              
              <Tabs
                value={activeTab}
                onChange={(_, v) => setActiveTab(v)}
                variant={isMobile ? 'scrollable' : 'standard'}
                sx={{ mb: 2 }}
              >
                <Tab label="自由输出" />
                <Tab label="模板输出" />
              </Tabs>
              
              {activeTab === 0 && (
                <TextField
                  fullWidth
                  multiline
                  rows={isMobile ? 6 : 8}
                  placeholder="请用你自己的话解释这个概念..."
                  value={outputText}
                  onChange={(e) => setOutputText(e.target.value)}
                  sx={{ mb: 2 }}
                />
              )}
              
              {activeTab === 1 && (
                <Box sx={{ bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50', p: 2, borderRadius: 2, mb: 2 }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {sampleOutput}
                  </Typography>
                </Box>
              )}
              
              <Button
                variant="contained"
                startIcon={<SendIcon />}
                disabled={!outputText.trim()}
                onClick={() => {
                  // TODO: 接入 AI 评分 API
                  alert('评分功能即将上线，请先复制模板内容进行练习')
                }}
              >
                提交评分
              </Button>
            </CardContent>
          </Card>
          
          {/* Sample Card Preview */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                卡片内容预览
              </Typography>
              
              <Typography variant="subtitle2" color="primary.main" gutterBottom>
                {fusionCards[0]?.term}
              </Typography>
              
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>个性化定义：</strong>
                {fusionCards[0]?.personalizedDefinition}
              </Typography>
              
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>深层逻辑：</strong>
                {fusionCards[0]?.deepLogic}
              </Typography>
              
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>实践案例：</strong>
                {fusionCards[0]?.practicalCases}
              </Typography>
              
              <Typography variant="body2">
                <strong>精准边界：</strong>
                {fusionCards[0]?.refinedBoundary}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default OutputCenter
