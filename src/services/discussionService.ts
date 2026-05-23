import { sendChatRequest } from './openai'
import { DISCUSSION_SYSTEM_PROMPT, DISCUSSION_USER_PROMPT } from '../constants/ai-prompts'
import { KnowledgeCard, DiscussionMessage, MessageRole } from '../types/study.types'
import { v4 as uuidv4 } from 'uuid'

export interface DiscussionResult {
  success: boolean
  message?: DiscussionMessage
  error?: string
}

/**
 * Get AI response for discussion
 */
export async function sendDiscussionMessage(
  card: KnowledgeCard,
  history: DiscussionMessage[],
  userMessage: string,
  onChunk?: (content: string) => void
): Promise<DiscussionResult> {
  try {
    const systemPrompt = DISCUSSION_SYSTEM_PROMPT(card)
    
    // Build conversation history
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: systemPrompt },
    ]
    
    // Add history
    history.forEach((msg) => {
      messages.push({
        role: msg.role === MessageRole.USER ? 'user' : 'assistant',
        content: msg.content,
      })
    })
    
    // Add current user message with context
    const userPrompt = DISCUSSION_USER_PROMPT(card, userMessage)
    messages.push({ role: 'user', content: userPrompt })
    
    const response = await sendChatRequest(messages, onChunk)
    
    const message: DiscussionMessage = {
      id: uuidv4(),
      role: MessageRole.ASSISTANT,
      content: response,
      timestamp: new Date().toISOString(),
    }
    
    return { success: true, message }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '讨论失败',
    }
  }
}

/**
 * Get initial discussion prompt from AI
 */
export async function getInitialDiscussionPrompt(
  card: KnowledgeCard
): Promise<DiscussionResult> {
  try {
    const systemPrompt = DISCUSSION_SYSTEM_PROMPT(card)
    
    // Ask AI to provide an initial thought-provoking question
    const prompt = `${systemPrompt}

请基于以上知识卡内容，给出一个能引导学生深入思考的初始问题，帮助学生开始讨论。`

    const response = await sendChatRequest([
      { role: 'user', content: prompt },
    ])
    
    const message: DiscussionMessage = {
      id: uuidv4(),
      role: MessageRole.ASSISTANT,
      content: response,
      timestamp: new Date().toISOString(),
    }
    
    return { success: true, message }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取提示失败',
    }
  }
}

/**
 * Generate discussion summary
 */
export async function generateDiscussionSummary(
  card: KnowledgeCard,
  messages: DiscussionMessage[]
): Promise<string> {
  try {
    const messagesText = messages
      .map((m) => `${m.role === MessageRole.USER ? '学生' : '导师'}: ${m.content}`)
      .join('\n')
    
    const prompt = `请总结以下关于"${card.term}"概念讨论的要点（限50字以内）：

${messagesText}`

    const response = await sendChatRequest([
      { role: 'user', content: prompt },
    ])
    
    return response
  } catch {
    return ''
  }
}
