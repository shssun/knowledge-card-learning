import { useState, useEffect, useRef } from 'react'
import { useTheme } from '@mui/material'
import {
  Box,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  Divider,
} from '@mui/material'
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  OpenInFull as OpenIcon,
} from '@mui/icons-material'
import { useStudyStore } from '../../store/studyStore'
import { useMaterialStore } from '../../store/materialStore'
import { hasApiKey } from '../../services/openai'
import { generateCard } from '../../services/cardService'
import { PromptUserLevel, LEVEL_FIELD_CONFIG } from '../../constants/ai-prompts'
import { v4 as uuidv4 } from 'uuid'
import { CardType, FusionCard } from '../../types/study.types'

/** 从 localStorage 读取用户等级，默认中级 */
function getUserLevel(): PromptUserLevel {
  try {
    const saved = localStorage.getItem('zhika-settings')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed.userLevel) return parsed.userLevel as PromptUserLevel
    }
  } catch { /* ignore */ }
  return '中级'
}

/** 卡片展示字段配置（前端按等级过滤） */
const CARD_SECTIONS = [
  { key: 'coreDefinition',         label: '核心定义',         isError: false },
  { key: 'applicableScope',         label: '适用范围',         isError: false },
  { key: 'originalViewpoint',       label: '原始视角',         isError: false },
  { key: 'basicCase',               label: '基础案例',         isError: false },
  { key: 'commonMisconceptions',    label: '常见误区',         isError: true },
] as const

interface Step2Props {
  onNext: () => void
  onBack: () => void
}

function Step2_GenerateCard({ onNext, onBack }: Step2Props): JSX.Element {
  const theme = useTheme()
  const { getCurrentSession, updateSession } = useStudyStore()
  const { wordBanks, getBankById } = useMaterialStore()
  const session = getCurrentSession()

  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [results, setResults] = useState<{
    term: string
    success: boolean
    error?: string
  }[]>([])
  // 本地累积生成的卡片，避免 session.generatedCards 在循环中不更新的问题
  const [generatedCards, setGeneratedCards] = useState<any[]>([])
  // 点击查看完整卡片的 Dialog
  const [selectedCard, setSelectedCard] = useState<any>(null)

  const apiKeyAvailable = hasApiKey()
  const hasAutoStarted = useRef(false)

  // 读取用户等级，用于控制生成深度和展示标题
  const userLevel = getUserLevel()
  // 根据等级确定需要展示的字段
  const allowedFields = LEVEL_FIELD_CONFIG[userLevel] as readonly string[]

  // 当 session 变化时，同步 session 中的 generatedCards 到本地状态
  useEffect(() => {
    if (!session) return
    
    // 如果 session 中有已生成的卡片，且本地为空，则恢复
    if (session.generatedCards.length > 0 && generatedCards.length === 0) {
      setGeneratedCards(session.generatedCards)
      // 同时恢复 results
      setResults(session.generatedCards.map((card: any) => ({
        term: card.term,
        success: true,
      })))
    }
  }, [session?.id])  // 只依赖 session.id，避免无限循环

  // 判断所有选中的术语是否都有词库预置数据
  const allTermsArePreset = session
    ? session.selectedTerms.length > 0 &&
      session.selectedTerms.every((term) =>
        wordBanks.some((bank) =>
          bank.words.some((w) => w.term === term && w.levelContent)
        )
      )
    : false

  // Auto-trigger generation when entering Step2 for the first time
  useEffect(() => {
    if (!session) return
    if (generatedCards.length > 0) return
    if (hasAutoStarted.current) return

    hasAutoStarted.current = true

    // 词库预置来源：直接加载预置卡片，不走 AI 生成
    if (allTermsArePreset) {
      const presetCards: any[] = []
      const presetResults: { term: string; success: boolean }[] = []

      for (const term of session.selectedTerms) {
        let wordData = null
        for (const bank of wordBanks) {
          const w = bank.words.find((word) => word.term === term)
          if (w?.levelContent) {
            wordData = w
            break
          }
        }
        if (!wordData || !wordData.levelContent) continue

        const lc = wordData.levelContent

        const presetCard = {
          id: uuidv4(),
          term,
          topic: '预置内容',
          source: '词库预置',
          domain: 'AI基础',
          coreDefinition: lc.definition,
          applicableScope: lc.boundary,
          originalViewpoint: '',
          basicCase: lc.examples,
          commonMisconceptions: lc.misconceptions,
          type: CardType.STANDARD,
          studySessionId: session.id,
          createdAt: new Date().toISOString(),
        }
        presetCards.push(presetCard)
        presetResults.push({ term, success: true })

        // 同时写入 FusionCard
        const { addFusionCard } = useStudyStore.getState()
        addFusionCard(session.id, {
          baseCardId: presetCard.id,
          term,
          personalizedDefinition: lc.definition,
          deepLogic: '',
          practicalCases: lc.applicationScenario,
          refinedBoundary: lc.boundary,
          discussionSnapshot: [],
        })
      }

      if (presetCards.length > 0) {
        updateSession(session.id, { generatedCards: presetCards })
        setGeneratedCards(presetCards)
        setResults(presetResults)
      }
      return
    }

    handleGenerate()
  }, [session])

  // 计算待生成的术语（排除已生成的）
  const pendingTerms = session
    ? session.selectedTerms.filter(
        (term) => !generatedCards.some((card) => card.term === term)
      )
    : []

  const handleGenerate = async (): Promise<void> => {
    if (!session) return
    
    // 计算需要生成的术语（排除已生成的）
    const termsToGenerate = session.selectedTerms.filter(
      (term) => !generatedCards.some((card) => card.term === term)
    )
    
    // 如果都已生成，直接返回
    if (termsToGenerate.length === 0) {
      return
    }
    
    // 保留之前已生成的卡片，只重置新生成的结果
    setResults([])
    
    if (!apiKeyAvailable) {
      // Demo mode - create mock cards
      const mockResults = termsToGenerate.map((term) => ({
        term,
        success: true,
        isDemo: true,
      }))
      
      const mockCards = termsToGenerate.map((term, index) => ({
        id: uuidv4(),
        term,
        topic: '演示主题',
        source: '演示来源',
        domain: '通用',
        coreDefinition: `"${term}"是指一个核心的概念或模型，用来理解和分析特定领域的问题。理解它需要把握其本质特征、适用边界以及与其他概念的关系。`,
        applicableScope: '适用于一般场景',
        originalViewpoint: '从经典理论角度',
        basicCase: '例如：日常生活中的应用',
        commonMisconceptions: '需要注意的误区',
        type: CardType.STANDARD,
        studySessionId: session.id,
        createdAt: new Date().toISOString(),
      }))

      // Demo 模式也需要为每张卡写入 FusionCard（与预设路径保持一致）
      const { addFusionCard } = useStudyStore.getState()
      mockCards.forEach((card) => {
        addFusionCard(session.id, {
          baseCardId: card.id,
          term: card.term,
          personalizedDefinition: card.coreDefinition,
          deepLogic: '',
          practicalCases: card.basicCase,
          refinedBoundary: card.applicableScope,
          discussionSnapshot: [],
        })
      })
      
      // 一次性更新 session
      updateSession(session.id, { generatedCards: mockCards })
      setGeneratedCards(mockCards)
      setResults(mockResults.map((r) => ({ term: r.term, success: true })))
      return
    }
    
    setIsGenerating(true)
    setProgress({ current: 0, total: termsToGenerate.length })

    const newResults: { term: string; success: boolean; error?: string }[] = []
    const allGeneratedCards: any[] = []

    // 查找术语的预置 levelContent（词库来源）
    const findPresetLevelContent = (term: string) => {
      for (const bank of wordBanks) {
        const word = bank.words.find((w) => w.term === term)
        if (word?.levelContent) return word.levelContent
      }
      return null
    }

    for (let i = 0; i < termsToGenerate.length; i++) {
      const term = termsToGenerate[i]
      setProgress((prev) => ({ ...prev, current: i + 1 }))

      // 优先用词库预置数据，跳过 AI 生成
      const presetLevelContent = findPresetLevelContent(term)

      if (presetLevelContent) {
        // 从词库词条构造标准卡片
        const presetCard = {
          id: uuidv4(),
          term,
          topic: '预置内容',
          source: '词库预置',
          domain: 'AI基础',
          coreDefinition: presetLevelContent.definition,
          applicableScope: presetLevelContent.boundary,
          originalViewpoint: '',
          basicCase: presetLevelContent.examples,
          commonMisconceptions: presetLevelContent.misconceptions,
          type: CardType.STANDARD,
          studySessionId: session.id,
          createdAt: new Date().toISOString(),
        }
        allGeneratedCards.push(presetCard)
        setGeneratedCards([...allGeneratedCards])

        // 同时写入 FusionCard（Step4 需要的五级内容，直接用预置）
        const { addFusionCard } = useStudyStore.getState()
        const fusionCard: Omit<FusionCard, 'id' | 'createdAt'> = {
          baseCardId: presetCard.id,
          term,
          personalizedDefinition: presetLevelContent.definition,
          deepLogic: '',
          practicalCases: presetLevelContent.applicationScenario,
          refinedBoundary: presetLevelContent.boundary,
          discussionSnapshot: [],
        }
        addFusionCard(session.id, fusionCard)

        newResults.push({ term, success: true })
        setResults([...newResults])
        continue
      }

      // 无预置，走 AI 生成
      try {
        const result = await generateCard(term, '', session.id, userLevel)

        if (result.success && result.card) {
          const newCard = {
            ...result.card,
            id: uuidv4(),
            type: CardType.STANDARD,
          }
          // 累积到本地数组
          allGeneratedCards.push(newCard)
          setGeneratedCards([...allGeneratedCards])
          newResults.push({ term, success: true })
        } else {
          newResults.push({ term, success: false, error: result.error })
        }
      } catch (error) {
        newResults.push({
          term,
          success: false,
          error: error instanceof Error ? error.message : '生成失败',
        })
      }

      setResults([...newResults])
    }
    
    // 循环结束后一次性更新 session，合并之前已生成的和新生成的
    if (allGeneratedCards.length > 0) {
      updateSession(session.id, { 
        generatedCards: [...generatedCards, ...allGeneratedCards] 
      })
    }
    
    setIsGenerating(false)
  }
  
  const successCount = results.filter((r) => r.success).length
  const failCount = results.filter((r) => !r.success).length
  
  return (
    <Box>
      <Typography variant="h5" fontWeight={600} sx={{ mb: 0.5 }}>
        生成知识卡片
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        AI 正在生成知识卡片
        <Chip
          size="small"
          label={`当前等级：${userLevel}（展示 ${CARD_SECTIONS.filter(s => allowedFields.includes(s.key)).length} 个核心字段）`}
          color="primary"
          variant="outlined"
          sx={{ ml: 1, fontSize: 11 }}
        />
      </Typography>
      
      {/* 开箱即用：无 API Key 也能正常生成（内置演示数据） */}
      {!apiKeyAvailable && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          💡 正在使用内置引擎。在设置中配置 AI 接口可获得更个性化的内容。
        </Typography>
      )}

      {/* Progress */}
      {isGenerating && (
        <Box sx={{ mb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">
              生成进度：{progress.current} / {progress.total}
            </Typography>
            <Typography variant="body2" color="primary">
              {Math.round((progress.current / progress.total) * 100)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={(progress.current / progress.total) * 100}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
      )}
      
      {/* Results List */}
      {results.length > 0 && (
        <Box sx={{ mb: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
            <Chip label={`成功 ${successCount}`} color="success" size="small" />
            {failCount > 0 && (
              <Chip label={`失败 ${failCount}`} color="error" size="small" />
            )}
          </Box>

          {results.map((result, index) => (
            <Card
              key={index}
              sx={{
                mb: 0.5,
                bgcolor: result.success
                  ? theme.palette.mode === 'dark' ? 'success.dark' : 'success.50'
                  : theme.palette.mode === 'dark' ? 'error.dark' : 'error.50',
                borderColor: result.success ? 'success.main' : 'error.main',
              }}
              variant="outlined"
            >
              <CardContent sx={{ py: 0.5, '&:last-child': { pb: 0.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {result.success ? (
                    <CheckIcon color="success" fontSize="small" />
                  ) : (
                    <ErrorIcon color="error" fontSize="small" />
                  )}
                  <Typography variant="body2" fontWeight={500}>
                    {result.term}
                  </Typography>
                  {!result.success && result.error && (
                    <Typography variant="caption" color="error">
                      - {result.error}
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
      
      {/* Generated Cards Preview */}
      {generatedCards.length > 0 && (
        <Box sx={{ mb: 1 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
            已生成的卡片预览
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 0.5 }}>
            {generatedCards.map((card) => (
              <Card
                key={card.id}
                onClick={() => setSelectedCard(card)}
                sx={{
                  minWidth: 260,
                  maxWidth: 300,
                  bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'primary.50',
                  border: '1px solid',
                  borderColor: theme.palette.mode === 'dark' ? 'grey.600' : 'primary.200',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 2,
                  },
                }}
              >
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ fontSize: '0.95rem' }}>
                      {card.term}
                    </Typography>
                    <Tooltip title="点击查看完整内容">
                      <IconButton size="small" sx={{ p: 0.3 }}>
                        <OpenIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mb: 0.5, display: 'block' }}
                  >
                    {card.domain} | {card.source || '未知来源'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: '0.8rem' }}>
                    {card.coreDefinition.slice(0, 55)}...
                  </Typography>
                  <Typography variant="caption" color="primary.main" sx={{ fontSize: '0.7rem' }}>
                    点击查看完整内容 →
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      )}
      
      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box>
          {allTermsArePreset && generatedCards.length > 0 && (
            <Typography variant="body2" color="text.secondary">
              已自动加载词库预置卡片
            </Typography>
          )}
          {!allTermsArePreset && !isGenerating && results.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              点击下方按钮开始生成卡片
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {!allTermsArePreset && (
            <>
              <Tooltip title="重新生成">
                <IconButton onClick={handleGenerate} disabled={isGenerating}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Box
                component="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                sx={{
                  px: 3,
                  py: 1.5,
                  border: 'none',
                  borderRadius: 2,
                  bgcolor: isGenerating ? (theme.palette.mode === 'dark' ? 'grey.700' : 'grey.300') : 'primary.main',
                  color: 'white',
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: isGenerating ? (theme.palette.mode === 'dark' ? 'grey.700' : 'grey.300') : 'primary.dark',
                  },
                }}
              >
                {isGenerating ? '生成中...' : '开始生成'}
              </Box>
            </>
          )}
          <Box
            component="button"
            onClick={onNext}
            disabled={generatedCards.length === 0}
            sx={{
              px: 3,
              py: 1.5,
              border: 'none',
              borderRadius: 2,
              bgcolor:
                generatedCards.length > 0
                  ? 'secondary.main'
                  : theme.palette.mode === 'dark' ? 'grey.700' : 'grey.300',
              color: 'white',
              cursor:
                generatedCards.length > 0
                  ? 'pointer'
                  : 'not-allowed',
              fontWeight: 600,
              '&:hover': {
                bgcolor:
                  generatedCards.length > 0
                    ? 'secondary.dark'
                    : theme.palette.mode === 'dark' ? 'grey.700' : 'grey.300',
              },
            }}
          >
            下一步：深度讨论
          </Box>
        </Box>
      </Box>

      {/* 完整卡片详情弹窗 */}
      <Dialog
        open={Boolean(selectedCard)}
        onClose={() => setSelectedCard(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        {selectedCard && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Typography variant="h5" fontWeight={600}>
                {selectedCard.term}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedCard.domain} | {selectedCard.source || '未知来源'}
              </Typography>
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {CARD_SECTIONS.filter((s) => allowedFields.includes(s.key) && selectedCard[s.key]).map((section) => (
                  <Box key={section.key}>
                    <Typography variant="subtitle2" color={section.isError ? 'error' : 'primary'} sx={{ mb: 1 }}>
                      {section.label}
                    </Typography>
                    <Typography variant="body1">
                      {selectedCard[section.key]}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  )
}

export default Step2_GenerateCard
