import { useState } from 'react'
import {
  Container,
  Box,
  Typography,
  Tabs,
  Tab,
} from '@mui/material'
import OutputCenter from '../features/output/OutputCenter'
import SceneSelector from '../features/output/SceneSelector'
import OutputTemplates from '../features/output/OutputTemplates'
import ExportPanel from '../features/output/ExportPanel'
import { useIsMobile } from '../hooks/useIsMobile'

function OutputPage(): JSX.Element {
  const [activeTab, setActiveTab] = useState(0)
  const isMobile = useIsMobile()
  
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight={700} sx={{ mb: 3 }}>
        成果输出
      </Typography>
      
      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{ mb: 3 }}
      >
        <Tab label="输出中心" />
        <Tab label="场景选择" />
        <Tab label="输出模板" />
        <Tab label="导出管理" />
      </Tabs>
      
      {activeTab === 0 && <OutputCenter />}
      {activeTab === 1 && <SceneSelector />}
      {activeTab === 2 && <OutputTemplates />}
      {activeTab === 3 && <ExportPanel />}
    </Container>
  )
}

export default OutputPage
