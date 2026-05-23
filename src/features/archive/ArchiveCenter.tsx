import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Stack,
} from '@mui/material'
import {
  Search as SearchIcon,
  MoreVert as MoreIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Share as ShareIcon,
  AccountTree as GraphIcon,
  School as LevelIcon,
  Sort as SortIcon,
} from '@mui/icons-material'
import { useArchiveStore } from '../../store/archiveStore'
import { ArchiveRecord } from '../../types/archive.types'
import { ROUTES } from '../../constants/routes'
import EmptyState from '../../components/ui/EmptyState'
import ArchiveDetail from './ArchiveDetail'

type SortKey = 'newest' | 'oldest' | 'score'

function ArchiveCenter(): JSX.Element {
  const { records, deleteRecord } = useArchiveStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [domainFilter, setDomainFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortKey>('newest')
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [viewRecord, setViewRecord] = useState<ArchiveRecord | null>(null)
  const navigate = useNavigate()

  // 提取所有领域作为筛选选项
  const availableDomains = useMemo(() => {
    const domains = new Set(records.map((r) => r.domain))
    return Array.from(domains).sort()
  }, [records])

  // 搜索 + 筛选 + 排序
  const filteredRecords = useMemo(() => {
    let result = [...records]

    // 文本搜索
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter((r) => {
        const titleMatch = r.title.toLowerCase().includes(q)
        const termMatch = r.terms.some((t) => t.toLowerCase().includes(q))
        const cardContentMatch = r.fusionCards?.some(
          (card) =>
            card.term.toLowerCase().includes(q) ||
            (card.personalizedDefinition?.toLowerCase() || '').includes(q) ||
            (card.practicalCases?.toLowerCase() || '').includes(q) ||
            (card.refinedBoundary?.toLowerCase() || '').includes(q) ||
            (card.deepLogic?.toLowerCase() || '').includes(q)
        ) ?? false
        return titleMatch || termMatch || cardContentMatch
      })
    }

    // 领域筛选
    if (domainFilter !== 'all') {
      result = result.filter((r) => r.domain === domainFilter)
    }

    // 排序
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.studiedAt).getTime() - new Date(a.studiedAt).getTime()
        case 'oldest':
          return new Date(a.studiedAt).getTime() - new Date(b.studiedAt).getTime()
        case 'score':
          return b.averageScore - a.averageScore
        default:
          return 0
      }
    })

    return result
  }, [records, searchQuery, domainFilter, sortBy])
  
  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    id: string
  ): void => {
    setAnchorEl(event.currentTarget)
    setSelectedId(id)
  }
  
  const handleMenuClose = (): void => {
    setAnchorEl(null)
    setSelectedId(null)
  }
  
  const handleDelete = (): void => {
    if (selectedId && window.confirm('确定要删除这条归档记录吗？')) {
      deleteRecord(selectedId)
    }
    handleMenuClose()
  }
  
  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'success.main'
    if (score >= 75) return 'primary.main'
    if (score >= 60) return 'warning.main'
    return 'error.main'
  }
  
  if (records.length === 0) {
    return (
      <EmptyState
        title="暂无归档记录"
        description="完成学习后将自动创建归档记录"
      />
    )
  }
  
  return (
    <Box>
      {/* 搜索 + 筛选 + 排序 工具栏 */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="搜索术语、定义、案例..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ minWidth: { xs: '100%', sm: 260 }, flexGrow: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
        />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>领域</InputLabel>
          <Select value={domainFilter} label="领域" onChange={(e) => setDomainFilter(e.target.value)}>
            <MenuItem value="all">全部领域</MenuItem>
            {availableDomains.map((d) => (
              <MenuItem key={d} value={d}>{d}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>排序</InputLabel>
          <Select value={sortBy} label="排序" onChange={(e) => setSortBy(e.target.value as SortKey)}>
            <MenuItem value="newest">最新优先</MenuItem>
            <MenuItem value="oldest">最早优先</MenuItem>
            <MenuItem value="score">分数最高</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* 搜索结果统计 */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        共 {records.length} 条记录
        {filteredRecords.length < records.length && (
          <Chip
            label={`筛选出 ${filteredRecords.length} 条`}
            size="small"
            variant="outlined"
            sx={{ ml: 1, fontSize: 11 }}
          />
        )}
      </Typography>

      {/* 搜索结果为空 */}
      {filteredRecords.length === 0 && searchQuery.trim() !== '' ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <SearchIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            没有找到匹配的记录
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
            <Button size="small" onClick={() => setSearchQuery('')}>清除搜索</Button>
            {domainFilter !== 'all' && (
              <Button size="small" onClick={() => setDomainFilter('all')}>显示全领域</Button>
            )}
          </Box>
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 2 }}>
        {filteredRecords.map((record) => (
          <Card key={record.id}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h6" fontWeight={600}>
                  {record.title}
                </Typography>
                <IconButton
                  size="small"
                  onClick={(e) => handleMenuOpen(e, record.id)}
                >
                  <MoreIcon />
                </IconButton>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Chip label={record.domain} size="small" />
                <Typography
                  variant="h5"
                  fontWeight={700}
                  sx={{ color: getScoreColor(record.averageScore) }}
                >
                  {record.averageScore.toFixed(0)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  平均分
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                学习 {record.terms.length} 个术语
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                {record.terms.slice(0, 3).map((term) => (
                  <Chip
                    key={term}
                    label={term}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: 11 }}
                  />
                ))}
                {record.terms.length > 3 && (
                  <Chip
                    label={`+${record.terms.length - 3}`}
                    size="small"
                    sx={{ fontSize: 11 }}
                  />
                )}
              </Box>
              
              <Typography variant="caption" color="text.secondary">
                {new Date(record.studiedAt).toLocaleDateString('zh-CN')}
              </Typography>
            </CardContent>
            
            <Box sx={{ p: 1, pt: 0 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ViewIcon />}
                onClick={() => setViewRecord(record)}
              >
                查看详情
              </Button>
            </Box>
          </Card>
        ))}
      </Box>
      )}
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { setViewRecord(records.find(r => r.id === selectedId) || null); handleMenuClose(); }}>
          <ViewIcon fontSize="small" sx={{ mr: 1 }} />
          查看详情
        </MenuItem>
        <MenuItem
          onClick={() => {
            const r = records.find(r => r.id === selectedId)
            if (r) navigate(ROUTES.GRAPH.replace(':domain', r.domain))
            handleMenuClose()
          }}
        >
          <GraphIcon fontSize="small" sx={{ mr: 1 }} />
          查看图谱
        </MenuItem>
        <MenuItem
          onClick={() => {
            const r = records.find(r => r.id === selectedId)
            if (r) navigate(ROUTES.LEVEL.replace(':domain', r.domain))
            handleMenuClose()
          }}
        >
          <LevelIcon fontSize="small" sx={{ mr: 1 }} />
          分级学习
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ShareIcon fontSize="small" sx={{ mr: 1 }} />
          导出
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          删除
        </MenuItem>
      </Menu>
      
      <Dialog
        open={Boolean(viewRecord)}
        onClose={() => setViewRecord(null)}
        maxWidth="md"
        fullWidth
      >
        {viewRecord && <ArchiveDetail record={viewRecord} onClose={() => setViewRecord(null)} />}
      </Dialog>
    </Box>
  )
}

export default ArchiveCenter
