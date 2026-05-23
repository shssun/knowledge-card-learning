import { useState } from 'react'
import { Box, Tabs, Tab, Paper } from '@mui/material'
import PodcastsPanel from './PodcastsPanel'
import DomainsPanel from './DomainsPanel'
import TermsPanel from './TermsPanel'
import DataPanel from './DataPanel'

const PANELS = [
  { label: '🎙️ 播客工单', component: <PodcastsPanel /> },
  { label: '📚 领域管理', component: <DomainsPanel /> },
  { label: '🏷️ 术语管理', component: <TermsPanel /> },
  { label: '💾 数据管理', component: <DataPanel /> },
]

function AdminPage(): JSX.Element {
  const [tab, setTab] = useState(0)

  return (
    <Box>
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {PANELS.map((p, i) => (
            <Tab key={i} label={p.label} />
          ))}
        </Tabs>
      </Paper>
      <Box>{PANELS[tab].component}</Box>
    </Box>
  )
}

export default AdminPage
