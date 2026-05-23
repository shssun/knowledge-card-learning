import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Box, Container, Typography, Button, Chip } from '@mui/material'
import { ArrowBack as BackIcon } from '@mui/icons-material'
import { useStudyStore } from '../store/studyStore'
import { useUIStore } from '../store/uiStore'
import { hasApiKey } from '../services/openai'
import { ROUTES } from '../constants/routes'
import { StudyStep, SessionStatus } from '../types/study.types'
import { useIsMobile } from '../hooks/useIsMobile'
import StudyWizard from '../features/study/StudyWizard'

function StudyPage(): JSX.Element {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const materialId = searchParams.get('materialId') || ''
  const term = searchParams.get('term') || ''
  const entryMode = (searchParams.get('mode') as 'focused' | 'full') || 'full'
  const { sessions, currentSessionId, getCurrentSession, createSession, setCurrentSession, setCurrentStep } = useStudyStore()
  const { showNotification } = useUIStore()
  const isMobile = useIsMobile()

  const session = getCurrentSession()
  const apiKeyAvailable = hasApiKey()

  // 复用已有 session 或创建新 session
  useEffect(() => {
    const existingSession = sessions.find(
      (s) => s.materialId === materialId && s.status === SessionStatus.ACTIVE
    )
    
    if (existingSession) {
      setCurrentSession(existingSession.id)
      if (term && !existingSession.selectedTerms.includes(term)) {
        const { updateSession } = useStudyStore.getState()
        updateSession(existingSession.id, {
          selectedTerms: [...existingSession.selectedTerms, term],
        })
      }
    } else if (materialId) {
      const initialTerms = term ? [term] : []
      const sessionId = createSession(materialId, initialTerms, entryMode)
      const startStep = entryMode === 'focused' && term
        ? StudyStep.GENERATE_CARD
        : StudyStep.SELECT_CONTENT
      setCurrentStep(sessionId, startStep)
    } else if (term) {
      const sessionId = createSession('default', [term], 'focused')
      setCurrentStep(sessionId, StudyStep.GENERATE_CARD)
    } else if (!session) {
      const sessionId = createSession('default', [], 'full')
      setCurrentStep(sessionId, StudyStep.SELECT_CONTENT)
    }
  }, [materialId, entryMode, term, currentSessionId, sessions])
  
  return (
    <Box>
      <Container maxWidth={isMobile ? false : 'xl'} sx={{ py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate(ROUTES.HOME)}
            sx={{ color: 'text.secondary', minWidth: { xs: 44, sm: 'auto' }, px: { xs: 0, sm: 1 } }}
          >
            {!isMobile && '返回首页'}
          </Button>
          {!apiKeyAvailable && (
            <Chip
              label="内置引擎"
              size="small"
              variant="outlined"
              color="primary"
              onClick={() => navigate(ROUTES.SETTINGS)}
            />
          )}
        </Box>
      </Container>
      <StudyWizard />
    </Box>
  )
}

export default StudyPage
