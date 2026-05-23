import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
} from '@mui/material'
import {
  AutoAwesome as MetaIcon,
  Build as ToolsIcon,
  School as LearnIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import { useUIStore, ONBOARDING_VERSION } from '../../store/uiStore'
import { useIsMobile } from '../../hooks/useIsMobile'

const steps = [
  {
    icon: <MetaIcon sx={{ fontSize: 40, color: '#667eea' }} />,
    title: '第一步：元概念先行',
    description:
      '进入「元概念学习」，从 130 个不可再分的底层概念出发——宇宙本源、逻辑思维、人性意识……8 层递进，构建可迁移的思维根基。',
    detail: '每学完一个概念自评掌握程度（≥80 分 = 已掌握），解锁更高层级和领域术语。',
    route: ROUTES.META_CONCEPTS,
    actionLabel: '去元概念学习',
  },
  {
    icon: <ToolsIcon sx={{ fontSize: 40, color: '#0ea5e9' }} />,
    title: '第二步：六件工具练习',
    description:
      '用元概念拆解万物——「万物拆解器」分析任何概念，「MECE 训练器」对立思考，「概念翻译」把上层概念翻译成元概念，「拆书」用元概念解构全书。',
    detail: '所有分析结果自动沉淀到「思维积木库」，方便随时回溯。',
    route: ROUTES.DECONSTRUCTOR,
    actionLabel: '试试万物拆解',
  },
  {
    icon: <LearnIcon sx={{ fontSize: 40, color: '#10b981' }} />,
    title: '第三步：系统学习流程',
    description:
      '粘贴你想学的内容到「资料中心」→「学习中心」五步研习 →「知识归档」→「复习中心」艾宾浩斯间隔复习。',
    detail: '复习间隔：1天 → 3天 → 7天 → 15天，科学对抗遗忘。',
    route: ROUTES.MATERIALS,
    actionLabel: '去资料中心',
  },
]

function OnboardingGuide(): JSX.Element | null {
  const [activeStep, setActiveStep] = useState(0)
  const navigate = useNavigate()
  const { hasSeenOnboarding, onboardingVersion, markOnboardingSeen } = useUIStore()
  const isMobile = useIsMobile()

  // 版本不匹配时重新显示引导（引导内容有重大更新）
  const shouldShow = !hasSeenOnboarding || onboardingVersion < ONBOARDING_VERSION

  const handleClose = (): void => {
    markOnboardingSeen()
  }

  const handleNext = (): void => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1)
    } else {
      handleClose()
    }
  }

  const handleStepClick = (route: string): void => {
    markOnboardingSeen()
    navigate(route)
  }

  if (!shouldShow) return null

  return (
    <Dialog
      open
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      onClose={handleClose}
      PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3 } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h5" fontWeight={700}>
          👋 欢迎使用知卡研习！
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          元概念先行，工具辅助练习，三步上手
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 2, px: { xs: 2, sm: 3 } }}>
        <Stepper activeStep={activeStep} orientation="vertical" sx={{ mb: 2 }}>
          {steps.map((step, index) => (
            <Step key={index}>
              <StepLabel
                StepIconComponent={() => (
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: 'action.hover',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {step.icon}
                  </Box>
                )}
              >
                <Typography variant="subtitle1" fontWeight={600}>
                  {step.title}
                </Typography>
              </StepLabel>
              <StepContent>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    bgcolor: 'action.hover',
                    borderRadius: 2,
                    border: 'none',
                  }}
                >
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {step.description}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    💡 {step.detail}
                  </Typography>
                </Paper>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{ mt: 1.5 }}
                  onClick={() => handleStepClick(step.route)}
                >
                  {step.actionLabel}
                </Button>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button size="small" onClick={handleClose} sx={{ color: 'text.secondary' }}>
          跳过引导
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
          sx={{ minWidth: 100 }}
        >
          {activeStep < steps.length - 1 ? '下一步' : '开始使用'}
        </Button>
      </DialogActions>

      <Box sx={{ px: 3, pb: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
          后续可在「设置 → 使用帮助」中再次查看此引导
        </Typography>
      </Box>
    </Dialog>
  )
}

export default OnboardingGuide
