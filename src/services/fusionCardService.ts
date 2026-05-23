import { sendChatRequest, parseAIResponse } from './openai'
import { FUSION_CARD_PROMPT } from '../constants/ai-prompts'
import { KnowledgeCard, DiscussionMessage, FusionCard, MessageRole } from '../types/study.types'
import { CardRelation } from '../types/graph.types'
import { LevelContent } from '../types/level.types'

export interface FusionCardResult {
  success: boolean
  fusionCard?: Omit<FusionCard, 'id' | 'createdAt'>
  relations?: CardRelation[]
  error?: string
}

/**
 * Generate a fusion card based on original card and discussion
 * @param knownTerms 同一领域已学过的词汇，用于 AI 建立关系
 */
export async function generateFusionCard(
  baseCard: KnowledgeCard,
  discussion: DiscussionMessage[],
  knownTerms: string[] = []
): Promise<FusionCardResult> {
  try {
    const prompt = FUSION_CARD_PROMPT(baseCard, discussion, knownTerms)
    
    const response = await sendChatRequest([
      { role: 'user', content: prompt },
    ])
    
    const cardData = parseAIResponse<{
      term: string
      personalizedDefinition: string
      deepLogic: string
      practicalCases: string
      refinedBoundary: string
      relations?: Array<{
        targetTerm: string
        relationType: string
        label: string
      }>
      levelContent?: Partial<LevelContent>
    }>(response)

    const relations: CardRelation[] = (cardData.relations || [])
      .filter((r: any) => r.targetTerm && r.relationType)
      .map((r: any) => ({
        targetTerm: r.targetTerm,
        relationType: r.relationType as CardRelation['relationType'],
        label: r.label || '',
      }))

    const fusionCard: Omit<FusionCard, 'id' | 'createdAt'> = {
      baseCardId: baseCard.id,
      term: cardData.term || baseCard.term,
      personalizedDefinition: cardData.personalizedDefinition || '',
      deepLogic: cardData.deepLogic || '',
      practicalCases: cardData.practicalCases || '',
      refinedBoundary: cardData.refinedBoundary || '',
      discussionSnapshot: discussion.filter(
        (m) => m.role === MessageRole.USER || m.role === MessageRole.ASSISTANT
      ),
      levelContent: cardData.levelContent || undefined,
    }
    
    return { success: true, fusionCard, relations }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '融合卡片生成失败',
    }
  }
}

/**
 * Refine fusion card with additional context
 */
export async function refineFusionCard(
  fusionCard: FusionCard,
  refinementRequest: string
): Promise<FusionCardResult> {
  try {
    const cardText = `
术语：${fusionCard.term}
个性化定义：${fusionCard.personalizedDefinition}
深层逻辑：${fusionCard.deepLogic}
实践案例：${fusionCard.practicalCases}
精准边界：${fusionCard.refinedBoundary}
`

    const prompt = `请根据以下融合卡片内容和改进建议，生成优化后的版本。

融合卡片：
${cardText}

改进建议：
${refinementRequest}

请严格返回JSON格式：
{
  "term": "优化后的术语",
  "personalizedDefinition": "优化后的定义",
  "deepLogic": "优化后的逻辑",
  "practicalCases": "优化后的案例",
  "refinedBoundary": "优化后的边界"
}

请严格返回合法JSON格式，不要包含任何markdown代码块标记。`

    const response = await sendChatRequest([
      { role: 'user', content: prompt },
    ])
    
    const cardData = parseAIResponse<{
      term: string
      personalizedDefinition: string
      deepLogic: string
      practicalCases: string
      refinedBoundary: string
    }>(response)
    
    return {
      success: true,
      fusionCard: {
        baseCardId: fusionCard.baseCardId,
        term: cardData.term,
        personalizedDefinition: cardData.personalizedDefinition,
        deepLogic: cardData.deepLogic,
        practicalCases: cardData.practicalCases,
        refinedBoundary: cardData.refinedBoundary,
        discussionSnapshot: fusionCard.discussionSnapshot,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '优化失败',
    }
  }
}
