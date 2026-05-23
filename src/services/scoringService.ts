import { sendChatRequest, parseAIResponse } from './openai'
import { SCORING_PROMPT } from '../constants/ai-prompts'
import { FusionCard, ScoreResult } from '../types/study.types'
import { createScoreResult } from '../utils/scoring'

export interface ScoringResult {
  success: boolean
  scoreResult?: ScoreResult
  error?: string
}

/**
 * Score user's output using AI
 */
export async function scoreUserOutput(
  fusionCard: FusionCard,
  userOutput: string
): Promise<ScoringResult> {
  try {
    const prompt = SCORING_PROMPT(fusionCard, userOutput)
    
    const response = await sendChatRequest([
      { role: 'user', content: prompt },
    ])
    
    const scores = parseAIResponse<{
      definitionAccuracy: number
      boundaryClarity: number
      caseCompleteness: number
      misconceptionAwareness: number
    }>(response)
    
    const scoreResult = createScoreResult(
      scores.definitionAccuracy,
      scores.boundaryClarity,
      scores.caseCompleteness,
      scores.misconceptionAwareness
    )
    
    return { success: true, scoreResult }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '评分失败',
    }
  }
}

/**
 * Quick score estimation without AI (for offline mode)
 */
export function estimateScore(userOutput: string, fusionCard: FusionCard): ScoreResult {
  let definitionAccuracy = 50
  let boundaryClarity = 50
  let caseCompleteness = 50
  let misconceptionAwareness = 50
  
  // Simple heuristics based on output length and content
  const outputLength = userOutput.length
  const hasExamples = userOutput.includes('比如') || userOutput.includes('例如')
  const hasSelfReflection = userOutput.includes('我理解') || userOutput.includes('我认为')
  
  // Length-based scoring
  if (outputLength > 100) definitionAccuracy += 15
  else if (outputLength < 20) definitionAccuracy -= 20
  
  // Content-based scoring
  if (hasExamples) caseCompleteness += 20
  if (hasSelfReflection) definitionAccuracy += 10
  
  // Compare with fusion card key terms
  const fusionTerms = [
    fusionCard.personalizedDefinition,
    fusionCard.deepLogic,
    fusionCard.practicalCases,
  ]
    .join(' ')
    .toLowerCase()
  
  const outputLower = userOutput.toLowerCase()
  let matchCount = 0
  const checkTerms = ['因为', '所以', '当', '如果', '虽然']
  checkTerms.forEach((term) => {
    if (outputLower.includes(term)) matchCount++
  })
  
  boundaryClarity += matchCount * 5
  
  // Clamp scores
  definitionAccuracy = Math.max(0, Math.min(100, definitionAccuracy))
  boundaryClarity = Math.max(0, Math.min(100, boundaryClarity))
  caseCompleteness = Math.max(0, Math.min(100, caseCompleteness))
  misconceptionAwareness = Math.max(0, Math.min(100, misconceptionAwareness))
  
  return createScoreResult(
    definitionAccuracy,
    boundaryClarity,
    caseCompleteness,
    misconceptionAwareness
  )
}

/**
 * Generate improvement suggestions
 */
export async function generateImprovementSuggestions(
  scoreResult: ScoreResult,
  fusionCard: FusionCard
): Promise<string> {
  try {
    const weakest = [
      { dim: '概念准确性', score: scoreResult.definitionAccuracy },
      { dim: '边界清晰度', score: scoreResult.boundaryClarity },
      { dim: '案例完整性', score: scoreResult.caseCompleteness },
      { dim: '误区意识', score: scoreResult.misconceptionAwareness },
    ].sort((a, b) => a.score - b.score)
    
    const prompt = `基于以下评分结果，为用户提供个性化的改进建议。

评分：
- 概念准确性：${scoreResult.definitionAccuracy}
- 边界清晰度：${scoreResult.boundaryClarity}
- 案例完整性：${scoreResult.caseCompleteness}
- 误区意识：${scoreResult.misconceptionAwareness}

概念卡片：
- 术语：${fusionCard.term}
- 个性化定义：${fusionCard.personalizedDefinition}
- 深层逻辑：${fusionCard.deepLogic}

请给出针对最弱环节（${weakest[0].dim}）的具体改进建议。`

    const response = await sendChatRequest([
      { role: 'user', content: prompt },
    ])
    
    return response
  } catch {
    return ''
  }
}
