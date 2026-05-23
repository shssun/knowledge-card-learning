import { useState, useMemo, useEffect } from 'react'
import { useTheme, Tooltip } from '@mui/material'
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  Grid,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import { Add as AddIcon, Check as CheckIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material'
import { useMaterialStore } from '../../store/materialStore'
import { useStudyStore } from '../../store/studyStore'
import { StudyStep } from '../../types/study.types'
import { useIsMobile } from '../../hooks/useIsMobile'

interface Step1Props {
  onNext: () => void
}

function Step1_SelectContent({ onNext }: Step1Props): JSX.Element {
  const theme = useTheme()
  const { materials, wordBanks } = useMaterialStore()
  const { createSession, setCurrentStep, updateSession, getCurrentSession } = useStudyStore()
  const session = getCurrentSession()
  const isMobile = useIsMobile()
  const isFocused = session?.entryMode === 'focused'

  // Pre-fill from session (materialId + selectedTerms from StudyPage)
  const preSelectedMaterialId = !isFocused && session?.materialId && session.materialId !== 'default'
    ? session.materialId
    : null

  // 尝试从资料或词库获取预填充术语
  const prefillKeywords = useMemo(() => {
    if (!preSelectedMaterialId) return []

    // 优先使用 session.selectedTerms（从案例分析跳转时传入）
    if (session?.selectedTerms && session.selectedTerms.length > 0) {
      return session.selectedTerms
    }

    // 从资料获取
    const material = materials.find((m) => m.id === preSelectedMaterialId)
    if (material?.keywords?.length) {
      return material.keywords.slice(0, 10)
    }

    // 从词库获取（materialId 是词库 ID，如 bank-ai-basics）
    const bank = wordBanks.find((b) => b.id === preSelectedMaterialId)
    if (bank?.words.length) {
      return bank.words.map((w) => w.term)
    }

    return []
  }, [preSelectedMaterialId, materials, wordBanks, session?.selectedTerms])

  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(preSelectedMaterialId)
  const [selectedTerms, setSelectedTerms] = useState<string[]>(prefillKeywords)
  const [termsToGenerate, setTermsToGenerate] = useState<Set<string>>(new Set(prefillKeywords))
  const [customTerms, setCustomTerms] = useState('')
  const [customContext, setCustomContext] = useState('')
  const [error, setError] = useState<string | null>(null)

  const selectedMaterial = materials.find((m) => m.id === selectedMaterialId)

  // Sync termsToGenerate when selectedTerms changes (new terms default to checked)
  useEffect(() => {
    setTermsToGenerate(prev => {
      const next = new Set<string>()
      for (const term of selectedTerms) {
        // Keep existing selection state; new terms default to checked
        next.add(term)
      }
      return next
    })
  }, [selectedTerms])

  const handleMaterialSelect = (materialId: string): void => {
    setSelectedMaterialId(materialId)
    // 从资料获取术语（单卡模式：只取第一个）
    const material = materials.find((m) => m.id === materialId)
    if (material?.keywords?.length) {
      setSelectedTerms([material.keywords[0]])
      return
    }
    // 从词库获取术语（单卡模式：只取第一个）
    const bank = wordBanks.find((b) => b.id === materialId)
    if (bank?.words.length) {
      setSelectedTerms([bank.words[0].term])
    }
  }
  
  const handleTermToggle = (term: string): void => {
    setSelectedTerms((prev) =>
      prev.includes(term) ? [] : [term]
    )
  }

  const toggleTermToGenerate = (term: string): void => {
    setTermsToGenerate(prev => {
      if (prev.has(term)) return new Set()
      return new Set([term])
    })
  }
  
  const handleCustomTermAdd = (): void => {
    const terms = customTerms
      .split(/[,\n]/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
    
    const firstTerm = terms[0]
    if (firstTerm) {
      setSelectedTerms([firstTerm])
    }
    setCustomTerms('')
  }
  
  const handleNext = (): void => {
    if (termsToGenerate.size === 0) {
      setError('请至少选择一个要生成的术语')
      return
    }

    const termsArray = [...termsToGenerate]

    // Reuse existing session if already created (from URL parameter)
    if (session?.id) {
      // CRITICAL: 清空旧的卡片和讨论记录，否则 Step2 会直接展示旧卡片
      updateSession(session.id, {
        selectedTerms: termsArray,
        generatedCards: [],
        fusionCards: [],
        discussions: [],
        outputRecords: [],
      })
      setCurrentStep(session.id, StudyStep.GENERATE_CARD)
      onNext()
    } else {
      const materialId = selectedMaterialId || 'custom'
      const sessionId = createSession(materialId, termsArray)
      setCurrentStep(sessionId, StudyStep.GENERATE_CARD)
      onNext()
    }
  }

  if (isFocused && selectedMaterial) {
    // Focused mode: only show material keywords and selected terms area
    return (
      <Box>
        <Typography variant="h5" fontWeight={600} sx={{ mb: 1 }}>
          为《{selectedMaterial.title}》生成知识卡片
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          以下是从该资料中提取的 {selectedTerms.length} 个术语，请勾选本次想生成卡片的术语
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Selected Terms Display */}
        <Box sx={{ bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50', p: { xs: 1.5, sm: 2 }, borderRadius: 2, mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            已选择 {selectedTerms.length} 个术语（点击切换是否生成，点 × 移除）：
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {selectedTerms.map((term) => {
              const isChecked = termsToGenerate.has(term)
              return (
                <Chip
                  key={term}
                  label={term}
                  size="small"
                  color={isChecked ? 'primary' : 'default'}
                  variant={isChecked ? 'filled' : 'outlined'}
                  onClick={() => toggleTermToGenerate(term)}
                  onDelete={() => handleTermToggle(term)}
                  sx={{
                    opacity: isChecked ? 1 : 0.5,
                  }}
                />
              )
            })}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Tooltip title={termsToGenerate.size === 0 ? '请先选择至少一个术语' : ''}>
            <span>
              <Button
                variant="contained"
                size="large"
                onClick={handleNext}
                disabled={termsToGenerate.size === 0}
                endIcon={<CheckIcon />}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                开始学习
              </Button>
            </span>
          </Tooltip>
        </Box>
      </Box>
    )
  }

  // Full mode: show all options (original behavior)
  return (
    <Box>
      <Typography variant="h5" fontWeight={600} sx={{ mb: 1 }}>
        选择学习内容
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        选择一份资料或自定义输入术语，开始你的学习之旅
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {/* Material Selection */}
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
        选择资料（可选）
      </Typography>
      
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {materials.slice(0, 4).map((material) => (
          <Grid item xs={12} sm={6} md={3} key={material.id}>
            <Card
              variant={selectedMaterialId === material.id ? 'elevation' : 'outlined'}
              sx={{
                borderColor: selectedMaterialId === material.id ? 'primary.main' : 'divider',
                bgcolor: selectedMaterialId === material.id
                  ? theme.palette.mode === 'dark' ? 'grey.700' : 'primary.50'
                  : 'background.paper',
              }}
            >
              <CardActionArea onClick={() => handleMaterialSelect(material.id)}>
                <CardContent>
                  <Typography variant="subtitle2" fontWeight={600} noWrap>
                    {material.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {material.content.slice(0, 40)}...
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      {/* Word Bank Selection */}
      {wordBanks.length > 0 && (
        <>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            从词库选择术语
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            {wordBanks.map((bank) => (
              <Box key={bank.id} sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {bank.name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {bank.words.map((word) => (
                    <Chip
                      key={word.id}
                      label={word.term}
                      size="small"
                      onClick={() => handleTermToggle(word.term)}
                      color={selectedTerms.includes(word.term) ? 'primary' : 'default'}
                      variant={selectedTerms.includes(word.term) ? 'filled' : 'outlined'}
                    />
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        </>
      )}
      
      {/* Custom Terms — Phase 2, collapsed by default */}
      <Accordion disableGutters elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px !important', '&:before': { display: 'none' } }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1" fontWeight={600}>
            自定义术语
          </Typography>
          <Chip size="small" label="二期功能" color="default" sx={{ ml: 1, fontSize: 11 }} />
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            输入任意术语，系统将自动生成知识卡片（一期暂不支持，位置保留）
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={2}
            placeholder="输入自定义术语，用逗号或换行分隔"
            value={customTerms}
            onChange={(e) => setCustomTerms(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleCustomTermAdd}
            sx={{ mb: 1, width: { xs: '100%', sm: 'auto' } }}
          >
            添加自定义术语
          </Button>
        </AccordionDetails>
      </Accordion>
      
      {/* Selected Terms Display with checkbox toggle */}
      <Box sx={{ bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50', p: { xs: 1.5, sm: 2 }, borderRadius: 2, mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          已选择 {selectedTerms.length} 个术语（点击切换是否生成，点 × 移除）：
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {selectedTerms.length > 0 ? (
            selectedTerms.map((term) => {
              const isChecked = termsToGenerate.has(term)
              return (
                <Chip
                  key={term}
                  label={term}
                  size="small"
                  color={isChecked ? 'primary' : 'default'}
                  variant={isChecked ? 'filled' : 'outlined'}
                  onClick={() => toggleTermToGenerate(term)}
                  onDelete={() => handleTermToggle(term)}
                  sx={{
                    opacity: isChecked ? 1 : 0.5,
                  }}
                />
              )
            })
          ) : (
            <Typography variant="body2" color="text.secondary">
              尚未选择任何术语
            </Typography>
          )}
        </Box>
      </Box>
      
      {/* Context Input */}
      <TextField
        fullWidth
        multiline
        rows={3}
        label="学习背景/上下文（可选）"
        placeholder="输入你的学习背景，例如：正在准备市场营销考试..."
        value={customContext}
        onChange={(e) => setCustomContext(e.target.value)}
        sx={{ mb: 3 }}
        helperText="提供上下文有助于 AI 生成更精准的知识卡片"
      />
      
      {/* Next Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Tooltip title={termsToGenerate.size === 0 ? '请先选择至少一个术语' : ''}>
          <span>
            <Button
              variant="contained"
              size="large"
              onClick={handleNext}
              disabled={termsToGenerate.size === 0}
              endIcon={<CheckIcon />}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              开始学习
            </Button>
          </span>
        </Tooltip>
      </Box>
    </Box>
  )
}

export default Step1_SelectContent
