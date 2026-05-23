import { ScoreResult, ScoreAnnotation } from '../types/study.types'

/**
 * Calculate weighted total score from individual dimensions
 */
export function calculateTotalScore(
  definitionAccuracy: number,
  boundaryClarity: number,
  caseCompleteness: number,
  misconceptionAwareness: number
): number {
  // Weights based on importance for knowledge mastery
  const weights = {
    definitionAccuracy: 0.3,
    boundaryClarity: 0.25,
    caseCompleteness: 0.25,
    misconceptionAwareness: 0.2,
  }
  
  return Math.round(
    definitionAccuracy * weights.definitionAccuracy +
    boundaryClarity * weights.boundaryClarity +
    caseCompleteness * weights.caseCompleteness +
    misconceptionAwareness * weights.misconceptionAwareness
  )
}

/**
 * Generate annotations based on low scores
 */
export function generateAnnotations(
  definitionAccuracy: number,
  boundaryClarity: number,
  caseCompleteness: number,
  misconceptionAwareness: number
): ScoreAnnotation[] {
  const annotations: ScoreAnnotation[] = []
  
  if (definitionAccuracy < 70) {
    annotations.push({
      dimension: '概念准确性',
      issue: '对核心概念的理解不够准确',
      suggestion: '建议重新阅读原始定义，并用自己的话复述',
    })
  }
  
  if (boundaryClarity < 70) {
    annotations.push({
      dimension: '边界清晰度',
      issue: '对概念适用边界理解模糊',
      suggestion: '建议列出概念的适用场景和不适用场景',
    })
  }
  
  if (caseCompleteness < 70) {
    annotations.push({
      dimension: '案例完整性',
      issue: '案例积累不足，难以灵活运用',
      suggestion: '建议多收集生活中的实际案例',
    })
  }
  
  if (misconceptionAwareness < 70) {
    annotations.push({
      dimension: '误区意识',
      issue: '对常见误区认识不足',
      suggestion: '建议查阅相关讨论区，了解他人的误解',
    })
  }
  
  return annotations
}

/**
 * Create a complete ScoreResult object
 */
export function createScoreResult(
  definitionAccuracy: number,
  boundaryClarity: number,
  caseCompleteness: number,
  misconceptionAwareness: number
): ScoreResult {
  const totalScore = calculateTotalScore(
    definitionAccuracy,
    boundaryClarity,
    caseCompleteness,
    misconceptionAwareness
  )
  
  const annotations = generateAnnotations(
    definitionAccuracy,
    boundaryClarity,
    caseCompleteness,
    misconceptionAwareness
  )
  
  return {
    definitionAccuracy,
    boundaryClarity,
    caseCompleteness,
    misconceptionAwareness,
    totalScore,
    annotations,
  }
}

/**
 * Get score level label
 */
export function getScoreLevel(score: number): {
  label: string
  color: 'error' | 'warning' | 'info' | 'success'
} {
  if (score >= 90) return { label: '优秀', color: 'success' }
  if (score >= 75) return { label: '良好', color: 'info' }
  if (score >= 60) return { label: '及格', color: 'warning' }
  return { label: '需改进', color: 'error' }
}

/**
 * Calculate improvement suggestions based on weakest dimensions
 */
export function getWeakestDimensions(
  result: ScoreResult
): { dimension: string; score: number }[] {
  const dimensions = [
    { dimension: '概念准确性', score: result.definitionAccuracy },
    { dimension: '边界清晰度', score: result.boundaryClarity },
    { dimension: '案例完整性', score: result.caseCompleteness },
    { dimension: '误区意识', score: result.misconceptionAwareness },
  ]
  
  return dimensions.sort((a, b) => a.score - b.score)
}
