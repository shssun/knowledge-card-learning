import { useState } from 'react'
import { useTheme, Tooltip } from '@mui/material'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import {
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Preview as PreviewIcon,
  CloudUpload as UploadIcon,
} from '@mui/icons-material'
import { exportCards } from '../../utils/exportUtils'
import { useStudyStore } from '../../store/studyStore'

interface ExportRecord {
  id: string
  name: string
  format: 'json' | 'csv' | 'markdown'
  cardCount: number
  exportedAt: string
}

function ExportPanel(): JSX.Element {
  const theme = useTheme()
  const { getCurrentSession } = useStudyStore()
  const session = getCurrentSession()
  
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewContent, setPreviewContent] = useState('')
  
  const fusionCards = session?.fusionCards || []
  
  const handleExport = (format: 'json' | 'csv' | 'markdown'): void => {
    exportCards(fusionCards, format)
  }
  
  const handlePreview = (format: 'json' | 'csv' | 'markdown'): void => {
    if (format === 'json') {
      setPreviewContent(JSON.stringify(fusionCards, null, 2))
    } else if (format === 'csv') {
      const headers = ['术语', '个性化定义', '深层逻辑', '实践案例', '精准边界']
      const rows = fusionCards.map((card) =>
        [card.term, card.personalizedDefinition, card.deepLogic, card.practicalCases, card.refinedBoundary]
          .map((cell) => `"${cell.replace(/"/g, '""')}"`)
          .join(',')
      )
      setPreviewContent([headers.join(','), ...rows].join('\n'))
    } else {
      let md = '# 知识卡片汇总\n\n'
      fusionCards.forEach((card, index) => {
        md += `## ${index + 1}. ${card.term}\n\n`
        md += `### 个性化定义\n\n${card.personalizedDefinition}\n\n`
        md += `### 深层逻辑\n\n${card.deepLogic}\n\n`
        md += `### 实践案例\n\n${card.practicalCases}\n\n`
        md += `### 精准边界\n\n${card.refinedBoundary}\n\n---\n\n`
      })
      setPreviewContent(md)
    }
    setPreviewOpen(true)
  }
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6">
          已生成 {fusionCards.length} 张融合卡片
        </Typography>
      </Box>
      
      {/* Export Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            导出选项
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Tooltip title={fusionCards.length === 0 ? '暂无卡片内容可导出' : ''}>
              <span>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleExport('json')}
                  disabled={fusionCards.length === 0}
                >
                  导出 JSON
                </Button>
              </span>
            </Tooltip>
            <Tooltip title={fusionCards.length === 0 ? '暂无卡片内容可导出' : ''}>
              <span>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleExport('csv')}
                  disabled={fusionCards.length === 0}
                >
                  导出 CSV
                </Button>
              </span>
            </Tooltip>
            <Tooltip title={fusionCards.length === 0 ? '暂无卡片内容可导出' : ''}>
              <span>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleExport('markdown')}
                  disabled={fusionCards.length === 0}
                >
                  导出 Markdown
                </Button>
              </span>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>
      
      {/* Preview Section */}
      <Card>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            预览导出内容
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Tooltip title={fusionCards.length === 0 ? '暂无卡片内容可预览' : ''}>
              <span>
                <Button
                  size="small"
                  startIcon={<PreviewIcon />}
                  onClick={() => handlePreview('json')}
                  disabled={fusionCards.length === 0}
                >
                  JSON
                </Button>
              </span>
            </Tooltip>
            <Tooltip title={fusionCards.length === 0 ? '暂无卡片内容可预览' : ''}>
              <span>
                <Button
                  size="small"
                  startIcon={<PreviewIcon />}
                  onClick={() => handlePreview('csv')}
                  disabled={fusionCards.length === 0}
                >
                  CSV
                </Button>
              </span>
            </Tooltip>
            <Tooltip title={fusionCards.length === 0 ? '暂无卡片内容可预览' : ''}>
              <span>
                <Button
                  size="small"
                  startIcon={<PreviewIcon />}
                  onClick={() => handlePreview('markdown')}
                  disabled={fusionCards.length === 0}
                >
                  Markdown
                </Button>
              </span>
            </Tooltip>
          </Box>
          
          {fusionCards.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              暂无可导出的内容
            </Typography>
          ) : (
            <TableContainer sx={{ maxHeight: 400 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>术语</TableCell>
                    <TableCell>定义摘要</TableCell>
                    <TableCell>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fusionCards.map((card) => (
                    <TableRow key={card.id}>
                      <TableCell>{card.term}</TableCell>
                      <TableCell>
                        {card.personalizedDefinition.slice(0, 50)}...
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setPreviewContent(JSON.stringify(card, null, 2))
                            setPreviewOpen(true)
                          }}
                        >
                          <PreviewIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
      
      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>内容预览</DialogTitle>
        <DialogContent>
          <Box
            component="pre"
            sx={{
              fontFamily: 'monospace',
              fontSize: 12,
              bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
              p: 2,
              borderRadius: 1,
              overflow: 'auto',
              maxHeight: 400,
            }}
          >
            {previewContent}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>关闭</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ExportPanel
