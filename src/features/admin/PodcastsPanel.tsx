import { useState, useMemo, useCallback, useRef } from 'react'
import {
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Tooltip,
  Alert,
} from '@mui/material'
import {
  Add as AddIcon,
  Upload as UploadIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Audiotrack as AudioIcon,
  HourglassEmpty as PendingIcon,
} from '@mui/icons-material'
import { usePodcastStore, PodcastStatus } from '../../store/podcastStore'
import { useDomainStore } from '../../store/domainStore'
import { useAudioStore } from '../../store/audioStore'
import { Podcast } from '../../store/podcastStore'

const STATUS_CONFIG: Record<PodcastStatus, { label: string; color: string; Icon: typeof PendingIcon }> = {
  pending: { label: '待生成', color: '#f59e0b', Icon: PendingIcon },
  generated: { label: '已上传', color: '#3b82f6', Icon: AudioIcon },
  failed: { label: '生成失败', color: '#ef4444', Icon: ErrorIcon },
  reviewed: { label: '已审核', color: '#10b981', Icon: CheckIcon },
}

const STATUS_TABS: { label: string; value: PodcastStatus | 'all' }[] = [
  { label: '全部', value: 'all' },
  { label: '待生成', value: 'pending' },
  { label: '已上传', value: 'generated' },
  { label: '失败', value: 'failed' },
  { label: '已审核', value: 'reviewed' },
]

function PodcastsPanel(): JSX.Element {
  const { podcasts, addPodcast, updatePodcast, deletePodcast, getStatusCounts } = usePodcastStore()
  const { domains } = useDomainStore()
  const { addAudio } = useAudioStore()

  const [filterStatus, setFilterStatus] = useState<PodcastStatus | 'all'>('all')
  const [addOpen, setAddOpen] = useState(false)
  const [editPodcast, setEditPodcast] = useState<Podcast | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingUploadId, setPendingUploadId] = useState<string | null>(null)

  // 表单状态
  const [formName, setFormName] = useState('')
  const [formDomainId, setFormDomainId] = useState('')
  const [formStatus, setFormStatus] = useState<PodcastStatus>('pending')
  const [formNote, setFormNote] = useState('')

  const counts = getStatusCounts()

  const filtered = useMemo(() => {
    if (filterStatus === 'all') return podcasts
    return podcasts.filter((p) => p.status === filterStatus)
  }, [podcasts, filterStatus])

  const getDomainName = (id: string) => domains.find((d) => d.id === id)?.name || id

  // 触发上传（先记住要上传的播客 ID）
  const triggerUpload = (podcastId: string) => {
    setPendingUploadId(podcastId)
    fileInputRef.current?.click()
  }

  // 处理文件上传
  const handleAudioUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file || !pendingUploadId) return
      const podcast = podcasts.find((p) => p.id === pendingUploadId)
      if (!podcast) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string
        const audio = new Audio(base64)
        audio.addEventListener('loadedmetadata', () => {
          addAudio({
            name: file.name.replace(/\.[^.]+$/, ''),
            domain: getDomainName(podcast.domainId),
            audioData: base64,
            duration: audio.duration || 0,
          })
          updatePodcast(podcast.id, {
            status: 'generated',
            audioName: file.name.replace(/\.[^.]+$/, ''),
          })
        })
      }
      reader.readAsDataURL(file)
      e.target.value = ''
      setPendingUploadId(null)
    },
    [pendingUploadId, podcasts, addAudio, updatePodcast]
  )

  // 打开新增弹窗
  const openAdd = (): void => {
    setFormName('')
    setFormDomainId(domains[0]?.id || '')
    setFormStatus('pending')
    setFormNote('')
    setAddOpen(true)
  }

  // 提交新增
  const handleAdd = (): void => {
    if (!formName.trim() || !formDomainId) return
    addPodcast({ name: formName.trim(), domainId: formDomainId, termIds: [], status: formStatus, reviewNote: formNote })
    setAddOpen(false)
  }

  // 打开编辑弹窗
  const openEdit = (p: Podcast): void => {
    setFormName(p.name)
    setFormDomainId(p.domainId)
    setFormStatus(p.status)
    setFormNote(p.reviewNote || '')
    setEditPodcast(p)
  }

  // 提交编辑
  const handleEdit = (): void => {
    if (!editPodcast) return
    updatePodcast(editPodcast.id, {
      name: formName.trim(),
      domainId: formDomainId,
      status: formStatus,
      reviewNote: formNote,
    })
    setEditPodcast(null)
  }

  return (
    <Box>
      {/* 隐藏的文件 input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        style={{ display: 'none' }}
        onChange={handleAudioUpload}
      />

      {/* 工具栏 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {STATUS_TABS.map((t) => (
            <Chip
              key={t.value}
              label={`${t.label} (${t.value === 'all' ? podcasts.length : counts[t.value as PodcastStatus] ?? 0})`}
              onClick={() => setFilterStatus(t.value as PodcastStatus | 'all')}
              color={filterStatus === t.value ? 'primary' : 'default'}
              variant={filterStatus === t.value ? 'filled' : 'outlined'}
            />
          ))}
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>
          新增播客
        </Button>
      </Box>

      {filtered.length === 0 ? (
        <Alert severity="info">暂无播客，点击上方「新增播客」创建</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell>播客名称</TableCell>
                <TableCell>所属领域</TableCell>
                <TableCell>状态</TableCell>
                <TableCell>审核备注</TableCell>
                <TableCell>更新时间</TableCell>
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((p) => {
                const cfg = STATUS_CONFIG[p.status]
                return (
                  <TableRow key={p.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>{p.name}</Typography>
                    </TableCell>
                    <TableCell><Chip label={getDomainName(p.domainId)} size="small" /></TableCell>
                    <TableCell>
                      <Chip
                        label={cfg.label}
                        size="small"
                        icon={<cfg.Icon sx={{ fontSize: 14 }} />}
                        sx={{ bgcolor: cfg.color + '20', color: cfg.color }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 160, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.reviewNote || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(p.updatedAt).toLocaleDateString('zh-CN')}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                        {p.status === 'pending' || p.status === 'failed' ? (
                          <Tooltip title="上传音频">
                            <IconButton size="small" color="primary" onClick={() => triggerUpload(p.id)}>
                              <UploadIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : null}
                        <Tooltip title="编辑">
                          <IconButton size="small" onClick={() => openEdit(p)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="删除">
                          <IconButton size="small" color="error" onClick={() => deletePodcast(p.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 新增弹窗 */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>新增播客</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="播客名称" value={formName} onChange={(e) => setFormName(e.target.value)} fullWidth autoFocus />
          <FormControl fullWidth>
            <InputLabel>所属领域</InputLabel>
            <Select value={formDomainId} label="所属领域" onChange={(e) => setFormDomainId(e.target.value)}>
              {domains.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="审核备注（可选）" value={formNote} onChange={(e) => setFormNote(e.target.value)} multiline rows={2} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>取消</Button>
          <Button variant="contained" onClick={handleAdd}>创建</Button>
        </DialogActions>
      </Dialog>

      {/* 编辑弹窗 */}
      <Dialog open={Boolean(editPodcast)} onClose={() => setEditPodcast(null)} maxWidth="sm" fullWidth>
        <DialogTitle>编辑播客</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="播客名称" value={formName} onChange={(e) => setFormName(e.target.value)} fullWidth autoFocus />
          <FormControl fullWidth>
            <InputLabel>所属领域</InputLabel>
            <Select value={formDomainId} label="所属领域" onChange={(e) => setFormDomainId(e.target.value)}>
              {domains.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>状态</InputLabel>
            <Select value={formStatus} label="状态" onChange={(e) => setFormStatus(e.target.value as PodcastStatus)}>
              {(Object.keys(STATUS_CONFIG) as PodcastStatus[]).map((k) => (
                <MenuItem key={k} value={k}>{STATUS_CONFIG[k].label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField label="审核备注" value={formNote} onChange={(e) => setFormNote(e.target.value)} multiline rows={2} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditPodcast(null)}>取消</Button>
          <Button variant="contained" onClick={handleEdit}>保存</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default PodcastsPanel
