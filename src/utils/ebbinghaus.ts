import { EbbinghausStage } from '../types/review.types'

/**
 * Ebbinghaus Forgetting Curve and Spaced Repetition Constants
 * Based on Hermann Ebbinghaus's research on memory retention
 */

export const REVIEW_INTERVALS: Record<EbbinghausStage, number> = {
  [EbbinghausStage.DAY_1]: 1,   // First review: 1 day
  [EbbinghausStage.DAY_3]: 3,   // Second review: 3 days
  [EbbinghausStage.DAY_7]: 7,  // Third review: 7 days
  [EbbinghausStage.DAY_15]: 15, // Fourth review: 15 days
}

export const STAGE_LABELS: Record<EbbinghausStage, string> = {
  [EbbinghausStage.DAY_1]: '第1天',
  [EbbinghausStage.DAY_3]: '第3天',
  [EbbinghausStage.DAY_7]: '第7天',
  [EbbinghausStage.DAY_15]: '第15天',
}

/**
 * Calculate the next review date based on current stage
 */
export function getNextReviewDate(currentStage: EbbinghausStage): Date {
  const daysToAdd = REVIEW_INTERVALS[currentStage]
  const nextDate = new Date()
  nextDate.setDate(nextDate.getDate() + daysToAdd)
  return nextDate
}

/**
 * Get the next stage in the review cycle
 */
export function getNextStage(currentStage: EbbinghausStage): EbbinghausStage {
  const stages = Object.values(EbbinghausStage).filter(
    (s) => typeof s === 'number'
  ) as EbbinghausStage[]
  
  const currentIndex = stages.indexOf(currentStage)
  if (currentIndex === -1 || currentIndex === stages.length - 1) {
    return EbbinghausStage.DAY_15 // Stay at max stage
  }
  
  return stages[currentIndex + 1]
}

/**
 * Calculate retention rate based on days since last review
 * Based on the forgetting curve equation
 */
export function calculateRetentionRate(
  daysSinceReview: number,
  stability: number = 1.5
): number {
  // Simplified retention formula based on Ebbinghaus
  // R = e^(-t/S) where S is stability factor
  const retention = Math.exp(-daysSinceReview / stability)
  return Math.round(retention * 100)
}

/**
 * Determine if a card needs review based on scheduled date
 */
export function needsReview(scheduledAt: string): boolean {
  const scheduled = new Date(scheduledAt)
  const now = new Date()
  return scheduled <= now
}

/**
 * Calculate study intensity score based on recent activity
 */
export function calculateStudyIntensity(
  reviewsToday: number,
  targetReviews: number = 20
): number {
  if (targetReviews <= 0) return 0
  return Math.min(Math.round((reviewsToday / targetReviews) * 100), 100)
}

/**
 * Get mastery level based on review count and consistency
 */
export function getMasteryLevel(
  reviewCount: number,
  averageScore: number
): 'beginner' | 'intermediate' | 'advanced' | 'master' {
  if (reviewCount >= 10 && averageScore >= 90) return 'master'
  if (reviewCount >= 5 && averageScore >= 75) return 'advanced'
  if (reviewCount >= 2 && averageScore >= 60) return 'intermediate'
  return 'beginner'
}
