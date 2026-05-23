import { useState } from 'react'
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Button,
  Grid,
} from '@mui/material'
import { Add as AddIcon, UploadFile as UploadFileIcon } from '@mui/icons-material'
import MaterialLibrary from './MaterialLibrary'
import WordBankEditor from './WordBankEditor'
import UploadMaterial from './UploadMaterial'
import BatchImportMaterial from './BatchImportMaterial'
import { useIsMobile } from '../../hooks/useIsMobile'

function MaterialCenter(): JSX.Element {
  const [activeTab, setActiveTab] = useState(0)
  const [showUpload, setShowUpload] = useState(false)
  const [showBatchImport, setShowBatchImport] = useState(false)
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null)
  const isMobile = useIsMobile()
  
  const handleEditMaterial = (id: string): void => {
    setEditingMaterialId(id)
    setShowUpload(true)
  }
  
  const handleCloseUpload = (): void => {
    setShowUpload(false)
    setEditingMaterialId(null)
  }
  
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight={700}>
          资料中心
        </Typography>
        <Button
          variant="outlined"
          startIcon={<UploadFileIcon />}
          onClick={() => setShowBatchImport(true)}
          sx={{ minWidth: { xs: 44, sm: 'auto' }, px: { xs: 0, sm: 1.5 } }}
        >
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>批量导入</Box>
        </Button>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowUpload(true)}
          sx={{ minWidth: { xs: 44, sm: 'auto' }, px: { xs: 0, sm: 2 } }}
        >
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' }, ml: 1 }}>上传资料</Box>
        </Button>
      </Box>
      
      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{ mb: 3 }}
      >
        <Tab label="资料库" />
        <Tab label="词库管理" />
      </Tabs>
      
      {activeTab === 0 && <MaterialLibrary onEditMaterial={handleEditMaterial} />}
      {activeTab === 1 && <WordBankEditor />}
      
      {showUpload && (
        <UploadMaterial
          onClose={handleCloseUpload}
          materialId={editingMaterialId ?? undefined}
        />
      )}

      {showBatchImport && (
        <BatchImportMaterial onClose={() => setShowBatchImport(false)} />
      )}
    </Container>
  )
}

export default MaterialCenter
