import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGraphStore } from '../../store/graphStore'
import { useArchiveStore } from '../../store/archiveStore'
import { useIsMobile } from '../../hooks/useIsMobile'
import DomainGraph from './DomainGraph'
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Paper,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  useTheme,
} from '@mui/material'
import { ArrowBack as BackIcon, Refresh as RefreshIcon, School as StudyIcon } from '@mui/icons-material'
import { GraphNode } from '../../types/graph.types'
import { ROUTES } from '../../constants/routes'

export default function GraphPage(): JSX.Element {
  const { domain } = useParams<{ domain: string }>()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const theme = useTheme()

  const graph = useGraphStore((s) => (domain ? s.getGraph(domain) : undefined))
  const archiveRecords = useArchiveStore((s) => s.records)
  const buildGraph = useGraphStore((s) => s.buildGraphFromArchive)

  // D3 图谱高度：移动端 400px，桌面端 600px
  const graphHeight = isMobile ? 400 : 600
  const isDark = theme.palette.mode === 'dark'

  // 节点点击确认对话框
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)

  const handleNodeClick = (node: GraphNode) => {
    // 找到该节点的融合卡片，在对话框中展示简要信息
    setSelectedNode(node)
    setDialogOpen(true)
  }

  const handleStartStudy = () => {
    if (!selectedNode) return
    setDialogOpen(false)
    // 导航到研习页面，预填该术语，使用 focused 模式跳过 Step1
    navigate(`/study?term=${encodeURIComponent(selectedNode.term)}&mode=focused`)
  }

  const handleBuildGraph = () => {
    if (!domain) return
    buildGraph(domain, archiveRecords)
  }

  // 找选中节点的融合卡信息，用于对话框展示
  const selectedCard = selectedNode
    ? archiveRecords
        .flatMap((r) => r.fusionCards ?? [])
        .find((c) => c.term === selectedNode.term)
    : null

  if (!domain) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">未指定领域</Alert>
      </Box>
    )
  }

  const hasGraph = graph && (graph.nodes.length > 0 || graph.edges.length > 0)

  return (
    <Box sx={{ p: { xs: 1, sm: 3 } }}>
      {/* 顶部导航 */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
        <Tooltip title="返回">
          <IconButton onClick={() => navigate(-1)} size="small">
            <BackIcon />
          </IconButton>
        </Tooltip>
        <Typography variant="h6" fontWeight={600}>
          知识图谱
        </Typography>
        <Chip label={domain} size="small" color="primary" />
      </Box>

      {/* 操作栏 */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Tooltip title="从归档记录重建图谱（仅节点）">
          <IconButton onClick={handleBuildGraph} size="small">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
        <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
          {hasGraph
            ? `${graph.nodes.length} 个节点，${graph.edges.length} 条关系`
            : '暂无图谱数据，请先研习并生成融合卡片'}
        </Typography>
      </Box>

      {/* 图谱区域 */}
      {hasGraph ? (
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', borderColor: isDark ? 'grey.800' : 'divider' }}>
          <DomainGraph
            nodes={graph.nodes}
            edges={graph.edges}
            onNodeClick={handleNodeClick}
            height={graphHeight}
            darkMode={isDark}
          />
        </Paper>
      ) : (
        <Alert severity="info" sx={{ mt: 2 }}>
          该领域还没有知识图谱数据。完成研习并生成融合卡片后，AI 会自动建立词汇关系。
          你也可以点击左上角 ↻ 按钮手动重建图谱（仅重建节点，关系需重新研习生成）。
        </Alert>
      )}

      {/* 图例 */}
      {hasGraph && (
        <Paper variant="outlined" sx={{ mt: 2, p: 2, borderRadius: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>关系图例</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {(
              [
                ['包含', '#4caf50'],
                ['对比', '#f44336'],
                ['因果', '#9c27b0'],
                ['应用', '#ff9800'],
                ['进阶', '#2196f3'],
                ['基础', '#8bc34a'],
              ] as [string, string][]
            ).map(([type, color]) => (
              <Box key={type} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: color }} />
                <Typography variant="caption">{type}</Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      {/* 节点点击确认对话框 */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullScreen={isMobile}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <StudyIcon color="primary" />
          {selectedNode?.term}
        </DialogTitle>
        <DialogContent>
          {selectedCard ? (
            <>
              <Typography variant="subtitle2" gutterBottom color="text.secondary">
                你已学过的内容
              </Typography>
              <DialogContentText>
                {selectedCard.personalizedDefinition}
              </DialogContentText>
              {selectedCard.deepLogic && (
                <>
                  <Typography variant="subtitle2" sx={{ mt: 2 }} gutterBottom color="text.secondary">
                    深层逻辑
                  </Typography>
                  <DialogContentText>
                    {selectedCard.deepLogic}
                  </DialogContentText>
                </>
              )}
            </>
          ) : (
            <DialogContentText>
              这是「{selectedNode?.domain}」领域的一个概念，你还未系统研习过它。
            </DialogContentText>
          )}
          <Box sx={{ mt: 2, p: 1.5, bgcolor: 'primary.50', borderRadius: 2 }}>
            <Typography variant="body2" color="primary.main" fontWeight={500}>
              开始一次新的研习，深入理解这个概念
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>取消</Button>
          <Button
            variant="contained"
            onClick={handleStartStudy}
            startIcon={<StudyIcon />}
          >
            开始学习
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
