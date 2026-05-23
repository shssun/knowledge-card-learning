import { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Psychology as BrainIcon,
} from '@mui/icons-material'
import { useReviewStore } from '../../store/reviewStore'
import EmptyState from '../../components/ui/EmptyState'

function MistakeBook(): JSX.Element {
  const { mistakeBook, addMistake, updateMistake, deleteMistake } = useReviewStore()
  
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Form state
  const [term, setTerm] = useState('')
  const [issueType, setIssueType] = useState('')
  const [description, setDescription] = useState('')
  const [correction, setCorrection] = useState('')
  
  const handleAdd = (): void => {
    if (!term.trim()) return
    
    addMistake({
      cardId: '',
      term: term.trim(),
      issueType: issueType.trim() || '理解错误',
      description: description.trim(),
      correction: correction.trim(),
    })
    
    resetForm()
  }
  
  const handleUpdate = (): void => {
    if (!editingId) return
    
    updateMistake(editingId, {
      term: term.trim(),
      issueType: issueType.trim(),
      description: description.trim(),
      correction: correction.trim(),
    })
    
    resetForm()
  }
  
  const handleEdit = (id: string): void => {
    const entry = mistakeBook.find((m) => m.id === id)
    if (!entry) return
    
    setTerm(entry.term)
    setIssueType(entry.issueType)
    setDescription(entry.description)
    setCorrection(entry.correction)
    setEditingId(id)
    setShowAddDialog(true)
  }
  
  const resetForm = (): void => {
    setTerm('')
    setIssueType('')
    setDescription('')
    setCorrection('')
    setEditingId(null)
    setShowAddDialog(false)
  }
  
  // Group by issue type
  const groupedMistakes = mistakeBook.reduce((acc, entry) => {
    if (!acc[entry.issueType]) {
      acc[entry.issueType] = []
    }
    acc[entry.issueType].push(entry)
    return acc
  }, {} as Record<string, typeof mistakeBook>)
  
  if (mistakeBook.length === 0) {
    return (
      <Box>
        <EmptyState
          icon={<BrainIcon sx={{ fontSize: 48 }} />}
          title="错题本为空"
          description="答错的题目会自动收录到这里"
        />
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setShowAddDialog(true)}
          >
            手动添加错题
          </Button>
        </Box>
        
        <Dialog open={showAddDialog} onClose={resetForm} maxWidth="sm" fullWidth>
          <DialogTitle>添加错题</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="术语"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              sx={{ mt: 2, mb: 2 }}
            />
            <TextField
              fullWidth
              label="错误类型"
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              sx={{ mb: 2 }}
              placeholder="例如：概念混淆、记忆不清"
            />
            <TextField
              fullWidth
              multiline
              rows={2}
              label="错误描述"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              multiline
              rows={2}
              label="正确理解"
              value={correction}
              onChange={(e) => setCorrection(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={resetForm}>取消</Button>
            <Button onClick={handleAdd} variant="contained">添加</Button>
          </DialogActions>
        </Dialog>
      </Box>
    )
  }
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="body1" color="text.secondary">
          共 {mistakeBook.length} 条错题记录
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowAddDialog(true)}
        >
          添加错题
        </Button>
      </Box>
      
      {Object.entries(groupedMistakes).map(([type, entries]) => (
        <Box key={type} sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
            {type} ({entries.length})
          </Typography>
          
          <List disablePadding>
            {entries.map((entry) => (
              <ListItem
                key={entry.id}
                sx={{
                  bgcolor: 'grey.50',
                  mb: 1,
                  borderRadius: 2,
                  flexDirection: 'column',
                  alignItems: 'stretch',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle2" fontWeight={600}>
                        {entry.term}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        记录时间：{new Date(entry.recordedAt).toLocaleDateString('zh-CN')}
                      </Typography>
                    }
                  />
                  <Box>
                    <IconButton size="small" onClick={() => handleEdit(entry.id)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => deleteMistake(entry.id)}
                      sx={{ color: 'error.main' }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                
                {entry.description && (
                  <Box sx={{ mt: 1, pl: 2 }}>
                    <Typography variant="caption" color="error.main">
                      错误：{entry.description}
                    </Typography>
                  </Box>
                )}
                
                {entry.correction && (
                  <Box sx={{ mt: 0.5, pl: 2 }}>
                    <Typography variant="caption" color="success.main">
                      正确：{entry.correction}
                    </Typography>
                  </Box>
                )}
              </ListItem>
            ))}
          </List>
        </Box>
      ))}
      
      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onClose={resetForm} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? '编辑错题' : '添加错题'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="术语"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            sx={{ mt: 2, mb: 2 }}
          />
          <TextField
            fullWidth
            label="错误类型"
            value={issueType}
            onChange={(e) => setIssueType(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={2}
            label="错误描述"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={2}
            label="正确理解"
            value={correction}
            onChange={(e) => setCorrection(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={resetForm}>取消</Button>
          <Button onClick={editingId ? handleUpdate : handleAdd} variant="contained">
            {editingId ? '保存' : '添加'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default MistakeBook
