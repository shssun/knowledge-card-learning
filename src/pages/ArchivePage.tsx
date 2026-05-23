import { useState } from 'react'
import {
  Container,
  Box,
  Typography,
  Tabs,
  Tab,
  Grid,
} from '@mui/material'
import ArchiveCenter from '../features/archive/ArchiveCenter'
import TimelineView from '../features/archive/TimelineView'
import StatsPanel from '../features/archive/StatsPanel'
import { useIsMobile } from '../hooks/useIsMobile'

function ArchivePage(): JSX.Element {
  const [activeTab, setActiveTab] = useState(0)
  const isMobile = useIsMobile()
  
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight={700} sx={{ mb: 3 }}>
        知识归档
      </Typography>
      
      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{ mb: 3 }}
      >
        <Tab label="归档卡片" />
        <Tab label="时间线" />
        <Tab label="学习统计" />
      </Tabs>
      
      {activeTab === 0 && <ArchiveCenter />}
      {activeTab === 1 && <TimelineView />}
      {activeTab === 2 && <StatsPanel />}
    </Container>
  )
}

export default ArchivePage
