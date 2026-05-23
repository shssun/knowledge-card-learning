import { EbbinghausStage } from '../types/review.types'

/**
 * Ebbinghaus Forgetting Curve Constants
 * Based on Hermann Ebbinghaus's memory research
 */

export const REVIEW_INTERVALS: Record<EbbinghausStage, number> = {
  [EbbinghausStage.DAY_1]: 1,
  [EbbinghausStage.DAY_3]: 3,
  [EbbinghausStage.DAY_7]: 7,
  [EbbinghausStage.DAY_15]: 15,
}

export const STAGE_LABELS: Record<EbbinghausStage, string> = {
  [EbbinghausStage.DAY_1]: '第1天复习',
  [EbbinghausStage.DAY_3]: '第3天复习',
  [EbbinghausStage.DAY_7]: '第7天复习',
  [EbbinghausStage.DAY_15]: '第15天复习',
}

export const STAGE_DESCRIPTIONS: Record<EbbinghausStage, string> = {
  [EbbinghausStage.DAY_1]: '初次强化记忆',
  [EbbinghausStage.DAY_3]: '短期巩固',
  [EbbinghausStage.DAY_7]: '中期强化',
  [EbbinghausStage.DAY_15]: '长期记忆固化',
}

/**
 * Maximum retention percentage achievable
 */
export const MAX_RETENTION_RATE = 95

/**
 * Minimum retention threshold for mastery
 */
export const MASTERY_THRESHOLD = 80

/**
 * Number of reviews needed for long-term retention
 */
export const REVIEWS_FOR_MASTERY = 4
