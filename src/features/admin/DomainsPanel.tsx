import { useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
} from '@mui/material'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Folder as FolderIcon } from '@mui/icons-material'
import { useDomainStore, Domain } from '../../store/domainStore'
import { useTermStore } from '../../store/termStore'

function DomainsPanel(): JSX.Element {
  const { domains, addDomain, updateDomain, deleteDomain } = useDomainStore()
  const { terms } = useTermStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDomain, setEditDomain] = useState<Domain | null>(null)
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')

  const getTermCount = (domainId: string) => terms.filter((t) => t.domainId === domainId).length

  const openAdd = (): void => {
    setEditDomain(null)
    setFormName('')
    setFormDesc('')
    setDialogOpen(true)
  }

  const openEdit = (d: Domain): void => {
    setEditDomain(d)
    setFormName(d.name)
    setFormDesc(d.description)
    setDialogOpen(true)
  }

  const handleSave = (): void => {
    if (!formName.trim()) return
    if (editDomain) {
      updateDomain(editDomain.id, { name: formName.trim(), description: formDesc.trim() })
    } else {
      addDomain({ name: formName.trim(), description: formDesc.trim() })
    }
    setDialogOpen(false)
  }

  const handleDelete = (d: Domain): void => {
    const count = getTermCount(d.id)
    const msg = count > 0
      ? `该领域下有 ${count} 个术语，删除后关联术语也会清空。确定删除「${d.name}」吗？`
      : `确定删除「${d.name}」吗？`
    if (window.confirm(msg)) {
      deleteDomain(d.id)
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          共 {domains.length} 个领域
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>
          新增领域
        </Button>
      </Box>

      {domains.length === 0 ? (
        <Alert severity="info">暂无领域，点击上方「新增领域」创建</Alert>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 2 }}>
          {domains.map((d) => (
            <Card key={d.id} variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FolderIcon color="primary" fontSize="small" />
                    <Typography variant="subtitle1" fontWeight={600}>{d.name}</Typography>
                  </Box>
                  <Box>
                    <IconButton size="small" onClick={() => openEdit(d)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(d)}><DeleteIcon fontSize="small" /></IconButton>
                  </Box>
                </Box>
                {d.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {d.description}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip label={`${getTermCount(d.id)} 个术语`} size="small" />
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editDomain ? '编辑领域' : '新增领域'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="领域名称" value={formName} onChange={(e) => setFormName(e.target.value)} fullWidth autoFocus />
          <TextField label="描述（可选）" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} multiline rows={2} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>取消</Button>
          <Button variant="contained" onClick={handleSave}>{editDomain ? '保存' : '创建'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default DomainsPanel
