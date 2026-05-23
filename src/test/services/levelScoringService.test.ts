/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getLevelStandardAnswer,
  scoreLevelAnswer,
  LevelScoringResult,
} from '../../services/levelScoringService'
import { UserLevel, LevelContent } from '../../types/level.types'

// Mock openai service
vi.mock('../../services/openai', () => ({
  sendChatRequest: vi.fn(),
  parseAIResponse: vi.fn(),
  hasApiKey: vi.fn().mockReturnValue(false), // 默认 demo 模式
}))

describe('LevelScoringService', () => {
  const mockLevelContent: LevelContent = {
    definition: '机器学习是让计算机从数据中学习的技术',
    boundary: '机器学习 vs 传统编程：规则是学出来的还是写出来的',
    similarTerms: '人工智能 > 机器学习 > 深度学习',
    examples: ['推荐系统', '图像识别', '语音助手'],
    applicationScenario: '当问题难以用规则定义，但有大量数据时',
    misconceptions: '1. 机器学习不需要数据 2. 越复杂的模型越好',
    relations: '统计学、概率论、线性代数、最优化',
    transferTest: '如何用机器学习思维分析「要不要接受 offer」这个问题',
    teachingOutput: '向一个没有技术背景的人解释什么是机器学习',
  }

  describe('getLevelStandardAnswer', () => {
    it('小白等级应返回 definition', () => {
      const result = getLevelStandardAnswer('小白' as UserLevel, mockLevelContent)
      expect(result).toBe(mockLevelContent.definition)
    })

    it('初级等级应返回 boundary 和 similarTerms', () => {
      const result = getLevelStandardAnswer('初级' as UserLevel, mockLevelContent)
      expect(result).toContain(mockLevelContent.boundary)
      expect(result).toContain(mockLevelContent.similarTerms)
    })

    it('中级等级应返回 examples 和 applicationScenario', () => {
      const result = getLevelStandardAnswer('中级' as UserLevel, mockLevelContent)
      expect(result).toContain(mockLevelContent.examples)
      expect(result).toContain(mockLevelContent.applicationScenario)
    })

    it('高级等级应返回 misconceptions 和 relations', () => {
      const result = getLevelStandardAnswer('高级' as UserLevel, mockLevelContent)
      expect(result).toContain(mockLevelContent.misconceptions)
      expect(result).toContain(mockLevelContent.relations)
    })

    it('大师等级应返回 transferTest 和 teachingOutput', () => {
      const result = getLevelStandardAnswer('大师' as UserLevel, mockLevelContent)
      expect(result).toContain(mockLevelContent.transferTest)
      expect(result).toContain(mockLevelContent.teachingOutput)
    })

    it('无 levelContent 应返回空字符串', () => {
      expect(getLevelStandardAnswer('小白' as UserLevel, undefined)).toBe('')
      expect(getLevelStandardAnswer('初级' as UserLevel, undefined)).toBe('')
    })

    it('缺少字段应跳过', () => {
      const partialContent: LevelContent = {
        definition: '测试定义',
        boundary: undefined,
        similarTerms: undefined,
        examples: undefined,
        applicationScenario: undefined,
        misconceptions: undefined,
        relations: undefined,
        transferTest: undefined,
        teachingOutput: undefined,
      }

      const result = getLevelStandardAnswer('初级' as UserLevel, partialContent)
      expect(result).toBe('')
    })
  })

  describe('scoreLevelAnswer', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('空回答应返回 0 分', async () => {
      const result = await scoreLevelAnswer('小白' as UserLevel, mockLevelContent, '')

      expect(result.success).toBe(true)
      expect(result.score).toBe(0)
      expect(result.feedback).toBe('未作答')
    })

    it('空白回答应返回 0 分', async () => {
      const result = await scoreLevelAnswer('小白' as UserLevel, mockLevelContent, '   ')

      expect(result.success).toBe(true)
      expect(result.score).toBe(0)
    })

    it('Demo 模式（无 API Key）应基于回答质量给分', async () => {
      const { hasApiKey } = await import('../../services/openai')
      vi.mocked(hasApiKey).mockReturnValue(false)

      // 短回答得低分
      const shortResult = await scoreLevelAnswer('小白' as UserLevel, mockLevelContent, '答')
      expect(shortResult.success).toBe(true)
      expect(shortResult.score).toBeLessThanOrEqual(3)

      // 长回答得高分
      const longAnswer = '机器学习是让计算机从数据中自动学习模式和规律的技术，它通过算法从大量数据中提取特征，建立模型来预测或决策。与传统编程不同，机器学习的规则不是人写的，而是从数据中学出来的。' +
        '机器学习的核心在于三个要素：数据、模型和学习算法。数据是燃料，模型是框架，学习算法是从数据中发现规律的引擎。' +
        '在实际应用中，机器学习可以用于分类、回归、聚类、降维等任务。例如在推荐系统中，算法会根据用户的历史行为来预测其可能感兴趣的商品。' +
        '理解机器学习的关键是区分监督学习、无监督学习和强化学习三种范式。'
      const longResult = await scoreLevelAnswer('小白' as UserLevel, mockLevelContent, longAnswer)
      expect(longResult.success).toBe(true)
      expect(longResult.score).toBeGreaterThanOrEqual(5)
      expect(longResult.feedback).toBeDefined()
    })

    it('应返回正确的结果结构', async () => {
      const { hasApiKey } = await import('../../services/openai')
      vi.mocked(hasApiKey).mockReturnValue(false)

      const result = await scoreLevelAnswer('小白' as UserLevel, mockLevelContent, '我的回答')

      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('score')
      expect(result).toHaveProperty('feedback')
    })
  })
})
