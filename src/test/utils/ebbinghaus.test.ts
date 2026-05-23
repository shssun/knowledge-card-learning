/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import {
  REVIEW_INTERVALS,
  STAGE_LABELS,
  getNextReviewDate,
  getNextStage,
  calculateRetentionRate,
  needsReview,
  calculateStudyIntensity,
  getMasteryLevel,
} from '../../utils/ebbinghaus'
import { EbbinghausStage } from '../../types/review.types'

describe('艾宾浩斯遗忘曲线工具函数', () => {
  describe('REVIEW_INTERVALS', () => {
    it('应包含所有复习阶段', () => {
      expect(REVIEW_INTERVALS[EbbinghausStage.DAY_1]).toBe(1)
      expect(REVIEW_INTERVALS[EbbinghausStage.DAY_3]).toBe(3)
      expect(REVIEW_INTERVALS[EbbinghausStage.DAY_7]).toBe(7)
      expect(REVIEW_INTERVALS[EbbinghausStage.DAY_15]).toBe(15)
    })
  })

  describe('STAGE_LABELS', () => {
    it('应返回中文标签', () => {
      expect(STAGE_LABELS[EbbinghausStage.DAY_1]).toBe('第1天')
      expect(STAGE_LABELS[EbbinghausStage.DAY_3]).toBe('第3天')
      expect(STAGE_LABELS[EbbinghausStage.DAY_7]).toBe('第7天')
      expect(STAGE_LABELS[EbbinghausStage.DAY_15]).toBe('第15天')
    })
  })

  describe('getNextReviewDate', () => {
    it('应返回正确间隔的日期', () => {
      const today = new Date()
      const nextDate = getNextReviewDate(EbbinghausStage.DAY_1)

      expect(nextDate.getDate()).toBe(today.getDate() + 1)
    })

    it('DAY_7 应返回7天后的日期', () => {
      const today = new Date()
      const nextDate = getNextReviewDate(EbbinghausStage.DAY_7)

      expect(nextDate.getDate()).toBe(today.getDate() + 7)
    })
  })

  describe('getNextStage', () => {
    it('DAY_1 应转换为 DAY_3', () => {
      expect(getNextStage(EbbinghausStage.DAY_1)).toBe(EbbinghausStage.DAY_3)
    })

    it('DAY_3 应转换为 DAY_7', () => {
      expect(getNextStage(EbbinghausStage.DAY_3)).toBe(EbbinghausStage.DAY_7)
    })

    it('DAY_7 应转换为 DAY_15', () => {
      expect(getNextStage(EbbinghausStage.DAY_7)).toBe(EbbinghausStage.DAY_15)
    })

    it('DAY_15 应保持不变', () => {
      expect(getNextStage(EbbinghausStage.DAY_15)).toBe(EbbinghausStage.DAY_15)
    })
  })

  describe('calculateRetentionRate', () => {
    it('当天复习应返回 100%', () => {
      const retention = calculateRetentionRate(0)
      expect(retention).toBe(100)
    })

    it('1天后应有一定遗忘', () => {
      const retention = calculateRetentionRate(1)
      expect(retention).toBeLessThan(100)
      expect(retention).toBeGreaterThan(0)
    })

    it('时间越长遗忘越多', () => {
      const retention1 = calculateRetentionRate(1)
      const retention7 = calculateRetentionRate(7)

      expect(retention7).toBeLessThan(retention1)
    })

    it('应支持自定义稳定性因子', () => {
      const retentionHighStability = calculateRetentionRate(1, 3)
      const retentionLowStability = calculateRetentionRate(1, 1)

      expect(retentionHighStability).toBeGreaterThan(retentionLowStability)
    })
  })

  describe('needsReview', () => {
    it('过去日期应需要复习', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)

      expect(needsReview(pastDate.toISOString())).toBe(true)
    })

    it('未来日期不应需要复习', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 1)

      expect(needsReview(futureDate.toISOString())).toBe(false)
    })

    it('当前日期应需要复习', () => {
      const now = new Date()
      expect(needsReview(now.toISOString())).toBe(true)
    })
  })

  describe('calculateStudyIntensity', () => {
    it('无复习应返回 0', () => {
      const intensity = calculateStudyIntensity(0, 20)
      expect(intensity).toBe(0)
    })

    it('完成一半应返回 50', () => {
      const intensity = calculateStudyIntensity(10, 20)
      expect(intensity).toBe(50)
    })

    it('达到目标应返回 100', () => {
      const intensity = calculateStudyIntensity(20, 20)
      expect(intensity).toBe(100)
    })

    it('超过目标应返回 100（上限）', () => {
      const intensity = calculateStudyIntensity(30, 20)
      expect(intensity).toBe(100)
    })

    it('目标为0应返回 0', () => {
      const intensity = calculateStudyIntensity(5, 0)
      expect(intensity).toBe(0)
    })

    it('目标为负应返回 0', () => {
      const intensity = calculateStudyIntensity(5, -10)
      expect(intensity).toBe(0)
    })
  })

  describe('getMasteryLevel', () => {
    it('无复习次数应返回 beginner', () => {
      expect(getMasteryLevel(0, 50)).toBe('beginner')
    })

    it('2次复习且60分应返回 intermediate', () => {
      expect(getMasteryLevel(2, 60)).toBe('intermediate')
    })

    it('5次复习且75分应返回 advanced', () => {
      expect(getMasteryLevel(5, 75)).toBe('advanced')
    })

    it('10次复习且90分应返回 master', () => {
      expect(getMasteryLevel(10, 90)).toBe('master')
    })

    it('复习次数够但分数不够应降级', () => {
      expect(getMasteryLevel(10, 80)).toBe('advanced')
    })

    it('分数够但复习次数不够应降级', () => {
      expect(getMasteryLevel(8, 90)).toBe('advanced')
    })
  })
})
