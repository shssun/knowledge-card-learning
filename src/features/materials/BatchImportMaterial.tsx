import { useState, useRef, useCallback } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
  Chip,
} from '@mui/material'
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Description as DescIcon,
} from '@mui/icons-material'
import mammoth from 'mammoth'
import { useMaterialStore } from '../../store/materialStore'
import { MaterialCategory, DifficultyLevel } from '../../types/material.types'

interface ParsedFile {
  name: string
  title: string
  content: string
  size: number
  status: 'pending' | 'reading' | 'ready' | 'error'
  error?: string
}

interface BatchImportMaterialProps {
  onClose: () => void
}

function BatchImportMaterial({ onClose }: BatchImportMaterialProps): JSX.Element {
  const { addMaterial } = useMaterialStore()
  const [files, setFiles] = useState<ParsedFile[]>([])
  const [category, setCategory] = useState<MaterialCategory>(MaterialCategory.FREE_RESEARCH)
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(DifficultyLevel.BEGINNER)
  const [isProcessing, setIsProcessing] = useState(false)
  const [editingTitle, setEditingTitle] = useState<string | null>(null)
  const [editTitleValue, setEditTitleValue] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Read a single file
  const readFile = useCallback(async (file: File): Promise<ParsedFile> => {
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '')

    if (file.name.endsWith('.docx')) {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = async (e) => {
          try {
            const arrayBuffer = e.target?.result as ArrayBuffer
            const result = await mammoth.extractRawText({ arrayBuffer })
            const content = result.value.trim()
            if (!content) {
              resolve({ name: file.name, title: nameWithoutExt, content: '', size: file.size, status: 'error', error: '文档内容为空' })
            } else {
              resolve({ name: file.name, title: nameWithoutExt, content, size: file.size, status: 'ready' })
            }
          } catch {
            resolve({ name: file.name, title: nameWithoutExt, content: '', size: file.size, status: 'error', error: 'docx 解析失败' })
          }
        }
        reader.onerror = () => {
          resolve({ name: file.name, title: nameWithoutExt, content: '', size: file.size, status: 'error', error: '文件读取失败' })
        }
        reader.readAsArrayBuffer(file)
      })
    } else {
      // Plain text
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          const content = (e.target?.result as string)?.trim() ?? ''
          if (!content) {
            resolve({ name: file.name, title: nameWithoutExt, content: '', size: file.size, status: 'error', error: '文件内容为空' })
          } else {
            resolve({ name: file.name, title: nameWithoutExt, content, size: file.size, status: 'ready' })
          }
        }
        reader.onerror = () => {
          resolve({ name: file.name, title: nameWithoutExt, content: '', size: file.size, status: 'error', error: '文件读取失败' })
        }
        reader.readAsText(file)
      })
    }
  }, [])

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? [])
    if (selectedFiles.length === 0) return

    const invalid = selectedFiles.filter(
      (f) => !f.name.endsWith('.txt') && !f.name.endsWith('.docx')
    )
    if (invalid.length > 0) {
      alert(`不支持的文件格式：${invalid.map((f) => f.name).join(', ')}\n仅支持 .txt 和 .docx 文件`)
      return
    }

    // Add as pending, mark as reading
    const newEntries: ParsedFile[] = selectedFiles.map((f) => ({
      name: f.name,
      title: f.name.replace(/\.[^/.]+$/, ''),
      content: '',
      size: f.size,
      status: 'reading',
    }))
    setFiles((prev) => [...prev, ...newEntries])

    // Process in parallel batches of 5
    const BATCH = 5
    for (let i = 0; i < selectedFiles.length; i += BATCH) {
      const batch = selectedFiles.slice(i, i + BATCH)
      const results = await Promise.all(batch.map(readFile))
      setFiles((prev) => {
        const updated = [...prev]
        results.forEach((result, j) => {
          const idx = updated.findIndex((f) => f.name === batch[j].name && f.status === 'reading')
          if (idx !== -1) updated[idx] = result
        })
        return updated
      })
    }

    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleRemoveFile = (name: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== name))
  }

  const handleStartEditTitle = (file: ParsedFile) => {
    setEditingTitle(file.name)
    setEditTitleValue(file.title)
  }

  const handleSaveTitle = (name: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.name === name ? { ...f, title: editTitleValue.trim() || f.title } : f))
    )
    setEditingTitle(null)
  }

  const handleImportAll = () => {
    const readyFiles = files.filter((f) => f.status === 'ready')
    readyFiles.forEach((f) => {
      addMaterial({
        title: f.title,
        content: f.content,
        category,
        difficulty,
        keywords: [],
        source: '',
      })
    })
    onClose()
  }

  const readyCount = files.filter((f) => f.status === 'ready').length
  const errorCount = files.filter((f) => f.status === 'error').length
  const readingCount = files.filter((f) => f.status === 'reading').length

  const categoryLabel: Record<MaterialCategory, string> = {
    [MaterialCategory.SCHOOL_SUBJECT]: '学科课程',
    [MaterialCategory.INDUSTRY_TRACK]: '行业赛道',
    [MaterialCategory.FREE_RESEARCH]: '自由研究',
  }

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <UploadIcon color="primary" />
          批量导入资料
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {/* File picker area */}
        <Box
          onClick={() => fileInputRef.current?.click()}
          sx={{
            border: '2px dashed',
            borderColor: 'primary.main',
            borderRadius: 3,
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            bgcolor: 'primary.50',
            transition: 'all 0.2s',
            '&:hover': { bgcolor: 'primary.100', borderColor: 'primary.dark' },
          }}
        >
          <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
          <Typography variant="h6" color="primary.main">
            点击选择文件
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            支持 .txt 和 .docx 文件，可多选
          </Typography>
          <Typography variant="caption" color="text.secondary">
            一次导入多个文件，每个文件将作为一条独立资料
          </Typography>
        </Box>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.docx"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {/* Metadata row */}
        {files.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2 }}>
              <Chip label="批量设置" size="small" />
            </Divider>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>分类</InputLabel>
                <Select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as MaterialCategory)}
                  label="分类"
                >
                  <MenuItem value={MaterialCategory.SCHOOL_SUBJECT}>学科课程</MenuItem>
                  <MenuItem value={MaterialCategory.INDUSTRY_TRACK}>行业赛道</MenuItem>
                  <MenuItem value={MaterialCategory.FREE_RESEARCH}>自由研究</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>难度</InputLabel>
                <Select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                  label="难度"
                >
                  <MenuItem value={DifficultyLevel.BEGINNER}>入门</MenuItem>
                  <MenuItem value={DifficultyLevel.INTERMEDIATE}>进阶</MenuItem>
                  <MenuItem value={DifficultyLevel.ADVANCED}>高级</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        )}

        {/* File list */}
        {files.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="subtitle2">
                待导入文件（{files.length}）
              </Typography>
              {readingCount > 0 && (
                <CircularProgress size={14} thickness={5} />
              )}
            </Box>
            {errorCount > 0 && (
              <Alert severity="warning" sx={{ mb: 1, py: 0.5 }}>
                {errorCount} 个文件读取失败或内容为空，已跳过
              </Alert>
            )}
            <List dense sx={{ maxHeight: 360, overflow: 'auto', bgcolor: 'grey.50', borderRadius: 2 }}>
              {files.map((file) => (
                <ListItem
                  key={file.name}
                  sx={{
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:last-child': { borderBottom: 'none' },
                    bgcolor:
                      file.status === 'error'
                        ? 'error.50'
                        : file.status === 'ready'
                        ? 'background.paper'
                        : 'grey.100',
                  }}
                  secondaryAction={
                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                      {file.status === 'ready' && (
                        <>
                          {editingTitle === file.name ? (
                            <>
                              <TextField
                                size="small"
                                value={editTitleValue}
                                onChange={(e) => setEditTitleValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveTitle(file.name)
                                  if (e.key === 'Escape') setEditingTitle(null)
                                }}
                                autoFocus
                                sx={{ width: 200 }}
                              />
                              <IconButton size="small" onClick={() => handleSaveTitle(file.name)}>
                                <CheckIcon fontSize="small" color="success" />
                              </IconButton>
                              <IconButton size="small" onClick={() => setEditingTitle(null)}>
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </>
                          ) : (
                            <IconButton size="small" onClick={() => handleStartEditTitle(file)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          )}
                        </>
                      )}
                      {file.status !== 'reading' && (
                        <IconButton size="small" onClick={() => handleRemoveFile(file.name)}>
                          <DeleteIcon fontSize="small" color="error" />
                        </IconButton>
                      )}
                    </Box>
                  }
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DescIcon fontSize="small" color="action" />
                        {editingTitle === file.name ? (
                          <TextField
                            size="small"
                            value={editTitleValue}
                            onChange={(e) => setEditTitleValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveTitle(file.name)
                            }}
                            sx={{ flexGrow: 1 }}
                            variant="standard"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                            onFocus={(e) => e.currentTarget.select()}
                          />
                        ) : (
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 500,
                              color: file.status === 'error' ? 'error.main' : 'text.primary',
                            }}
                          >
                            {file.title}
                          </Typography>
                        )}
                        {file.status === 'reading' && (
                          <CircularProgress size={12} thickness={5} />
                        )}
                        {file.status === 'error' && (
                          <Typography variant="caption" color="error">
                            {file.error}
                          </Typography>
                        )}
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {file.name}
                        {file.status === 'ready' && (
                          <> · {Math.round(file.size / 1024)}KB · {file.content.length} 字</>
                        )}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>取消</Button>
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          disabled={readyCount === 0 || readingCount > 0}
          onClick={handleImportAll}
        >
          导入 {readyCount} 条资料
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default BatchImportMaterial
