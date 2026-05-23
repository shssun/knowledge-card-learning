import { useState } from 'react'
import {
  Container,
  Box,
  Typography,
  Tabs,
  Tab,
} from '@mui/material'
import ReviewQueue from '../features/review/ReviewQueue'
import SpeedReview from '../features/review/SpeedReview'
import ReciteMode from '../features/review/ReciteMode'
import MistakeBook from '../features/review/MistakeBook'
import FinalAssessment from '../features/review/FinalAssessment'
import { useIsMobile } from '../hooks/useIsMobile'
import { ReviewMode } from '../types/review.types'

function ReviewPage(): JSX.Element {
  const [activeTab, setActiveTab] = useState(0)
  const isMobile = useIsMobile()

  const handleStartReview = (mode: ReviewMode): void => {
    switch (mode) {
      case ReviewMode.SPEED_REVIEW:
        setActiveTab(1)
        break
      case ReviewMode.RECITE_MODE:
        setActiveTab(2)
        break
      default:
        break
    }
  }
  
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight={700} sx={{ mb: 3 }}>
        复习中心
      </Typography>
      
      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{ mb: 3 }}
      >
        <Tab label="复习队列" />
        <Tab label="快速复习" />
        <Tab label="背诵模式" />
        <Tab label="错题本" />
        <Tab label="最终测评" />
      </Tabs>
      
      {activeTab === 0 && <ReviewQueue onStartReview={handleStartReview} />}
      {activeTab === 1 && <SpeedReview />}
      {activeTab === 2 && <ReciteMode />}
      {activeTab === 3 && <MistakeBook />}
      {activeTab === 4 && <FinalAssessment />}
    </Container>
  )
}

export default ReviewPage
