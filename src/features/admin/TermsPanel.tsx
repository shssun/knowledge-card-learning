import { useState } from 'react'
import {
  Box,
  Button,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Alert,
} from '@mui/material'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Label as LabelIcon } from '@mui/icons-material'
import { useTermStore, Term } from '../../store/termStore'
import { useDomainStore } from '../../store/domainStore'

function TermsPanel(): JSX.Element {
  const { terms, addTerm, updateTerm, deleteTerm } = useTermStore()
  const { domains } = useDomainStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTerm, setEditTerm] = useState<Term | null>(null)
  const [formName, setFormName] = useState('')
  const [formDomainId, setFormDomainId] = useState('')
  const [formDesc, setFormDesc] = useState('')

  const getDomainName = (id: string) => domains.find((d) => d.id === id)?.name || id

  const openAdd = (): void => {
    setEditTerm(null)
    setFormName('')
    setFormDomainId(domains[0]?.id || '')
    setFormDesc('')
    setDialogOpen(true)
  }

  const openEdit = (t: Term): void => {
    setEditTerm(t)
    setFormName(t.name)
    setFormDomainId(t.domainId)
    setFormDesc(t.description || '')
    setDialogOpen(true)
  }

  const handleSave = (): void => {
    if (!formName.trim() || !formDomainId) return
    if (editTerm) {
      updateTerm(editTerm.id, { name: formName.trim(), domainId: formDomainId, description: formDesc.trim() || undefined })
    } else {
      addTerm({ name: formName.trim(), domainId: formDomainId, description: formDesc.trim() || undefined })
    }
    setDialogOpen(false)
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          共 {terms.length} 个术语
          {domains.length === 0 && <Alert severity="warning" sx={{ mt: 1 }}>请先在「领域管理」中添加领域，再添加术语</Alert>}
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd} disabled={domains.length === 0}>
          新增术语
        </Button>
      </Box>

      {terms.length === 0 ? (
        <Alert severity="info">暂无术语，点击上方「新增术语」创建</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell>术语名称</TableCell>
                <TableCell>所属领域</TableCell>
                <TableCell>描述</TableCell>
                <TableCell>添加时间</TableCell>
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {terms.map((t) => (
                <TableRow key={t.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LabelIcon fontSize="small" color="action" />
                      <Typography variant="body2" fontWeight={500}>{t.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{getDomainName(t.domainId)}</TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {t.description || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(t.createdAt).toLocaleDateString('zh-CN')}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEdit(t)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => deleteTerm(t.id)}><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editTerm ? '编辑术语' : '新增术语'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="术语名称" value={formName} onChange={(e) => setFormName(e.target.value)} fullWidth autoFocus />
          <FormControl fullWidth>
            <InputLabel>所属领域</InputLabel>
            <Select value={formDomainId} label="所属领域" onChange={(e) => setFormDomainId(e.target.value)}>
              {domains.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="描述（可选）" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} multiline rows={2} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>取消</Button>
          <Button variant="contained" onClick={handleSave}>{editTerm ? '保存' : '创建'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default TermsPanel
