import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Typography,
  Button,
  Alert,
  MobileStepper,
} from '@mui/material'
import { ArrowBack as BackIcon } from '@mui/icons-material'
import { useStudyStore } from '../../store/studyStore'
import { StudyStep } from '../../types/study.types'
import { ROUTES } from '../../constants/routes'
import { useIsMobile } from '../../hooks/useIsMobile'
import Step1_SelectContent from './Step1_SelectContent'
import Step2_GenerateCard from './Step2_GenerateCard'
import Step3_Discussion from './Step3_Discussion'
import Step4_FusionCard from './Step4_FusionCard'
import Step5_OutputScore from './Step5_OutputScore'

const steps = [
  { label: '选择内容', description: '选择学习资料和术语' },
  { label: '生成卡片', description: 'AI 生成知识卡片' },
  { label: '深度讨论', description: '与 AI 导师讨论' },
  { label: '融合卡片', description: '生成个性化融合卡' },
  { label: '输出评分', description: '输出理解并获得评分' },
]

function StudyWizard(): JSX.Element {
  const navigate = useNavigate()
  const { getCurrentSession, setCurrentStep } = useStudyStore()
  const session = getCurrentSession()
  const currentStep = session?.currentStep ?? StudyStep.SELECT_CONTENT
  const isMobile = useIsMobile()

  const [error, setError] = useState<string | null>(null)
  
  const handleNext = (): void => {
    if (!session) return
    setError(null)
    if (currentStep < StudyStep.OUTPUT_SCORE) {
      setCurrentStep(session.id, currentStep + 1)
    }
  }

  const handleBack = (): void => {
    if (!session) return
    setError(null)
    if (currentStep > StudyStep.SELECT_CONTENT) {
      setCurrentStep(session.id, currentStep - 1)
    }
  }
  
  const handleExit = (): void => {
    if (window.confirm('确定要退出学习吗？进度将会保存。')) {
      navigate(ROUTES.HOME)
    }
  }
  
  const renderStep = (): JSX.Element => {
    switch (currentStep) {
      case StudyStep.SELECT_CONTENT:
        return <Step1_SelectContent onNext={handleNext} />
      case StudyStep.GENERATE_CARD:
        return <Step2_GenerateCard onNext={handleNext} onBack={handleBack} />
      case StudyStep.DISCUSSION:
        return <Step3_Discussion onNext={handleNext} onBack={handleBack} />
      case StudyStep.FUSION_CARD:
        return <Step4_FusionCard onNext={handleNext} onBack={handleBack} />
      case StudyStep.OUTPUT_SCORE:
        return <Step5_OutputScore onFinish={() => navigate(ROUTES.REVIEW)} onBack={handleBack} />
      default:
        return <Step1_SelectContent onNext={handleNext} />
    }
  }
  
  return (
    <Container maxWidth={isMobile ? false : 'lg'} sx={{ py: { xs: 1, md: 3 } }}>
      {/* Stepper */}
      <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3, borderRadius: 3 }}>
        {isMobile ? (
          <MobileStepper
            steps={5}
            position="static"
            activeStep={currentStep}
            sx={{ flexGrow: 1, bgcolor: 'transparent' }}
            backButton={
              <Button size="small" onClick={handleBack} disabled={currentStep === StudyStep.SELECT_CONTENT}>
                上一步
              </Button>
            }
            nextButton={
              <Button size="small" onClick={handleNext}>
                下一步
              </Button>
            }
          />
        ) : (
          <Stepper activeStep={currentStep} alternativeLabel>
            {steps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel>
                  <Typography variant="body2" fontWeight={currentStep === index ? 600 : 400}>
                    {step.label}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        )}
      </Paper>
      
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {/* Current Step Content */}
      <Paper sx={{ p: { xs: 1.5, md: 3 }, borderRadius: 3, minHeight: { xs: 300, md: 400 } }}>
        {renderStep()}
      </Paper>
      
      {/* Navigation Buttons - hidden on mobile (MobileStepper handles navigation) */}
      {!isMobile && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            variant="outlined"
            onClick={handleBack}
            disabled={currentStep === StudyStep.SELECT_CONTENT}
            startIcon={<BackIcon />}
          >
            上一步
          </Button>
          <Button
            variant="outlined"
            onClick={handleExit}
            color="error"
          >
            退出学习
          </Button>
        </Box>
      )}
    </Container>
  )
}

export default StudyWizard
