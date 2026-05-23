/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import {
  calculateTotalScore,
  generateAnnotations,
  createScoreResult,
  getScoreLevel,
  getWeakestDimensions,
} from '../../utils/scoring'

describe('评分工具函数', () => {
  describe('calculateTotalScore', () => {
    it('应正确计算加权总分', () => {
      const total = calculateTotalScore(80, 80, 80, 80)

      // 80 * 0.3 + 80 * 0.25 + 80 * 0.25 + 80 * 0.2 = 24 + 20 + 20 + 16 = 80
      expect(total).toBe(80)
    })

    it('应正确应用权重', () => {
      const total = calculateTotalScore(100, 0, 0, 0)

      // 100 * 0.3 = 30
      expect(total).toBe(30)
    })

    it('应四舍五入到整数', () => {
      const total = calculateTotalScore(85, 85, 85, 85)

      // 85 * 0.3 + 85 * 0.25 + 85 * 0.25 + 85 * 0.2 = 25.5 + 21.25 + 21.25 + 17 = 85
      expect(total).toBe(85)
    })

    it('权重总和应为 1', () => {
      const total = calculateTotalScore(100, 100, 100, 100)
      expect(total).toBe(100)
    })
  })

  describe('generateAnnotations', () => {
    it('70分以上不应生成注释', () => {
      const annotations = generateAnnotations(70, 70, 70, 70)
      expect(annotations.length).toBe(0)
    })

    it('69分以下应生成注释', () => {
      const annotations = generateAnnotations(69, 70, 70, 70)
      expect(annotations.length).toBe(1)
      expect(annotations[0].dimension).toBe('概念准确性')
    })

    it('多维度低于70应生成多个注释', () => {
      const annotations = generateAnnotations(60, 60, 80, 80)

      expect(annotations.length).toBe(2)
      expect(annotations.some(a => a.dimension === '概念准确性')).toBe(true)
      expect(annotations.some(a => a.dimension === '边界清晰度')).toBe(true)
    })

    it('注释应包含 issue 和 suggestion', () => {
      const annotations = generateAnnotations(50, 70, 70, 70)

      expect(annotations[0]).toHaveProperty('issue')
      expect(annotations[0]).toHaveProperty('suggestion')
      expect(annotations[0].issue.length).toBeGreaterThan(0)
      expect(annotations[0].suggestion.length).toBeGreaterThan(0)
    })
  })

  describe('createScoreResult', () => {
    it('应返回完整的评分结果', () => {
      const result = createScoreResult(80, 85, 90, 75)

      expect(result).toHaveProperty('definitionAccuracy', 80)
      expect(result).toHaveProperty('boundaryClarity', 85)
      expect(result).toHaveProperty('caseCompleteness', 90)
      expect(result).toHaveProperty('misconceptionAwareness', 75)
      expect(result).toHaveProperty('totalScore')
      expect(result).toHaveProperty('annotations')
    })

    it('totalScore 应由 calculateTotalScore 计算', () => {
      const result = createScoreResult(80, 80, 80, 80)
      const expected = calculateTotalScore(80, 80, 80, 80)

      expect(result.totalScore).toBe(expected)
    })

    it('annotations 应由 generateAnnotations 生成', () => {
      const result = createScoreResult(60, 80, 80, 80)
      const expectedAnnotations = generateAnnotations(60, 80, 80, 80)

      expect(result.annotations).toEqual(expectedAnnotations)
    })
  })

  describe('getScoreLevel', () => {
    it('90分以上应返回优秀', () => {
      expect(getScoreLevel(90)).toEqual({ label: '优秀', color: 'success' })
      expect(getScoreLevel(100)).toEqual({ label: '优秀', color: 'success' })
    })

    it('75-89分应返回良好', () => {
      expect(getScoreLevel(75)).toEqual({ label: '良好', color: 'info' })
      expect(getScoreLevel(89)).toEqual({ label: '良好', color: 'info' })
    })

    it('60-74分应返回及格', () => {
      expect(getScoreLevel(60)).toEqual({ label: '及格', color: 'warning' })
      expect(getScoreLevel(74)).toEqual({ label: '及格', color: 'warning' })
    })

    it('60分以下应返回需改进', () => {
      expect(getScoreLevel(59)).toEqual({ label: '需改进', color: 'error' })
      expect(getScoreLevel(0)).toEqual({ label: '需改进', color: 'error' })
    })
  })

  describe('getWeakestDimensions', () => {
    it('应按分数升序排序', () => {
      const result = createScoreResult(90, 60, 80, 70)
      const weakest = getWeakestDimensions(result)

      expect(weakest[0].score).toBe(60)
      expect(weakest[1].score).toBe(70)
      expect(weakest[2].score).toBe(80)
      expect(weakest[3].score).toBe(90)
    })

    it('应包含所有维度', () => {
      const result = createScoreResult(75, 80, 85, 90)
      const weakest = getWeakestDimensions(result)

      expect(weakest.length).toBe(4)
      expect(weakest.some(d => d.dimension === '概念准确性')).toBe(true)
      expect(weakest.some(d => d.dimension === '边界清晰度')).toBe(true)
      expect(weakest.some(d => d.dimension === '案例完整性')).toBe(true)
      expect(weakest.some(d => d.dimension === '误区意识')).toBe(true)
    })

    it('应返回分数值', () => {
      const result = createScoreResult(70, 80, 90, 60)
      const weakest = getWeakestDimensions(result)

      expect(weakest[0].score).toBe(60)
      expect(weakest[3].score).toBe(90)
    })
  })
})
