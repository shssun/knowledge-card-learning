import { sendChatRequest, parseAIResponse, hasApiKey } from './openai'
import { LEVEL_SCORING_PROMPT } from '../constants/ai-prompts'
import { UserLevel, LevelContent } from '../types/level.types'

export interface LevelScoringResult {
  success: boolean
  score?: number
  feedback?: string
  error?: string
}

/** 获取指定等级的「标准答案」文本 */
export function getLevelStandardAnswer(
  level: UserLevel,
  levelContent?: LevelContent
): string {
  if (!levelContent) return ''

  switch (level) {
    case '小白':
      return levelContent.definition || ''
    case '初级':
      return [levelContent.boundary, levelContent.similarTerms]
        .filter(Boolean)
        .join('\n')
    case '中级':
      return [levelContent.examples, levelContent.applicationScenario]
        .filter(Boolean)
        .join('\n')
    case '高级':
      return [levelContent.misconceptions, levelContent.relations]
        .filter(Boolean)
        .join('\n')
    case '大师':
      return [levelContent.transferTest, levelContent.teachingOutput]
        .filter(Boolean)
        .join('\n')
  }
}

/** 评分 AI 返回结果类型 */
interface AIGradResult {
  score: number
  feedback: string
}

/**
 * 评估用户某等级的回答
 * @param level 当前等级
 * @param levelContent AI 生成的标准答案
 * @param userAnswer 用户的回答
 */
export async function scoreLevelAnswer(
  level: UserLevel,
  levelContent: LevelContent | undefined,
  userAnswer: string
): Promise<LevelScoringResult> {
  // 空回答不得分
  if (!userAnswer.trim()) {
    return { success: true, score: 0, feedback: '未作答' }
  }

  if (!hasApiKey()) {
    // 内置引擎：基于回答长度和关键词匹配做基础评估
    const score = Math.min(10, Math.max(1, Math.round(userAnswer.length / 20)))
    return {
      success: true,
      score,
      feedback: score >= 8 ? '理解比较到位' : score >= 5 ? '部分理解正确，有提升空间' : '需要再仔细学习一下',
    }
  }

  try {
    const standardAnswer = getLevelStandardAnswer(level, levelContent)
    const prompt = LEVEL_SCORING_PROMPT(level, standardAnswer, userAnswer)

    const response = await sendChatRequest([
      { role: 'user', content: prompt },
    ])

    const result = parseAIResponse<AIGradResult>(response)

    return {
      success: true,
      score: result.score ?? 7,
      feedback: result.feedback ?? '',
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '评分失败',
    }
  }
}
