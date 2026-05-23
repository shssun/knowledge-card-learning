import { sendChatRequest, parseAIResponse } from './openai'
import { CARD_GENERATION_PROMPT, PromptUserLevel } from '../constants/ai-prompts'
import { KnowledgeCard, CardType } from '../types/study.types'

export interface CardGenerationResult {
  success: boolean
  card?: KnowledgeCard
  error?: string
}

/**
 * Generate a knowledge card using AI
 * @param userLevel 用户等级，控制生成内容的深度（对应 localStorage zhika-settings.userLevel）
 */
export async function generateCard(
  term: string,
  context: string,
  sessionId: string,
  userLevel: PromptUserLevel = '中级'
): Promise<CardGenerationResult> {
  try {
    const prompt = CARD_GENERATION_PROMPT(term, context, userLevel)
    
    const response = await sendChatRequest([
      { role: 'user', content: prompt },
    ])
    
    const cardData = parseAIResponse<{
      term: string
      topic: string
      source: string
      domain: string
      coreDefinition: string
      applicableScope: string
      originalViewpoint: string
      basicCase: string
      commonMisconceptions: string
    }>(response)
    
    // 清洗 AI 返回的 domain，避免无意义的默认值
    const rawDomain = cardData.domain?.trim() || ''
    const cleanDomain =
      rawDomain && rawDomain !== 'default' && rawDomain !== '未知' && rawDomain !== '通用'
        ? rawDomain
        : ''

    const card: KnowledgeCard = {
      id: '', // Will be assigned by store
      term: cardData.term || term,
      topic: cardData.topic || '',
      source: cardData.source || '',
      domain: cleanDomain,
      coreDefinition: cardData.coreDefinition || '',
      applicableScope: cardData.applicableScope || '',
      originalViewpoint: cardData.originalViewpoint || '',
      basicCase: cardData.basicCase || '',
      commonMisconceptions: cardData.commonMisconceptions || '',
      type: CardType.STANDARD,
      studySessionId: sessionId,
      createdAt: new Date().toISOString(),
    }
    
    return { success: true, card }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '生成失败',
    }
  }
}

/**
 * Generate multiple cards in batch
 */
export async function generateCardsBatch(
  terms: string[],
  context: string,
  sessionId: string,
  userLevel: PromptUserLevel = '中级',
  onProgress?: (completed: number, total: number) => void
): Promise<CardGenerationResult[]> {
  const results: CardGenerationResult[] = []

  for (let i = 0; i < terms.length; i++) {
    const result = await generateCard(terms[i], context, sessionId, userLevel)
    results.push(result)
    onProgress?.(i + 1, terms.length)
  }

  return results
}
