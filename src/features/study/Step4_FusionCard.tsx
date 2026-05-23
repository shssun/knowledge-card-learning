import { useState } from 'react'
import { useTheme } from '@mui/material'
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Divider,
  Chip,
} from '@mui/material'
import { useStudyStore } from '../../store/studyStore'
import { useGraphStore } from '../../store/graphStore'
import { generateFusionCard } from '../../services/fusionCardService'
import { hasApiKey } from '../../services/openai'
import { LEVEL_FIELD_CONFIG, FUSION_LEVEL_FIELD_CONFIG, FUSION_FIELD_LABELS, type PromptUserLevel } from '../../constants/ai-prompts'
import { v4 as uuidv4 } from 'uuid'

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

interface Step4Props {
  onNext: () => void
  onBack: () => void
}

function Step4_FusionCard({ onNext, onBack }: Step4Props): JSX.Element {
  const theme = useTheme()
  const { getCurrentSession, addFusionCard } = useStudyStore()
  const session = getCurrentSession()
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const apiKeyAvailable = hasApiKey()

  const currentCard = session?.generatedCards[0]
  const currentDiscussion = session?.discussions.find(
    (d) => d.cardId === currentCard?.id
  )

  // 读取用户等级，控制原始卡片和融合卡片展示维度
  const userLevel = getUserLevel()
  const allowedFields = LEVEL_FIELD_CONFIG[userLevel]
  const allowedFusionFields = FUSION_LEVEL_FIELD_CONFIG[userLevel]

  /** 标准卡片字段标签 */
  const CARD_FIELD_LABELS: Record<string, string> = {
    coreDefinition: '核心定义',
    applicableScope: '适用范围',
    basicCase: '基础案例',
    commonMisconceptions: '常见误区',
  }

  const graphStore = useGraphStore.getState()

  const handleGenerate = async (): Promise<void> => {
    if (!currentCard || !session) return

    setIsGenerating(true)
    setError(null)

    // 已生成的融合卡片术语，作为 knownTerms 传给 AI
    const knownTerms = session.fusionCards.map((f) => f.term)

    try {
      if (!apiKeyAvailable) {
        // Demo mode
        const demoFusionCard = {
          baseCardId: currentCard.id,
          term: currentCard.term,
          personalizedDefinition: `我认为"${currentCard.term}"的核心是：${currentCard.coreDefinition}`,
          deepLogic: `${currentCard.term}之所以重要，是因为它揭示了事物发展的底层规律。理解这一点可以帮助我们更好地分析问题。`,
          practicalCases: `在实际工作中，我遇到过类似的情况：${currentCard.basicCase}`,
          refinedBoundary: `适用范围：${currentCard.applicableScope}，但需要注意：${currentCard.commonMisconceptions.split('，')[0] || '避免常见误区'}`,
          discussionSnapshot: currentDiscussion?.messages || [],
        }
        addFusionCard(session.id, demoFusionCard)

        // Demo 模式：写入图谱（演示关系）
        graphStore.addCardToGraph(
          currentCard.domain,
          demoFusionCard as any,
          knownTerms.length > 0
            ? [{ targetTerm: knownTerms[0], relationType: '对比', label: '演示关系' }]
            : []
        )
      } else {
        const result = await generateFusionCard(
          currentCard,
          currentDiscussion?.messages || [],
          knownTerms
        )

        if (result.success && result.fusionCard) {
          addFusionCard(session.id, result.fusionCard)

          // 写入知识图谱
          if (result.relations && result.relations.length > 0) {
            graphStore.addCardToGraph(
              currentCard.domain,
              result.fusionCard as any,
              result.relations
            )
          }
        } else {
          setError(result.error || '生成失败')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生错误')
    } finally {
      setIsGenerating(false)
    }
  }
  
  const handleNext = (): void => {
    onNext()
  }
  
  const hasFusionCard = session?.fusionCards.some(
    (f) => f.baseCardId === currentCard?.id
  )
  
  return (
    <Box>
      <Typography variant="h5" fontWeight={600} sx={{ mb: 1 }}>
        生成融合卡片
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        基于讨论，生成个性化的深度理解卡片
        <Chip
          size="small"
          label={`当前等级：${userLevel}（原始 ${allowedFields.length} 个字段 / 融合 ${allowedFusionFields.length} 个维度）`}
          color="primary"
          variant="outlined"
          sx={{ ml: 1, fontSize: 11 }}
        />
      </Typography>
      
      {!apiKeyAvailable && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          融合卡片将基于你的讨论内容自动生成。配置 AI 接口可获得更个性化的内容。
        </Typography>
      )}
      
      {currentCard && (
        <>
          {/* Original Card */}
          <Card sx={{ mb: 3, bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                原始知识卡片
              </Typography>
              <Typography variant="subtitle2" color="primary.main" gutterBottom>
                {currentCard.term}
              </Typography>
              {allowedFields.map((field, idx) => (
                <Typography
                  key={field}
                  variant="body2"
                  sx={{ mb: idx < allowedFields.length - 1 ? 1 : 0 }}
                >
                  <strong>{CARD_FIELD_LABELS[field]}：</strong>
                  {(currentCard as unknown as Record<string, string>)[field]}
                </Typography>
              ))}
            </CardContent>
          </Card>
          
          {/* Fusion Card */}
          {hasFusionCard && (
            <>
              <Divider sx={{ my: 3 }} />
              <Card sx={{ mb: 3, bgcolor: theme.palette.mode === 'dark' ? 'secondary.dark' : 'secondary.50', border: '1px solid', borderColor: theme.palette.mode === 'dark' ? 'secondary.main' : 'secondary.200' }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                    融合卡片
                  </Typography>
                  {(() => {
                    const fusionCard = session?.fusionCards.find(
                      (f) => f.baseCardId === currentCard.id
                    )
                    if (!fusionCard) return null
                    return (
                      <>
                        <Typography variant="subtitle2" color="secondary.main" gutterBottom>
                          {fusionCard.term}
                        </Typography>
                        {allowedFusionFields.map((field) => (
                          <Typography key={field} variant="body2" sx={{ mb: 1 }}>
                            <strong>{FUSION_FIELD_LABELS[field]}：</strong>
                            {(fusionCard as unknown as Record<string, string>)[field]}
                          </Typography>
                        ))}
                      </>
                    )
                  })()}
                </CardContent>
              </Card>
            </>
          )}
          
          {/* Generate Button */}
          {!hasFusionCard && (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              {isGenerating ? (
                <CircularProgress />
              ) : (
                <Box
                  component="button"
                  onClick={handleGenerate}
                  sx={{
                    px: 4,
                    py: 1.5,
                    border: 'none',
                    borderRadius: 2,
                    bgcolor: 'secondary.main',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 16,
                    '&:hover': { bgcolor: 'secondary.dark' },
                  }}
                >
                  为"{currentCard.term}"生成融合卡片
                </Box>
              )}
            </Box>
          )}
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
        </>
      )}
      
      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Box
          component="button"
          onClick={onBack}
          sx={{
            px: 3,
            py: 1.5,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            bgcolor: 'background.paper',
            cursor: 'pointer',
          }}
        >
          上一步
        </Box>
        <Box
          component="button"
          onClick={handleNext}
          disabled={!hasFusionCard}
          sx={{
            px: 4,
            py: 1.5,
            border: 'none',
            borderRadius: 2,
            bgcolor: hasFusionCard
              ? 'primary.main'
              : theme.palette.mode === 'dark' ? 'grey.700' : 'grey.300',
            color: 'white',
            cursor: hasFusionCard ? 'pointer' : 'not-allowed',
            fontWeight: 600,
          }}
        >
          下一步：输出评分
        </Box>
      </Box>
    </Box>
  )
}

export default Step4_FusionCard
